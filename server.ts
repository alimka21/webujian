import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import jwt from 'jsonwebtoken';
import { createServer as createViteServer } from 'vite';

// Add type for req.user
declare module 'express-serve-static-core' {
  interface Request {
    user?: any;
  }
}


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'secret-key-123';

app.use(cors());
app.use(express.json());

// --- Mock Database ---
let users = [
  { id: '1', name: 'Super Admin', username: 'admin', password: 'password', role: 'SUPER_ADMIN' },
  { id: '2', name: 'Budi Guru', username: 'guru1', password: 'password', role: 'TEACHER' },
  { id: '3', name: 'Siti Siswa', username: 'siswa1', password: 'password', role: 'STUDENT', class: '10A' },
];

let exams = [
  { id: '1', title: 'Ujian Akhir Semester - Matematika', duration: 120, status: 'PUBLISHED', teacherId: '2', targetClass: '10A' }
];

let questions = [
  { id: '1', examId: '1', type: 'MULTIPLE_CHOICE', text: 'Berapakah hasil dari 1 + 1?', options: ['1', '2', '3', '4'], correctAnswers: ['2'] },
  { id: '2', examId: '1', type: 'TRUE_FALSE', text: 'Bumi itu bulat.', correctAnswers: ['True'] },
];

let examResults = [];
let attendances = [];
let alumni = [];
let news = [];

// --- APIs ---

// Auth
app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body;
  const user = users.find(u => u.username === username && u.password === password);
  if (!user) return res.status(401).json({ message: 'Invalid credentials' });
  const token = jwt.sign({ id: user.id, role: user.role, name: user.name }, JWT_SECRET, { expiresIn: '1d' });
  res.json({ token, user: { id: user.id, name: user.name, role: user.role, class: user.class } });
});

// Auth Middleware
const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ message: 'Unauthorized' });
  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ message: 'Invalid token' });
  }
};

// Exams
app.get('/api/exams', authenticate, (req, res) => {
  if (req.user.role === 'STUDENT') {
    const student = users.find(u => u.id === req.user.id);
    const studentExams = exams.filter(e => e.targetClass === student.class && e.status === 'PUBLISHED');
    return res.json(studentExams);
  }
  res.json(exams);
});

app.get('/api/exams/:id', authenticate, (req, res) => {
  const exam = exams.find(e => e.id === req.params.id);
  if (!exam) return res.status(404).json({ message: 'Exam not found' });
  const examQuestions = questions.filter(q => q.examId === exam.id).map(q => {
    // Hide correct answers from students
    if (req.user.role === 'STUDENT') {
      const { correctAnswers, ...rest } = q;
      return rest;
    }
    return q;
  });
  res.json({ ...exam, questions: examQuestions });
});

// Submit Exam
app.post('/api/exams/:id/submit', authenticate, (req, res) => {
  if (req.user.role !== 'STUDENT') return res.status(403).json({ message: 'Only students can submit exams' });
  const { answers } = req.body;
  // Evaluate answers
  const examQuestions = questions.filter(q => q.examId === req.params.id);
  let correctCount = 0;
  
  Object.keys(answers).forEach(questionId => {
    const q = examQuestions.find(q => q.id === questionId);
    let isCorrect = false;
    if (q) {
      if (q.type === 'MULTIPLE_CHOICE') {
        isCorrect = q.correctAnswers.includes(answers[questionId][0]);
      } else if (q.type === 'TRUE_FALSE') {
        isCorrect = q.correctAnswers[0] === answers[questionId][0];
      }
      if (isCorrect) correctCount++;
    }
  });

  const score = (correctCount / examQuestions.length) * 100;

  const result = {
    id: Date.now().toString(),
    examId: req.params.id,
    studentId: req.user.id,
    score,
    submittedAt: new Date().toISOString()
  };
  examResults.push(result);
  res.json(result);
});

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Determine dist path for production
    // Due to build:server.ts, __dirname might point to dist
    const rootPath = path.resolve(__dirname, '..'); 
    const distPath = path.join(rootPath, 'dist');
    const clientPath = path.join(rootPath, 'dist', 'client');
    // Vite build normally outputs to dist directly, we need to make sure index.html is served
    // But since server.js is deployed in dist, the client index.html would be in dist/index.html
    const servePath = process.env.NODE_ENV === 'production' && __dirname.endsWith('dist') ? __dirname : distPath;

    app.use(express.static(servePath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(servePath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
