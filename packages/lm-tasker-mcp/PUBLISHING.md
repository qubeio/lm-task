# Publishing Guide for @qubeio/lm-tasker-mcp

This package is a thin wrapper around the main `@qubeio/lm-tasker` package and must be published **after** the main package.

## Publishing Order

1. **First**: Publish `@qubeio/lm-tasker` (main package)
2. **Second**: Publish `@qubeio/lm-tasker-mcp` (this wrapper package)

## Publishing Steps

### 1. Publish Main Package

From the root directory:

```bash
# Make sure all tests pass
npm test

# Build and publish the main package
npm run changeset:version
npm run release
```

### 2. Publish Wrapper Package

After the main package is published:

```bash
# Navigate to wrapper package
cd packages/lm-tasker-mcp

# Install dependencies (will fetch published @qubeio/lm-tasker)
npm install

# Publish
npm publish
```

## Version Syncing

Both packages should maintain the same version number. When bumping the version:

1. Update version in `/package.json` (main package)
2. Update version in `/packages/lm-tasker-mcp/package.json`
3. Update dependency version in `/packages/lm-tasker-mcp/package.json`:
   ```json
   "dependencies": {
     "@qubeio/lm-tasker": "^X.Y.Z"
   }
   ```

## Local Testing

To test locally before publishing:

```bash
# From root directory, create a tarball of main package
npm pack

# Navigate to wrapper package
cd packages/lm-tasker-mcp

# Install the local tarball
npm install ../../qubeio-lm-tasker-X.Y.Z.tgz

# Test the wrapper
node index.js
```

## Automated Publishing

Consider adding these scripts to automate the process:

```json
{
  "scripts": {
    "publish:all": "npm run release && cd packages/lm-tasker-mcp && npm publish"
  }
}
```
