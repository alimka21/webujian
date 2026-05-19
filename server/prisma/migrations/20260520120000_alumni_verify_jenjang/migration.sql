-- Alumni.isVerified — moderate alumni yg daftar via form publik
-- Alumni.createdAt — timestamp pendaftaran
ALTER TABLE `Alumni`
  ADD COLUMN `isVerified` BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3);

-- Mark semua alumni yg sudah ada sebagai verified (dianggap valid karena di-input admin)
UPDATE `Alumni` SET `isVerified` = true WHERE `isVerified` = false;

-- SiteConfig.jenjang — SD/SMP/SMA/SMK
ALTER TABLE `SiteConfig`
  ADD COLUMN `jenjang` VARCHAR(191) NULL;
