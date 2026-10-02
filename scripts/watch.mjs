#!/usr/bin/env node
/**
 * 监听样式与脚本源码，改动后自动重建。
 *
 * 只负责 LESS → CSS 与 JS 压缩；站点本身的增量重建交给
 * `jekyll serve --livereload`（见 npm run serve），两者可同时跑。
 *
 * 用法： npm run watch
 */
import { watch } from 'node:fs';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const STYLE_DIR = existsSync(path.join(ROOT, 'src/styles')) ? 'src/styles' : 'less';
const JS_DIR = existsSync(path.join(ROOT, 'src/js')) ? 'src/js' : 'js';

const TASKS = {
  styles: 'scripts/build-styles.mjs',
  scripts: 'scripts/build-scripts.mjs',
};

// 简单的防抖：编辑器保存往往触发多次事件
const pending = new Map();
function schedule(name) {
  clearTimeout(pending.get(name));
  pending.set(
    name,
    setTimeout(() => run(TASKS[name], name), 120)
  );
}

let running = false;
const queue = [];
function run(script, name) {
  queue.push({ script, name });
  if (running) return;
  next();
}

function next() {
  const job = queue.shift();
  if (!job) {
    running = false;
    return;
  }
  running = true;
  const child = spawn(process.execPath, [job.script], { cwd: ROOT, stdio: 'inherit' });
  child.on('exit', (code) => {
    if (code !== 0) console.error(`[watch] ${job.name} 构建失败 (exit ${code})`);
    next();
  });
}

function attach(dir, filter, name) {
  const abs = path.join(ROOT, dir);
  if (!existsSync(abs)) {
    console.warn(`[watch] 跳过不存在的目录: ${dir}`);
    return;
  }
  watch(abs, { recursive: true }, (_event, filename) => {
    if (!filename || !filter(filename)) return;
    console.log(`[watch] ${dir}/${filename} 变更 → 重建 ${name}`);
    schedule(name);
  });
  console.log(`[watch] 监听 ${dir}/`);
}

attach(STYLE_DIR, (f) => f.endsWith('.less'), 'styles');
attach(JS_DIR, (f) => f.endsWith('.js') && !f.endsWith('.min.js'), 'scripts');

console.log('[watch] 就绪，Ctrl+C 退出');
