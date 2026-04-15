#!/usr/bin/env zsh
# ============================================================
# cursor-setup.sh — Run this on your NEW machine
#
# Must be run from inside the "Hackathon" folder:
#   cd "/path/to/Hackathon" && zsh cursor-setup.sh
#
# Requires: cursor-migration/ folder created by cursor-pack.sh
# ============================================================
set -e

HACKATHON="$(cd "$(dirname "$0")" && pwd)"
MIGRATION="$HACKATHON/cursor-migration"
NEW_USER="$(whoami)"

echo ""
echo "╔══════════════════════════════════════════╗"
echo "║   Cursor Migration — Hackathon Setup      ║"
echo "╚══════════════════════════════════════════╝"
echo "  Hackathon : $HACKATHON"
echo "  New user  : $NEW_USER"
echo ""

check() { echo "  ✓ $1"; }
warn()  { echo "  ⚠ $1"; }
step()  { echo ""; echo "── $1"; }

# ── Pre-flight ────────────────────────────────────────────
if [ ! -d "$MIGRATION" ]; then
  echo "ERROR: cursor-migration/ not found at $MIGRATION"
  echo ""
  echo "Run cursor-pack.sh on your OLD machine first:"
  echo "  cd \"/path/to/Hackathon\" && zsh cursor-pack.sh"
  echo "Then copy the entire 'Hackathon' folder to this machine."
  exit 1
fi

SOURCE_USER=""
if [ -f "$MIGRATION/source-meta.txt" ]; then
  SOURCE_USER=$(grep "^source_user=" "$MIGRATION/source-meta.txt" | cut -d= -f2)
  echo "  Migrating from user: $SOURCE_USER → $NEW_USER"
fi

# ── 1. Global Cursor config ───────────────────────────────
step "Restoring global Cursor config"

mkdir -p ~/.cursor/rules ~/.cursor/skills-cursor ~/.cursor/commands ~/.cursor/plans

cp "$MIGRATION/cursor-config/mcp.json" ~/.cursor/
check "mcp.json"

cp "$MIGRATION/cursor-config/argv.json" ~/.cursor/ 2>/dev/null \
  && check "argv.json" || warn "argv.json not found (optional)"

if [ -d "$MIGRATION/cursor-config/rules" ]; then
  cp -R "$MIGRATION/cursor-config/rules/." ~/.cursor/rules/
  check "rules/ ($(ls ~/.cursor/rules | wc -l | tr -d ' ') files)"
fi

if [ -d "$MIGRATION/cursor-config/skills-cursor" ]; then
  cp -R "$MIGRATION/cursor-config/skills-cursor/." ~/.cursor/skills-cursor/
  check "skills-cursor/ ($(ls ~/.cursor/skills-cursor | wc -l | tr -d ' ') skills)"
fi

if [ -d "$MIGRATION/cursor-config/commands" ]; then
  cp -R "$MIGRATION/cursor-config/commands/." ~/.cursor/commands/
  check "commands/ ($(ls ~/.cursor/commands | wc -l | tr -d ' ') files)"
fi

if [ -d "$MIGRATION/cursor-config/plans" ]; then
  cp -R "$MIGRATION/cursor-config/plans/." ~/.cursor/plans/
  check "plans/ ($(ls ~/.cursor/plans | wc -l | tr -d ' ') files)"
fi

# ── 2. Editor settings ────────────────────────────────────
step "Restoring editor settings"

CURSOR_USER_DIR="$HOME/Library/Application Support/Cursor/User"
mkdir -p "$CURSOR_USER_DIR/snippets"

cp "$MIGRATION/cursor-user-settings/settings.json"    "$CURSOR_USER_DIR/" 2>/dev/null \
  && check "settings.json" || warn "settings.json not found"
cp "$MIGRATION/cursor-user-settings/keybindings.json" "$CURSOR_USER_DIR/" 2>/dev/null \
  && check "keybindings.json" || warn "keybindings.json not found"

if [ -d "$MIGRATION/cursor-user-settings/snippets" ]; then
  cp -R "$MIGRATION/cursor-user-settings/snippets/." "$CURSOR_USER_DIR/snippets/"
  check "snippets/"
fi

# ── 3. Agent transcripts ──────────────────────────────────
step "Restoring agent transcripts (past conversations)"

PROJECTS_DIR="$HOME/.cursor/projects"

if [ -d "$MIGRATION/agent-transcripts" ]; then
  for src_dir in "$MIGRATION/agent-transcripts"/*/; do
    OLD_NAME=$(basename "$src_dir")

    if [ -n "$SOURCE_USER" ] && [ "$SOURCE_USER" != "$NEW_USER" ]; then
      NEW_NAME=$(echo "$OLD_NAME" | sed "s|Users-${SOURCE_USER}-|Users-${NEW_USER}-|g")
    else
      NEW_NAME="$OLD_NAME"
    fi

    DST="$PROJECTS_DIR/$NEW_NAME/agent-transcripts"
    mkdir -p "$DST"
    cp -R "$src_dir/." "$DST/"
    COUNT=$(ls "$DST" | wc -l | tr -d ' ')
    check "$NEW_NAME ($COUNT transcripts)"
  done
else
  warn "No agent-transcripts found in migration bundle"
fi

# ── 4. Node / nvm / MCP packages ─────────────────────────
step "Setting up Node.js + MCP dependencies"

NODE_VERSION="24.11.1"
export NVM_DIR="$HOME/.nvm"

if [ ! -d "$NVM_DIR" ]; then
  echo "  → Installing nvm..."
  curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash
  [ -s "$NVM_DIR/nvm.sh" ] && source "$NVM_DIR/nvm.sh"
  check "nvm installed"
else
  [ -s "$NVM_DIR/nvm.sh" ] && source "$NVM_DIR/nvm.sh"
  check "nvm already present"
fi

if ! nvm ls "$NODE_VERSION" &>/dev/null 2>&1; then
  echo "  → Installing Node $NODE_VERSION..."
  nvm install "$NODE_VERSION"
fi
nvm use "$NODE_VERSION" --silent
check "Node $(node --version) active"

if ! npm list -g superset-mcp &>/dev/null 2>&1; then
  echo "  → Installing superset-mcp..."
  npm install -g superset-mcp
fi
check "superset-mcp installed"

# ── 5. Patch mcp.json node path ───────────────────────────
step "Patching mcp.json for this machine's Node path"

NODE_PATH="$(which node)"
MCP_FILE="$HOME/.cursor/mcp.json"

python3 - "$MCP_FILE" "$NODE_PATH" << 'PYEOF'
import json, sys

mcp_file, node_path = sys.argv[1], sys.argv[2]
with open(mcp_file) as f:
    config = json.load(f)

patched = 0
for name, settings in config.get("mcpServers", {}).items():
    if "command" in settings and "node" in str(settings["command"]):
        old = settings["command"]
        settings["command"] = node_path
        print(f"  Patched '{name}': {old}\n         → {node_path}")
        patched += 1

with open(mcp_file, "w") as f:
    json.dump(config, f, indent=2)

if patched == 0:
    print("  No node paths needed patching")
PYEOF
check "mcp.json up to date"

# ── 6. Extensions ─────────────────────────────────────────
step "Installing Cursor extensions"

EXTENSIONS=(
  "ms-python.python"
  "anysphere.cursorpyright"
  "ms-vscode.live-server"
  "ms-toolsai.jupyter"
  "ms-toolsai.jupyter-renderers"
  "ms-toolsai.vscode-jupyter-cell-tags"
  "ms-toolsai.vscode-jupyter-slideshow"
  "ms-python.debugpy"
  "mechatroner.rainbow-csv"
)

if command -v cursor &>/dev/null; then
  for ext in "${EXTENSIONS[@]}"; do
    cursor --install-extension "$ext" &>/dev/null \
      && check "$ext" \
      || warn "$ext (install manually via Extensions panel)"
  done
else
  warn "cursor CLI not in PATH — install extensions manually after launch:"
  for ext in "${EXTENSIONS[@]}"; do echo "    cursor --install-extension $ext"; done
fi

# ── 7. Python environments ────────────────────────────────
step "Checking Python environments"

for project_dir in "$HACKATHON"/*/; do
  PROJECT=$(basename "$project_dir")
  REQ="$project_dir/requirements.txt"
  PYPROJECT="$project_dir/pyproject.toml"

  if [ -f "$REQ" ] || [ -f "$PYPROJECT" ]; then
    if [ ! -d "$project_dir/.venv" ]; then
      warn "$PROJECT — .venv missing. Run:"
      echo "     cd \"$project_dir\" && python3 -m venv .venv && pip install -r requirements.txt"
    else
      check "$PROJECT — .venv exists"
    fi
  fi
done

# ── 8. Done ───────────────────────────────────────────────
echo ""
echo "╔══════════════════════════════════════════╗"
echo "║          Setup Complete                   ║"
echo "╚══════════════════════════════════════════╝"
echo ""
echo "3 manual steps left — do these inside Cursor:"
echo ""
echo "  1. VERIFY USER RULES (your AI system prompt)"
echo "     Cursor Settings → Rules → User Rules"
echo "     If blank: log out and back in with your Cursor account."
echo ""
echo "  2. RECONNECT FIGMA MCP"
echo "     Cursor Settings → MCP → Figma → click Connect"
echo ""
echo "  3. VERIFY SUPERSET MCP"
echo "     Cursor Settings → MCP → firstclub-superset → should show green."
echo ""
echo "Past conversations restored to ~/.cursor/projects/"
echo "(visible in Cursor history when you open the Hackathon workspace)"
echo ""
