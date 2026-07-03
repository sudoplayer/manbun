const fs = require('fs');
const path = require('path');
const { getClaudeDir } = require('./manbun-config');

const STATE_FILE = '.manbun-active';

const stateDir = getClaudeDir();
const statePath = path.join(stateDir, STATE_FILE);

function setMode(mode) {
  fs.mkdirSync(path.dirname(statePath), { recursive: true });
  fs.writeFileSync(statePath, mode, 'utf8');
}

function clearMode() {
  try {
    fs.unlinkSync(statePath);
  } catch (e) {
    // Silent fail
  }
}

function writeHookOutput(event, mode, context = '') {
  process.stdout.write(context);
}

module.exports = {
  clearMode,
  setMode,
  writeHookOutput,
};
