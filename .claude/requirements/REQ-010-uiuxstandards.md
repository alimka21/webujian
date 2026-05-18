# REQ-010 — UI/UX Standards
 
**Label:** `REQ-010`  
**Area:** Komponen, pola interaksi, aksesibilitas, toast  
**Status:** ⚠️ ~60% (26 issue audit sedang di-fix)
 
---
 
## Komponen Wajib Dipakai
 
| Kebutuhan | Komponen |
|-----------|----------|
| Tombol | `src/components/ui/button.tsx` |
| Kartu | `src/components/ui/card.tsx` |
| Input | `src/components/ui/input.tsx` |
| Badge | `src/components/ui/badge.tsx` |
| Toast | `sonner` → `toast.success/error/info/warning` |
| Ikon | `lucide-react` |
| Grafik | `recharts` |
| Animasi | `framer-motion` |
 
## Pola Loading State
 
```tsx
if (isLoading) return (
  <div className="flex flex-col items-center py-12">
    <div className="w-6 h-6 border-4 border-blue-600/30 border-t-blue-600 
                    rounded-full animate-spin mb-2" />
    <span className="text-sm text-gray-500">Memuat...</span>
  </div>
);
```
 
## Pola Error State
 
```tsx
if (error) return (
  <div className="flex flex-col items-center py-12 text-center">
    <AlertCircle className="w-10 h-10 text-red-400 mb-2" />
    <p className="text-red-600 font-medium mb-1">Gagal memuat data</p>
    <p className="text-sm text-gray-500 mb-4">{error}</p>
    <Button onClick={refetch}>Muat Ulang</Button>
  </div>
);
```
 
## Pola Empty State
 
```tsx
if (data.length === 0) return (
  <div className="flex flex-col items-center py-12 text-center">
    <FileText className="w-10 h-10 text-gray-300 mb-2" />
    <p className="text-gray-500 mb-4">Belum ada data</p>
    <Button onClick={handleAdd}>+ Tambah Pertama</Button>
  </div>
);
```
 
## Pola Modal Konfirmasi Destructive
 
```tsx
// JANGAN window.confirm()
// PAKAI modal dengan state:
const [showConfirm, setShowConfirm] = useState(false);
// Tombol: "Batal" (secondary) | "Hapus" (destructive/red)
```
 
## Pola Form Validation
 
```tsx
// JANGAN satu errorMsg di atas
// PAKAI per-field error:
const [errors, setErrors] = useState<Record<string, string>>({});
// Di input: className={errors.nama ? 'border-red-500' : ''}
// Di bawah input: {errors.nama && <p className="text-red-500 text-xs mt-1">{errors.nama}</p>}
```
 
## Aksesibilitas (A11y) Wajib
 
- Setiap `<input>` harus punya `<label>` atau `aria-label`
- Tombol icon-only: tambah `aria-label="nama aksi"`
- Modal: `role="dialog"` + `aria-modal="true"` + `aria-labelledby`
- Link navigasi: `aria-label` pada ikon sidebar
- Gambar: `alt` text deskriptif atau `alt=""` jika dekoratif
## Responsive
 
- Tabel: `overflow-x-auto` di wrapper
- Modal: `w-full max-w-md mx-4` (tidak full-width di desktop)
- Sidebar: drawer di mobile (md:flex hidden)
- Form: 1 kolom mobile, 2 kolom `md:grid-cols-2` desktop
## Warna Nilai
 
- ≥ 75 → `text-green-600` / `bg-green-50`
- 60–74 → `text-yellow-600` / `bg-yellow-50`
- < 60 → `text-red-600` / `bg-red-50`
 