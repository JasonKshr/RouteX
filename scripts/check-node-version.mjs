const requiredMajor = 22;
const requiredMinor = 13;
const [major, minor] = process.versions.node.split(".").map(Number);

if (major < requiredMajor || (major === requiredMajor && minor < requiredMinor)) {
  console.error(`
RouteX needs Node.js ${requiredMajor}.${requiredMinor}.0 or newer.

Your terminal is using Node.js ${process.versions.node}.

Fix:
  1. Install Node 22 LTS or newer.
  2. Reopen Terminal.
  3. Run: node -v
  4. Run: npm install
  5. Run: npm run dev

If you use nvm:
  nvm install
  nvm use
`);
  process.exit(1);
}
