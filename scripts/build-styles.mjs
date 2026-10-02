#!/usr/bin/env node
/**
 * 编译 LESS -> css/hux-blog.min.css
 *
 * 模板只引用压缩版本（_includes/head.html）。未压缩的 hux-blog.css 曾经也生成，
 * 但全站零引用，已归档到 _archive/ 不再产出 —— 少一个容易误用的产物。
 * 需要调试样式时用浏览器 DevTools 的 CSS 覆盖功能，或临时改这里加一行输出。
 *
 * banner 由本脚本写入，行为与原 Gruntfile 的 usebanner 一致。
 */
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import less from 'less';
import CleanCSS from 'clean-css';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const CANDIDATES = ['src/styles/hux-blog.less', 'less/hux-blog.less'];
const entry = CANDIDATES.map((p) => path.join(ROOT, p)).find((p) => existsSync(p));

if (!entry) {
  console.error('找不到 LESS 入口，尝试过:', CANDIDATES.join(', '));
  process.exit(1);
}

// 现代层：单独编译后**追加**在主样式之后。
// 它要覆盖 bootstrap.min.css 里的硬编码颜色，而同等特指度下后者才生效。
const MODERN_CANDIDATES = ['src/styles/modern.less', 'less/modern.less'];
const modernEntry = MODERN_CANDIDATES.map((p) => path.join(ROOT, p)).find((p) => existsSync(p));

const OUT = path.join(ROOT, 'css/hux-blog.min.css');

const pkg = JSON.parse(await readFile(path.join(ROOT, 'package.json'), 'utf8'));
const banner =
  `/*!\n` +
  ` * ${pkg.title || pkg.name} v${pkg.version} (${pkg.homepage || ''})\n` +
  ` * Copyright ${new Date().getFullYear()} ${pkg.author || ''}\n` +
  ` */\n`;

await mkdir(path.dirname(OUT), { recursive: true });

const started = Date.now();

const result = await less.render(await readFile(entry, 'utf8'), {
  filename: entry,
  paths: [path.dirname(entry)],
  javascriptEnabled: false,
  sourceMap: false, // 不产出 .map，避免生成却没有服务器提供
});

// 编译现代层（可能与主样式共用 tokens/mixins，所以 paths 要带上主样式目录）
let modernCss = '';
if (modernEntry) {
  const modern = await less.render(await readFile(modernEntry, 'utf8'), {
    filename: modernEntry,
    paths: [path.dirname(modernEntry), path.dirname(entry)],
    javascriptEnabled: false,
    sourceMap: false,
  });
  modernCss = modern.css;
}

const combined = result.css + (modernCss ? '\n' + modernCss : '');

const minified = new CleanCSS({
  level: 1,
  // 让 banner 的 /*! ... */ 原样保留
  specialComments: 'all',
}).minify(combined);

if (minified.errors.length) {
  console.error('clean-css 错误:');
  for (const e of minified.errors) console.error('  ' + e);
  process.exit(1);
}
for (const w of minified.warnings) console.warn('  clean-css 警告: ' + w);

await writeFile(OUT, banner + minified.styles, 'utf8');

const pct = ((1 - minified.styles.length / combined.length) * 100).toFixed(1);
console.log(
  `styles  ${path.relative(ROOT, entry).replace(/\\/g, '/')} -> css/hux-blog.min.css ` +
    `(${minified.styles.length} B, 未压缩 ${combined.length} B, -${pct}%)  ${Date.now() - started}ms`
);
if (modernEntry) {
  console.log(`        + ${path.relative(ROOT, modernEntry).replace(/\\/g, '/')} (追加在现代层之后)`);
}
