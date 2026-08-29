import { mkdir, rm, cp, access } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const outputDir = path.join(rootDir, 'dist', 'opera-gx');

const requiredEntries = [
  'manifest.json',
  'assets',
  'src',
  'update.json',
];

async function pathExists(targetPath) {
  try {
    await access(targetPath);
    return true;
  } catch {
    return false;
  }
}

async function main() {
  await rm(outputDir, { recursive: true, force: true });
  await mkdir(outputDir, { recursive: true });

  for (const entry of requiredEntries) {
    const sourcePath = path.join(rootDir, entry);

    if (!(await pathExists(sourcePath))) {
      throw new Error(`Missing required extension entry: ${entry}`);
    }

    await cp(sourcePath, path.join(outputDir, entry), { recursive: true });
  }

  console.log(`Opera GX build ready at ${path.relative(rootDir, outputDir)}`);
}

main().catch((error) => {
  console.error(error.message ?? error);
  process.exitCode = 1;
});