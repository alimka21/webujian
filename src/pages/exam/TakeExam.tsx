import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuthStore } from "../../store/authStore";
import { Button } from "../../components/ui/button";
import { Check, Clock, AlertTriangle, ChevronLeft, ChevronRight } from "lucide-react";

export default function TakeExam() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { token } = useAuthStore();
  
  const [exam, setExam] = useState<any>(null);
  const [questions, setQuestions] = useState<any[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string[]>>({});
  
  const [timeLeft, setTimeLeft] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [warnings, setWarnings] = useState(0);

  // Fetch Exam Data
  useEffect(() => {
    fetch(`/api/exams/${id}`, {
      headers: { "Authorization": `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        setExam(data);
        setQuestions(data.questions);
        setTimeLeft(data.duration * 60); // mins to seconds
      });
  }, [id, token]);

  // Timer
  useEffect(() => {
    if (!exam) return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [exam]);

  // Anti-Cheat: Visibility & Fullscreen
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        setWarnings(w => w + 1);
        alert("PERINGATAN: Anda mendeteksi berpindah tab! Ini akan dicatat dalam log ujian.");
      }
    };

    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
      if (!document.fullscreenElement && exam) {
        setWarnings(w => w + 1);
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    document.addEventListener("fullscreenchange", handleFullscreenChange);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, [exam]);

  const requestFullscreen = () => {
    document.documentElement.requestFullscreen().catch(console.error);
  };

  const handleAnswer = (questionId: string, option: string) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: [option] // Assuming Single Answer for now
    }));
  };

  const handleSubmit = async () => {
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      }
      
      const res = await fetch(`/api/exams/${id}/submit`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ answers, warnings })
      });
      
      if (res.ok) {
        navigate("/dashboard/exams");
      }
    } catch (e) {
      console.error(e);
    }
  };

  if (!exam) return <div className="h-screen flex items-center justify-center">Loading...</div>;

  if (!isFullscreen) {
    return (
      <div className="h-screen bg-gray-50 flex flex-col items-center justify-center p-6 text-center">
        <AlertTriangle className="h-16 w-16 text-yellow-500 mb-6" />
        <h1 className="text-2xl font-bold mb-2">Ujian Hanya Dapat Dikerjakan Dalam Layar Penuh</h1>
        <p className="text-gray-600 mb-8 max-w-lg">
          Demi menjaga integritas ujian, Anda diwajibkan menggunakan mode layar penuh (fullscreen). 
          Jika Anda keluar dari layar penuh atau berpindah tab, sistem akan mencatat aktivitas tersebut.
        </p>
        <Button size="lg" onClick={requestFullscreen}>
          Masuk Mode Layar Penuh & Mulai Ujian
        </Button>
      </div>
    );
  }

  const currentQ = questions[currentIdx];
  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex h-screen bg-gray-100 font-sans">
      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="bg-white px-6 py-4 border-b flex justify-between items-center shrink-0">
          <div>
            <h1 className="font-bold text-lg">{exam.title}</h1>
            <p className="text-sm text-gray-500">Soal ke {currentIdx + 1} dari {questions.length}</p>
          </div>
          <div className="flex items-center gap-6">
            {warnings > 0 && (
              <div className="flex items-center text-red-600 font-bold text-sm bg-red-50 px-3 py-1 rounded-full">
                <AlertTriangle className="h-4 w-4 mr-1" />
                Peringatan: {warnings}
              </div>
            )}
            <div className="flex items-center gap-2 bg-blue-50 text-blue-700 px-4 py-2 rounded-lg font-mono font-bold text-lg">
              <Clock className="h-5 w-5" />
              {formatTime(timeLeft)}
            </div>
            <Button variant="destructive" onClick={handleSubmit}>Selesai Ujian</Button>
          </div>
        </header>

        {/* Question Area */}
        <div className="flex-1 p-8 overflow-auto">
          <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-sm border border-gray-200 p-8">
            <h2 className="text-xl text-gray-900 mb-8 leading-relaxed">
              {currentQ.text}
            </h2>
            
            <div className="space-y-3">
              {currentQ.options?.map((opt: string, i: number) => {
                const isSelected = answers[currentQ.id]?.[0] === opt;
                return (
                  <button
                    key={i}
                    onClick={() => handleAnswer(currentQ.id, opt)}
                    className={`w-full flex items-center p-4 border rounded-lg text-left transition-all ${
                      isSelected 
                        ? 'border-blue-600 bg-blue-50 ring-1 ring-blue-600' 
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <div className={`flex-shrink-0 w-6 h-6 rounded-full border-2 mr-4 flex items-center justify-center ${
                      isSelected ? 'border-blue-600 bg-blue-600' : 'border-gray-300'
                    }`}>
                      {isSelected && <Check className="w-4 h-4 text-white" />}
                    </div>
                    <span className="text-gray-700">{opt}</span>
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        {/* Footer Nav */}
        <footer className="bg-white border-t p-4 flex justify-between shrink-0">
          <Button 
            variant="outline" 
            onClick={() => setCurrentIdx(prev => Math.max(0, prev - 1))}
            disabled={currentIdx === 0}
          >
            <ChevronLeft className="w-4 h-4 mr-2" />
            Soal Sebelumnya
          </Button>
          <Button 
            onClick={() => setCurrentIdx(prev => Math.min(questions.length - 1, prev + 1))}
            disabled={currentIdx === questions.length - 1}
          >
            Soal Berikutnya
            <ChevronRight className="w-4 h-4 ml-2" />
          </Button>
        </footer>
      </div>

      {/* Right Sidebar - CAT Navigation */}
      <div className="w-80 bg-white border-l shadow-xl flex flex-col shrink-0">
        <div className="p-4 border-b bg-gray-50">
          <h3 className="font-semibold text-gray-700">Navigasi Soal</h3>
        </div>
        <div className="p-4 grid grid-cols-5 gap-2 overflow-auto content-start">
          {questions.map((q, i) => {
            const isAnswered = !!answers[q.id];
            const isCurrent = i === currentIdx;
            return (
              <button
                key={q.id}
                onClick={() => setCurrentIdx(i)}
                className={`w-10 h-10 rounded font-medium text-sm transition-all focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-1 ${
                  isCurrent 
                    ? 'bg-blue-600 text-white shadow-md' 
                    : isAnswered
                      ? 'bg-green-100 text-green-700 hover:bg-green-200 border border-green-200'
                      : 'bg-white text-gray-600 border border-gray-300 hover:bg-gray-50'
                }`}
              >
                {i + 1}
              </button>
            )
          })}
        </div>
        <div className="p-4 border-t bg-gray-50 space-y-2 mt-auto">
          <div className="flex justify-between text-sm text-gray-600">
            <span>Terjawab:</span>
            <span className="font-bold text-green-600">{Object.keys(answers).length}</span>
          </div>
          <div className="flex justify-between text-sm text-gray-600">
            <span>Belum Terjawab:</span>
            <span className="font-bold text-gray-900">{questions.length - Object.keys(answers).length}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
