import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, extname } from 'node:path';

const ROOT = process.cwd();
const ignoreDirs = new Set(['.git', 'node_modules', 'dist']);
const exts = new Set(['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs']);
const conflictPattern = /^(<<<<<<<|=======|>>>>>>>)\s?.*$/m;

function walk(dir, files = []) {
  for (const item of readdirSync(dir)) {
    const fullPath = join(dir, item);
    const stat = statSync(fullPath);

    if (stat.isDirectory()) {
      if (!ignoreDirs.has(item)) walk(fullPath, files);
      continue;
    }

    if (exts.has(extname(item))) files.push(fullPath);
  }
  return files;
}

const offenders = [];
for (const file of walk(ROOT)) {
  const content = readFileSync(file, 'utf8');
  if (conflictPattern.test(content)) offenders.push(file.replace(`${ROOT}/`, ''));
}

if (offenders.length > 0) {
  console.error('\n❌ Merge conflict markers found. Resolve these files before running the app:\n');
  for (const file of offenders) console.error(` - ${file}`);
  console.error('\nThen run: git add <files> && git rebase --continue (if rebasing).\n');
  process.exit(1);
}

console.log('✅ No merge conflict markers found.');
