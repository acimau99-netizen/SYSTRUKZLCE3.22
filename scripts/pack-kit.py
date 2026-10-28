#!/usr/bin/env python3
# ZLCE pack wrapper. Forwards execution to canonical scripts/zlce/pack-kit.py
import os
import sys
import subprocess

here = os.path.dirname(os.path.abspath(__file__))
canonical = os.path.join(here, "zlce", "pack-kit.py")
sys.exit(subprocess.call([sys.executable, canonical] + sys.argv[1:]))
