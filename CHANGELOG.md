# Catatan Perubahan (Changelog)

Semua perubahan penting pada proyek **ZLCE (Zero-Loss Context Engineering)** didokumentasikan di sini. Format mengikuti prinsip [Keep a Changelog](https://keepachangelog.com/id/1.0.0/).

---

## [3.2.2] - 2026-10-21

### Ditambahkan
- Integrasi repositori resmi GitHub di `https://github.com/acimau99-netizen/ZLCE3.22-studio.git`.
- Standar skrip kanonik di `scripts/zlce/` (`zlce-check.py`, `zlce-snapshot.sh`, `zlce-collect.py`) dengan wrapper tipis di `scripts/`.
- Dukungan flag `--state <file>` dan `--no-git` pada `zlce-check.py` untuk menguji contoh berkas tanpa repositori git aktif.
- Dokumentasi operasional modular `docs/USAGE.md`, `SECURITY.md`, dan `CONTRIBUTING.md`.
- Skenario pengujian manual T2 (Kompatibilitas Lingkungan CLI & Git) dan panel konfigurasi metadata benchmark dinamis di tab Test Harness (14/14 Lulus).
- Sinkronisasi template impor `?raw` di web app langsung dari direktori fisik `templates/`.

### Diperbaiki
- Penguatan utilitas `generateUUIDv4` dengan fallback `crypto.getRandomValues()` untuk lingkungan HTTP/LAN saat `crypto.randomUUID` tidak tersedia.
- Paritas validasi `zlceValidator.ts` ditingkatkan untuk mencocokkan logika `zlce-check.py` pada seluruh aturan dokumen `SESSION_STATE.md` (deteksi dependensi, ID duplikat, keselarasan WAL vs IN_PROGRESS, status task aktif).
- Perbaikan parser Markdown agar tidak membuang baris teks yang mengandung kata "ID" dalam daftar asumsi.
- Perbaikan penanganan fallback clipboard di 22 titik menggunakan helper terpadu `copyText()`.
- Optimasi penyimpanan histori `useSessionPersistence` dengan skema *lightweight snapshot* (tanpa duplikasi objek terurai `stateData`) dan pembersihan *side-effect* state setter.
- Penyeragaman penamaan versi ke `ZLCE Studio v3.2.2` di seluruh komponen, template, prompt, dan metadata HTML.
- Pembersihan berkas usang `bun.lock` serta penambahan aturan `.gitignore` untuk cache interpreter Python (`__pycache__`, `*.pyc`).

---

## [3.2.1] - 2026-10-18

### Diperbaiki
- Sinkronisasi penamaan profil domain dan pemetaan `DOMAIN_BOOKING.profile.md`.
- Normalisasi penanganan format timestamp UTC ISO 8601 dan fallback aturan jam `X1` ("jam: ?").

---

## [3.2.0] - 2026-10-14

### Ditambahkan
- Inisiasi awal ZLCE Studio web app (React 19 + Vite + Tailwind CSS v4).
- 4 Quality Gates terstruktur: Blueprint, Rules, Tasks/Testing, Session State/Workflow.
- Protokol pemulihan darurat Kasus A–D (Working tree bersih, In-flight diff, Commit desync, Wildcard diff).
- Matriks triase revisi R1–R7 (Level S, M dependen, M independen).
- Modul uji benchmark Test Harness (14 butir evaluasi).
