@echo off
title TRETIS Server
color 0F
echo.
echo  --- TRETIS server ---
echo.
echo   ** Close this window to close the server **
echo ! DO NOT FORGET TO CHANGE THE IP IN serverSettings.js !
echo.
echo Starting server ...
echo.
powershell "node server.js | tee log.txt"
PAUSE
