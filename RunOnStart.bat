@echo off
REM change to your project folder
cd /d "E:\Code\CAH clone"

REM open three separate PowerShell windows, minimized
start "Frontend" /min powershell -NoExit -Command "Set-Location 'E:\Code\CAH clone'; node FrontendServer.js"
start "Websocket" /min powershell -NoExit -Command "Set-Location 'E:\Code\CAH clone'; node Websocket.js"
start "Cloudflared" /min powershell -NoExit -Command "Set-Location 'E:\Code\CAH clone'; cloudflared tunnel run cahbyben"

exit
