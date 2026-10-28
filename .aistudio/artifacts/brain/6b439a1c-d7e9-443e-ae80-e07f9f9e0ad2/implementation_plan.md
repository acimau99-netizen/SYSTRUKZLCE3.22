# Rencana Perbaikan Komprehensif: ZLCE Studio v3.2.2 -> v3.3.0
**Berdasarkan Sintesis 3 Review Kritis:** GPT (Teknis/Runtime), Grok (Arsitektur/Format), Claude (Spesifikasi/Determinisme)

---

## 1. GERBANG 1: BLUEPRINT PERBAIKAN & ACCEPTANCE CRITERIA

### 1.1 Visi & Tujuan
Mentransformasikan ZLCE dari "prototipe metodologi yang bergantung pada disiplin manusia" menjadi **sistem rekayasa konteks yang deterministik, terverifikasi otomatis, dan bebas dari ambiguitas spesifikasi**.

### 1.2 Non-Goals (Batasan Ruang Lingkup)
- Tidak mengganti arsitektur inti ZLCE (Single Source of Truth + WAL + 4 Gerbang + Aturan X1).
- Tidak mengubah stack web client (React 19 + Vite + Tailwind CSS v4).
- Tidak menambahkan AI chatbot atau LLM runtime internal di client.

### 1.3 Matriks Isu Terkonsolidasi (Sintesis 3 Reviewer)
| ID Isu | Klasifikasi | Deskripsi Masalah | Sumber Temuan | Target Solusi |
| :--- | :---: | :--- | :--- | :--- |
| **CRIT-01** | **P0** | Mode LITE inkoheren: merujuk berkas yang tidak dibuat (`AI_WORKFLOW`, `CHANGELOG`); mapping gerbang berbeda antar dokumen | Claude (C1), Grok (C1) | Bentuk dokumen inti `AI_WORKFLOW_CORE.md` (wajib di LITE & FULL) dan standardisasi tabel mode |
| **CRIT-02** | **P0** | Recovery Kasus A–D tidak deterministik: WAL tanpa Base SHA commit, snapshot hanya `git log -5`, kasus tidak mutually exclusive, mtime rapuh | Claude (C2) | Tambah field `Base Commit: <sha>`, aturan prioritas `D > C > B > A`, snapshot `<base>..HEAD` |
| **CRIT-03** | **P0** | Validasi persetujuan longgar: UI memakai `.includes('ya')` vs CLI memakai `in ("ya", "yes")` | GPT (C1) | Samakan ke exact enum regex `^(ya|yes)$` di UI & Python |
| **CRIT-04** | **P0** | Fragmentasi Checkpoint Block: 3 format berbeda (`=== ZLCE CHECKPOINT`, `<!-- ZLCE:CHECKPOINT -->`, ````zlce-checkpoint````) | Claude (M1), Grok (C2) | Tetapkan satu format kanonik: ````zlce-checkpoint ... ```` di seluruh kit dan dokumen |
| **MAJ-01** | **P1** | Triple source of truth untuk template: `templates/`, `ZLCE_KIT_SINGLE.md`, `src/data/templates.ts` rawan drift | Grok (C4), Claude (M2) | Buat build generator script tunggal (`scripts/zlce-pack.py`) dan CI sync guard |
| **MAJ-02** | **P1** | Kontradiksi batasan Level S: `< 5 baris` (USAGE/FEEDBACK) vs `<= 20 baris` (AI_WORKFLOW/LANDING) | Claude (M1), Grok (C6) | Standardisasi metrik kuantitatif: `<= 20 baris non-struktural, <= 1 berkas` |
| **MAJ-03** | **P1** | Persistensi tidak atomik di localStorage (3 setItem terpisah + parser rebuild di lightweight history) | GPT (M2, M4) | Bungkus dalam satu envelope biner/JSON terversi (`schemaVersion`, `timestamp`, `state`, `markdown`) |
| **MAJ-04** | **P1** | Redundansi status 4-titik & ketiadaan stack saat preempt (WAL tertimpa di Catatan Serah Terima) | Claude (M4), Grok (C5) | Buat struktur `WAL_STACK` di SESSION_STATE untuk menampung task yang dijeda |
| **MAJ-05** | **P1** | Ketiadaan automated test suite, lockfile, dan fixture bersama antara TypeScript dan Python | GPT (M1, M5, m1), Claude (M5) | Tambahkan Vitest + Pytest dengan fixtures bersama (`tests/fixtures/*.md` + `.expected.json`) |
| **MIN-01** | **P2** | Glosarium istilah rancu ("task atomik", "Level L", "R1–R7", "ISO 8601") | Claude (M6) | Bersihkan istilah dan definisikan glosarium terukur di USAGE.md |
| **MIN-02** | **P2** | Sinkronisasi metadata: `package.json` version 0.0.0, redaksi klaim "14/14" dan "Zero-Loss" | GPT (M5), Grok (C7), Claude (C3) | Naikkan versi ke 3.3.0, bedakan badge benchmark metodologi dari build app |

---

## 2. GERBANG 2: ARSITEKTUR TEKNIS & KONTRAK DATA

### 2.1 Skema Kontrak Kanonik (Canonical Schemas)

#### A. Format Checkpoint Block Tunggal (The One True Format)
```text
```zlce-checkpoint
TASK: <TASK-ID>
STATUS: <IN_PROGRESS | BLOCKED | DONE>
BASE_COMMIT: <git-sha-7>
STEP_COMPLETED: <deskripsi ringkas>
EVIDENCE: <output perintah verifikasi atau exit code>
NEXT_STEP: <tindakan persis berikutnya>
VERIFICATION_CMD: <perintah shell untuk validasi>
TIMESTAMP: <YYYY-MM-DD (HH:MM TZ | jam: ?)>
```
```

#### B. Skema WAL Baru (Dengan Base Commit & WAL Stack)
```markdown
## 3. WORK IN PROGRESS (WAL)
* **Task:** TASK-002
* **Base Commit:** c4163e7
* **Branch:** feature/TASK-002-schema
* **Langkah Sedang Dikerjakan:** Membuat skema DDL migrasi
* **Berkas Direncanakan/Disentuh:** migrations/001_todos.sql, src/models/todo.py
* **Sudah Dilakukan:** Model Pydantic Todo selesai
* **Langkah Berikutnya (persis):** Eksekusi pytest tests/test_migrations.py
* **Perintah Verifikasi:** pytest tests/test_migrations.py -v
* **Diperbarui:** 2026-10-28 jam: ?

### WAL_STACK (Task Dijeda akibat Preempt R7)
| Stack ID | Task ID | Base Commit | Langkah Terakhir | Disimpan Pada |
| :--- | :--- | :--- | :--- | :--- |
| STACK-01 | TASK-001 | a1b2c3d | Unit test repo pass | 2026-10-28 jam: ? |
```

#### C. Aturan Prioritas Deterministik Pemulihan Kasus A–D
Ketika terjadi sesi terputus, evaluasi kondisi secara sekuensial dengan hierarki:
**KASUS D > KASUS C > KASUS B > KASUS A**
1. **Kasus D (Paling Kritis):** Ada berkas di `git status` yang tidak terdaftar di `Berkas Direncanakan/Disentuh` WAL -> **TINDAKAN: TAHAN & MINTA KONFIRMASI PENGGUNA. JANGAN SENTUH.**
2. **Kasus C:** Ada commit di `git log <base_commit>..HEAD` yang belum tercatat statusnya di Matriks Task -> **TINDAKAN: SELARASKAN STATE DENGAN COMMIT TERSEBUT.**
3. **Kasus B:** Ada uncommitted diff dan seluruh berkasnya cocok dengan daftar WAL -> **TINDAKAN: PERIKSA AC, JALANKAN VERIFIKASI, JIKA LOLOS COMMIT.**
4. **Kasus A:** Working tree bersih dan `HEAD == Base Commit` -> **TINDAKAN: ULANGI LANGKAH BERIKUTNYA YANG BELUM TERSIMPAN.**

#### D. Kontrak Penyimpanan Atomik (Envelope-Based LocalStorage)
```typescript
interface ZlceSessionEnvelope {
  schemaVersion: '3.3.0';
  envelopeId: string;
  updatedAt: string; // ISO 8601 UTC
  projectName: string;
  mode: 'LITE' | 'FULL';
  rawMarkdown: string;
  stateData: ParsedSessionState;
  history: Array<{
    id: string;
    timestamp: number;
    label: string;
    rawMarkdown: string;
  }>;
}
```
Kunci penyimpanan disatukan menjadi satu key utama: `zlce_session_envelope_v3_3`.

---

## 3. GERBANG 3: MATRIKS TASK ATOMIK & STRATEGI PENGUJIAN

### 3.1 Daftar Task Pengerjaan Bertahap
- [ ] **TASK-001 [CRIT-03 & M-5]:** Unifikasi aturan persetujuan & quality gate pada `zlceValidator.ts` dan `zlce-check.py` (exact regex `^(ya|yes)$`, validasi format bukti, aturan jam X1 di Python).
- [ ] **TASK-002 [CRIT-04 & MAJ-02]:** Unifikasi format Checkpoint Block kanonik dan ambang Level S (`<= 20 baris`) di `AI_WORKFLOW`, `LANDING_PROMPT`, `HANDOVER_PROMPT`, `USAGE.md`, dan UI.
- [ ] **TASK-003 [CRIT-01 & MIN-01]:** Standardisasi kanonik Mode LITE vs FULL (arsitektur 5 berkas di LITE dengan `AI_WORKFLOW_CORE.md`, eliminasi redundansi Gerbang 2, pembersihan istilah).
- [ ] **TASK-004 [CRIT-02 & MAJ-04]:** Pembaruan skema WAL (Base Commit SHA, snapshot `<base>..HEAD`, tabel `WAL_STACK`, hierarki prioritas `D > C > B > A`) di template dan skrip `zlce-snapshot.sh` & `zlce-check.py`.
- [ ] **TASK-005 [MAJ-03]:** Implementasi *Session Envelope Storage* atomik di `useSessionPersistence.ts` dengan deteksi kegagalan simpan persisten di UI (*Toast/Banner warning*).
- [ ] **TASK-006 [MAJ-01]:** Pembuatan generator script otomatis `scripts/zlce/pack-kit.py` untuk mengompilasi `ZLCE_KIT_SINGLE.md` dari `templates/` guna mencegah drift selamanya.
- [ ] **TASK-007 [MAJ-05]:** Pembuatan shared test fixtures (`tests/fixtures/valid_state.md`, `invalid_dep.md`, `invalid_wal.md`) dan test suite otomatis di Vitest & Python.
- [ ] **TASK-008 [MIN-02]:** Sinkronisasi metadata `package.json` (versi 3.3.0, skrip `test`, lockfile), pembersihan residu build di `public/`, dan pembaruan `CHANGELOG.md`.

### 3.2 Strategi Verifikasi (Quality Gate)
Setiap task wajib menyertakan bukti:
1. `npm run lint` & `npm run build` exit code 0.
2. `python3 scripts/zlce/zlce-check.py` exit code 0 pada fixture valid dan exit non-zero pada fixture invalid.
3. Vitest round-trip parsing test passing 100%.

---

## 4. GERBANG 4: STATUS SESI & PERSIAPAN EKSEKUSI
- **Task Aktif Pertama:** TASK-001 (Unifikasi Quality Gate & Validasi Persetujuan)
- **Status Awal:** READY (menunggu persetujuan pengguna untuk memulai eksekusi).
