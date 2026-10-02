require "rubygems"
require 'rake'
require 'yaml'
require 'time'

SOURCE = "."
CONFIG = {
  'version' => "12.3.2",
  'themes' => File.join(SOURCE, "_includes", "themes"),
  'layouts' => File.join(SOURCE, "_layouts"),
  'posts' => File.join(SOURCE, "_posts"),
  # 本站文章实际使用 .markdown 扩展名（29/29），与 Jekyll 的解析无关，
  # 但保持一致可避免同一目录出现两种后缀。
  'post_ext' => "markdown",
  'theme_package_version' => "0.1.0"
}

# Usage: rake post title="A Title" subtitle="A sub title"
desc "Begin a new post in #{CONFIG['posts']}"
task :post do
  abort("rake aborted: '#{CONFIG['posts']}' directory not found.") unless FileTest.directory?(CONFIG['posts'])
  title = ENV["title"] || "new-post"
  subtitle = ENV["subtitle"] || "This is a subtitle"
  slug = title.downcase.strip.gsub(' ', '-').gsub(/[^\w-]/, '')
  begin
    date = (ENV['date'] ? Time.parse(ENV['date']) : Time.now).strftime('%Y-%m-%d')
  rescue Exception => e
    puts "Error - date format must be YYYY-MM-DD, please check you typed it correctly!"
    exit -1
  end
  filename = File.join(CONFIG['posts'], "#{date}-#{slug}.#{CONFIG['post_ext']}")
  if File.exist?(filename)
    abort("rake aborted!") if ask("#{filename} already exists. Do you want to overwrite?", ['y', 'n']) == 'n'
  end

  puts "Creating new post: #{filename}"
  # Ruby 3.0 起 Kernel#open 不再接受块形式写文件，必须用 File.open
  File.open(filename, 'w') do |post|
    post.puts "---"
    post.puts "layout: post"
    post.puts "title: \"#{title.gsub(/-/,' ')}\""
    post.puts "subtitle: \"#{subtitle.gsub(/-/,' ')}\""
    post.puts "date: #{date}"
    post.puts "author: \"lzh173\""
    post.puts "tags: []"
    post.puts "---"
  end
end # task :post

desc "Launch preview environment"
task :preview do
  # --auto 是 Jekyll 2 的写法；本项目用 Jekyll 4，本地预览见 scripts/serve.cmd
  system "bundle exec jekyll serve --livereload"
end # task :preview
