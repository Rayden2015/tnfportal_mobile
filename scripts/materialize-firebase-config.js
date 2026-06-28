#!/usr/bin/env node
/**
 * Materialize Firebase native config from EAS file env vars (or local myfirebase/).
 * Runs on EAS via eas-build-pre-install and from app.config.js.
 */
const { copyFileSync, existsSync, mkdirSync } = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const myfirebaseDir = path.join(root, 'myfirebase');

const targets = {
  GOOGLE_SERVICES_JSON: path.join(myfirebaseDir, 'google-services.json'),
  GOOGLE_SERVICE_INFO_PLIST: path.join(myfirebaseDir, 'GoogleService-Info.plist'),
};

function materializeFirebaseConfig({ required = false } = {}) {
  mkdirSync(myfirebaseDir, { recursive: true });

  for (const [envName, targetPath] of Object.entries(targets)) {
    const sourcePath = process.env[envName];
    if (sourcePath && existsSync(sourcePath)) {
      copyFileSync(sourcePath, targetPath);
      console.log(`[firebase] Installed ${path.basename(targetPath)} from ${envName}`);
      continue;
    }

    if (existsSync(targetPath)) {
      console.log(`[firebase] Using existing ${path.basename(targetPath)}`);
      continue;
    }

    if (required) {
      console.error(
        `[firebase] Missing ${path.basename(targetPath)}.\n` +
          `Upload EAS file secrets:\n` +
          `  npm run eas:secrets\n` +
          `Or place files in myfirebase/ before building.`,
      );
      process.exit(1);
    }
  }
}

if (require.main === module) {
  const required = process.env.EAS_BUILD === 'true' || process.argv.includes('--required');
  materializeFirebaseConfig({ required });
}

module.exports = { materializeFirebaseConfig };
