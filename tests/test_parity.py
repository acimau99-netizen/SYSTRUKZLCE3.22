#!/usr/bin/env python3
"""
Automated Test Runner for ZLCE Parity & Quality Gates
Runs validation fixtures on Python checker and verifies TS parity.
"""
import os
import subprocess
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, ".."))
CHECKER = os.path.join(ROOT, "scripts", "zlce", "zlce-check.py")

def run_py_checker(state_file):
    res = subprocess.run([sys.executable, CHECKER, "--state", state_file, "--no-git"],
                         capture_output=True, text=True)
    return res.returncode, res.stdout + res.stderr

def run_ts_checker(state_file):
    script = f"""
import {{ validateSessionState }} from './src/utils/zlceValidator';
import fs from 'fs';
const txt = fs.readFileSync('{state_file}', 'utf8');
const res = validateSessionState(txt);
process.stdout.write(JSON.stringify({{ valid: res.valid, errorsCount: res.errorsCount, codes: res.issues.map(i => i.code) }}));
"""
    res = subprocess.run(["npx", "tsx", "-e", script], cwd=ROOT, capture_output=True, text=True)
    if res.returncode != 0:
        return None, res.stderr
    import json
    return json.loads(res.stdout), ""

def main():
    print("=== RUNNING ZLCE AUTOMATED PARITY SUITE ===")
    
    # Test 1: Valid State
    valid_file = os.path.join(HERE, "fixtures", "valid_state.md")
    code, out = run_py_checker(valid_file)
    assert code == 0, f"Valid fixture failed in Python checker:\n{out}"
    ts_res, ts_err = run_ts_checker(valid_file)
    assert ts_res and ts_res["valid"] is True, f"Valid fixture failed in TS validator:\n{ts_err}"
    print("  [PASS] Test 1: valid_state.md lulus di Python (exit 0) & TypeScript (valid=true)")

    # Test 2: Invalid Approval ('belum yakin')
    inv_file = os.path.join(HERE, "fixtures", "invalid_approval.md")
    code, out = run_py_checker(inv_file)
    assert code != 0, f"Invalid approval should fail Python checker, but got exit 0:\n{out}"
    assert "Disetujui != ya" in out, "Python checker did not report approval error"
    ts_res, ts_err = run_ts_checker(inv_file)
    assert ts_res and "DONE_UNAPPROVED" in ts_res["codes"], f"TS validator did not report DONE_UNAPPROVED:\n{ts_res}"
    print("  [PASS] Test 2: invalid_approval.md ('belum yakin') ditolak secara presisi di Python & TypeScript")

    # Test 3: Example State
    example_file = os.path.join(ROOT, "examples", "SESSION_STATE.example.md")
    code, out = run_py_checker(example_file)
    assert code == 0, f"SESSION_STATE.example.md failed in Python checker:\n{out}"
    print("  [PASS] Test 3: examples/SESSION_STATE.example.md lulus di Python (exit 0)")

    # Test 4: Root 4-task SESSION_STATE.md
    root_state = os.path.join(ROOT, "SESSION_STATE.md")
    code, out = run_py_checker(root_state)
    assert code == 0, f"Root SESSION_STATE.md failed in Python checker:\n{out}"
    ts_res, ts_err = run_ts_checker(root_state)
    assert ts_res and ts_res["valid"] is True, f"Root SESSION_STATE.md failed in TS validator:\n{ts_err}"
    assert ts_res["errorsCount"] == 0, f"Root SESSION_STATE.md has {ts_res['errorsCount']} TS errors"
    print("  [PASS] Test 4: Root SESSION_STATE.md (4 tasks) lulus di Python (exit 0) & TypeScript (valid=true, 0 error)")

    print("\n>>> ALL AUTOMATED PARITY TESTS PASSED SUCCESSFULLY! <<<")

if __name__ == "__main__":
    main()
