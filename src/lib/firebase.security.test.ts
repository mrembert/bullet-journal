import { test } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

test('Security: firebase.ts should not log sensitive configuration', () => {
  const firebasePath = path.join(__dirname, 'firebase.ts');

  // Ensure file exists
  if (!fs.existsSync(firebasePath)) {
      assert.fail(`firebase.ts not found at ${firebasePath}`);
  }

  const content = fs.readFileSync(firebasePath, 'utf8');

  // 1. Check for console.log containing 'firebaseConfig'
  // We use a regex that looks for console.log calls that include 'firebaseConfig'
  const logConfigRegex = /console\.log\s*\([^)]*firebaseConfig[^)]*\)/;
  if (logConfigRegex.test(content)) {
      // Allow for legitimate logging if it doesn't expose keys (though we expect none)
      // For now, any logging of the config object is suspect.
      assert.fail('firebase.ts contains console.log(firebaseConfig), which may leak credentials.');
  }

  // 2. Check for console.log containing 'apiKey'
  const logApiKeyRegex = /console\.log\s*\([^)]*apiKey[^)]*\)/;
  assert.strictEqual(logApiKeyRegex.test(content), false, 'firebase.ts should not log "apiKey" directly');

  // 3. Check for console.log containing 'import.meta.env'
  const logEnvRegex = /console\.log\s*\([^)]*import\.meta\.env[^)]*\)/;
  assert.strictEqual(logEnvRegex.test(content), false, 'firebase.ts should not log "import.meta.env"');

  // 4. Check for the specific vulnerability pattern mentioned in the task
  // Pattern: console.log("Initializing Firebase with config:", { ...firebaseConfig, ... })
  const specificVulnerabilityRegex = /console\.log\s*\(\s*["']Initializing Firebase with config:["']\s*,\s*\{\s*\.\.\.firebaseConfig/s;
  assert.strictEqual(specificVulnerabilityRegex.test(content), false, 'firebase.ts should not contain the specific vulnerability pattern');

  console.log('✅ firebase.ts passed static security checks.');
});
