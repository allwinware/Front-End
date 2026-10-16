# file:// 로 index.html 을 직접 열 때 사용할 데이터 번들 생성 스크립트
# (브라우저가 file:// 에서 $.load / fetch 를 막기 때문에 include HTML, JSON 을 JS 로 묶는다)
# include/ 또는 resource/json/ 파일이 바뀌면 다시 실행: python resource/js/jin/build-local-demo-data.py
import glob, json, os

root = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", ".."))
data = {}

for path in ["include/737-800.html", "include/777-200ER.html"]:
    with open(os.path.join(root, path), encoding="utf-8") as f:
        data[path] = f.read()

for full in sorted(glob.glob(os.path.join(root, "resource", "json", "jin", "*", "*.json"))):
    path = os.path.relpath(full, root).replace(os.sep, "/")
    with open(full, encoding="utf-8-sig") as f:
        data[path] = json.load(f)

out = os.path.join(root, "resource", "js", "jin", "local-demo-data.js")
with open(out, "w", encoding="utf-8") as f:
    f.write("window.LOCAL_DEMO_DATA = ")
    json.dump(data, f, ensure_ascii=False, separators=(",", ":"))
    f.write(";\n")

print(out, len(data), "entries")
