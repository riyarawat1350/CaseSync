import sys
import os

# Add backend directory to sys.path
backend_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "backend"))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from main import app  # type: ignore[import-not-found]
from init_db import init_database  # type: ignore[import-not-found]

try:
    init_database()
except Exception as e:
    print(f"[Vercel Init] Database init check: {e}")
