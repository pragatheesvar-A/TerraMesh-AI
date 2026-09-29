import os
import re

PATTERNS = [
    (re.compile(r"password\s*=\s*[\"'][^\"']+[\"']", re.I), "Potential hardcoded password"),
    (re.compile(r"api_key\s*=\s*[\"'][^\"']+[\"']", re.I), "Potential API key"),
    (re.compile(r"secret\s*=\s*[\"'][^\"']+[\"']", re.I), "Potential secret"),
]

def scan_file(filepath):
    issues = 0
    with open(filepath, "r", encoding="utf-8", errors="ignore") as f:
        for i, line in enumerate(f):
            for pattern, desc in PATTERNS:
                if pattern.search(line):
                    # Do not print the secret itself
                    print(f"WARNING: {desc} found in {filepath} on line {i+1}")
                    issues += 1
    return issues

def main():
    root_dir = os.path.join(os.path.dirname(__file__), "..")
    skip_dirs = {".git", "node_modules", "dist", ".gemini", "venv"}
    total_issues = 0
    for root, dirs, files in os.walk(root_dir):
        dirs[:] = [d for d in dirs if d not in skip_dirs]
        for file in files:
            if file.endswith((".py", ".js", ".ts", ".json", ".env")):
                total_issues += scan_file(os.path.join(root, file))
    
    if total_issues == 0:
        print("PASS: No embedded secrets detected.")
    else:
        print(f"FAIL: {total_issues} potential secrets found.")

if __name__ == "__main__":
    main()
