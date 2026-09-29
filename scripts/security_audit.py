import os
import sys
import re

def main():
    print("--- SECURITY CONFIGURATION CHECK ---")
    env_file = os.path.join(os.path.dirname(__file__), "..", ".env")
    issues = 0
    if os.path.exists(env_file):
        with open(env_file, "r") as f:
            content = f.read()
            if "DEBUG=true" in content.lower():
                print("WARNING: DEBUG is enabled.")
                issues += 1
            if "SECRET_KEY=terramesh_secure_key_2026" in content:
                print("WARNING: Default SECRET_KEY in use.")
                issues += 1
            if "ALLOW_ORIGINS=*" in content:
                print("WARNING: Wildcard CORS ALLOW_ORIGINS in use.")
                issues += 1
    
    if issues == 0:
        print("PASS: Basic configuration security checks passed.")
    else:
        print(f"FAIL: {issues} issues found.")

if __name__ == "__main__":
    main()
