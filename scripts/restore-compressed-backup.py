from pathlib import Path
import base64
import gzip

ROOT = Path(__file__).resolve().parents[1]


def restore(parts_glob: str, destination: str) -> None:
    parts = sorted(ROOT.glob(parts_glob))
    if not parts:
        raise FileNotFoundError(f"No backup parts found for {parts_glob}")

    encoded = "".join(path.read_text(encoding="utf-8").strip() for path in parts)
    data = gzip.decompress(base64.b64decode(encoded))

    target = ROOT / destination
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_bytes(data)
    print(f"Restored {destination}")


restore("backup/compressed/src-ui.tsx.gz.b64.part*", "src/ui.tsx")
restore(
    "backup/compressed/assets-scene-main.composite.gz.b64.part*",
    "assets/scene/main.composite",
)
