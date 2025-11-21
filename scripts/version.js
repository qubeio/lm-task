#!/usr/bin/env node
import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT_DIR = join(__dirname, '..');

function bumpVersion(version, level) {
  const parts = version.split('.').map(Number);

  switch (level) {
    case 'major':
      return `${parts[0] + 1}.0.0`;
    case 'minor':
      return `${parts[0]}.${parts[1] + 1}.0`;
    case 'patch':
      return `${parts[0]}.${parts[1]}.${parts[2] + 1}`;
    default:
      throw new Error(`Invalid version level: ${level}`);
  }
}

function updatePackageJson(filePath, updates) {
  const content = readFileSync(filePath, 'utf-8');
  const pkg = JSON.parse(content);

  Object.assign(pkg, updates);

  // Preserve formatting by maintaining original structure
  writeFileSync(filePath, JSON.stringify(pkg, null, 2) + '\n', 'utf-8');

  return pkg;
}

function main() {
  const level = process.argv[2];

  if (!['major', 'minor', 'patch'].includes(level)) {
    console.error('Usage: node version.js <major|minor|patch>');
    process.exit(1);
  }

  // Read root package.json
  const rootPkgPath = join(ROOT_DIR, 'package.json');
  const rootPkg = JSON.parse(readFileSync(rootPkgPath, 'utf-8'));
  const oldVersion = rootPkg.version;
  const newVersion = bumpVersion(oldVersion, level);

  console.log(`Bumping version from ${oldVersion} to ${newVersion}`);

  // Update root package
  updatePackageJson(rootPkgPath, { version: newVersion });
  console.log(`✓ Updated root package to ${newVersion}`);

  // Update workspace packages
  const workspacePkgPath = join(ROOT_DIR, 'packages/lm-tasker-mcp/package.json');
  const workspacePkg = JSON.parse(readFileSync(workspacePkgPath, 'utf-8'));

  // Bump workspace version
  const workspaceNewVersion = bumpVersion(workspacePkg.version, level);

  // Update workspace package with new version and updated dependency
  const updates = {
    version: workspaceNewVersion,
    dependencies: {
      ...workspacePkg.dependencies,
      '@qubeio/lm-tasker': `^${newVersion}`
    }
  };

  updatePackageJson(workspacePkgPath, updates);
  console.log(`✓ Updated workspace package to ${workspaceNewVersion}`);
  console.log(`✓ Updated workspace dependency to ^${newVersion}`);

  console.log('\nVersion bump complete!');
  console.log('Next steps:');
  console.log('  1. Review the changes');
  console.log('  2. Commit: git add . && git commit -m "chore: bump version to ' + newVersion + '"');
  console.log('  3. Publish: npm run publish:all');
}

main();
