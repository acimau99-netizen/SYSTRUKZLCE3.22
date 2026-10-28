# 🚀 ZLCE Studio v3.2.2 (Zero-Loss Context Engineering)

[![Status Kit ZLCE: 14/14 Lulus Pengujian](https://img.shields.io/badge/Kit%20ZLCE%20v3.2.2-14%2F14%20LULUS%20TEST-success?style=for-the-badge&logo=checkmarx)](data/FEEDBACK_ZLCE_EVALUASI.md)
[![TypeScript 5.8](https://img.shields.io/badge/TypeScript-5.8-blue?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![React 19](https://img.shields.io/badge/React-19-61dafb?style=for-the-badge&logo=react)](https://react.dev/)
[![Tailwind CSS v4](https://img.shields.io/badge/Tailwind-CSS%20v4-38bdf8?style=for-the-badge&logo=tailwindcss)](https://tailwindcss.com/)

> **Standardisasi Rekayasa Konteks Tanpa Kebocoran (Zero-Loss)** untuk interaksi berkelanjutan antara Manusia & AI Agent (Google AI Studio, Claude Code, Cursor, ChatGPT, Windsurf, Codex, dan IDE AI lainnya).

---

## 1. 📖 Pengertian dan Penjelasan Apa Itu ZLCE

**ZLCE (Zero-Loss Context Engineering)** adalah metodologi dan kerangka kerja (*framework*) rekayasa prompt dan manajemen status terstruktur yang dirancang agar AI tidak pernah "lupa", tidak berasumsi sembarangan (halusinasi), dan tidak kehilangan arah saat mengerjakan proyek perangkat lunak dari awal hingga selesai.

Dalam kolaborasi dengan LLM / AI Coding Assistant, masalah paling umum adalah **konteks yang amnesia** ketika percakapan berganti sesi, jendela token menipis, atau terjadi *compaction*. 

ZLCE memecahkan masalah ini dengan konsep **"Single Source of Truth yang Terverifikasi"**:
- AI tidak lagi mengandalkan memori obrolan yang rapuh.
- Seluruh keputusan arsitektur, status tugas, riwayat perubahan, dan batasan teknis dicatat dalam berkas teks terstruktur (*Control Documents*) yang selalu terbaca oleh AI di setiap sesi kerja.
- Dilengkapi mekanisme protokol transaksi berkas (*Write-Ahead Logging* / WAL) dan *handover* (serah-terima sesi) yang presisi.

---

## 2. 🎯 Penjelasan Kegunaan & Manfaat ZLCE

### Mengapa Anda Membutuhkan ZLCE?
Ketika mengembangkan software dengan AI tanpa metodologi ZLCE:
1. **Amnesia Antar Sesi**: Saat kuota token obrolan habis dan Anda harus membuka sesi/chat baru, AI lupa kesepakatan arsitektur dan menulis ulang kode yang sudah bekerja.
2. **Asumsi Liar (Halusinasi)**: AI mengarang API, salah menebak port database, atau menghapus fitur lama tanpa izin.
3. **Revisi Tak Terkendali (Regression)**: Memperbaiki 1 bug malah mematahkan 3 fitur lain karena AI tidak memantau matriks dependensi.
4. **Waktu Terbuang**: Pengembang harus mengetik ulang instruksi panjang lebar berulang kali di setiap sesi.

### Manfaat Nyata ZLCE:
* 🔒 **Zero Context Drift**: AI melanjutkan pekerjaan tepat di titik terakhir tanpa ada informasi yang bocor atau tercecer.
* 🚦 **4 Gerbang Kualitas (Quality Gates)**: AI dilarang keras menulis kode sebelum Blueprint & Spesifikasi disepakati (Anti-Trial-and-Error).
* 📝 **Write-Ahead Logging (WAL)**: Perubahan status selalu dicatat sebelum tindakan diambil, mencegah rollback gagal atau bug tak terlacak.
* ⚡ **Efisiensi Token**: Mereduksi konsumsi token melalui pembacaan bertingkat (Tier 0–2) dibanding menempel seluruh codebase secara berulang.
* 🤝 **Serah Terima AI-ke-AI Seamless**: Anda dapat memindahkan pekerjaan dari Google AI Studio ke Claude Code atau Cursor tanpa kehilangan satu baris konteks pun.

---

## 3. ⚡ Panduan Cepat: Inisiasi Proyek dalam 3 Langkah

Hanya butuh **3 langkah ringkas** untuk memulai proyek software Anda bersama AI menggunakan kit ZLCE:

### Langkah 1: Tentukan Mode Proyek
Pilih salah satu mode:
* **Mode LITE (Default & Direkomendasikan untuk proyek < 15 task / 1–2 modul):**
  Hanya membutuhkan 4 berkas kontrol inti:
  1. `BLUEPRINT.md` (Gerbang 1)
  2. `TASKS.md` (Gerbang 3)
  3. `SESSION_STATE.md` (Gerbang 4)
  4. `HANDOVER.md` (Serah terima)
* **Mode FULL (Untuk sistem besar / multi-service / arsitektur kompleks > 15 task):**
  Membuat 10 dokumen kontrol lengkap bertahap melalui 4 Gerbang Persetujuan (`templates/`).

---

### Langkah 2: Salin & Isi Parameter Inisiasi di `LANDING_PROMPT.md`
Buka berkas `LANDING_PROMPT.md` (atau salin langsung blok template di bawah ini). Sesuaikan nilai dalam kurung siku sesuai spesifikasi proyek Anda:

```markdown
## 1. PARAMETER PROYEK (INPUT PENGGUNA)
- Nama Proyek: [Contoh: Aplikasi Rental Kendaraan]
- Aksi: [BARU | RESTRUKTURISASI]
- MODE: [LITE (Rekomendasi) | FULL]
- Domain / Industri: [Contoh: Rental / FinTech / E-Commerce / Logistik]
- Profil Domain (opsional): [booking | none]
- Sasaran: [Contoh: Web App React 19 + Vite + Tailwind CSS]
- Tech Stack: [Contoh: React 19, Tailwind CSS v4, TypeScript, SQLite, Express]
- Kebutuhan Inti:
  1. [Contoh: Manajemen katalog armada motor & status ketersediaan unit]
  2. [Contoh: Formulir reservasi booking dengan validasi tanggal sewa]
  3. [Contoh: Verifikasi identitas penyewa dan dashboard admin]
```

---

### Langkah 3: Tempelkan ke Sesi AI dan Jalankan Gerbang 1
1. **Buka Sesi AI Pertama**: Gunakan Google AI Studio, Claude Code, Cursor, Windsurf, ChatGPT, atau AI IDE pilihan Anda.
2. **Lampirkan Template**:
   - Jika AI mendukung lampiran banyak berkas: lampirkan isi folder `templates/`.
   - Jika AI berbasis prompt tunggal tanpa upload folder: gunakan satu berkas bundel `ZLCE_KIT_SINGLE.md`.
3. **Kirim Prompt**: Tempelkan prompt parameter yang sudah diisi di Langkah 2.
4. **PENTING (Quality Gate 1):** AI akan menghasilkan **`BLUEPRINT.md` (Gerbang 1)** dan **BERHENTI**. 
   Periksa rancangan tersebut, lalu kirim persetujuan Anda:
   > *"Setujui Gerbang 1 (BLUEPRINT.md). Lanjutkan ke gerbang berikutnya."*

---

### 🧭 Matriks Situasi Kerja: Kapan Menggunakan Dokumen Tertentu?

| Situasi Kerja | Tindakan & Berkas yang Digunakan |
| :--- | :--- |
| **Memulai Proyek Baru** | Gunakan `LANDING_PROMPT.md` (Aksi: `BARU`). |
| **Melanjutkan Sesi / Pindah AI / Sesi Normal Selesai** | Gunakan `HANDOVER_PROMPT.md` + lampirkan `SESSION_STATE.md`. |
| **Merapikan Proyek Lama (Existing Codebase)** | Gunakan `LANDING_PROMPT.md` (Aksi: `RESTRUKTURISASI`). AI dilarang mengubah kode lama sebelum audit dan matriks selesai. |
| **Validasi Integritas Format State** | Jalankan `python3 scripts/zlce/zlce-check.py .` di terminal, atau buka antarmuka visual **ZLCE Studio**. |
| **Sesi Terputus Tiba-Tiba (Crash / Token Limit)** | Jalankan `bash scripts/zlce/zlce-snapshot.sh --diff` atau buka tab **Recovery** di ZLCE Studio untuk pemulihan Kasus A–D. |

---

## 4. 🛠️ Cara Pemakaian ZLCE (3 Alur Kerja Operasional)

### Jalur 1: Proyek Baru (Mulai dari Nol)
1. **Inisiasi via Landing Prompt**: Jalankan 3 langkah cepat di atas.
2. **Gerbang Kualitas Bertahap (Quality Gates)**:
   - Gerbang 1: `BLUEPRINT.md` (Visi & Lingkup) -> Pengguna menyetujui.
   - Gerbang 2: `ARCHITECTURE.md` & `DATA_MODEL.md` (Hanya di mode FULL) -> Pengguna menyetujui.
   - Gerbang 3: `TASKS.md` & `TESTING.md` (Daftar antrean tugas atomik) -> Pengguna menyetujui.
   - Gerbang 4: `SESSION_STATE.md` & `AI_WORKFLOW.md` (State aktif & aturan eksekusi).
3. **Eksekusi Atomik & Transaksional**:
   - AI hanya boleh mengerjakan **tepat 1 task** berstatus `IN_PROGRESS` pada satu waktu.
   - Perubahan status wajib dicatat di tabel matriks task dan blok WAL (*Write-Ahead Log*).
   - Penandaan status `DONE` **wajib** menyertakan bukti verifikasi nyata (log tes, perintah verifikasi, atau tangkapan keluaran).

---

### Jalur 2: Lanjut Sesi / Pindah AI / Sesi Terputus (Handover & Recovery)
1. **Persiapkan Dokumen Serah Terima**:
   - Ambil berkas `SESSION_STATE.md` dari sesi sebelumnya.
   - Jika sesi sebelumnya terputus di tengah jalan (token limit / crash), jalankan snapshot di terminal:
     ```bash
     bash scripts/zlce/zlce-snapshot.sh --diff
     ```
     *(Atau buka tab **Recovery** di aplikasi web ZLCE Studio untuk menghasilkan teks snapshot).*
2. **Panggil AI Baru dengan Handover**:
   - Buka sesi obrolan AI yang baru.
   - Tempelkan isi `HANDOVER_PROMPT.md` dan lampirkan `SESSION_STATE.md` serta cuplikan snapshot git.
   - AI akan otomatis mengidentifikasi status (Kasus A: Bersih, Kasus B: In-flight diff cocok dengan WAL, Kasus C: Commit desync di git log, atau Kasus D: Perubahan di luar WAL) dan langsung melanjutkan langkah yang tertulis di WAL (*Write-Ahead Log*) tanpa amnesia.

---

### Jalur 3: Proyek Existing yang Direstrukturisasi
1. **Gunakan Landing Prompt Mode Restrukturisasi**:
   - Buka `LANDING_PROMPT.md`, setel parameter: `Aksi: RESTRUKTURISASI proyek existing`.
   - Lampirkan struktur direktori kode lama dan berkas kunci (misal `package.json`, skema database, atau rute utama).
2. **Audit Baca-Saja (Read-Only Audit)**:
   - AI dilarang keras mengubah atau menghapus kode lama sebelum menghasilkan `BLUEPRINT.md` dan `TASKS.md` pemetaan.
   - Setelah tugas atomik disetujui, refactor dilakukan per task terisolasi dengan verifikasi berbukti.

---

## 5. ✨ Fitur Utama ZLCE Studio (Web GUI)

**ZLCE Studio** adalah aplikasi web interaktif yang mendampingi pengembang dan tim dalam menerapkan standar ZLCE secara visual, cepat, dan otomatis:

| Fitur | Deskripsi |
| :--- | :--- |
| **🎛️ Quick Action Sidebar** | Akses cepat untuk generate UUID v4 unik, insert timestamp ISO/X1 terkini, toggle fullscreen editor, dan switch template kontrol dalam 1 klik. |
| **💾 Persistent Storage & Undo/Restore** | Setiap ketikan pada editor Markdown dan State Form disimpan otomatis ke `localStorage`. Dilengkapi tombol *Restore Last Session* dan *Reset to Default*. |
| **📂 Visual State & Raw Editor Sync** | Edit dokumen kontrol via formulir interaktif (Sprint, Tasks, WAL Log, Architecture) atau langsung edit raw Markdown dengan sinkronisasi 2 arah (*bi-directional sync*). |
| **🛡️ 4 Inception Gates Checklist** | Validasi visual kesiapan proyek (Gerbang 1: Blueprint, Gerbang 2: Rules, Gerbang 3: Tasks/Testing, Gerbang 4: Session State & Verification). |
| **🤖 Prompt Generator Otomatis** | Salin instan prompt resmi ZLCE: `LANDING_PROMPT.md` (untuk memulai sesi) dan `HANDOVER_PROMPT.md` (untuk serah terima sesi). |
| **📊 Token Budget & Guard Engine** | Kalkulator estimasi token real-time dengan panduan batas ambang aman (Green <50k, Yellow 50k–120k, Red >150k untuk handover). |
| **🩹 Recovery Protocol Assistant** | Wizard penanganan 4 skenario darurat (Kasus A: Sesi baru, Kasus B: In-flight diff cocok dengan WAL, Kasus C: Commit desync di git log, Kasus D: Perubahan di luar WAL). |
| **📐 Triase Revisi R1–R7** | Klasifikasi skala revisi otomatis (Level S langsung vs Level M dependen/independen) dengan aturan isolasi risiko. |
| **📚 Tutorial Interaktif 3 Skenario** | Panduan langkah demi langkah implementasi ZLCE pada proyek baru, proyek berjalan, dan proyek restrukturisasi. |

---

## 6. 💻 Menjalankan Aplikasi Web ZLCE Studio

Aplikasi ZLCE Studio dapat dijalankan secara lokal dengan sangat mudah:

### Prasyarat
- **Node.js** v20+ atau v22+
- **npm**

### Langkah Instalasi & Menjalankan
```bash
# 1. Clone repositori
git clone https://github.com/acimau99-netizen/ZLCE3.22-studio.git
cd ZLCE3.22-studio

# 2. Install dependensi
npm install

# 3. Jalankan server pengembangan
npm run dev
```

Buka peramban Anda di: `http://localhost:3000`

### Build untuk Produksi
```bash
npm run build
npm run preview
```

---

## 7. 📁 Struktur Repositori

Repositori ini memuat kit resmi ZLCE v3.2.2 beserta aplikasi web ZLCE Studio dan skrip pembantu:

```text
zlce-studio/
├── README.md                  # 📘 Dokumentasi utama, panduan cepat 3 langkah, dan verifikasi
├── LANDING_PROMPT.md          # 🚀 Prompt inisiasi proyek baru / restrukturisasi (4 Inception Gates)
├── HANDOVER_PROMPT.md         # 🤝 Protokol penutupan & serah terima sesi AI (Kasus A–D)
├── ZLCE_KIT_SINGLE.md         # 📦 Bundel Utuh Kit ZLCE (Single File untuk LLM prompt tunggal)
├── metadata.json              # ⚙️ Konfigurasi metadata AI Studio
├── .gitignore                 # 🙈 Berkas aturan pengabaian git
│
├── templates/                 # 📄 10 Dokumen Kontrol Baku Standar ZLCE v3.2.2
│   ├── BLUEPRINT.template.md          # Gerbang 1: Visi, ruang lingkup, dan acceptance criteria
│   ├── ARCHITECTURE.template.md       # Gerbang 2: Arsitektur modul, tech stack, dan boundary
│   ├── DATA_MODEL.template.md         # Gerbang 2: Skema database, relasi entitas, dan migrasi
│   ├── TASKS.template.md              # Gerbang 3: Daftar task atomik (TASK-001, TASK-002, dst.)
│   ├── TESTING.template.md            # Gerbang 3: Rencana pengujian dan strategi acceptance
│   ├── CHECKLISTS.template.md         # Gerbang 4: Kepatuhan rilis & quality checklist
│   ├── AI_WORKFLOW.template.md        # Gerbang 4: Aturan main agen & format checkpoint block
│   ├── SESSION_STATE.template.md      # Gerbang 4: Single source of truth, matriks task & WAL
│   ├── CHANGELOG.template.md          # Gerbang 4: Log riwayat rilis dan revisi
│   └── profiles/                      # 🎭 Profil Domain Spesifik
│       └── DOMAIN_BOOKING.profile.md  # Profil domain reservasi & sewa (rental, booking)
│
├── scripts/                   # 🛠️ Skrip Diagnostik & Recovery (Opsional / CLI)
│   ├── zlce-check.py          # Wrapper tipis -> meneruskan eksekusi ke scripts/zlce/zlce-check.py
│   ├── zlce-snapshot.sh       # Wrapper tipis -> meneruskan eksekusi ke scripts/zlce/zlce-snapshot.sh
│   ├── zlce-collect.py        # Wrapper tipis -> meneruskan eksekusi ke scripts/zlce/zlce-collect.py
│   └── zlce/                  # Direktori skrip kanonik kit ZLCE (salin folder ini ke repo proyek Anda)
│       ├── zlce-check.py          # Pemeriksa integritas & validasi format SESSION_STATE.md
│       ├── zlce-snapshot.sh       # Snapshot status git & WAL untuk pemulihan sesi terputus
│       └── zlce-collect.py        # Kolektor diagnostik untuk bundle evaluasi
│
├── data/                      # 📊 Data Evaluasi Kit
│   └── FEEDBACK_ZLCE_EVALUASI.md      # Hasil pengujian benchmark AI Studio (14/14 Lulus)
│
├── examples/                  # 💡 Contoh Dokumen Nyata yang Terisi
│   └── SESSION_STATE.example.md       # Contoh berkas SESSION_STATE terisi lengkap
│
└── src/                       # 💻 Source Code Aplikasi Web ZLCE Studio
    ├── components/            # Komponen UI React (SessionStateTab, RecoveryTab, Sidebar, dll.)
    ├── hooks/                 # Custom React hooks (useSessionPersistence)
    ├── data/                  # Template data, skenario verifikasi (T1-T8, X1), tutorial
    └── utils/                 # Parser Markdown, validator skema, UUID generator, clipboard helper
```

> 💡 **Prinsip Arsitektur Distribusi Template (Multi-Channel Delivery)**:
> Repositori ini menyediakan template dalam representasi fungsional untuk kebutuhan berbeda:
> 1. `templates/*.md`: Berkas kontrol fisik terpisah untuk repositori Git dan IDE AI modular (Cursor, Windsurf, VS Code).
> 2. `ZLCE_KIT_SINGLE.md`: Bundel tunggal mandiri (*all-in-one bundle*) untuk model AI berbasis web prompt tunggal (ChatGPT, Claude web) yang tidak mendukung upload direktori sekaligus.
> 3. `src/data/templates.ts`: Runtime asset TypeScript agar web app ZLCE Studio dapat berjalan mandiri di browser tanpa ketergantungan server-side filesystem API.

---

## 8. 🏆 Hasil Verifikasi & Pengujian Kit ZLCE

Kit ZLCE v3.2.2 telah diuji secara komprehensif menggunakan benchmark evaluasi terstruktur (14 butir skenario uji) dan mencatatkan skor **14 / 14 LULUS (100% Pass Rate)**.

Bukti rincian pengujian didokumentasikan secara transparan pada repositori ini:
- 📑 **Hasil Evaluasi Lengkap**: [`data/FEEDBACK_ZLCE_EVALUASI.md`](data/FEEDBACK_ZLCE_EVALUASI.md)

### Ringkasan Skenario yang Terverifikasi:
- **T1**: Inisiasi Proyek Baru & Kepatuhan Gerbang 1
- **T2**: Uji Manual Kompatibilitas Lingkungan CLI & Git
- **T3**: Penolakan Penandaan DONE Tanpa Bukti Riil
- **T4a/b/c**: Triase Revisi Level S (Langsung), Level M Dependen, dan Level M Independen
- **T5**: Protokol Anti-Halusinasi Konfigurasi & Berkas
- **T6**: Handover Mode Normal
- **T7A/B/C/D**: Protokol Recovery Kasus A (Bersih), B (In-flight Diff), C (Commit Desync), D (Wildcard Diff)
- **T8**: Kepatuhan Format Checkpoint Block & WAL
- **X1**: Aturan Jam Anti-Ekstrapolasi (Fallback "jam: ?")
- **T8**: Format Checkpoint Block & Transaksionalitas WAL
- **X1**: Aturan Jam Anti-Ekstrapolasi (Fallback Wajib `"jam: ?"`)

---

## 9. 📜 Lisensi & Standar

- **Lisensi**: MIT License — Bebas digunakan, dimodifikasi, dan didistribusikan untuk proyek komersial maupun open-source.
- **Standar Format**: Markdown (CommonMark), JSON Schema, ISO 8601 UTC Timestamps.
- **Kompatibilitas AI**: Kompatibel dengan semua AI Frontier / LLM modern (Google Gemini 2.5 / Flash / Pro, Anthropic Claude 3.5 / 3.7 Sonnet, OpenAI GPT-4o / o1 / o3, Cursor IDE, Windsurf, Claude Code, Cline, dll.) yang mendukung instruksi sistem dan pemrosesan teks multi-dokumen.

---

*Dikembangkan untuk rekayasa perangkat lunak berbantuan AI yang presisi, deterministik, dan tanpa kehilangan konteks.*
