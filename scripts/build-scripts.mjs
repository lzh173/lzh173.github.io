#!/usr/bin/env node
/**
 * 打包/压缩站点脚本。
 *
 * 保持与 Grunt+uglify 完全相同的输入输出约定，避免改动模板与执行时序：
 *   src/js/hux-blog.js  ->  js/hux-blog.min.js
 *
 * 之所以值得做：原来仓库里的 js/hux-blog.min.js 与 js/hux-blog.js 已经漂移
 * （源文件里多出一段百度统计注入，产物里没有），说明构建没跟上手工编辑。
 * 换成可复现的构建后，这个隐患消失。
 *
 * 顶部写入 banner（与原 Gruntfile 的 usebanner 行为一致）。
 */
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

// 入口：优先 src/，回退旧路径（便于渐进迁移）
const srcEntry = path.join(ROOT, 'src/js/hux-blog.js');
const entry = existsSync(srcEntry) ? srcEntry : path.join(ROOT, 'js/hux-blog.js');

const pkg = JSON.parse(await readFile(path.join(ROOT, 'package.json'), 'utf8'));
const banner =
  `/*!\n` +
  ` * ${pkg.title || pkg.name} v${pkg.version} (${pkg.homepage || ''})\n` +
  ` * Copyright ${new Date().getFullYear()} ${pkg.author || ''}\n` +
  ` */`;

await mkdir(path.join(ROOT, 'js'), { recursive: true });

const started = Date.now();

const result = await build({
  entryPoints: [entry],
  outfile: path.join(ROOT, 'js/hux-blog.min.js'),
  bundle: false,        // 单文件，无需解析 import
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

console.log(
  `scripts  ${path.relative(ROOT, entry)} -> js/hux-blog.min.js ` +
    `(${size} B, 源 ${srcSize} B, -${((1 - size / srcSize) * 100).toFixed(1)}%)  ${Date.now() - started}ms`
);
