const fs = require('fs');
const path = require('path');

const sourceRoot = process.cwd();
const outputDir = path.join(sourceRoot, '.edgeone-release');

const copyItems = [
  'about.html',
  'about.js',
  'admin.html',
  'admin.js',
  'api',
  'app.js',
  'archive.html',
  'archive.js',
  'assets',
  'atlas.html',
  'atlas.js',
  'auth-guard.js',
  'auth.js',
  'classics.html',
  'classics.js',
  'cloud-functions',
  'data.js',
  'detail.html',
  'detail.js',
  'guard-index.png',
  'home-mengyi.png',
  'index.html',
  'login-mengyi.png',
  'login-page-2.png',
  'login-page-password.png',
  'login-page-qq.png',
  'login-page.png',
  'login.html',
  'login.js',
  'profile.html',
  'profile.js',
  'styles.css'
];

function removeDir(target) {
  fs.rmSync(target, { recursive: true, force: true });
}

function ensureDir(target) {
  fs.mkdirSync(target, { recursive: true });
}

function copyRecursive(source, target) {
  const stat = fs.statSync(source);

  if (stat.isDirectory()) {
    ensureDir(target);
    for (const entry of fs.readdirSync(source)) {
      copyRecursive(path.join(source, entry), path.join(target, entry));
    }
    return;
  }

  ensureDir(path.dirname(target));
  fs.copyFileSync(source, target);
}

removeDir(outputDir);
ensureDir(outputDir);

for (const item of copyItems) {
  const sourcePath = path.join(sourceRoot, item);
  if (!fs.existsSync(sourcePath)) {
    throw new Error(`Missing required release item: ${item}`);
  }

  copyRecursive(sourcePath, path.join(outputDir, item));
}

const edgeoneConfig = {
  rewrites: [
    { source: '/', destination: '/index.html' },
    { source: '/about', destination: '/about.html' },
    { source: '/archive', destination: '/archive.html' },
    { source: '/atlas', destination: '/atlas.html' },
    { source: '/classics', destination: '/classics.html' },
    { source: '/detail', destination: '/detail.html' },
    { source: '/login', destination: '/login.html' },
    { source: '/profile', destination: '/profile.html' }
  ]
};

fs.writeFileSync(
  path.join(outputDir, 'edgeone.json'),
  `${JSON.stringify(edgeoneConfig, null, 2)}\n`,
  'utf8'
);

console.log(`Prepared EdgeOne release directory: ${outputDir}`);
