@echo off
REM ============================================================
REM  本地 Jekyll 预览
REM  Ruby 由 Chocolatey 安装于 C:\tools\ruby34
REM  用法:  scripts\serve.cmd   (或直接双击)
REM ============================================================
setlocal

set "PATH=C:\tools\ruby34\bin;C:\tools\devkit\bin;%PATH%"

cd /d "%~dp0.."

echo.
echo   Ruby:
ruby -v
echo.
echo   正在启动 Jekyll，请看下面的 Server address
echo   停止: 按 Ctrl+C
echo.

bundle exec jekyll serve --livereload --host 127.0.0.1 --port 4000

endlocal
