"""Local dependency check; no keys read and no services called."""
import importlib.util, importlib.metadata, json, shutil, sys
from pathlib import Path
r={"python":sys.version.split()[0],"python_supported":sys.version_info>=(3,10),"commands":{},"packages":{}}
for x in ["ffmpeg","ffprobe"]:r["commands"][x]=bool(shutil.which(x))
for mod,dist in [("playwright","playwright"),("PIL","Pillow"),("numpy","numpy")]:
 r["packages"][dist]=importlib.metadata.version(dist) if importlib.util.find_spec(mod) else None
r["fonts_bundled"]=(Path(__file__).parent/"_runtime/fonts/fonts.css").is_file()
r["note"]="Stills/render check Chromium. Install it with python -m playwright install chromium if needed."
print(json.dumps(r,indent=2))
sys.exit(0 if r["python_supported"] and all(r["commands"].values()) and all(r["packages"].values()) and r["fonts_bundled"] else 1)
