const { execSync } = require('child_process');
const path = require('path');

module.exports = async () => {
  const root = path.resolve(__dirname, '..');
  const dbUrl = 'file:./dev.test.db';
  console.log('[jest global setup] Creating test database:', dbUrl);
  // Run prisma db push with DATABASE_URL set to the test sqlite file
  execSync('npx prisma db push --accept-data-loss', {
    stdio: 'inherit',
    cwd: root,
    env: { ...process.env, DATABASE_URL: dbUrl }
  });
  // Run seed against the test DB
  try {
    execSync('node -e "require(\'ts-node/register\'); require(\'./prisma/seed\')"', {
      stdio: 'inherit',
      cwd: root,
      env: { ...process.env, DATABASE_URL: dbUrl }
    });
  } catch (e) {
    console.warn('[jest global setup] seed script failed (continuing):', e.message);
  }
};
