# Start all 3 servers
$root = Split-Path -Parent $MyInvocation.MyCommand.Path

# Kill old processes
taskkill /F /IM node.exe 2>$null
taskkill /F /IM python.exe 2>$null
Start-Sleep 2

# Start Backend (Django)
Start-Process cmd -ArgumentList "/c cd /d `"$root\bichilweb_backend`" && `"$root\.venv\Scripts\python.exe`" manage.py runserver 0.0.0.0:8000" -WindowStyle Normal

# Start Frontend (Next.js port 3000)
Start-Process cmd -ArgumentList "/c cd /d `"$root\bichilweb`" && npm run dev" -WindowStyle Normal

# Start Admin (Next.js port 3001)
Start-Process cmd -ArgumentList "/c cd /d `"$root\bichilweb_admin`" && npm run dev" -WindowStyle Normal

Write-Host "All 3 servers starting..."
Write-Host "Backend:  http://localhost:8000"
Write-Host "Frontend: http://localhost:3000"
Write-Host "Admin:    http://localhost:3001"
