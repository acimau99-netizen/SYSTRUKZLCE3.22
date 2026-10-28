#!/usr/bin/env python3
"""
ZLCE Kit Single-File Pack Generator (pack-kit.py)
Automates compilation of templates/ and prompt documents into ZLCE_KIT_SINGLE.md.
Guarantees a Single Source of Truth and eliminates template drift.
"""
import os
import sys

FILES_TO_PACK = [
    ("LANDING_PROMPT.md", "LANDING_PROMPT.md"),
    ("HANDOVER_PROMPT.md", "HANDOVER_PROMPT.md"),
    ("templates/AI_WORKFLOW.template.md", "templates/AI_WORKFLOW.template.md"),
    ("templates/AI_WORKFLOW_CORE.template.md", "templates/AI_WORKFLOW_CORE.template.md"),
    ("templates/BLUEPRINT.template.md", "templates/BLUEPRINT.template.md"),
    ("templates/ARCHITECTURE.template.md", "templates/ARCHITECTURE.template.md"),
    ("templates/DATA_MODEL.template.md", "templates/DATA_MODEL.template.md"),
    ("templates/TASKS.template.md", "templates/TASKS.template.md"),
    ("templates/SESSION_STATE.template.md", "templates/SESSION_STATE.template.md"),
    ("templates/TESTING.template.md", "templates/TESTING.template.md"),
    ("templates/CHECKLISTS.template.md", "templates/CHECKLISTS.template.md"),
    ("templates/CHANGELOG.template.md", "templates/CHANGELOG.template.md"),
    ("templates/profiles/DOMAIN_BOOKING.profile.md", "templates/profiles/DOMAIN_BOOKING.profile.md")
]

def main():
    root = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
    out_file = os.path.join(root, "ZLCE_KIT_SINGLE.md")

    header = """# ZLCE KIT (SATU BERKAS) v3.3.0

Berkas ini adalah bundel tunggal (*monolithic bundle*) resmi Zero-Loss Context Engineering (ZLCE) v3.3.0.
Tujuan Utama: Memungkinkan pemakaian ZLCE pada AI berbasis chat/web prompt tunggal (seperti ChatGPT, Claude Web, atau IDE prompt) yang tidak mendukung upload direktori folder sekaligus.

Setiap berkas di dalamnya dibatasi penanda:
<<<FILE: path>>> dan <<<END FILE>>>.
Perlakukan tiap bagian sebagai berkas terpisah dengan path tersebut.

💡 PRINSIP ARSITEKTUR DISTRIBUSI TEMPLATE:
Kit ZLCE sengaja didistribusikan dari satu sumber kebenaran kanonik (`templates/`):
1. `templates/*.md`: Berkas fisik terpisah untuk repositori Git & IDE AI modular (Cursor, Windsurf, VS Code).
2. `ZLCE_KIT_SINGLE.md`: Bundel tunggal mandiri ini yang di-generate otomatis oleh `scripts/zlce/pack-kit.py`.
3. `src/data/templates.ts`: Runtime cache internal untuk aplikasi web ZLCE Studio di sisi browser.

DAFTAR BERKAS:
""" + "\n".join("- " + target for _, target in FILES_TO_PACK) + "\n\n"

    body_parts = []
    missing_files = []
    for rel_src, target_path in FILES_TO_PACK:
        abs_src = os.path.join(root, rel_src)
        if not os.path.exists(abs_src):
            missing_files.append(rel_src)
            continue
        with open(abs_src, "r", encoding="utf-8") as f:
            content = f.read().rstrip()
        block = f"<<<FILE: {target_path}>>>\n{content}\n<<<END FILE>>>"
        body_parts.append(block)

    if missing_files:
        print("[ERROR] Berkas sumber berikut tidak ditemukan:", missing_files)
        sys.exit(1)

    full_bundle = header + "\n\n".join(body_parts) + "\n"

    with open(out_file, "w", encoding="utf-8") as f:
        f.write(full_bundle)

    print(f"[OK] Berhasil mengompilasi {len(FILES_TO_PACK)} berkas ke {out_file} ({len(full_bundle)} bytes)")

if __name__ == "__main__":
    main()
