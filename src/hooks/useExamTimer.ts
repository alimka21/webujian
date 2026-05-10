import { useState, useEffect, useRef } from 'react';

interface UseExamTimerProps {
  durationSeconds: number;
  examSessionId: string;
  onExpire: () => void;
}

export function useExamTimer({ durationSeconds, examSessionId, onExpire }: UseExamTimerProps) {
  const [timeLeft, setTimeLeft] = useState(durationSeconds);
  const [isExpired, setIsExpired] = useState(false);
  
  const expireRef = useRef(false);

  useEffect(() => {
    const storageKey = `exam_timer_${examSessionId}`;
    let initialTime = durationSeconds;

    const storedData = localStorage.getItem(storageKey);
    if (storedData) {
      try {
        const { remaining, savedAt } = JSON.parse(storedData);
        // Hitung waktu yang telah berlalu sejak terakhir disimpan
        const elapsed = Math.floor((Date.now() - savedAt) / 1000);
        const adjustedTime = Math.max(0, remaining - elapsed);
        initialTime = adjustedTime;
      } catch (e) {
        console.error("Gagal melakukan parsing data timer", e);
      }
    } else {
      // Simpan inisialisasi awal
      localStorage.setItem(storageKey, JSON.stringify({
        remaining: initialTime,
        savedAt: Date.now()
      }));
    }

    setTimeLeft(initialTime);

    if (initialTime <= 0) {
      setIsExpired(true);
      if (!expireRef.current) {
        expireRef.current = true;
        onExpire();
      }
      return;
    }

    const intervalId = setInterval(() => {
      setTimeLeft(prev => {
        const next = Math.max(0, prev - 1);
        
        // Simpan ke local storage setiap 10 detik atau jika waktunya habis
        if (next % 10 === 0 || next === 0) {
          localStorage.setItem(storageKey, JSON.stringify({
            remaining: next,
            savedAt: Date.now()
          }));
        }

        if (next === 0 && !expireRef.current) {
          clearInterval(intervalId);
          setIsExpired(true);
          expireRef.current = true;
          localStorage.removeItem(storageKey);
          onExpire();
        }

        return next;
      });
    }, 1000);

    return () => {
      clearInterval(intervalId);
    };
  }, [durationSeconds, examSessionId, onExpire]);

  // Status peringatan
  const isWarning = timeLeft <= 600 && timeLeft > 0; // <= 10 menit
  const isCritical = timeLeft <= 120 && timeLeft > 0; // <= 2 menit

  // Parsing ke format HH:MM:SS atau MM:SS
  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;

    const pad = (num: number) => num.toString().padStart(2, '0');

    if (h > 0) {
      return `${pad(h)}:${pad(m)}:${pad(s)}`;
    }
    return `${pad(m)}:${pad(s)}`;
  };

  const formattedTime = formatTime(timeLeft);

  return {
    timeLeft,
    formattedTime,
    isWarning,
    isCritical,
    isExpired
  };
}
