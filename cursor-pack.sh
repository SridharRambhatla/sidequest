#!/usr/bin/env zsh
# ============================================================
# cursor-pack.sh — Run this on your OLD machine BEFORE moving
#                  the "Hackathon" folder.
#
# Saves everything into Hackathon/cursor-migration/ so the
# single folder copy carries all config + history with it.
#
# Usage:
#   cd "/Users/siddansh/Hackathon" && zsh cursor-pack.sh
# ============================================================
set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
STAGE="$SCRIPT_DIR/cursor-migration"

echo "→ Creating migration bundle at $STAGE"
rm -rf "$STAGE"
mkdir -p "$STAGE"

# ── 1. Global Cursor config ────────────────────────────────
echo "→ Copying Cursor config..."
mkdir -p "$STAGE/cursor-config"

cp ~/.cursor/mcp.json              "$STAGE/cursor-config/"
cp ~/.cursor/argv.json             "$STAGE/cursor-config/" 2>/dev/null || true

[ -d ~/.cursor/rules ]         && cp -R ~/.cursor/rules         "$STAGE/cursor-config/rules"
[ -d ~/.cursor/skills-cursor ] && cp -R ~/.cursor/skills-cursor "$STAGE/cursor-config/skills-cursor"
[ -d ~/.cursor/commands ]      && cp -R ~/.cursor/commands      "$STAGE/cursor-config/commands"
[ -d ~/.cursor/plans ]         && cp -R ~/.cursor/plans         "$STAGE/cursor-config/plans"

# ── 2. Editor settings ────────────────────────────────────
echo "→ Copying editor settings..."
CURSOR_USER="$HOME/Library/Application Support/Cursor/User"
mkdir -p "$STAGE/cursor-user-settings"

cp "$CURSOR_USER/settings.json"    "$STAGE/cursor-user-settings/" 2>/dev/null || true
cp "$CURSOR_USER/keybindings.json" "$STAGE/cursor-user-settings/" 2>/dev/null || true
[ -d "$CURSOR_USER/snippets" ]  && cp -R "$CURSOR_USER/snippets" "$STAGE/cursor-user-settings/snippets"

# ── 3. Extensions list ────────────────────────────────────
echo "→ Exporting extensions list..."
cp ~/.cursor/extensions/extensions.json "$STAGE/extensions.json" 2>/dev/null || true

# ── 4. Agent transcripts for Hackathon workspaces ─────────
echo "→ Copying agent transcripts..."
PROJECTS_DIR="$HOME/.cursor/projects"

for project_dir in \
  "Users-siddansh-Hackathon" \
  "Users-siddansh-Hackathon-curex"
do
  SRC="$PROJECTS_DIR/$project_dir/agent-transcripts"
  [ -d "$SRC" ] || continue

  DST="$STAGE/agent-transcripts/$project_dir"
  mkdir -p "$DST"
  cp -R "$SRC/." "$DST/"
  COUNT=$(ls "$DST" | wc -l | tr -d ' ')
  echo "  ✓ $project_dir ($COUNT transcripts)"
done

# ── 5. Source machine metadata ────────────────────────────
echo "→ Writing metadata..."
cat > "$STAGE/source-meta.txt" << EOF
source_user=$(whoami)
source_hostname=$(hostname)
source_macos=$(sw_vers -productVersion)
source_hackathon=$SCRIPT_DIR
packed_at=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
node_path=$(which node 2>/dev/null || echo "not found")
node_version=$(node --version 2>/dev/null || echo "not found")
EOF

# ── 6. Manifest ───────────────────────────────────────────
cat > "$STAGE/MANIFEST.txt" << EOF
Cursor Migration Bundle — Hackathon
Generated : $(date)
Machine   : $(hostname) [$(whoami)]
macOS     : $(sw_vers -productVersion)

Contents:
  cursor-config/          — mcp.json, rules, skills-cursor, commands, plans
  cursor-user-settings/   — settings.json, keybindings.json, snippets
  extensions.json         — installed extension IDs
  agent-transcripts/      — Hackathon + curex conversations
  source-meta.txt         — source machine info for path remapping

MCP Servers:
  - firstclub-superset  (node path will be auto-patched)
  - Figma               (re-authenticate in Cursor MCP panel)
EOF

echo ""
echo "✅ Done! Bundle saved to: $STAGE"
echo ""
echo "Next: Copy the entire 'Hackathon' folder to your new machine, then run:"
echo "   cd \"/path/to/Hackathon\" && zsh cursor-setup.sh"
