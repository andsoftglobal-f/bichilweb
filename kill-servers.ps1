$ErrorActionPreference = 'SilentlyContinue'
$results = @()

# Find processes on target ports
$conns = Get-NetTCPConnection -LocalPort 3000,3001,8000 -State Listen -ErrorAction SilentlyContinue
foreach ($c in $conns) {
    $proc = Get-Process -Id $c.OwningProcess -ErrorAction SilentlyContinue
    $results += "Port $($c.LocalPort) -> PID $($c.OwningProcess) ($($proc.ProcessName))"
    Stop-Process -Id $c.OwningProcess -Force -ErrorAction SilentlyContinue
    $results += "  -> Killed PID $($c.OwningProcess)"
}

# Also kill any remaining node/python
Get-Process -Name node -ErrorAction SilentlyContinue | ForEach-Object {
    Stop-Process -Id $_.Id -Force
    $results += "Killed node PID $($_.Id)"
}
Get-Process -Name python -ErrorAction SilentlyContinue | ForEach-Object {
    Stop-Process -Id $_.Id -Force
    $results += "Killed python PID $($_.Id)"
}

if ($results.Count -eq 0) {
    $results += "No server processes found"
}

$results | Out-File "c:\kill_result.txt" -Force
