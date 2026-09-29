import re

src = open("main.py", encoding="utf-8").read()
lines = src.splitlines()

routes = []
for i, line in enumerate(lines):
    m = re.search(r'@app\.(get|post|put|delete|patch)\(["\'](/api/[^"\']+)', line)
    if m:
        method = m.group(1).upper()
        path = m.group(2)
        ctx = " ".join(lines[i:i+6])
        has_auth = any(tok in ctx for tok in ["verify_api_key", "require_role", "get_current_user", "Depends"])
        routes.append((path, method, has_auth, i+1))

print("UNPROTECTED ROUTES:")
unprotected = [(p,m,l) for p,m,a,l in routes if not a]
for path, method, lineno in unprotected:
    print(f"  Line {lineno}: {method} {path}")

print()
print(f"Total routes: {len(routes)}  Protected: {len(routes)-len(unprotected)}  Unprotected: {len(unprotected)}")
