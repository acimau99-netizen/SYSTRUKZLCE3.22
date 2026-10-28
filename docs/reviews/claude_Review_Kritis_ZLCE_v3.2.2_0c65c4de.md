# Review Kritis ZLCE v3.2.2

Review teknis atas paket `SYSTRUKZLCE3_22-main.zip` · 29 Oktober 2026

**Cakupan dan batas verifikasi.** Seluruh kit dibaca (`ZLCE_KIT_SINGLE.md`, prompt, 9 template, profil, contoh, `docs/`, `data/`, skrip) beserta kode Studio (validator, parser, harness, scenarios). `zlce-check.py` **dijalankan** pada contoh dan template, dan salinan template dibandingkan secara otomatis. `npm install`, `build`, validator TS, dan LLM **tidak** dijalankan, sehingga hasilnya "tidak terverifikasi".

## 1. Executive summary

| Aspek | Penilaian | Alasan singkat |
| --- | --- | --- |
| Arsitektur | Sebagian | Pemisahan state, WAL, dan gerbang masuk akal. Recovery tidak punya jangkar deterministik (C2). |
| Konsistensi spesifikasi | **Gagal** | Mode LITE merujuk berkas yang tidak dibuat (C1). `USAGE.md` bertentangan dengan kit (M1). Salinan prompt berbeda (M2). |
| Kualitas dokumentasi | Lemah | Klaim "Zero-Loss", "14/14", dan "parity" tidak didukung bukti di repo (C3, M5). |
| Alur kerja | Berlubang | Fase Gerbang 1–3 tanpa state (M3). Preempt bisa menimpa WAL (M4). |
| Maintainability | Lemah | 4 sumber kebenaran untuk prompt, 13 aturan diduplikasi, tanpa CI, tanpa tes (M2, M8, m3). |
| Risiko implementasi | Sedang–tinggi | Bergantung pada git, bash, python, dan manusia yang menyimpan checkpoint (M7). |

Intinya: klaim utama ("tidak ada konteks hilang") justru paling lemah di jalur pemulihan, dan jalur itu tidak punya bukti uji independen.

## 2. Critical issues

**C1. Mode LITE (default yang direkomendasikan) tidak koheren.** LITE hanya membuat 4 berkas, tetapi aturan otoritatifnya ada di berkas yang tidak dibuat (`AI_WORKFLOW.md`, `CHANGELOG.md`). Triase, WAL, checkpoint, recovery, dan `[MINOR]` tidak punya definisi di repo pengguna. Dampaknya, AI menebak atau memakai Skeleton Fallback, padahal R3 dan R10 melarang menebak.

**C2. Protokol Recovery (A–D) tidak dapat diputuskan secara deterministik.**

- WAL tidak menyimpan commit dasar (SHA), sehingga "tidak ada commit baru" (Kasus A) tidak terdefinisi.
- Kasus A–D tidak saling eksklusif (B+D dan C+B bisa terjadi sekaligus), dan tidak ada aturan prioritas.
- Snapshot hanya `git log -5`, padahal kit mewajibkan commit `wip` per langkah, jadi commit relevan bisa terlempar.
- `zlce-check.py` tidak mendeteksi Kasus C. Satu-satunya heuristiknya (mtime) gagal setelah clone atau checkout.
- Dokumen saling bertentangan soal tindakan Kasus D (lihat M1).

Dampaknya, dua AI bisa mengklasifikasikan kondisi yang sama secara berbeda, dan salah klasifikasi berisiko menimpa atau mengabaikan pekerjaan.

**C3. Klaim kualitas tidak dapat diverifikasi dan sebagian bertentangan dengan spesifikasi sendiri.**

- Skor "14/14 LULUS" berasal dari tombol PASS manual, dan semua skenario sudah berstatus `PASS` secara bawaan.
- Tidak ada transkrip. Model dicatat sebagai satu string gabungan, jadi hasil tidak bisa dikaitkan ke model tertentu.
- T4a menguji aturan Level S "<5 baris" dan lulus, padahal kit mendefinisikan ≤20 baris. Uji memvalidasi aturan yang salah.
- Branding "Zero-Loss" dan "tidak pernah lupa" bertentangan dengan `LANDING_PROMPT`: "target, bukan jaminan".

Dampaknya, pembaca menganggap kit sudah teruji padahal tidak ada bukti yang bisa diperiksa. Review sebelumnya (butir 3.2) sudah menandai ini dan substansinya belum berubah.

## 3. Major issues

**M1. `docs/USAGE.md` bertentangan dengan kit.** Perbedaannya mencakup definisi Level S, penanganan Level M independen, tindakan Kasus D, format checkpoint, dan nama field WAL. Rinciannya ada di bagian Evidence.

**M2. Salinan prompt sudah menyimpang (drift).** `LANDING_PROMPT.md` dan `HANDOVER_PROMPT.md` di disk tidak sama dengan blok di `ZLCE_KIT_SINGLE.md`. Akibatnya "`HANDOVER.md` salinan verbatim" ambigu, karena dua versi sah berbeda. Studio menambah varian prompt lagi yang teksnya berbeda sendiri. Sinkronisasi hanya mengandalkan kepatuhan manual (`CONTRIBUTING.md`).

**M3. Fase Gerbang 1–3 tanpa state, ditambah dependensi tersembunyi.**

- `BLUEPRINT` §6 memerintahkan menyalin ASM/Q ke "`SESSION_STATE.md` bagian 3". Bagian 3 adalah WAL, bukan Asumsi (bagian 4), dan berkasnya baru ada di Gerbang 4.
- "Pertanyaan terbuka berstatus kritis" tidak punya definisi, dan tabel Q tidak punya kolom tingkat keparahan.
- Sebelum Gerbang 4 tidak ada checkpoint (R12), jadi persetujuan Gerbang 1–3 hanya hidup di chat. Ini celah Zero-Loss di fase awal.

**M4. Protokol preempt bisa kehilangan data dan menghasilkan alarm palsu.**

- WAL task yang dijeda dipindah ke "Catatan Serah Terima", field yang **ditimpa** dengan batas \~10 baris. Preempt bersarang atau WAL panjang menimpa data. Tidak ada struktur stack.
- Level S yang menyentuh berkas di luar daftar WAL memicu peringatan "kasus D" di `zlce-check.py`. Commit `[MINOR]` juga ambigu terhadap deteksi Kasus C.
- Level S melewati R5 (tanpa bukti verifikasi). `TASK-REV-NN` dibuat AI tanpa persetujuan eksplisit, padahal `TASKS.md` sudah disetujui di Gerbang 3.

**M5. Aturan yang dinyatakan wajib tidak ditegakkan oleh validator.**

- Python tidak punya aturan X1. Hanya validator TS yang punya.
- Komentar "100% parity" di kode TS dan klaim paritas di CHANGELOG tidak benar.
- "Bukti Verifikasi" valid selama bukan `-` (string "ok" lolos).
- "Disetujui: ya" hanya teks yang bisa diisi AI sendiri.
- Tidak ada pemeriksaan siklus dependensi, BLOCKED tanpa alasan, atau penomoran ASM/Q.
- Template kosong lolos dengan exit 0.

**M6. Istilah ambigu atau bertabrakan.**

| Istilah | Masalah | Definisi yang diusulkan |
| --- | --- | --- |
| "task atomik" | Tidak ada kriteria ukuran. | Satu perubahan dengan ≤N berkas dan satu set AC yang diverifikasi oleh satu perintah. |
| "Level L" | Dipisah dari M di tabel, tetapi penanganannya identik dan L tidak pernah didefinisikan. | Hapus L, atau definisikan dengan kriteria terukur. |
| "langkah utuh" / "multi-berkas" | Menjadi pemicu WAL tetapi tidak terukur. | ">1 berkas atau >30 menit" (sudah ada di AI\_WORKFLOW §8; jadikan satu-satunya definisi). |
| "R1–R7" | Dipakai README/USAGE untuk Triase Revisi. Di kit R1–R13 adalah aturan global. | Ganti nama menjadi "Triase Level S/M". |
| "Gerbang 2: Rules" | README menyebut Gerbang 2 sebagai "Rules". Di kit Gerbang 2 adalah ARCHITECTURE + DATA\_MODEL. | Samakan dengan kit. |
| "ISO 8601" | Format yang dipakai (`2026-10-14 09:30:00 WIB`, `jam: ?`) bukan ISO 8601. | Pakai `YYYY-MM-DDTHH:MM:SS±hh:mm` atau hapus klaim ISO. |

**M7. Dependensi tersembunyi dan titik gagal manusia.**

- Recovery bergantung penuh pada git, tetapi `LANDING_PROMPT` tidak punya parameter "git tersedia".
- Skrip memakai bash dan python3, tanpa jalur Windows.
- Pengguna wajib menyimpan checkpoint secara manual (R12). Itu satu titik gagal tunggal.
- "Tawarkan handover setelah \~20 pertukaran pesan" adalah angka arbitrer tanpa dasar.

**M8. Redundansi aturan dan beban konteks.** Aturan yang sama ditulis di LANDING (R1–R13), AI\_WORKFLOW (yang mengklaim "satu-satunya definisi"), dan HANDOVER. Aturan X1 muncul ≥5 kali. Setiap perubahan aturan harus diedit di banyak tempat. Untuk proyek LITE (<15 task) overhead ini tidak proporsional.

## 4. Minor issues

- **m1.** `README` menyebut ambang token Green<50k / Yellow 50k–120k / Red>150k (rentang 120–150k tidak terdefinisi). `TokenUsageGauge` memakai 1.500 / 3.000 token dari `SESSION_STATE` saja.
- **m2.** `README`: "10 Dokumen Kontrol di `templates/`". Isi `templates/` hanya 9 berkas (HANDOVER tidak ada di sana). T8 dan X1 tercatat dua kali di daftar skenario.
- **m3.** `CONTRIBUTING` mewajibkan `npm ci`, padahal tidak ada `package-lock.json`. Tidak ada skrip tes dan tidak ada CI. `lint` hanya `tsc --noEmit`.
- **m4.** `metadata.json` berisi `ZLCE Studio v3.2` dan `MAJOR_CAPABILITY_SERVER_SIDE_GEMINI_API`, bertentangan dengan `SECURITY.md` ("100% client-side"). Review sebelumnya menandai ini teratasi, jadi ini regresi.
- **m5.** `public/assets/aistudio/` ikut ter-build. Isinya zip lama 180 KB (berisi `__pycache__/*.pyc`), 2 file review, dan `README.proposed`. Review yang sama juga ada di `docs/reviews/`.
- **m6.** `package.json` memuat `express`, `dotenv`, `@google/genai` (pemakaian tidak di-grep, tidak terverifikasi). Skrip `clean` merujuk `server.js` yang tidak ada. `version` bernilai `0.0.0`. Versi `typescript ^7`, `vite ^8` dan sejenisnya tidak terverifikasi (tanpa jaringan).
- **m7.** `vite.config.ts` memakai `host: 0.0.0.0` dan `allowedHosts: true` sebagai default.
- **m8.** URL repo tidak konsisten: README memakai `ZLCE3.22-studio`, `SECURITY.md` memakai `ZLCEv3.2.2`. Kanal pelaporan "email" tidak menyebut alamat.
- **m9.** Instruksi "Salin `scripts/` ke `scripts/zlce/`" (Landing) bisa menghasilkan `scripts/zlce/zlce/…`. README menyuruh menyalin folder `scripts/zlce/`.
- **m10.** `zlce-check.py`: berkas kontrol dikecualikan dari deteksi "dirty", sehingga edit `TASKS.md` di luar WAL tidak pernah ditandai. Parsing `git status --porcelain` salah untuk rename (`old -> new`).
- **m11.** README mengklaim kompatibel dengan "semua AI frontier", padahal hanya satu string model tercatat di evaluasi.

## 5. Evidence

| ID | Bukti |
| --- | --- |
| C1 | `KIT_SINGLE` l.53: LITE = 4 berkas. l.139: HANDOVER meminta lampiran `AI_WORKFLOW.md`. l.147: "`AI_WORKFLOW.md` otoritatif". l.80: format checkpoint "di `AI_WORKFLOW.md` bagian 8". l.75: R7 "catat CHANGELOG". AI\_WORKFLOW §10 (Mode LITE) berada di berkas yang tidak dibuat di LITE. |
| C2 | Field WAL (`KIT_SINGLE` l.656–662): tidak ada SHA/baseline. l.345: Kasus A "tidak ada commit baru". Snapshot: `git log -5`. `zlce-check.py` l.162: `getmtime(sp)+60 < commit_time`. Grep: tidak ada aturan prioritas A–D di kit/USAGE. `USAGE` §3: Kasus D → task `BLOCKED`. `HANDOVER` l.168 dan `AI_WORKFLOW` §9: "laporkan dan tanyakan; jangan disentuh". |
| C3 | `scenarios.ts`: 14× `status: 'PASS'` sebagai nilai awal. `TestHarnessTab.tsx` l.29: model default `'Gemini 3.8 Flash / Claude 3.5 Sonnet'`. `data/` hanya berisi satu berkas. `scenarios.ts` l.87: "<5 baris" vs kit "≤ 20 baris". FEEDBACK T8: "diparsing linter"; X1: "lolos validasi zlce-check". Grep `jam\|checkpoint\|X1` di `zlce-check.py`: **0 hasil**. `LANDING_PROMPT` l.46 (KIT): "target, bukan jaminan". |
| M1 | `USAGE` §4: Level S "<5 baris, dikerjakan di dalam task aktif, tanpa task baru". Kit: ≤20 baris, commit `[MINOR]`. `USAGE` §4: Level M independen = task `PENDING` setelah task aktif selesai. Kit: jeda task aktif lalu `TASK-REV` (preempt). `USAGE` §3: "plannedFiles" vs template "Berkas Direncanakan/Disentuh". `USAGE` §5: `<!-- ZLCE:CHECKPOINT:START -->`. Kit: `=== ZLCE CHECKPOINT`. `scenarios.ts`: blok `zlce-checkpoint` dengan TASK/STATUS/EVIDENCE/NEXT\_STEP. **Tiga format checkpoint berbeda.** |
| M2 | Diff otomatis: `LANDING_PROMPT.md` ≠ blok KIT (23 baris diff). `HANDOVER_PROMPT.md` ≠ blok KIT (7 baris diff). Hanya versi disk yang punya R3a/R3b dan "LITE (Default)". Versi KIT: `[FULL \| LITE]` tanpa default. Sembilan template + profil **identik** dengan KIT (sinkron). Prompt yang tidak sinkron hanya LANDING dan HANDOVER. |
| M3 | `KIT_SINGLE` l.438 ("SESSION\_STATE bagian 3") vs template: bagian 3 = WAL, bagian 4 = ASM. l.80: "Sebelum Gerbang 4 tidak ada state". Tabel ASM/Q: kolom ID, Jenis, Isi, Dampak, Status; tidak ada severity. |
| M4 | `KIT_SINGLE` l.684: "ditimpa; maks. \~10 baris". `AI_WORKFLOW` §6 langkah 1: WAL dipindah ke Catatan Serah Terima. `zlce-check.py` l.165, l.172: deteksi "kasus D" dari dirty files vs daftar WAL. R7: `TASK-REV` didaftarkan AI, tanpa langkah persetujuan pengguna kecuali opsi (i). |
| M5 | `zlce-check.py` l.104–107: bukti valid bila bukan `""`/`-`; approved valid bila `ya`/`yes`. `zlceValidator.ts`: `CLOCK_RULE_X1_FORMAT` (tidak ada padanan di Python). Eksekusi: template SESSION\_STATE → `RESULT: OK (0 error, 2 warn)`, exit 0. Eksekusi: contoh → `RESULT: OK`. |
| M6 | `AI_WORKFLOW` §6: baris "M/L \| Selain Level S, atau ragu". `AI_WORKFLOW` §1.2: "ISO 8601 dengan zona (mis. `2026-10-14 09:30:00 WIB`)". README §9: "ISO 8601 UTC Timestamps". |
| M7 | `LANDING_PROMPT` §1: ada "Kemampuan Tulis/Eksekusi AI", tidak ada "git". `zlce-snapshot.sh`: bash saja. `KIT_SINGLE` l.107: "\~20 pertukaran pesan". |
| M8 | R1–R13 di LANDING; `AI_WORKFLOW` l.206: "Satu-satunya definisi aturan kerja"; X1 di R3/R3b, AI\_WORKFLOW §3.8, §8, HANDOVER "D". |
| m1 | `README` §5 tabel fitur vs `TokenUsageGauge.tsx` l.28–34 (`> 3000`, `> 1500`). |
| m3–m7 | `ls -a`: tidak ada lockfile, `.github`, atau `*.test.*`. `package.json`: `clean` → `rm -rf dist server.js`. `metadata.json` (isi di atas). `unzip -l`: `__pycache__/zlce-check.cpython-310.pyc` di zip. |

## 6. Fix recommendations

| ID | Perbaikan |
| --- | --- |
| C1 | Jadikan `AI_WORKFLOW.md` berkas wajib di semua mode. Pecah menjadi **inti** (enum, WAL, recovery, triase, X1) dan **lampiran FULL**. Buat `CHANGELOG.md` wajib. LITE = 5 berkas. |
| C2 | Tambah field WAL: `Base Commit: <sha>` dan `Branch`. Definisikan Kasus A dari perbandingan `HEAD == Base Commit`. Terapkan urutan prioritas **D > C > B > A** (D menahan semua tindakan). Snapshot memakai `git log <base>..HEAD`, bukan `-5`. Hapus heuristik mtime, ganti dengan perbandingan tag `[TASK-…]` di log terhadap matriks. Samakan tindakan D di semua dokumen. |
| C3 | Hapus badge dan klaim "14/14" sampai ada transkrip per skenario di `data/transcripts/`, model terpisah per run, dan hasil mentah (bukan toggle). Ubah nilai awal skenario ke `PENDING`. Perbaiki T4a ke ≤20 baris. Ganti "Zero-Loss" di README dengan redaksi yang sama dengan Landing ("meminimalkan kehilangan konteks"). |
| M1 | Jadikan `docs/USAGE.md` turunan terhasilkan (tanpa duplikasi aturan), atau hapus bagian §3–§5 dan tautkan ke `AI_WORKFLOW`. |
| M2 | Satu sumber: `templates/` + `prompts/*.md`. Hasilkan `KIT_SINGLE.md` dan `templates.ts` lewat skrip build. Tambah CI yang gagal bila hasil generate ≠ komit. |
| M3 | Perbaiki referensi ke "bagian 4". Definisikan "kritis" (tambah kolom `Severity: BLOCKING/NON-BLOCKING`). Sediakan `DECISIONS.md` ringan yang dibuat di Gerbang 1 agar persetujuan Gerbang 1–3 tersimpan di berkas. |
| M4 | Ganti pemindahan WAL ke Catatan Serah Terima dengan `WAL_STACK` di `SESSION_STATE.md`. Level S yang memengaruhi berkas di luar WAL wajib dicatat di Slot Revisi sebelum dikerjakan. Wajibkan persetujuan pengguna untuk `TASK-REV`. |
| M5 | Pindahkan logika validasi ke satu sumber (mis. JSON-spec yang dipakai Python dan TS). Tambah `tests/fixtures/*.md` + expected, dijalankan di CI untuk kedua validator. Tambah aturan: bukti minimal berisi referensi perintah atau path, siklus dependensi, BLOCKED wajib alasan, penomoran ASM/Q. Hapus klaim "100% parity". |
| M6 | Tambahkan glosarium satu halaman (lihat tabel M6) dan hapus "Level L" atau definisikan. |
| M7 | Tambah parameter "Git: YA/TIDAK" di Landing. Sediakan padanan PowerShell atau `zlce.py` lintas OS. Dokumentasikan fallback tanpa git. Ganti "\~20 pertukaran" dengan ambang berbasis ukuran `SESSION_STATE`. |
| M8 | Landing hanya merujuk `AI_WORKFLOW` (tanpa menyalin R1–R13). Sebut X1 sekali. |
| m1–m11 | Selaraskan ambang token dengan implementasi. Perbaiki README (jumlah template dan daftar skenario). Buat `package-lock.json`, tambah skrip `test` dan CI. Perbaiki `metadata.json`. Pindahkan atau hapus `public/assets/aistudio/`. Bersihkan `package.json`. Atur `server.host` ke localhost secara default. Seragamkan URL repo dan kanal keamanan. Perjelas instruksi salin skrip. |

Urutan pengerjaan yang disarankan: **C1 → C2 → M2 → C3 → M1 → M5 → sisanya.**

## 7. Final verdict

**Belum siap dipakai sebagai standar yang diandalkan.** Kit layak sebagai prototipe untuk proyek LITE kecil yang memakai git, dengan satu pengguna yang disiplin menyimpan state. Dua alasan utama:

1. Spesifikasi tidak konsisten secara internal. Mode default menunjuk berkas yang tidak dibuat (C1), dan tiga dokumen saling bertentangan soal triase, recovery, dan checkpoint (M1).
2. Klaim inti tidak punya bukti yang bisa diperiksa. Recovery tidak deterministik (C2), dan evaluasi 14/14 adalah toggle manual dengan nilai awal PASS (C3).

Hal yang kuat dan terverifikasi: sembilan template dan profil identik dengan `KIT_SINGLE.md`, `zlce-check.py` berjalan dan mendeteksi pelanggaran struktur dasar (enum, satu IN\_PROGRESS, dependensi, WAL vs task aktif), dan pemisahan "status hanya di `SESSION_STATE`" konsisten di dokumen yang saya baca.

Dengan C1, C2, C3, dan M2 diperbaiki, saya akan menilainya layak dipakai terbatas. Tanpa itu, jangan memakainya untuk pekerjaan yang konsekuensi kehilangan konteksnya mahal.
