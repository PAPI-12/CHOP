#!/usr/bin/env bash
# Re-provision the sandbox after a restart.
#
# The workspace survives restarts but installed packages and /tmp do not, so
# every session needs this before any of the x-ray tooling will run:
#
#   • numpy / pillow        -- all the analysis is numeric
#   • imageio-ffmpeg        -- there is no system ffmpeg; we ship a static one
#   • /tmp/ffmpeg           -- edit.py points FF at this path
#   • local branch          -- restarts roll HEAD back to base while leaving
#                              the working tree intact, which makes git report
#                              every tracked file as untracked. We re-point the
#                              branch at the remote tip instead, but only after
#                              confirming the tree matches it byte for byte.
#
# Usage:  bash tools/xray/bootstrap.sh
set -euo pipefail
cd "$(dirname "$0")/../.."

echo "== python packages =="
pip install --break-system-packages -q imageio-ffmpeg pillow numpy

echo "== ffmpeg =="
FF=$(python3 -c "import imageio_ffmpeg, shutil, os; \
p = imageio_ffmpeg.get_ffmpeg_exe(); shutil.copy(p, '/tmp/ffmpeg'); os.chmod('/tmp/ffmpeg', 0o755); print(p)")
echo "   $FF -> /tmp/ffmpeg"
/tmp/ffmpeg -version 2>&1 | head -1

echo "== node =="
[ -d node_modules ] || npm install --no-audit --no-fund
echo "   $(ls node_modules 2>/dev/null | wc -l) packages"

echo "== git =="
BR=$(git rev-parse --abbrev-ref HEAD)
git fetch origin "$BR" -q 2>/dev/null || true
REMOTE=$(git rev-parse "origin/$BR" 2>/dev/null || echo "")
if [ -n "$REMOTE" ] && [ "$REMOTE" != "$(git rev-parse HEAD)" ]; then
  git add -A
  if [ -z "$(git diff --cached --stat "$REMOTE")" ]; then
    git reset --mixed "$REMOTE" -q
    echo "   reconciled $BR -> $(git rev-parse --short "$REMOTE") (tree was byte-identical)"
  else
    git reset -q
    echo "   WARNING: working tree differs from origin/$BR -- left alone, resolve by hand"
    git status --short | head
  fi
else
  echo "   $BR at $(git rev-parse --short HEAD), up to date"
fi

echo "== assets =="
echo "   source footage : $(ls assets/xray/source 2>/dev/null | wc -l) files"
echo "   intermediates  : $(ls assets/xray/work 2>/dev/null | wc -l) files"
echo "   delivery       : $(ls public/videos 2>/dev/null | wc -l) files"
