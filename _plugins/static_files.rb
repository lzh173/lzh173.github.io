# frozen_string_literal: true

# 把 static/ 目录下的内容原样发布到站点根目录，且保持相对路径。
#
# 用途：存放那些「不属于 Jekyll 站点、但需要能被 URL 访问」的独立页面与文件
# （班级积分系统、聊天室页、ARG 预告页、.well-known/ 验证文件等）。
#
#   static/login-dyf-djb.html   ->  /login-dyf-djb.html
#   static/.well-known/x.txt    ->  /.well-known/x.txt
#   static/sub/a.txt            ->  /sub/a.txt
#
# 为什么需要插件而不是 Jekyll 的 collection：
#   Jekyll 的 EntryFilter 用 SPECIAL_LEADING_CHAR_REGEX 拒绝一切以 . _ # ~ 开头的
#   目录名，所以 _static/ 永远不会被当作 collection 读取（实测文档数为 0）。
#   目录名不能以下划线开头；而非下划线目录 Jekyll 默认会当普通页面处理并尝试
#   渲染，所以需要这个钩子来「原样复制 + 重写路径」。
#
# 为什么在 post_read 阶段：
#   此时 Jekyll 已完成读取、即将执行 cleanup（它会清掉目标目录里 Jekyll 不认识的
#   旧文件）。把文件注册进 site.static_files，cleanup 就会保留它们。
#
# 注意：GitHub Pages 的默认构建器禁止自定义插件。此功能在本地
# `jekyll build/serve`、Cloudflare Pages、以及 GitHub Actions 里都正常。

module LzhBlog
  # 源目录名（相对仓库根）
  SOURCE_DIR = "static"

  # 精确匹配这些文件名则跳过。
  # .gitignore 一并跳过：它只是给作者看的「别把密钥提交进来」提示，
  # 发布到线上没有意义，还会让人以为站点根目录的忽略规则能被它影响。
  SKIP_BASENAMES = %w[.DS_Store Thumbs.db desktop.ini .gitignore].freeze

  Jekyll::Hooks.register :site, :post_read do |site|
    src = File.join(site.source, SOURCE_DIR)
    next unless Dir.exist?(src)

    prefix = "#{src}#{File::SEPARATOR}"
    count = 0

    # Dir.glob("**/*") 不包含隐藏文件，所以用 Find
    Find.find(src) do |path|
      next unless File.file?(path)

      rel = path.start_with?(prefix) ? path[prefix.length..] : File.basename(path)
      rel = rel.tr(File::SEPARATOR, "/")

      next if SKIP_BASENAMES.include?(File.basename(rel))

      dest = File.join(site.dest, rel)

      # 该路径是否已被 Jekyll 自己占用？重名时让 Jekyll 赢并告警，
      # 避免两个来源写同一个路径导致难以排查的覆盖。
      if site.static_files.any? { |sf| sf.destination(site.dest) == dest }
        Jekyll.logger.warn "Static:", "跳过 #{rel}（已被 Jekyll 生成的文件占用）"
        next
      end

      site.static_files << Jekyll::StaticFile.new(
        site, src, File.dirname(rel), File.basename(rel)
      )
      count += 1
    end

    Jekyll.logger.info "Static:", "将 #{count} 个文件发布到站点根目录（来自 #{SOURCE_DIR}/）" if count.positive?
  end
end
