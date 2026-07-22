@echo off
taskkill /F /IM node.exe 2>nul
taskkill /F /IM python.exe 2>nul
echo STOPPED > c:\kill_result.txt
netstat -ano | findstr "LISTENING" | findstr ":3000 :3001 :8000" >> c:\kill_result.txt 2>&1
echo END >> c:\kill_result.txt
