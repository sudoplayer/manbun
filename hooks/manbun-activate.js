#!/usr/bin/env node
// manbun — Claude Code SessionStart activation hook
//
// Runs on every session start:
//   1. Writes flag file at $CLAUDE_CONFIG_DIR/.manbun-active (statusline reads this)
//   2. Emits manbun ruleset as hidden SessionStart context
//   3. Detects missing statusline config and emits setup nudge

const fs = require('fs');
const path = require('path');
const { getDefaultMode, getClaudeDir, isShellSafe } = require('./manbun-config');
const { getManbunInstructions } = require('./manbun-instructions');

const claudeDir = getClaudeDir();
const settingsPath = path.join(claudeDir, 'settings.json');

const mode = getDefaultMode();

// "off" mode — skip activation entirely
if (mode === 'off') {
  try {
    const flagPath = path.join(claudeDir, '.manbun-active');
    if (fs.existsSync(flagPath)) fs.unlinkSync(flagPath);
  } catch (e) {
    // Silent fail
  }
  process.stdout.write('OK\n');
  process.exit(0);
}

// 1. Write flag file for statusline
try {
  const flagPath = path.join(claudeDir, '.manbun-active');
  fs.mkdirSync(claudeDir, { recursive: true });
  fs.writeFileSync(flagPath, mode, 'utf8');
} catch (e) {
  // Silent fail — flag is best-effort
}

// 2. Emit the manbun ruleset, filtered to the active intensity level.
let output = getManbunInstructions(mode);

// 3. Detect missing statusline config — nudge Claude to help set it up
try {
  let hasStatusline = false;
  if (fs.existsSync(settingsPath)) {
    // Strip UTF-8 BOM some editors prepend on Windows (breaks JSON.parse)
    const raw = fs.readFileSync(settingsPath, 'utf8').replace(/^﻿/, '');
    const settings = JSON.parse(raw);
    if (settings.statusLine) {
      hasStatusline = true;
    }
  }

  if (!hasStatusline) {
    const isWindows = process.platform === 'win32';
    const scriptName = isWindows ? 'manbun-statusline.ps1' : 'manbun-statusline.sh';
    const scriptPath = path.join(__dirname, scriptName);
    if (isShellSafe(scriptPath)) {
      const command = isWindows
        ? `powershell -ExecutionPolicy Bypass -File "${scriptPath}"`
        : `bash "${scriptPath}"`;
      const statusLineSnippet =
        '"statusLine": { "type": "command", "command": ' + JSON.stringify(command) + ' }';
      output += '\n\n' +
        'STATUSLINE SETUP NEEDED: The manbun plugin includes a statusline badge showing active mode ' +
        '(e.g. [MANBUN], [MANBUN:ULTRA]). It is not configured yet. ' +
        'To enable, add this to ~/.claude/settings.json: ' +
        statusLineSnippet + ' ' +
        'Proactively offer to set this up for the user on first interaction.';
    } else {
      output += '\n\n' +
        'STATUSLINE SETUP NEEDED: The manbun plugin includes a statusline badge showing active mode. ' +
        'Its install path contains characters unsafe to embed in a shell command, so configure it manually: ' +
        'add a statusLine command of type "command" that runs ' + scriptName +
        ' from the plugin\'s hooks directory to ~/.claude/settings.json, quoting/escaping the path for your shell. ' +
        'Proactively offer to set this up for the user on first interaction.';
    }
  }
} catch (e) {
  // Silent fail — don't block session start over statusline detection
}

try {
  process.stdout.write(output + '\n');
} catch (e) {
  // Silent fail — stdout closed/EPIPE at hook exit must not surface as a hook failure
}
