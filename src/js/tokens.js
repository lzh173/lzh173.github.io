/* ===========================================================
 * tokens.js - 明暗主题切换
 * ===========================================================
 * 分两部分：
 *   1. 防闪烁内联片段（由 _includes/head.html 直接内联，必须早于首屏渲染）
 *   2. 交互逻辑（本文件，defer 加载）
 *
 * 存储：localStorage['theme'] = 'light' | 'dark'
 *   未设置 = 跟随系统 prefers-color-scheme
 * ========================================================== */

(function () {
  'use strict';

  var STORAGE_KEY = 'theme';
  var root = document.documentElement;
  var mql = window.matchMedia('(prefers-color-scheme: dark)');

  function stored() {
    try {
      var v = localStorage.getItem(STORAGE_KEY);
      return v === 'light' || v === 'dark' ? v : null;
    } catch (e) {
      // 隐私模式下 localStorage 可能抛异常，降级为跟随系统
      return null;
    }
  }

  function save(v) {
    try {
      localStorage.setItem(STORAGE_KEY, v);
    } catch (e) {
      /* 存不了就只是不持久化，功能仍可用 */
    }
  }

  // 当前"实际生效"的主题：手动选择优先，否则看系统
  function effective() {
    return stored() || (mql.matches ? 'dark' : 'light');
  }

  function apply() {
    var s = stored();
    if (s) {
      root.setAttribute('data-theme', s);
    } else {
      // 不写属性，交给 CSS 的 prefers-color-scheme 分支
      root.removeAttribute('data-theme');
    }
  }

  function buildButton() {
    if (document.querySelector('.theme-toggle')) return null;

    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'theme-toggle';
    btn.innerHTML = '<span class="theme-toggle__icon" aria-hidden="true"></span>';
    btn.addEventListener('click', function () {
      var next = effective() === 'dark' ? 'light' : 'dark';
      save(next);
      apply();
      sync(btn);
    });
    document.body.appendChild(btn);
    return btn;
  }

  function sync(btn) {
    var isDark = effective() === 'dark';
    var icon = btn.querySelector('.theme-toggle__icon');
    if (icon) icon.textContent = isDark ? '☀' : '☾';

    var label = isDark ? '切换到亮色主题' : '切换到暗色主题';
    btn.setAttribute('aria-label', label);
    btn.setAttribute('title', label);
    btn.setAttribute('aria-pressed', isDark ? 'true' : 'false');
  }

  function init() {
    var btn = buildButton();
    if (btn) sync(btn);

    // 用户没有手动选择时，跟随系统实时变化
    var onSystemChange = function () {
      if (stored()) return; // 已手动选择，忽略
      apply();
      if (btn) sync(btn);
    };

    if (typeof mql.addEventListener === 'function') {
      mql.addEventListener('change', onSystemChange);
    } else if (typeof mql.addListener === 'function') {
      mql.addListener(onSystemChange); // 旧版 Safari
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // 暴露给内联片段与其他脚本复用
  window.LzhTheme = { apply: apply, effective: effective, stored: stored };
})();
