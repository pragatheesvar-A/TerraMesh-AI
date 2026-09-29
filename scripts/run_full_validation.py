#!/usr/bin/env python3
import os
print("Running full validation (mock)")
os.system("cd apps/mineguard-core/backend && pytest -q")
