# Review Teknis ZLCE Studio v3.2.2

**Objek review:** `SYSTRUKZLCE3.22-main.zip`  
**Fokus:** Arsitektur, konsistensi spesifikasi, dokumentasi, alur kerja, maintainability, risiko implementasi, dan ambiguitas desain.  
**Verdict:** `CONDITIONAL — NOT READY FOR PRODUCTION`

## 1. Executive summary

**ZLCE belum layak dinyatakan siap produksi berdasarkan bukti yang tersedia.** Terdapat inkonsistensi nyata antara validator TypeScript dan Python, persistensi state dilakukan melalui beberapa operasi terpisah, parsing Markdown bergantung pada pemrosesan string sederhana, dan keberhasilan build/type-check belum terbukti.

Pemeriksaan CLI terhadap contoh state berhasil dengan `0 error, 1 warn, 3 task`. Namun, hasil tersebut hanya membuktikan bahwa satu contoh state lolos dari pemeriksaan CLI; hasil itu tidak membuktikan kesiapan keseluruhan aplikasi.

### Ringkasan risiko

| Area | Temuan | Prioritas |
|---|---|---|
| Quality gate | Aturan persetujuan UI dan CLI berbeda | P0 |
| Build dan type-check | Pemeriksaan gagal di lingkungan saat ini | P0 |
| Persistensi | Data sesi disimpan pada beberapa kunci terpisah | P1 |
| Parser | Parsing Markdown menggunakan pencocokan string dan `split('|')` | P1 |
| Undo/redo | Pemulihan riwayat bergantung pada parsing ulang Markdown | P1 |
| Pengujian | Belum ada skrip `test` pada `package.json` | P1 |
| Reproduksibilitas | Lockfile npm/bun tidak ditemukan di arsip | P2 |
| Migrasi skema | Mekanisme migrasi versi belum terbukti | P2 |

## 2. Critical issues

### C1. Validasi persetujuan terlalu longgar di UI

- **Masalah:** Validator UI menggunakan pencarian substring untuk menentukan apakah persetujuan valid, sedangkan CLI menggunakan pencocokan nilai eksak.
- **Bukti:** `src/utils/zlceValidator.ts`, sekitar baris 249:

  ```ts
  !r.approved.includes('ya') &&
  !r.approved.includes('yes')
  ```

  Pada `scripts/zlce/zlce-check.py`, validasi dilakukan dengan `approved not in ("ya", "yes")`.
- **Dampak:** Nilai yang memuat substring `ya` atau `yes` dapat diterima UI walaupun bukan nilai persetujuan yang sah. UI dan CLI dapat memberi hasil berbeda untuk input yang sama.
- **Perbaikan:** Normalisasi whitespace dan kapitalisasi, kemudian validasi menggunakan kesamaan eksak terhadap enum yang sama di kedua implementasi. Tambahkan test negatif untuk `belum yakin`, `tidak`, string kosong, dan nilai di luar enum.

### C2. Build dan pemeriksaan tipe belum terverifikasi berhasil

- **Masalah:** Kesiapan kompilasi aplikasi tidak dapat dikonfirmasi.
- **Bukti hasil pemeriksaan:**
  - `npm run build` berhenti dengan `vite: Permission denied`.
  - `npm run lint` berhenti dengan `TS2688: Cannot find type definition file for 'vite/client'`.
  - `python3 scripts/zlce-check.py --state examples/SESSION_STATE.example.md --no-git` berhasil dengan `0 error, 1 warn, 3 task`.
- **Dampak:** Keberhasilan checker pada satu contoh state tidak membuktikan bahwa aplikasi dapat dikompilasi, lolos pemeriksaan tipe, atau berjalan benar di browser.
- **Perbaikan:** Ulangi pemeriksaan dari checkout bersih dengan dependensi sesuai manifest. Jalankan build, type-check, lint, dan test suite di CI serta simpan log dan exit code. Penyebab kegagalan build belum terverifikasi sebagai cacat source karena kondisi lingkungan dependensi/eksekusi belum tervalidasi.

## 3. Major issues

### M1. Implementasi validator terduplikasi tanpa bukti parity menyeluruh

- **Masalah:** Aturan validasi berada pada implementasi TypeScript dan Python yang terpisah.
- **Bukti:** `src/utils/zlceValidator.ts` dan `scripts/zlce/zlce-check.py` sama-sama memvalidasi status, dependensi, task aktif, WAL, dan quality gate. Perbedaan aturan persetujuan ditunjukkan pada C1.
- **Dampak:** State yang diterima UI dapat ditolak CLI, atau sebaliknya. Pengguna tidak memiliki satu sumber kebenaran yang dapat diandalkan.
- **Perbaikan:** Tetapkan spesifikasi normatif untuk setiap aturan, buat fixture valid/invalid bersama, dan jalankan fixture identik pada kedua validator. Jika memungkinkan, gunakan satu implementasi kanonik dengan adapter untuk UI dan CLI.

### M2. Persistensi sesi tidak atomik

- **Masalah:** Data sesi dan metadata disimpan melalui beberapa operasi terpisah.
- **Bukti:** `src/hooks/useSessionPersistence.ts`, sekitar baris 133–135, memanggil `localStorage.setItem` secara terpisah untuk `STORAGE_KEY_MARKDOWN`, `STORAGE_KEY_STATE`, dan `STORAGE_KEY_LAST_SAVED`. Riwayat disimpan terpisah melalui `saveLightweightHistory()`.
- **Dampak:** Jika penyimpanan gagal di tengah rangkaian, data dapat tidak sinkron. Markdown dapat berasal dari versi berbeda dengan objek state yang tersimpan. Penanganan error pada operasi individual tidak menjamin konsistensi keseluruhan.
- **Perbaikan:** Simpan satu envelope berversi yang mencakup Markdown, state, timestamp, dan metadata penting. Validasi envelope saat pemulihan dan sediakan fallback ke snapshot terakhir yang valid.

### M3. Parser Markdown bergantung pada pemrosesan string yang rapuh

- **Masalah:** Parsing mengandalkan pencocokan string dan pemisahan tabel manual.
- **Bukti:** `src/utils/markdownParser.ts`, sekitar baris 85–149, menggunakan pemeriksaan heading seperti `line.includes(...)` dan pemisahan tabel melalui `line.split('|')`. Validator UI juga memecah sel tabel dengan pendekatan serupa.
- **Dampak:** Variasi heading, delimiter di dalam teks, atau perubahan struktur Markdown dapat menghasilkan parsing keliru atau kehilangan data tanpa diagnostik yang memadai.
- **Perbaikan:** Gunakan parser Markdown yang teruji, definisikan skema untuk setiap bagian, dan keluarkan error eksplisit ketika struktur tidak sesuai. Tambahkan round-trip test Markdown → state → Markdown dengan karakter khusus, sel kosong, dan format tidak valid.

### M4. Konsistensi undo/redo setelah pemulihan belum terbukti

- **Masalah:** Riwayat ringan menyimpan Markdown dan metadata, lalu state dapat perlu dibangun ulang dari Markdown.
- **Bukti:** `src/hooks/useSessionPersistence.ts` menyimpan `id`, `timestamp`, `label`, dan `rawMarkdown` melalui `saveLightweightHistory()`. Indeks awal riwayat ditetapkan berdasarkan `history.length - 1`.
- **Dampak:** Konsistensi pemulihan bergantung pada keberhasilan parsing ulang dan kompatibilitas format. Belum ada bukti bahwa undo/redo tetap benar untuk semua versi state atau ketika penyimpanan parsial/rusak.
- **Perbaikan:** Tetapkan invariant riwayat: setiap snapshot konsisten, indeks selalu valid, dan setiap snapshot divalidasi saat dipulihkan. Uji reload, undo, redo, restore snapshot, reset, dan kegagalan penyimpanan.

### M5. Badge pengujian tidak membuktikan kesiapan build saat ini

- **Masalah:** Klaim kelulusan pengujian dalam dokumentasi dapat disalahartikan sebagai bukti kualitas keseluruhan aplikasi.
- **Bukti:** `README.md` baris 3 menampilkan badge `14/14 Lulus Pengujian` yang merujuk ke `data/FEEDBACK_ZLCE_EVALUASI.md`. Harness aplikasi berada di `src/components/TestHarnessTab.tsx`. `package.json` tidak memiliki skrip `test`.
- **Dampak:** Hasil evaluasi yang dirujuk tidak otomatis membuktikan source saat ini lolos build, type-check, integrasi, atau regresi.
- **Perbaikan:** Dokumentasikan cakupan, tanggal, versi source, metode, dan hasil pengujian. Tambahkan automated test suite dan CI untuk build, lint, type-check, serta regresi. Bedakan badge evaluasi metodologi dari status build aplikasi.

### M6. Kontrak transisi status task belum terbukti lengkap

- **Masalah:** Aturan status dan dependensi belum terbukti mencakup seluruh transisi yang mungkin.
- **Bukti:** `src/utils/zlceValidator.ts` memvalidasi status `PENDING`, `READY`, `IN_PROGRESS`, `BLOCKED`, dan `DONE`, serta mensyaratkan dependensi selesai untuk `READY`, `IN_PROGRESS`, dan `DONE`. Bukti pengujian transisi menyeluruh tidak tersedia dalam pemeriksaan ini.
- **Dampak:** Belum dapat dipastikan bahwa perubahan status selalu mengikuti jalur yang sah, terutama ketika task diblokir, dibuka kembali, atau dependensinya berubah setelah task selesai.
- **Perbaikan:** Definisikan tabel transisi status, aturan perubahan dependensi, dan perilaku ketika prasyarat task `DONE` berubah. Tolak transisi ilegal pada lapisan domain, bukan hanya pada pemeriksaan dokumen.

## 4. Minor issues

### m1. Reproduksibilitas instalasi belum terbukti

- **Masalah:** Arsip tidak memuat lockfile npm atau bun.
- **Bukti:** `package.json` mencantumkan dependensi seperti Vite, TypeScript, dan React; `package-lock.json` dan `bun.lock` tidak ditemukan dalam arsip yang diperiksa.
- **Dampak:** Resolusi dependensi dapat berbeda antarinstalasi sehingga hasil build sulit direproduksi.
- **Perbaikan:** Pilih satu package manager, commit lockfile, dan gunakan instalasi terkunci di CI.

### m2. Migrasi skema state belum terbukti tersedia

- **Masalah:** Belum ada bukti mekanisme migrasi skema terpusat.
- **Bukti:** `useSessionPersistence.ts` menyimpan `stateData` melalui `JSON.stringify`, memulihkannya dengan `JSON.parse`, dan memiliki fallback parsing Markdown ketika parsing JSON gagal.
- **Dampak:** JSON yang valid tetapi berasal dari skema lama dapat lolos parsing tanpa validasi kompatibilitas yang cukup.
- **Perbaikan:** Tambahkan `schemaVersion`, validasi struktur hasil parsing, dan migrasi eksplisit antarversi.

### m3. Kegagalan penyimpanan kurang terlihat oleh pengguna

- **Masalah:** Sebagian error persistensi hanya dicatat di console.
- **Bukti:** `useSessionPersistence.ts` menangkap error penyimpanan dan menggunakan `console.warn`; beberapa jalur reset juga mengabaikan error.
- **Dampak:** Pengguna dapat mengira sesi tersimpan padahal penulisan gagal.
- **Perbaikan:** Tampilkan indikator gagal simpan yang persisten, pertahankan status dirty, sediakan retry, dan berikan opsi ekspor cadangan.

## 5. Evidence

| Referensi | Bukti | Status |
|---|---|---|
| `src/utils/zlceValidator.ts:249` | Pemeriksaan persetujuan menggunakan `includes()` | Terbukti |
| `scripts/zlce/zlce-check.py` | Pemeriksaan persetujuan menggunakan nilai eksak | Terbukti |
| `src/hooks/useSessionPersistence.ts:133–135` | Tiga kunci penyimpanan ditulis secara terpisah | Terbukti |
| `src/utils/markdownParser.ts:85–149` | Parsing tabel menggunakan `split('|')` | Terbukti |
| `package.json` | Tidak ada skrip `test`; tersedia `build` dan `lint` | Terbukti |
| Arsip proyek | Lockfile npm/bun tidak ditemukan | Terbukti pada arsip yang diperiksa |
| CLI checker | Contoh state lolos dengan 0 error, 1 warning, 3 task | Teruji |
| Build dan lint | Gagal pada lingkungan pemeriksaan | Teruji; akar masalah tidak terverifikasi |
| Kesetaraan penuh validator | Tidak tersedia bukti parity test menyeluruh | Tidak terverifikasi |
| Seluruh transisi status | Tidak tersedia bukti pengujian menyeluruh | Tidak terverifikasi |
| Ketahanan terhadap kehilangan data pada semua skenario | Tidak tersedia hasil uji menyeluruh | Tidak terverifikasi |

**Catatan:** Nomor baris merupakan petunjuk lokasi pada source yang diperiksa dan dapat berubah pada revisi berikutnya. Tidak ditemukannya bukti pengujian tidak otomatis berarti fitur pasti gagal.

## 6. Fix recommendations

### P0 — Sebelum rilis apa pun

1. **Samakan quality gate dan validator.** Samakan aturan TypeScript dan Python. Uji persetujuan, status, dependensi, task aktif, dan WAL dengan fixture yang sama. Kriteria penerimaan: klasifikasi kedua validator identik untuk fixture yang disepakati.
2. **Buktikan build dan type-check.** Jalankan dari checkout bersih dengan dependensi yang konsisten. Kriteria penerimaan: build, lint, type-check, dan test suite lulus di CI.

### P1 — Sebelum penggunaan operasional

3. **Perkuat persistensi.** Gunakan envelope berversi, validasi snapshot, status gagal simpan, serta pengujian undo/redo dan restore. Kriteria penerimaan: kegagalan parsial tidak menimbulkan state inkonsisten tanpa terdeteksi.
4. **Formalkan kontrak state dan parser.** Definisikan skema Markdown, enum, transisi status, aturan dependensi, dan migrasi versi. Kriteria penerimaan: input invalid ditolak dengan diagnostik spesifik dan dapat direproduksi.
5. **Bangun pengujian regresi otomatis.** Pisahkan pengujian validator, parser, persistence, dan integrasi alur kerja.

### P2 — Penguatan maintainability

6. Commit lockfile dan dokumentasikan prosedur instalasi yang reproduktif.
7. Dokumentasikan cakupan pengujian, batasan, format data, dan prosedur pemulihan.
8. Pisahkan status evaluasi metodologi dari status build/release aplikasi.

### Checklist kelulusan minimum

- [ ] Build dan type-check lulus dari lingkungan bersih.
- [ ] Validator UI dan CLI konsisten pada fixture yang sama.
- [ ] Transisi status dan quality gate memiliki pengujian otomatis.
- [ ] Parsing dan serialisasi state lulus round-trip test.
- [ ] Undo/redo, restore, reset, dan kegagalan penyimpanan telah diuji.
- [ ] Instalasi dapat direproduksi menggunakan lockfile.
- [ ] Dokumentasi menjelaskan format data, batasan, dan pemulihan.

## 7. Final verdict

**Status: `CONDITIONAL — NOT READY FOR PRODUCTION`.**

Alasan utama:

1. Terdapat inkonsistensi nyata pada quality gate antara validator UI dan CLI.
2. Persistensi dan pemulihan state belum terbukti aman terhadap seluruh skenario kegagalan.
3. Build dan pemeriksaan tipe belum berhasil diverifikasi.
4. Reproduksibilitas dependensi dan cakupan regresi belum memadai sebagai bukti kesiapan rilis.

ZLCE dapat dilanjutkan ke tahap perbaikan dan pengujian terkontrol. Namun, kelulusan checker terhadap satu contoh state tidak cukup untuk membuktikan kesiapan keseluruhan sistem.

**Batas review:** Penilaian ini didasarkan pada arsip dan hasil pemeriksaan yang tersedia. Keamanan operasional menyeluruh, performa pada proyek besar, dan perilaku aplikasi di browser nyata **tidak terverifikasi**.
