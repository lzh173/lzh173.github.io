#!/usr/bin/env node
/**
 * 压缩站点脚本到 js/。
 *
 * 输入 -> 输出（三项都是「源在 src/js/，运行时在 js/」的同一约定）：
 *   src/js/hux-blog.js         -> js/hux-blog.min.js         主题脚本（滚动导航/表格/iframe）
 *   src/js/archive.js          -> js/archive.min.js          归档页标签筛选（仅 /archive/ 加载）
 *   src/js/snackbar.js         -> js/snackbar.min.js         底部提示条（sw-registration 依赖它）
 *   src/js/sw-registration.js  -> js/sw-registration.min.js  注册 Service Worker
 *
 * 注意：snackbar.js 与 sw-registration.js 必须都发布，且 snackbar 在前 ——
 * sw-registration.js 会调用 snackbar.js 定义的 createSnackbar。
 *
 * 顶部写入 banner（与原 Gruntfile 的 usebanner 行为一致）。
 */
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const ENTRIES = [
  'hux-blog',
  'archive',
  'snackbar',
  'sw-registration',
];

const pkg = JSON.parse(await readFile(path.join(ROOT, 'package.json'), 'utf8'));
const banner =
  `/*!\n` +
  ` * ${pkg.title || pkg.name} v${pkg.version} (${pkg.homepage || ''})\n` +
  ` * Copyright ${new Date().getFullYear()} ${pkg.author || ''}\n` +
  ` */`;

await mkdir(path.join(ROOT, 'js'), { recursive: true });

const started = Date.now();
const rows = [];

for (const name of ENTRIES) {
  // 优先 src/js/，回退旧路径（便于渐进迁移）
  const candidates = [
    path.join(ROOT, 'src/js', `${name}.js`),
    path.join(ROOT, 'js', `${name}.js`),
  ];
  const entry = candidates.find((p) => existsSync(p));

  if (!entry) {
    console.error(`scripts  ✗ 找不到源文件: ${name}.js（尝试过 src/js/ 与 js/）`);
    process.exitCode = 1;
    continue;
  }

  const outfile = path.join(ROOT, 'js', `${name}.min.js`);

  const result = await build({
    entryPoints: [entry],
    outfile,
    bundle: false,        // 每个文件独立，不做模块解析
    minify: true,
    target: ['es2015'],   // 与原 uglify 的兼容目标大致相当
    legalComments: 'none',
    banner: { js: banner },
    logLevel: 'warning',
    metafile: true,
  });

  const out = Object.keys(result.metafile.outputs)[0];
  const size = result.metafile.outputs[out].bytes;
  const srcSize = (await readFile(entry, 'utf8')).length;
  const pct = ((1 - size / srcSize) * 100).toFixed(1);

  rows.push(
    `  ${path.relative(ROOT, entry).replace(/\\/g, '/').padEnd(26)} -> js/${name}.min.js  ` +
      `${String(size).padStart(6)} B  (-${pct}%)`
  );
}

console.log(`scripts  ${rows.length} 个文件  ${Date.now() - started}ms`);
for (const r of rows) console.log(r);
