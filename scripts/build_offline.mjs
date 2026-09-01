import { cp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const source = path.join(root, 'offline-src');
const output = path.resolve(root, '..', 'outputs', '选课系统-离线版');
const data = JSON.parse(await readFile(path.join(root, 'app', 'data', 'courses.json'), 'utf8'));

await rm(output, { recursive: true, force: true });
await mkdir(path.join(output, 'assets'), { recursive: true });
await cp(path.join(source, 'index.html'), path.join(output, '打开选课系统.html'));
await cp(path.join(source, 'style.css'), path.join(output, 'assets', 'style.css'));
await cp(path.join(source, 'app.js'), path.join(output, 'assets', 'app.js'));
await cp(path.join(source, '使用说明.txt'), path.join(output, '使用说明.txt'));
await writeFile(
  path.join(output, 'assets', 'courses.js'),
  `window.COURSE_DATA=${JSON.stringify(data)};\n`,
  'utf8',
);
console.log(output);
