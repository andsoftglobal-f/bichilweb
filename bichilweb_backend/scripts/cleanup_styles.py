import requests

r = requests.get('http://127.0.0.1:8000/api/v1/header-style/')
data = r.json()
styles = data if isinstance(data, list) else data.get('results', [])
print(f"Total styles: {len(styles)}")

kept = None
for s in styles:
    sid = s["id"]
    if kept is None:
        kept = s
        print(f"Keeping style id={sid}")
    else:
        dr = requests.delete(f"http://127.0.0.1:8000/api/v1/header-style/{sid}/")
        print(f"Deleted style id={sid} -> {dr.status_code}")

print("DONE")
