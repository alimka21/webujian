-- Fix bug PG_KOMPLEKS: unique constraint @@unique([sesiId, soalId]) di Jawaban
-- mem-block multiple row per (sesi, soal), padahal PG_KOMPLEKS butuh satu row
-- per opsi yang dipilih siswa. Akibatnya: insert ke-2 throws, deleteMany sudah
-- jalan duluan, DB kosong, hasil ujian baca "tidak dijawab".
--
-- Fix: drop unique key, ganti dengan index biasa (cukup utk query performance).
-- Idempotent via stored procedure.

DROP PROCEDURE IF EXISTS fix_jawaban_pg_kompleks;
DELIMITER //
CREATE PROCEDURE fix_jawaban_pg_kompleks()
BEGIN
  -- Drop unique constraint Jawaban_sesiId_soalId_key (nama default Prisma utk @@unique)
  IF EXISTS (
    SELECT 1 FROM INFORMATION_SCHEMA.STATISTICS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'Jawaban'
      AND INDEX_NAME = 'Jawaban_sesiId_soalId_key'
  ) THEN
    ALTER TABLE `Jawaban` DROP INDEX `Jawaban_sesiId_soalId_key`;
  END IF;

  -- Tambah index biasa untuk query performance (sesi + soal)
  IF NOT EXISTS (
    SELECT 1 FROM INFORMATION_SCHEMA.STATISTICS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'Jawaban'
      AND INDEX_NAME = 'Jawaban_sesiId_soalId_idx'
  ) THEN
    CREATE INDEX `Jawaban_sesiId_soalId_idx` ON `Jawaban`(`sesiId`, `soalId`);
  END IF;
END //
DELIMITER ;
CALL fix_jawaban_pg_kompleks();
DROP PROCEDURE fix_jawaban_pg_kompleks;
