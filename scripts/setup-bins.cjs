const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const binDir = path.join(rootDir, 'node_modules', '.bin');

if (!fs.existsSync(binDir)) {
  fs.mkdirSync(binDir, { recursive: true });
}

function createWrapper(binName, targetRelPath) {
  const binPath = path.join(binDir, binName);
  const content = `#!/bin/sh
basedir=$(dirname "$0")
exec node "$basedir/../${targetRelPath}" "$@"
`;
  fs.writeFileSync(binPath, content, { mode: 0o755 });
  try {
    fs.chmodSync(binPath, 0o755);
  } catch (err) {
    // Ignore chmod failure if filesystem handles execute permissions automatically
  }
  console.log(`[setup-bins] Created executable wrapper for ${binName} -> ${targetRelPath}`);
}

// Explicit targets required for FUSE / virtiofs environments
const explicitTargets = [
  { bin: 'vite', pkg: 'vite', fallback: 'vite/bin/vite.js' },
  { bin: 'tsc', pkg: 'typescript', fallback: 'typescript/bin/tsc' },
  { bin: 'tsserver', pkg: 'typescript', fallback: 'typescript/bin/tsserver' },
  { bin: 'esbuild', pkg: 'esbuild', fallback: 'esbuild/bin/esbuild' }
];

for (const target of explicitTargets) {
  const pkgDir = path.join(rootDir, 'node_modules', target.pkg);
  let resolvedBin = target.fallback;

  if (fs.existsSync(pkgDir)) {
    try {
      const pkgJson = JSON.parse(fs.readFileSync(path.join(pkgDir, 'package.json'), 'utf8'));
      if (typeof pkgJson.bin === 'string') {
        resolvedBin = path.join(target.pkg, pkgJson.bin).replace(/\\/g, '/');
      } else if (pkgJson.bin && pkgJson.bin[target.bin]) {
        resolvedBin = path.join(target.pkg, pkgJson.bin[target.bin]).replace(/\\/g, '/');
      }
    } catch (_) {}
  }

  const targetFullPath = path.join(rootDir, 'node_modules', resolvedBin);
  if (fs.existsSync(targetFullPath)) {
    createWrapper(target.bin, resolvedBin);
  } else {
    // Write wrapper anyway so bin exists once package is present
    createWrapper(target.bin, resolvedBin);
  }
}

// Dynamic scan for any other dependencies declaring bin in node_modules
const nodeModulesDir = path.join(rootDir, 'node_modules');
if (fs.existsSync(nodeModulesDir)) {
  const entries = fs.readdirSync(nodeModulesDir, { withFileTypes: true });
  for (const entry of entries) {
    if (!entry.isDirectory() || entry.name.startsWith('.')) continue;

    const pkgs = [];
    if (entry.name.startsWith('@')) {
      const scopeDir = path.join(nodeModulesDir, entry.name);
      try {
        const subEntries = fs.readdirSync(scopeDir, { withFileTypes: true });
        for (const sub of subEntries) {
          if (sub.isDirectory()) pkgs.push(`${entry.name}/${sub.name}`);
        }
      } catch (_) {}
    } else {
      pkgs.push(entry.name);
    }

    for (const pkg of pkgs) {
      try {
        const pkgJsonPath = path.join(nodeModulesDir, pkg, 'package.json');
        if (!fs.existsSync(pkgJsonPath)) continue;
        const pkgJson = JSON.parse(fs.readFileSync(pkgJsonPath, 'utf8'));
        if (!pkgJson.bin) continue;

        if (typeof pkgJson.bin === 'string') {
          const binName = pkg.includes('/') ? pkg.split('/')[1] : pkg;
          createWrapper(binName, path.join(pkg, pkgJson.bin).replace(/\\/g, '/'));
        } else if (typeof pkgJson.bin === 'object') {
          for (const [binName, binPath] of Object.entries(pkgJson.bin)) {
            createWrapper(binName, path.join(pkg, binPath).replace(/\\/g, '/'));
          }
        }
      } catch (_) {}
    }
  }
}

console.log('[setup-bins] Binary wrappers configuration completed.');
