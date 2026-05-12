import { toast } from 'sonner';
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { AlertCircle, Clock, ChevronLeft, ChevronRight, Flag, X, CheckSquare, Maximize, List } from 'lucide-react';
import api from '../../lib/api';
import { useAntiCheat } from '../../hooks/useAntiCheat';
import { useExamTimer } from '../../hooks/useExamTimer';
import { useModalA11y } from '../../hooks/useModalA11y';

// Utility for debouncing
function useDebounce<T extends (...args: any[]) => void>(func: T, wait: number) {
  const timeout = React.useRef<NodeJS.Timeout | undefined>(undefined);
  return React.useCallback(
    (...args: Parameters<T>) => {
      if (timeout.current) clearTimeout(timeout.current);
      timeout.current = setTimeout(() => func(...args), wait);
    },
    [func, wait]
  );
}

export default function TakeExam() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  
  const [sessionData, setSessionData] = useState<any>(null);
  const [soalList, setSoalList] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string[]>>({});
  const [flagged, setFlagged] = useState<Record<string, boolean>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);
  const [showMobileNav, setShowMobileNav] = useState(false);

  // Modal a11y refs
  const submitModalRef = useModalA11y<HTMLDivElement>(showSubmitConfirm, () => setShowSubmitConfirm(false));
  const mobileNavRef = useModalA11y<HTMLDivElement>(showMobileNav, () => setShowMobileNav(false));

  // Fetch session data
  useEffect(() => {
    const fetchSession = async () => {
      try {
        const res = await api.get(`/api/siswa/sesi/${sessionId}`);
        if (res.sesi?.status === 'SELESAI' || res.sesi?.status === 'AUTO_SUBMIT') {
          navigate(`/dashboard/siswa/hasil/${sessionId}`, { replace: true });
          return;
        }

        setSessionData(res);
        setSoalList(res.ujian.soal || []);
        
        // Restore answers and flags from localStorage if exist, otherwise from server response (if any)
        const storedAns = localStorage.getItem(`exam_ans_${sessionId}`);
        if (storedAns) {
          setAnswers(JSON.parse(storedAns));
        } else {
          // If server provides previous answers, we can load them here
          // For now, start empty
          setAnswers({});
        }

        const storedFlags = localStorage.getItem(`exam_flags_${sessionId}`);
        if (storedFlags) {
          setFlagged(JSON.parse(storedFlags));
        }

      } catch (err: any) {
        toast.error(err.message || 'Gagal memuat sesi ujian');
        navigate('/dashboard/siswa');
      } finally {
        setIsLoading(false);
      }
    };
    if (sessionId) fetchSession();
  }, [sessionId, navigate]);

  // Anti-Cheat Hook
  const {
    violationCount,
    isFullscreen,
    isWarningVisible,
    latestViolation,
    requestFullscreen,
    dismissWarning,
    maxViolations
  } = useAntiCheat({
    sessionId: sessionId || '',
    maxViolations: 3,
    onAutoSubmit: () => submitExam('auto_cheat')
  });

  // Exam Timer Hook
  const {
    formattedTime,
    isWarning,
    isCritical,
    isExpired
  } = useExamTimer({
    durationSeconds: sessionData ? sessionData.ujian.durasi * 60 : 3600, // Handle edge case while loading
    examSessionId: sessionId || '',
    onExpire: () => {
      if (!isSubmitting) submitExam('timeout');
    }
  });

  // Save answer to server (debounced)
  const saveAnswerToServer = useDebounce(async (soalId: string, opsiIds: string[]) => {
    if (!sessionId) return;
    try {
      await api.post(`/api/siswa/sesi/${sessionId}/jawab`, {
        soalId,
        opsiIds
      });
    } catch (err) {
      console.error('Failed to save answer', err);
    }
  }, 500);

  const handleAnswerSelect = (opsiId: string) => {
    const currentSoal = soalList[currentIndex];
    if (!currentSoal) return;
    
    setAnswers(prev => {
      const isMulti = currentSoal.tipe === 'PG_KOMPLEKS';
      const currentAns = prev[currentSoal.id] || [];
      
      let newAns: string[];
      if (isMulti) {
        if (currentAns.includes(opsiId)) {
          newAns = currentAns.filter(id => id !== opsiId);
        } else {
          newAns = [...currentAns, opsiId];
        }
      } else {
        newAns = [opsiId];
      }
      
      const nextAnswers = { ...prev, [currentSoal.id]: newAns };
      localStorage.setItem(`exam_ans_${sessionId}`, JSON.stringify(nextAnswers));
      saveAnswerToServer(currentSoal.id, newAns);
      return nextAnswers;
    });
  };

  const toggleFlag = () => {
    const currentSoal = soalList[currentIndex];
    if (!currentSoal) return;

    setFlagged(prev => {
      const nextFlags = { ...prev, [currentSoal.id]: !prev[currentSoal.id] };
      localStorage.setItem(`exam_flags_${sessionId}`, JSON.stringify(nextFlags));
      return nextFlags;
    });
  };

  const submitExam = async (reason: string = 'manual') => {
    if (!sessionId || isSubmitting) return;
    try {
      setIsSubmitting(true);
      await api.post(`/api/siswa/sesi/${sessionId}/submit?reason=${reason}`);
      
      // Cleanup
      localStorage.removeItem(`exam_timer_${sessionId}`);
      localStorage.removeItem(`exam_ans_${sessionId}`);
      localStorage.removeItem(`exam_flags_${sessionId}`);

      // Exit fullscreen if active
      if (document.fullscreenElement) {
        await document.exitFullscreen().catch(console.error);
      }

      navigate(`/dashboard/siswa/hasil/${sessionId}`, { replace: true });
    } catch (err: any) {
      toast.error(err.message || 'Gagal mengumpulkan ujian. Silakan coba lagi.');
      setIsSubmitting(false);
    }
  };

  // Prevent drag and drop, copy paste, except in inputs
  useEffect(() => {
    const blockAction = (e: Event) => {
      const target = e.target as HTMLElement;
      if (target.tagName !== 'INPUT' && target.tagName !== 'TEXTAREA') {
        e.preventDefault();
      }
    };
    
    document.addEventListener('copy', blockAction);
    document.addEventListener('paste', blockAction);
    document.addEventListener('cut', blockAction);
    document.addEventListener('dragstart', blockAction);
    document.addEventListener('drop', blockAction);
    
    return () => {
      document.removeEventListener('copy', blockAction);
      document.removeEventListener('paste', blockAction);
      document.removeEventListener('cut', blockAction);
      document.removeEventListener('dragstart', blockAction);
      document.removeEventListener('drop', blockAction);
    };
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center">
        <div className="w-8 h-8 border-4 border-blue-600/30 border-t-blue-600 rounded-full animate-spin mb-4" />
        <p className="text-slate-500 font-medium">Menyiapkan Ujian...</p>
      </div>
    );
  }

  if (!sessionData) return null;

  const currentSoal = soalList[currentIndex];
  const answeredCount = Object.keys(answers).filter(k => answers[k] && answers[k].length > 0).length;
  const flaggedCount = Object.values(flagged).filter(v => v).length;
  const unansweredCount = soalList.length - answeredCount;
  const progressPercent = soalList.length > 0 ? (answeredCount / soalList.length) * 100 : 0;

  // Render Fullscreen Gate
  if (!isFullscreen) {
    return (
      <div className="fixed inset-0 z-[100] bg-slate-900 flex items-center justify-center p-4">
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="fullscreen-gate-title"
          className="bg-white max-w-lg w-full rounded-2xl shadow-2xl p-8 text-center space-y-6"
        >
          <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-2">
            <Maximize className="w-8 h-8" />
          </div>
          <div>
            <h2 id="fullscreen-gate-title" className="text-2xl font-bold text-slate-900">Masuk Mode Layar Penuh</h2>
            <p className="text-slate-500 mt-2">
              Ujian ini mewajibkan mode layar penuh (Fullscreen). Anda tidak diizinkan untuk berpindah tab atau mengecilkan layar selama ujian berlangsung.
            </p>
          </div>
          <div className="bg-red-50 text-red-700 p-4 rounded-xl text-sm border border-red-100 text-left">
            <p className="font-semibold mb-1 flex items-center gap-2">
              <AlertCircle className="w-4 h-4" /> Penting!
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Meninggalkan layar penuh akan dicatat sebagai <span className="font-bold">pelanggaran</span>.</li>
              <li>Jika pelanggaran mencapai {maxViolations} kali, ujian akan <span className="font-bold">dihentikan paksa</span>.</li>
            </ul>
          </div>
          <Button size="lg" className="w-full text-lg h-14" onClick={requestFullscreen}>
            Masuk Layar Penuh & Lanjutkan Ujian
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row select-none">
      {/* Sidebar — Desktop only */}
      <aside className="hidden md:flex md:flex-col md:w-72 bg-white border-r border-slate-200 shrink-0 relative z-20">
        <div className="p-4 border-b border-slate-100">
          <h2 className="font-bold text-slate-900 line-clamp-1">{sessionData.ujian.mataPelajaran}</h2>
          <p className="text-xs text-slate-500">{sessionData.ujian._count?.soal || soalList.length} Soal</p>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 scroller">
          {/* Legend */}
          <div className="grid grid-cols-2 gap-2 mb-6 text-xs text-slate-600 font-medium">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-blue-600" /> Current
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-green-500" /> Dijawab
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-amber-400" /> Ditandai
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full border border-slate-300 bg-white" /> Belum
            </div>
          </div>

          <div className="grid grid-cols-5 md:grid-cols-4 gap-2">
            {soalList.map((soal, idx) => {
              const isActive = idx === currentIndex;
              const hasAnswer = answers[soal.id] && answers[soal.id].length > 0;
              const isFlagged = flagged[soal.id];
              
              let btnClass = 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'; // Default
              
              if (isActive) btnClass = 'bg-blue-600 border-blue-600 text-white shadow-md transform scale-105';
              else if (isFlagged) btnClass = 'bg-amber-100 border-amber-300 text-amber-800';
              else if (hasAnswer) btnClass = 'bg-green-100 border-green-300 text-green-800';

              return (
                <button
                  key={soal.id}
                  onClick={() => setCurrentIndex(idx)}
                  className={`relative aspect-square flex items-center justify-center rounded-lg border font-semibold text-sm transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${btnClass}`}
                >
                  {soal.nomor || idx + 1}
                  {isFlagged && !isActive && (
                    <div className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-amber-400 border border-white" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        <div className="p-4 border-t border-slate-200">
          <Button 
            variant="destructive" 
            className="w-full font-bold shadow-sm" 
            onClick={() => setShowSubmitConfirm(true)}
          >
            Selesai Ujian
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 bg-slate-50 relative h-[100dvh]">
        {/* Top Header */}
        <header className="bg-white h-16 border-b border-slate-200 flex items-center justify-between px-4 sm:px-6 shrink-0 relative z-10">
          <div className="flex items-center gap-3 min-w-0 mr-4">
            <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold shrink-0">
               {sessionData.siswa.nama.charAt(0)}
            </div>
            <div className="min-w-0">
              <h1 className="font-bold text-slate-900 truncate text-sm sm:text-base leading-tight">
                {sessionData.ujian.judul}
              </h1>
              <p className="text-xs text-slate-500 truncate">{sessionData.siswa.nama}</p>
            </div>
          </div>
          
          <div className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg font-mono text-base sm:text-lg lg:text-xl font-bold tracking-wider shrink-0 transition-colors ${
            isCritical ? 'bg-red-100 text-red-700 animate-pulse' : 
            isWarning ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-700'
          }`}>
            <Clock className={`w-4 h-4 sm:w-5 sm:h-5 ${isCritical ? 'text-red-500' : isWarning ? 'text-amber-500' : 'text-slate-400'}`} />
            {formattedTime}
          </div>
        </header>

        {/* Progress Bar */}
        <div className="h-1 w-full bg-slate-200 shrink-0">
          <div className="h-full bg-green-500 transition-all duration-300" style={{ width: `${progressPercent}%` }} />
        </div>

        {/* Anti-Cheat Warning Dropdown */}
        {isWarningVisible && latestViolation && (
          <div className="bg-red-50 border-b border-red-200 p-4 shadow-sm relative z-10">
             <div className="flex items-start gap-3 max-w-4xl mx-auto">
                <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 shrink-0" />
                <div className="flex-1">
                  <h4 className="text-red-800 font-bold mb-1">
                    Peringatan Pelanggaran {violationCount} / {maxViolations}
                  </h4>
                  <p className="text-red-700 text-sm">
                    {latestViolation.message}
                  </p>
                  <p className="text-xs text-red-600 mt-2 font-medium">
                    Apabila pelanggaran mencapai {maxViolations} kali, ujian akan dihentikan paksa dan nilai Anda akan digugurkan.
                  </p>
                </div>
                <button onClick={dismissWarning} className="p-1 rounded-md hover:bg-red-100 text-red-500">
                  <X className="w-5 h-5" />
                </button>
             </div>
          </div>
        )}

        {/* Soal Content */}
        <div className="flex-1 overflow-y-auto px-4 py-6 sm:p-8 scroller relative">
          <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            
            {/* Soal Header */}
            <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex flex-wrap justify-between items-center gap-4">
               <div className="flex items-center gap-3">
                  <Badge variant="default" className="text-sm px-3 py-1 bg-slate-800 hover:bg-slate-800">
                    Soal {currentSoal?.nomor || currentIndex + 1}
                  </Badge>
                  <Badge variant="outline" className="text-xs text-slate-500 border-slate-300">
                    {currentSoal?.tipe.replace('_', ' ')}
                  </Badge>
               </div>
               
               <Button 
                variant="outline" 
                size="sm" 
                onClick={toggleFlag}
                className={`gap-2 ${flagged[currentSoal?.id] ? 'bg-amber-50 text-amber-600 border-amber-200 hover:bg-amber-100' : 'text-slate-500'}`}
               >
                 <Flag className={`w-4 h-4 ${flagged[currentSoal?.id] ? 'fill-current' : ''}`} />
                 Ragu-ragu
               </Button>
            </div>

            {/* Soal Body */}
            <div className="p-6 sm:p-8">
               <div className="prose prose-slate max-w-none mb-8">
                 <p className="text-lg text-slate-900 leading-relaxed max-w-none whitespace-pre-wrap">
                   {currentSoal?.teks}
                 </p>
                 {currentSoal?.imageUrl && (
                   <img src={currentSoal.imageUrl} alt="Lampiran Soal" className="my-6 rounded-lg max-w-full max-h-[400px] border border-slate-200" />
                 )}
               </div>

               {currentSoal?.tipe === 'PG_KOMPLEKS' && (
                 <div className="mb-4 text-sm font-medium pr-4 flex items-center gap-2 text-blue-600 bg-blue-50 p-3 rounded-lg border border-blue-100">
                   <CheckSquare className="w-4 h-4" /> Pilih semua jawaban yang benar (Bisa lebih dari satu)
                 </div>
               )}

               <div className="space-y-3 mt-8">
                 {currentSoal?.opsi.map((opsi: any, i: number) => {
                   const cAns = answers[currentSoal.id] || [];
                   const isSelected = cAns.includes(opsi.id);
                   const isMulti = currentSoal.tipe === 'PG_KOMPLEKS';

                   // Gunakan huruf A, B, C, D...
                   const letter = String.fromCharCode(65 + i);

                   return (
                     <button
                       key={opsi.id}
                       onClick={() => handleAnswerSelect(opsi.id)}
                       className={`w-full flex items-start text-left p-4 rounded-xl border-2 transition-all duration-200 group focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 ${
                         isSelected 
                           ? 'border-blue-600 bg-blue-50/50 shadow-sm' 
                           : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                       }`}
                     >
                       <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mr-4 font-bold border-2 transition-colors ${
                         isSelected 
                          ? (isMulti ? 'bg-blue-600 border-blue-600 text-white' : 'bg-blue-600 border-blue-600 text-white rounded-full')
                          : (isMulti ? 'border-slate-300 text-slate-500 bg-white' : 'border-slate-300 text-slate-500 bg-white rounded-full group-hover:border-slate-400')
                       }`}>
                         {isMulti ? (isSelected ? <CheckSquare className="w-5 h-5 mx-0.5" /> : letter) : letter}
                       </div>
                       <div className={`flex-1 pt-1 ${isSelected ? 'font-semibold text-blue-900' : 'text-slate-700 group-hover:text-slate-900'}`}>
                         {opsi.teks}
                       </div>
                     </button>
                   );
                 })}
               </div>
            </div>
          </div>
        </div>

        {/* Bottom Navigation */}
        <footer className="bg-white border-t border-slate-200 p-4 shrink-0 z-10">
          <div className="max-w-4xl mx-auto flex items-center justify-between gap-4">
             <Button
               variant="outline"
               size="lg"
               onClick={() => setCurrentIndex(prev => Math.max(0, prev - 1))}
               disabled={currentIndex === 0}
               aria-label="Soal Sebelumnya"
               className="gap-2 px-4 sm:px-6 h-12"
             >
               <ChevronLeft className="w-5 h-5" />
               <span className="hidden sm:inline">Soal Sebelumnya</span>
             </Button>

             <div className="hidden sm:flex text-sm text-slate-500 font-medium px-4 items-center justify-center gap-1.5 flex-1 whitespace-nowrap text-center">
               <span className="text-green-600">{answeredCount} Dijawab</span>
               <span className="mx-1 opacity-50">•</span>
               <span>{unansweredCount} Belum</span>
               <span className="mx-1 opacity-50">•</span>
               <span className="text-amber-600">{flaggedCount} Ditandai</span>
             </div>

             <Button
               variant="default"
               size="lg"
               onClick={() => setCurrentIndex(prev => Math.min(soalList.length - 1, prev + 1))}
               disabled={currentIndex === soalList.length - 1}
               aria-label="Soal Berikutnya"
               className="gap-2 px-4 sm:px-6 h-12 bg-slate-900 hover:bg-slate-800"
             >
               <span className="hidden sm:inline">Soal Berikutnya</span>
               <ChevronRight className="w-5 h-5" />
             </Button>
          </div>
        </footer>

        {/* FAB Mobile — Navigasi Soal */}
        <button
          className="fixed bottom-20 right-4 z-30 md:hidden w-14 h-14 bg-blue-600 text-white rounded-full shadow-xl flex flex-col items-center justify-center gap-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
          onClick={() => setShowMobileNav(true)}
          aria-label="Navigasi soal"
        >
          <List className="w-5 h-5" />
          {unansweredCount > 0 && (
            <span className="text-[10px] font-bold leading-none">{unansweredCount}</span>
          )}
        </button>

        {/* Submit Default Modal */}
        {showSubmitConfirm && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm shadow-2xl">
             <div
               ref={submitModalRef}
               role="dialog"
               aria-modal="true"
               aria-labelledby="submit-confirm-title"
               className="bg-white max-w-md w-full rounded-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200"
             >
                <div className="p-6 text-center space-y-4">
                  <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-2">
                    <CheckSquare className="w-8 h-8" />
                  </div>
                  <h3 id="submit-confirm-title" className="text-2xl font-bold text-slate-900">Selesai Ujian?</h3>
                  <p className="text-slate-500">
                    Anda yakin ingin menyelesaikan ujian sekarang?
                    {unansweredCount > 0 && (
                      <span className="block mt-2 font-semibold text-red-600 bg-red-50 p-2 rounded-lg">
                        Peringatan: Masih ada {unansweredCount} soal yang belum dijawab!
                      </span>
                    )}
                  </p>
                </div>
                <div className="bg-slate-50 p-4 border-t border-slate-100 flex justify-end gap-3">
                  <Button variant="outline" onClick={() => setShowSubmitConfirm(false)}>Kembali Mengerjakan</Button>
                  <Button onClick={() => submitExam('manual')} disabled={isSubmitting} className="bg-blue-600 hover:bg-blue-700 gap-2">
                    {isSubmitting ? (
                      <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    ) : 'Selesai & Kumpulkan'}
                  </Button>
                </div>
             </div>
          </div>
        )}
      </main>

      {/* Mobile Bottom Drawer — Navigasi Soal */}
      {showMobileNav && (
        <div className="fixed inset-0 z-[150] md:hidden" onClick={() => setShowMobileNav(false)}>
          <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" />
          <div
            ref={mobileNavRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="mobile-nav-title"
            className="absolute inset-x-0 bottom-0 h-2/3 bg-white rounded-t-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom duration-300"
            onClick={e => e.stopPropagation()}
          >
            {/* Header drawer */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 shrink-0">
              <div>
                <h3 id="mobile-nav-title" className="font-bold text-slate-900">Navigasi Soal</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {answeredCount} dijawab · {unansweredCount} belum · {flaggedCount} ditandai
                </p>
              </div>
              <button
                onClick={() => setShowMobileNav(false)}
                className="p-2 rounded-lg hover:bg-slate-100 text-slate-500"
                aria-label="Tutup navigasi"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Konten drawer */}
            <div className="flex-1 overflow-y-auto p-4">
              {/* Legend */}
              <div className="grid grid-cols-2 gap-2 mb-4 text-xs text-slate-600 font-medium">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-blue-600" /> Saat ini
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-green-500" /> Dijawab
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-amber-400" /> Ditandai
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full border border-slate-300 bg-white" /> Belum
                </div>
              </div>

              {/* Grid nomor soal */}
              <div className="grid grid-cols-6 gap-2">
                {soalList.map((soal, idx) => {
                  const isActive = idx === currentIndex;
                  const hasAnswer = answers[soal.id] && answers[soal.id].length > 0;
                  const isFlagged = flagged[soal.id];

                  let btnClass = 'bg-white border-slate-200 text-slate-600';
                  if (isActive) btnClass = 'bg-blue-600 border-blue-600 text-white shadow-md';
                  else if (isFlagged) btnClass = 'bg-amber-100 border-amber-300 text-amber-800';
                  else if (hasAnswer) btnClass = 'bg-green-100 border-green-300 text-green-800';

                  return (
                    <button
                      key={soal.id}
                      onClick={() => { setCurrentIndex(idx); setShowMobileNav(false); }}
                      className={`relative aspect-square flex items-center justify-center rounded-lg border font-semibold text-sm transition-all focus:outline-none ${btnClass}`}
                    >
                      {soal.nomor || idx + 1}
                      {isFlagged && !isActive && (
                        <div className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-amber-400 border border-white" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Footer drawer */}
            <div className="p-4 border-t border-slate-100 shrink-0">
              <Button
                variant="destructive"
                className="w-full font-bold"
                onClick={() => { setShowMobileNav(false); setShowSubmitConfirm(true); }}
              >
                Selesai Ujian
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
