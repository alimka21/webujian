# REQ-001 — Autentikasi & Otorisasi

**Label:** `REQ-001`  
**Area:** Login, JWT, Role, Session, Middleware  
**Status:** ✅ Selesai  

---

## Aktor & Role

| Role | Login dengan | Redirect ke |
|------|-------------|-------------|
| `SUPER_ADMIN` | Email + password | `/dashboard/admin` |
| `GURU` | Email + password | `/dashboard/guru` |
| `SISWA` | NIS + password | `/dashboard/siswa` |

---

## Flow Login

1. User pilih role di LoginPage
2. Submit form → `POST /api/auth/login` dengan `{ identifier, password, role }`
3. Backend cari user (SISWA by NIS, lainnya by email)
4. Validasi: password bcrypt, role match, isActive
5. Generate JWT (8 jam), simpan ke UserSession table
6. Response: `{ token, user }` → simpan di localStorage via authStore
7. Redirect ke dashboard sesuai role

---

## File Terkait

**Frontend:**
- `src/pages/LoginPage.tsx` — UI login
- `src/store/authStore.ts` — state management auth
- `src/lib/api.ts` — auto-attach token di header
- `src/components/ProtectedRoute.tsx` — guard route

**Backend:**
- `server/routes/auth.ts` — endpoint login/logout/me
- `server/middleware.ts` — requireAuth, requireRole

---

## Endpoint

```
POST /api/auth/login    → login, return token
POST /api/auth/logout   → hapus session
GET  /api/auth/me       → data user saat ini
```

---

## Aturan Penting

- Password di-hash dengan bcrypt (cost factor 10)
- JWT disimpan di localStorage (bukan httpOnly cookie) karena Vite SPA
- Token di-attach via header `Authorization: Bearer <token>`
- Logout: hapus localStorage + DELETE session dari DB
- Session expired → redirect ke /login dengan `state.from` untuk redirect balik