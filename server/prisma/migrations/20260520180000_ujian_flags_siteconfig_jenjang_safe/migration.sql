-- Ujian: tiga flag baru untuk pengaturan ujian
ALTER TABLE `Ujian`
  ADD COLUMN `acakOpsi` BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN `tampilkanPembahasan` BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN `tampilkanNilai` BOOLEAN NOT NULL DEFAULT true;

-- SiteConfig.jenjang — jaga2 kalau migration alumni_verify_jenjang belum jalan
-- di production (user melaporkan error column tidak ada). Gunakan prosedur biar idempotent.
DROP PROCEDURE IF EXISTS add_siteconfig_jenjang;
DELIMITER //
CREATE PROCEDURE add_siteconfig_jenjang()
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'SiteConfig'
      AND COLUMN_NAME = 'jenjang'
  ) THEN
    ALTER TABLE `SiteConfig` ADD COLUMN `jenjang` VARCHAR(191) NULL;
  END IF;
END //
DELIMITER ;
CALL add_siteconfig_jenjang();
DROP PROCEDURE add_siteconfig_jenjang;
