# lzh Blog

初一八班电教委的个人博客 —— <https://blog.lzh173.chat/>

> 部署在 **Cloudflare Pages**。旧地址 `lzh173.github.io` 通过保留路径的方式
> 重定向到新域名（见「部署」一节）。

基于 [Hux Blog](https://github.com/Huxpro/huxpro.github.io) 主题二次开发（Apache 2.0），
用 Jekyll 构建，部署在 GitHub Pages。上游主题的原始文档在 [`_doc/upstream/`](_doc/upstream/)，仅供参考。

---

## 本地预览

### 前置环境

Ruby 由 Chocolatey 安装，位于 `C:\tools\ruby34`。若在**新开的终端**里找不到 `ruby`，
用仓库自带的脚本即可（它会自己设置 PATH）：

```cmd
scripts\serve.cmd
```

然后打开 <http://127.0.0.1:4000/>。改动 `_posts/`、`_layouts/`、`_includes/` 会自动重建。

### 手动命令

```powershell
# 当前终端先补 PATH
$env:Path = "C:\tools\ruby34\bin;C:\tools\devkit\bin;$env:Path"

bundle install                 # 首次，或 Gemfile 变更后
bundle exec jekyll serve --livereload
bundle exec jekyll build       # 只构建到 _site/
```

> `Gemfile.lock` **必须入库**。`.gitignore` 里 `*.lock` 那条规则专门加了 `!Gemfile.lock` 例外，
> 否则 CI 无法复现依赖版本。

---

## 怎么写一篇新文章

在 `_posts/` 新建 `YYYY-MM-DD-slug.markdown`：

```yaml
---
layout:       post
title:        "文章标题"
author:       "lzh173"
header-style: text      # 纯文字标题（本仓库 29 篇全是这个）
catalog:      true      # 注意：模板实际读的是 no-catalog，这个字段目前无效果
tags:
    - 标签
---
```

也可以用 Rakefile 生成骨架：

```powershell
bundle exec rake post title="文章标题"
```

**日期取自文件名**，不需要在 front matter 里写 `date`（写了会覆盖文件名里的日期）。

---

## 目录结构

| 路径 | 说明 |
| --- | --- |
| `_posts/` | 文章（29 篇） |
| `_layouts/` | `default` / `post` / `page` |
| `_includes/` | 页面组件（导航、页脚、侧栏、搜索、多语言等） |
| `_plugins/static_files.rb` | 把 `static/` 映射到站点根目录 |
| `src/styles/` | LESS 源码（8 个文件） |
| `src/js/` | 站点脚本源码 |
| `src/vendor/` | 第三方未压缩源（`jquery.js`、`bootstrap.js/css`），模板不引用，仅存档 |
| `scripts/` | 构建脚本（Node ESM） |
| `css/` | **构建产物**：`bootstrap.min.css`、`hux-blog.min.css` |
| `js/` | **构建产物** + 运行时 vendor：`hux-blog.min.js`、`archive.min.js`、`snackbar.min.js`、`sw-registration.min.js`、`jquery.min.js`、`bootstrap.min.js`、`jquery.nav.js`、`jquery.tagcloud.js`、`simple-jekyll-search.min.js` |
| `img/` | 图片 |
| `static/` | **见下方说明**：内容直接发布到站点根目录 |
| `fonts/` | Bootstrap 3 的 glyphicons |
| `_archive/` | 已停用资源与废弃模板（见下方说明） |
| `_doc/upstream/` | 上游主题文档 |

---

## 部署（Cloudflare Pages）

产线地址：**<https://blog.lzh173.chat>**，由 Cloudflare Pages 构建。GitHub Pages 已不再承载站点。

### Cloudflare Pages 项目设置

| 项 | 值 |
| --- | --- |
| Production branch | `master` |
| 构建命令 | `npm ci && npm run build && bundle exec jekyll build` |
| 输出目录 | `_site` |
| 环境变量 | 无需 |

Cloudflare 的构建镜像默认已含 **Ruby 3.4.4** 与 **Node 22**
（见 [Build image](https://developers.cloudflare.com/pages/configuration/build-image/)）。
本机用的是 Ruby 3.4.11（Chocolatey），与 3.4.4 同属 3.4 线，`Gemfile` 的约束
（`jekyll ~> 4.0`）对两者都成立。

> 如果想彻底钉死版本，可以在仓库根目录加 `.ruby-version`（内容如 `3.4.4`）与
> `.nvmrc`（内容如 `22`）。**目前故意没加** —— 钉到 3.4.4 会与本机的 3.4.11 不一致，
> 反而制造环境漂移；镜像滚动更新时再按需添加即可。

### 仓库里需要 Cloudflare 读取的文件

这三个都在仓库根目录，Jekyll 会把它们原样复制进 `_site/`：

| 文件 | 作用 |
| --- | --- |
| `CNAME` | 自定义域名 `blog.lzh173.chat` |
| `_headers` | 响应头：安全头 + 分级缓存策略 |
| `_redirects` | `/dyf-djb-01-old.html` → `/dyf-djb-07.html` 等 301 |

> ⚠️ `_headers` 与 `_redirects` **必须**在 `_config.yml` 的 `include:` 里显式列出。
> Jekyll 的 `EntryFilter` 会拒绝一切以 `_` 开头的文件与目录，不加 include 就不会进产物。

### 域名配置（需在 Cloudflare 控制台操作）

1. 把 `lzh173.chat` 接入 Cloudflare（若尚未接入）
2. Pages 项目 → **Custom domains** → 添加 `blog.lzh173.chat`
   （因为该 zone 已在 Cloudflare，会自动创建 DNS 记录；无需手工加 CNAME）

### 旧域名 lzh173.github.io 的重定向

GitHub Pages 不支持服务端重定向，所以采用「保留路径」的客户端跳转：

- `404.html` 会检测访问者是否来自 `lzh173.github.io`，若是则把
  **原始路径 + 查询串 + hash** 一起送到新域名。GitHub Pages 对任何没有对应文件的
  路径都会渲染 `404.html` 且保留原 URL，因此这一招能覆盖全站。
- `redirect-site/index.html` 是**只含跳转**的独立站点，由
  `.github/workflows/redirect.yml` 单独部署到 GitHub Pages。

**要点：GitHub Actions 现在只发布 `redirect-site/`，不再构建完整博客。**
因此旧域名上不会再出现学生名单、登录页等页面。原来的完整站点工作流
（`.github/workflows/jekyll.yml`）已归档到 `_archive/.github/workflows/`。

> 这样做的代价是：`lzh173.github.io` 上仍会保留一份跳转页。
> 如果你想更彻底，可以先确认新站点无恙，再停用 GitHub Pages 并从仓库移除
> `redirect-site/` 与 `redirect.yml`，让旧地址直接 404。

---

## 设计令牌与暗色模式

样式分两层，构建时**依次拼接**成一个 `css/hux-blog.min.css`：

| 层 | 源文件 | 作用 |
| --- | --- | --- |
| 令牌层 | `src/styles/tokens.less` | 定义语义令牌（颜色/字号/间距/圆角），并给出暗色取值 |
| 主题层 | `src/styles/hux-blog.less` + `sidebar/side-catalog/search/snackbar/highlight.less` | 原有主题规则，颜色一律通过 `var(--token)` 取值 |
| 现代层 | `src/styles/modern.less` | 覆盖 Bootstrap 3 的硬编码颜色、排版微调、可访问性、主题按钮 |

**为什么需要独立编译再追加**：`bootstrap.min.css` 里的颜色是 Bootstrap 3 在编译期用
LESS 变量固化成字面量的，`var()` 无法穿透。现代层必须排在 `bootstrap.min.css` 之后、
同等特指度下才能获胜，所以它单独编译再追加。

### 令牌是唯一事实来源

字体栈只在 `tokens.less` 里定义一次（`--font-sans` / `--font-mono` / `--font-serif`），
`mixins.less` 里的 `.sans-serif()` 等只做转发。改字体只需改一处。

品牌色分三种角色，**不要混用**：

| 令牌 | 用途 | 浅色值 | 对比度 |
| --- | --- | --- | --- |
| `--brand` | 装饰：描边、焦点环、引用条 | `#0085a1` | 白底 4.31:1（仅非文字元素） |
| `--brand-surface` | 填充底：按钮、分页、`::selection` | `#006d84` | 配白字 5.96:1 |
| `--brand-text` | 当文字用的品牌色 | `#006d84` | 白底 5.96:1 |

> 早期版本让 `--brand` 同时承担装饰与填充，导致按钮上的白字只有 4.31:1（不达标）。
> 拆出 `--brand-surface` 后达标。

### 暗色模式

两种触发方式，都不需要刷新页面：

1. **手动** —— 点右下角按钮，写入 `localStorage.theme`，在 `<html>` 上加 `data-theme`
2. **跟随系统** —— 未手动选择时，由 `@media (prefers-color-scheme: dark)` 决定

防闪烁靠 `_includes/head.html` 里的一段**内联脚本**（必须早于首屏渲染，所以不能放到
`tokens.min.js` 里）；交互逻辑在 `src/js/tokens.js`（产物 `js/tokens.min.js`）。

CSS 里用 `html:not([data-theme='light'])` 限定媒体查询，这样显式选过 light 的用户
不会被系统偏好覆盖。

### 对比度

所有文字/底色组合都按 WCAG AA（正文 4.5:1）校验过，**校的是编译产物里的实际值**：

| | 浅色 | 暗色 |
| --- | --- | --- |
| 正文 / 页面底 | 10.37:1 | 12.56:1 |
| 标题 / 页面底 | 16.48:1 | 16.15:1 |
| 次要文字 / 页面底 | 5.33:1 | 7.88:1 |
| 链接 / 页面底 | 4.56:1 | 9.31:1 |
| 填充底上的文字 | 5.96:1 | 6.19:1 |

改动令牌后请重新校验 —— 校验脚本要点：从 `:root{...}` 与 `html[data-theme=dark]{...}`
里抽出实际值，计算相对亮度比，正文按 4.5:1、大字号按 3:1。

### 已知取舍

- `tokens.less` 里有若干档位（`--space-1/2/3/7/8`、`--step--1`、`--radius-lg`、
  `--brand-strong`）当前未被引用。保留是为了让刻度完整、便于后续使用；代价只是
  几行 CSS 变量声明。
- `highlight.less` 里语法高亮的各个 token 颜色（`#abb2bf`、`#c678dd` 等）**刻意保持固定** ——
  它们是为 One Dark 的深底调过的配色，随主题变化反而会失去对比。只有底色接了 `--code-bg`。
- `snackbar.less` 带进来一批未被使用的 Material 组件样式（`.card`、`.paper-button` 等），
  属上游遗留，未清理。

---

## 样式与脚本的构建

用 **npm scripts** 驱动，不再使用 Grunt（`Gruntfile.js` 已归档到 `_archive/`）：

```powershell
npm install          # 首次
npm run build        # 编译 LESS + 压缩 JS
npm run watch        # 监听 src/styles 与 src/js，改动自动重建
npm run serve        # 启动 Jekyll 预览（含 livereload）
```

| 命令 | 作用 |
| --- | --- |
| `npm run build:styles` | `src/styles/hux-blog.less` → `css/hux-blog.min.css`（less 4 + clean-css） |
| `npm run build:scripts` | `src/js/*.js` → `js/*.min.js`（esbuild，4 个入口，见下） |
| `npm run build:jekyll` | 只跑 `bundle exec jekyll build` |
| `npm run clean` | 删除 `_site/` |

`build:scripts` 处理的 4 个入口，**源在 `src/js/`、运行时产物在 `js/`，两者不可混用**：

| 源 | 产物 | 用途 |
| --- | --- | --- |
| `src/js/hux-blog.js` | `js/hux-blog.min.js` | 滚动导航、响应式表格与 iframe |
| `src/js/archive.js` | `js/archive.min.js` | 归档页标签筛选（仅 `/archive/` 加载） |
| `src/js/snackbar.js` | `js/snackbar.min.js` | 底部提示条 |
| `src/js/sw-registration.js` | `js/sw-registration.min.js` | 注册 Service Worker |

> ⚠️ `snackbar.min.js` 必须在 `sw-registration.min.js` **之前**加载 ——
> 后者会调用前者定义的 `createSnackbar`。
>
> ⚠️ `_includes/footer.html` 引用的是 `js/*.min.js`（产物），不是 `src/js/*.js`（源）。
> 往 `src/js/` 加文件后，记得同步改模板路径与 `sw.js` 的 `PRECACHE_LIST`。

**改了 `src/styles/` 或 `src/js/` 之后必须跑一次 `npm run build`**，否则页面加载的还是旧产物。
两个脚本都会在产物顶部写入 banner（版本、作者、年份取自 `package.json`）。

> 关于 `src/vendor/`：里面是 jQuery 与 Bootstrap 的**未压缩源码**，用于对照与重新压缩。
> 页面实际加载的是 `js/jquery.min.js`（jQuery 2.1.3）和 `js/bootstrap.min.js`，
> 这两者是从 `src/vendor/` 派生出来的独立文件，不在构建链里。
>
> ⚠️ 已知问题：`src/vendor/jquery.js` 是 **v2.1.3**，而仓库里还曾有一个 v3.7.1
> （已归档到 `_archive/js/jquery-3.7.1.min.js`）。升级 jQuery 需要先确认
> `jquery.nav.js` / `jquery.tagcloud.js` 的兼容性，尚未处理。

---

## `static/` —— 放进去就出现在站点根目录

`static/` 用来放那些**不属于 Jekyll 站点、但需要能被 URL 访问**的独立页面与文件。
放进去后，其相对路径就是访问路径：

| 源文件 | 访问地址 |
| --- | --- |
| `static/login-dyf-djb.html` | `/login-dyf-djb.html` |
| `static/.well-known/verify.txt` | `/.well-known/verify.txt` |
| `static/sub/a.txt` | `/sub/a.txt` |

实现见 [`_plugins/static_files.rb`](_plugins/static_files.rb)：它在 `post_read` 阶段把
这些文件注册进 `site.static_files`，因此 Jekyll 的清理阶段不会误删它们。

> ⚠️ **不是保密手段。** 内容会随站点公开，仓库本身也是公开的。
> 凭据、密钥、个人数据**根本不要放进仓库**。`static/.gitignore` 只是防手滑的提示，
> 而且它自己不会被发布。

> ⚠️ **GitHub Pages 的默认构建器禁止自定义插件**，所以在那里 `static/` 不会生效。
> 它在本地 `jekyll build/serve`、**Cloudflare Pages**、以及 GitHub Actions 里都正常。
> 如果继续用 GitHub Pages，这些页面需要保持在仓库根目录。

### 目前 `static/` 里有什么

| 文件 | 说明 |
| --- | --- |
| `login-dyf-djb.html` | 班级积分系统登录页（**纯前端假校验，密码明文，见"已知问题"**） |
| `dyf-djb-07.html` | 班级积分系统（新版） |
| `dyf-djb-01-old.html` | 班级积分系统（旧版，与新版仅 3 处差异） |
| `is83h2xn59dn2.html` | lzh ARG 预告页 |
| `L-CHATROOM-011232.html` | 聊天室入口页 |
| `about_patch.exe` | 239,616 字节的加壳 VB.NET 程序，来源与用途不明。**未分析、未运行** |

---

## `_archive/` —— 已停用，但保留

`_archive/` 存放从站点移除、但保留备查的文件（已被 `_config.yml` 的 `exclude` 排除，不参与构建）：

| 内容 | 原因 |
| --- | --- |
| `_archive/img/post-bg-*.jpg` 等 20+ 张 | 上游主题示例文章的头图，随示例文章删除后遗留 |
| `_archive/img/in-post/post-alitrip-pd/`、`post-nextgen-web-pwa/`、`post-wmu/`、`post-js-version/`、`post-eleme-pwa/` | 上游示例文章的配图，已无任何引用 |
| `_archive/_includes/posts/2017-07-12-upgrading-eleme-to-pwa/` | 饿了么 PWA 全文（他人作品），对应文章早已删除 |
| `_archive/_layouts/keynote.html` | 孤儿布局，无任何页面使用 |

`img/` 因此从 12.16 MB 降到约 3.6 MB。**这些文件没有被删除**，确认站点无问题后可自行清理。

---

## 已知问题

1. **`disqus_username: lzh`** —— `lzh` 是极短字符串，很可能已被他人注册，评论区大概率加载失败。
   如果要评论功能，请在 `_config.yml` 里换成你自己注册的 Disqus shortname；不需要就去掉这一行。
2. **隐私** —— `_posts/` 里有 26 篇"德育分扣分登记"，包含全班同学的**姓名与学号**；
   `dyf-djb-07.html` / `dyf-djb-01-old.html` 里各自硬编码了同一份 50 人名单。
   这些内容会进入 `search.json` 和 `feed.xml`，而仓库与站点都是公开的。
   **尚未处理，需要你决定。**
3. **`login-dyf-djb.html`** —— 纯前端假校验，三个账号的密码 `1qaz` 明文写在页面里，
   且该口令已存在于 git 历史（提交 `5148e6f`、`9dfc0c6`）。**尚未处理。**
4. **`about_patch.exe`** —— 见上文 `_static/` 一节；它当前存在于一个**尚未推送**的提交 `154f2ce` 里。
5. **文章头图** —— 29 篇全部是 `header-style: text`，模板的 `.style-text` 规则会
   把背景图设为 `none`，所以文章页没有头图。这是主题的既定行为，不是 bug。

---

## 许可

站点内容版权归作者所有。主题部分来自 Hux Blog，遵循 Apache License 2.0，
原始版权声明见 [`LICENSE`](LICENSE)（**请勿删除**）。
