#!/usr/bin/env python3
"""
TerraMesh AI — i18n Parity & Silent-Fallback Checker (Phase F)
================================================================
Validates the five operational locales (EN/HI/BN/TA/SAT):
  1. KEY PARITY — every key in the base (en) exists in all four others.
  2. SILENT FALLBACK DETECTION — flags any non-English locale whose value
     is IDENTICAL to the English value (i.e. untranslated), separately for
     operationally-critical namespaces (alerts, common, nav, dashboard)
     versus cosmetic ones.
  3. UNIT SAFETY — flags translations that altered machine identifiers,
     numeric units, or Latin technical tokens (CH4/CO/O2/EVACUATE-coded).

Exit 0 = parity OK; exit 1 = hard failures (missing keys or untranslated
operational strings); warnings exit 0 but print.
"""
from __future__ import annotations
import json
import re
import sys
from pathlib import Path

LOCALES_DIR = Path(__file__).resolve().parents[1] / "apps/mineguard-core/frontend/src/i18n/locales"
LANGS = ["en", "hi", "bn", "ta", "sat"]
OPERATIONAL_NAMESPACES = {"alerts", "common", "nav", "nav_sections", "dashboard"}
# Tokens that must survive translation unchanged (safety-critical machine codes)
PROTECTED_TOKENS = ["CH4", "CO", "O2", "EVACUATE", "CRITICAL", "DANGER",
                    "CAUTION", "WATCH", "NORMAL", "SIMULATED", "LIVE",
                    "CSV", "PWA", "API", "IoT"]


def load(lang: str) -> dict:
    with open(LOCALES_DIR / f"{lang}.json", encoding="utf-8") as f:
        return json.load(f)


def flatten(d: dict, prefix: str = "") -> dict:
    out = {}
    for k, v in d.items():
        key = f"{prefix}.{k}" if prefix else k
        if isinstance(v, dict):
            out.update(flatten(v, key))
        else:
            out[key] = v
    return out


def main() -> int:
    base = flatten(load("en"))
    hard_failures = []
    warnings = []
    stats = {}

    for lang in LANGS[1:]:
        other = flatten(load(lang))
        stats[lang] = {"missing": 0, "untranslated_operational": 0, "untranslated_other": 0}
        # 1. key parity
        missing = set(base) - set(other)
        for k in sorted(missing):
            hard_failures.append(f"[{lang}] MISSING key: {k}")
        stats[lang]["missing"] = len(missing)
        # 2. silent fallback (identical to English)
        for k, v in other.items():
            if k not in base or not isinstance(v, str):
                continue
            if v == base[k]:
                ns = k.split(".", 1)[0]
                if ns in OPERATIONAL_NAMESPACES:
                    hard_failures.append(f"[{lang}] UNTRANSLATED operational string: {k} = {v!r}")
                    stats[lang]["untranslated_operational"] += 1
                else:
                    warnings.append(f"[{lang}] untranslated cosmetic: {k}")
                    stats[lang]["untranslated_other"] += 1
        # 3. protected tokens must survive
        for k, v in other.items():
            if not isinstance(v, str):
                continue
            base_tokens = {t for t in PROTECTED_TOKENS if t in (base.get(k) or "")}
            for tok in base_tokens:
                if tok not in v:
                    hard_failures.append(
                        f"[{lang}] PROTECTED TOKEN LOST: {k} — '{tok}' missing from {v!r}")

    print(f"i18n PARITY CHECK — base keys: {len(base)}")
    for lang, s in stats.items():
        print(f"  {lang}: missing={s['missing']} "
              f"untranslated_operational={s['untranslated_operational']} "
              f"untranslated_cosmetic={s['untranslated_other']}")
    for f_ in hard_failures:
        print(f"  [FAIL] {f_}")
    for w in warnings:
        print(f"  [warn] {w}")
    if hard_failures:
        print(f"RESULT: {len(hard_failures)} HARD FAILURES")
        return 1
    print("RESULT: PARITY OK (operational strings translated in all locales)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
