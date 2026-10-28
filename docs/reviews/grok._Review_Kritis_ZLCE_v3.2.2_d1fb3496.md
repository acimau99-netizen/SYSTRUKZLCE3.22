**Review ZLCE v3.2.2 (SYSTRUKZLCE3.22-main)**

## Executive summary

ZLCE adalah metodologi manajemen konteks AI berbasis dokumen kontrol + WAL + gerbang persetujuan, dilengkapi Studio web (React/Vite) dan skrip checker. Spesifikasi inti (aturan R1–R13, enum status, format SESSION_STATE, recovery A–D) relatif konsisten di dalam `AI_WORKFLOW.template.md` dan `SESSION_STATE.template.md`. Namun distribusi triple (templates fisik, `ZLCE_KIT_SINGLE.md`, impor `?raw` di `src/data/templates.ts`), inkonsistensi definisi mode LITE/FULL dan daftar gerbang antar dokumen, serta ketergantungan kuat pada disiplin pengguna + format markdown kaku membuatnya **belum siap produksi penuh** untuk tim atau proyek skala menengah ke atas tanpa penyesuaian. Klaim “Zero-Loss” dan “14/14 lulus” hanya terverifikasi pada skenario benchmark internal; celah operasional dan risiko drift masih nyata.

## Critical issues

**1. Inkonsistensi definisi mode LITE / FULL dan daftar gerbang**
- Masalah: Definisi file yang wajib dan nomor gerbang berbeda antar dokumen sumber kebenaran.
- Bukti:
  - `README.md`: LITE = 4 berkas (`BLUEPRINT` G1, `TASKS` G3, `SESSION_STATE` G4, `HANDOVER`); FULL = “10 dokumen kontrol”; G4 hanya menyebut `SESSION_STATE` + `AI_WORKFLOW`.
  - `ZLCE_KIT_SINGLE.md` / LANDING: FULL = 10 berkas; G4 = `AI_WORKFLOW`, `CHECKLISTS`, `SESSION_STATE`, `CHANGELOG`, `HANDOVER`; LITE = Gerbang 1 lalu `TASKS` + `SESSION_STATE` + `HANDOVER`.
  - `AI_WORKFLOW.template.md` §10: LITE = `BLUEPRINT`, `TASKS`, `SESSION_STATE`, `HANDOVER`.
- Dampak: AI/agent yang membaca README vs kit menghasilkan set dokumen berbeda; pengguna tidak tahu mana yang benar; checker tidak memvalidasi kelengkapan set mode.
- Solusi: Satu tabel kanonik di `AI_WORKFLOW` (atau `BLUEPRINT` bagian mode) yang mengikat mode → daftar file → gerbang. README dan LANDING hanya merujuk tabel itu. Update semua placeholder.

**2. Format SESSION_STATE rigid + parsing regex-only**
- Masalah: Seluruh validasi (Python `zlce-check.py` dan `zlceValidator.ts`) bergantung pada nomor bagian `## 0.`–`## 7.`, nama field `**Nama:**`, dan kolom matriks persis. Tidak ada schema formal.
- Bukti: `REQUIRED_SECTIONS` di validator TS; fungsi `section(text, num)` dan `field()` di `zlce-check.py`; komentar template “jangan ubah nama field, kolom, atau nomor bagian”.
- Dampak: Satu perubahan heading, spasi, atau urutan kolom mematahkan checker dan Studio. Tidak scalable; sulit di-extend tanpa breaking change.
- Solusi: Definisikan schema (JSON Schema atau YAML front-matter + body) untuk SESSION_STATE. Parser membaca schema; markdown hanya rendering. Backward-compat layer untuk v3.2.x.

**3. Ketergantungan tersembunyi pada disiplin manusia untuk Checkpoint Block**
- Masalah: Saat AI tidak punya write access, protokol mengandalkan pengguna menyalin/menimpa CHECKPOINT BLOCK ke file setiap respons yang mengubah state.
- Bukti: `AI_WORKFLOW` §8.3 dan R12 di kit: “Pengguna wajib menyimpan checkpoint terakhir… sebelum menutup sesi”.
- Dampak: Single point of failure operasional. Sesi terputus + lupa paste = state hilang, recovery menjadi spekulatif. Klaim “zero-loss” gagal di sini.
- Solusi: Wajibkan tool/script side-effect (atau browser extension / IDE plugin) yang menulis state otomatis. Atau degradasi eksplisit: “mode no-write = lossy by design”.

## Major issues

**4. Triple source of templates — risiko drift residual**
- Masalah: Tiga wujud template (folder `templates/`, bundel `ZLCE_KIT_SINGLE.md`, runtime `src/data/templates.ts` via `?raw`).
- Bukti: Prinsip arsitektur di header `ZLCE_KIT_SINGLE.md`; CHANGELOG mengklaim sinkronisasi `?raw`; sebelumnya review v3.2.2 mencatat folder templates hilang di zip.
- Dampak: Perubahan di satu tempat mudah tidak tersinkron. Kit monolitik 38 kB menjadi single point of truth de-facto untuk prompt-only, tetapi Studio dan Git repo bisa divergensi.
- Solusi: Build step yang menghasilkan `ZLCE_KIT_SINGLE.md` dan `templates.ts` dari folder `templates/` saja. CI fail jika diff.

**5. Enum status dan aturan single IN_PROGRESS hanya enforced di checker, bukan di runtime**
- Masalah: Aturan R4/R11 dan matriks hanya dicek saat `zlce-check` dijalankan manual.
- Bukti: Enum di `AI_WORKFLOW` §2, `zlce.ts` `TaskStatus`, validator; tidak ada lock file atau state machine enforced di Studio saat edit.
- Dampak: Pengguna/AI bisa set dua task `IN_PROGRESS` atau status ilegal; baru ketahuan saat check.
- Solusi: Studio harus memblokir UI/transisi status ilegal. Checker wajib di-hook pre-commit / pre-DONE.

**6. Triase Level S/M/L mengandung kriteria subjektif**
- Masalah: “atau ragu” dan batas “≤ 20 baris / 1 berkas / tanpa perubahan skema…” sulit diukur objektif oleh AI.
- Bukti: `AI_WORKFLOW` §6 dan R7 di kit.
- Dampak: AI cenderung over-classify sebagai M/L atau under-classify; prosedur preempt (jeda task, pindah WAL) menjadi error-prone.
- Solusi: Buat checklist objektif terukur (jumlah file diff, apakah menyentuh schema/contract/AC, apakah task lain belum DONE bergantung). Hapus “ragu”.

**7. package.json version “0.0.0” vs dokumentasi 3.2.2**
- Bukti: `package.json` `"version": "0.0.0"`; metadata, README, CHANGELOG, template header semua 3.2.2.
- Dampak: Verifikasi build/release dan dependency management rusak.
- Solusi: Sinkronkan version ke 3.2.2 (atau semver yang sesuai).

## Minor issues

- **HANDOVER.md** dihasilkan sebagai salinan VERBATIM dari `HANDOVER_PROMPT.md` (kit G4). Tidak ada template terpisah yang bisa di-diff; risiko drift jika prompt berubah.
- Timestamp rule X1 (“jam: ?” wajib jika tidak ada sumber jam) bagus anti-halusinasi, tetapi brittleness tinggi di log audit dan recovery.
- Scripts memerlukan Python 3 + git; tidak ada graceful degradation atau pure-JS fallback di Studio.
- `CONTROL` set di checker hard-coded 10 file; tidak menyesuaikan mode LITE.
- Dokumentasi USAGE.md dan SECURITY.md ada, tetapi tidak merujuk ke tabel mode kanonik.

## Evidence

- Definisi mode/gerbang: `README.md` baris ~49–56 & ~108–112 vs `ZLCE_KIT_SINGLE.md` baris 51–53 & 88–95 vs `AI_WORKFLOW.template.md` §10.
- Parsing kaku: `src/utils/zlceValidator.ts` `REQUIRED_SECTIONS` + `getSection`; `scripts/zlce/zlce-check.py` fungsi `section`/`field`.
- Checkpoint human-dependent: `AI_WORKFLOW.template.md` §8.3.
- Triple distribution: header `ZLCE_KIT_SINGLE.md` + `src/data/templates.ts` + folder `templates/`.
- Checker vs runtime: enum di types + validator; tidak ada enforcement di komponen edit state (dari struktur file).
- Version mismatch: `package.json` vs CHANGELOG `[3.2.2]`.

(Temuan yang tidak bisa diverifikasi tanpa menjalankan full Studio UI atau multi-sesi nyata: seberapa sering pengguna benar-benar paste Checkpoint Block; seberapa sering AI melanggar single IN_PROGRESS di praktik.)

## Fix recommendations

1. Buat tabel mode kanonik tunggal; hapus definisi yang bertentangan.
2. Ganti markdown-rigid SESSION_STATE dengan schema-driven (JSON/YAML + markdown view).
3. Automatisasi write state (plugin/IDE/script) atau deklarasikan mode no-write sebagai lossy.
4. Generate kit dan `templates.ts` dari source tunggal; CI guard.
5. Enforce status machine di Studio UI + pre-commit hook.
6. Objektifkan kriteria triase; hapus “ragu”.
7. Sinkronkan version, update CONTROL set agar mode-aware, dokumentasikan degradasi scripts.

## Final verdict

**Belum siap dipakai sebagai metodologi produksi yang andal tanpa penyesuaian.**  

Cocok untuk eksperimen solo / proyek kecil (<15 task) yang pengguna disiplin tinggi dan selalu menjalankan checker. Tidak cocok untuk tim, proyek multi-modul, atau environment di mana AI sering tanpa write access / sesi sering putus. Arsitektur ide bagus (single source of truth + WAL + gerbang), tetapi implementasi masih fragile pada format, distribusi, dan enforcement operasional. Prioritas perbaikan: konsistensi mode/gerbang + schema SESSION_STATE + otomasi write.

**Masalah 1: Inkonsistensi definisi mode LITE / FULL dan daftar gerbang**

### Apa masalahnya
Definisi formal mode LITE vs FULL, jumlah berkas kontrol yang wajib, serta mapping berkas ke nomor Gerbang (Quality Gate) **tidak sama** di antara dokumen yang seharusnya menjadi sumber kebenaran. Akibatnya tidak ada “single source of truth” untuk pertanyaan paling dasar: “proyek ini mode apa, harus menghasilkan file apa, dan di gerbang ke berapa?”

### Bukti spesifik

| Sumber | Klaim LITE | Klaim FULL / Gerbang |
|--------|------------|----------------------|
| `README.md` | 4 berkas: `BLUEPRINT.md` (G1), `TASKS.md` (G3), `SESSION_STATE.md` (G4), `HANDOVER.md` | “10 dokumen kontrol”; G4 hanya menyebut `SESSION_STATE` + `AI_WORKFLOW` |
| `ZLCE_KIT_SINGLE.md` / LANDING_PROMPT | Gerbang 1 → lalu `TASKS` + `SESSION_STATE` + `HANDOVER` | FULL = 10 berkas; G4 = `AI_WORKFLOW`, `CHECKLISTS`, `SESSION_STATE`, `CHANGELOG`, `HANDOVER` |
| `AI_WORKFLOW.template.md` §10 | `BLUEPRINT`, `TASKS`, `SESSION_STATE`, `HANDOVER` | (tidak mendefinisikan FULL secara eksplisit di sini) |
| Daftar template fisik | 9 template + 1 profil domain | Tidak ada mapping formal ke mode |

Perbedaan konkret:
- Apakah `HANDOVER.md` termasuk “berkas kontrol” atau hanya turunan dari prompt? README menghitungnya di LITE, kit menghitungnya di G4 FULL.
- Apakah G3 LITE menghasilkan `TESTING.md`? README tidak, kit tidak, tapi nama gerbang “Tasks/Testing” di README masih dipakai.
- Apakah G4 selalu menghasilkan 5 berkas (`AI_WORKFLOW` + `CHECKLISTS` + `SESSION_STATE` + `CHANGELOG` + `HANDOVER`)? Hanya kit yang menyatakan demikian; README menyederhanakan.

### Dampak

1. **AI agent membaca dokumen berbeda → output berbeda**  
   Agent yang di-prompt dengan README akan berhenti setelah 4 berkas. Agent yang membaca kit akan mencoba menghasilkan 10 berkas. Hasil tidak deterministik.

2. **Checker tidak bisa memvalidasi kelengkapan set**  
   `zlce-check.py` hard-code daftar 10 file CONTROL. Tidak ada parameter mode. Proyek LITE yang “benar” menurut README akan selalu dapat warning “file tidak ditemukan”.

3. **Gerbang persetujuan menjadi ambigu**  
   Pengguna tidak tahu apakah harus menyetujui “Gerbang 3” atau langsung ke SESSION_STATE. Aturan “BERHENTI dan tunggu persetujuan eksplisit” (kit §3) tidak bisa dijalankan konsisten.

4. **Maintainability rusak**  
   Setiap perubahan daftar file harus diedit di minimal 3 tempat (README, kit, AI_WORKFLOW). Drift sudah terjadi dan akan berulang.

### Solusi perbaikan

1. Buat **satu tabel kanonik** di `AI_WORKFLOW.template.md` (atau dokumen baru `MODES.md` yang di-impor):

```markdown
| Mode | Berkas wajib | Gerbang |
|------|--------------|---------|
| LITE | BLUEPRINT, TASKS, SESSION_STATE, HANDOVER | G1 → BLUEPRINT; G3 → TASKS; G4 → SESSION_STATE + HANDOVER |
| FULL | BLUEPRINT, ARCHITECTURE, DATA_MODEL, TASKS, TESTING, AI_WORKFLOW, CHECKLISTS, SESSION_STATE, CHANGELOG, HANDOVER | G1–G4 sesuai mapping eksplisit |
```

2. Semua dokumen lain (README, LANDING, kit header, skeleton fallback) **hanya merujuk** tabel itu. Hapus definisi ulang.

3. Update `zlce-check.py` dan `zlceValidator.ts` agar menerima flag `--mode LITE|FULL` dan memvalidasi kelengkapan set sesuai tabel.

4. Di Studio, saat inisiasi proyek, pilih mode sekali → generate hanya file yang relevan + disable tab/file yang tidak berlaku.

Tanpa langkah di atas, mode LITE/FULL hanyalah label kosmetik, bukan kontrak yang bisa diverifikasi.
