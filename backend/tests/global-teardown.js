const fs = require('fs');
const path = require('path');

module.exports = async () => {
  const root = path.resolve(__dirname, '..');
  const dbPath = path.join(root, 'dev.test.db');
  try {
    if (fs.existsSync(dbPath)) fs.unlinkSync(dbPath);
    console.log('[jest global teardown] Removed', dbPath);
  } catch (e) {
    console.warn('[jest global teardown] Could not remove test DB:', e.message);
  }
};
