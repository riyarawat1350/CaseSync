Write-Host "======================================================================" -ForegroundColor Cyan
Write-Host "          AICTE CaseSync (SIH 2026 - Problem Statement 26264)" -ForegroundColor Cyan
Write-Host "    Integrated Dashboard for Monitoring and Tracking Complaint Cases" -ForegroundColor Cyan
Write-Host "======================================================================" -ForegroundColor Cyan
Write-Host ""

$RootPath = $PSScriptRoot
Set-Location $RootPath

# 1. Check Python
$VenvPython = Join-Path $RootPath "backend\.venv\Scripts\python.exe"
if (Test-Path $VenvPython) {
    $PythonExe = $VenvPython
    Write-Host "[OK] Using virtual environment Python: $PythonExe" -ForegroundColor Green
} else {
    $SysPython = Get-Command python -ErrorAction SilentlyContinue
    if (-not $SysPython) {
        Write-Host "[ERROR] Python is not installed or not found in PATH." -ForegroundColor Red
        Pause
        Exit 1
    }
    $PythonExe = "python"
    Write-Host "[OK] Using system Python." -ForegroundColor Green
}

# 2. Check npm
$NpmCmd = Get-Command npm -ErrorAction SilentlyContinue
if (-not $NpmCmd) {
    Write-Host "[ERROR] Node.js / npm is not installed or not in PATH." -ForegroundColor Red
    Pause
    Exit 1
}
Write-Host "[OK] Node.js and npm detected." -ForegroundColor Green

# 3. Check frontend dependencies
$NodeModules = Join-Path $RootPath "frontend\node_modules"
if (-not (Test-Path $NodeModules)) {
    Write-Host "[INFO] Installing frontend dependencies..." -ForegroundColor Yellow
    Set-Location (Join-Path $RootPath "frontend")
    npm install
    Set-Location $RootPath
}

Write-Host ""
Write-Host "----------------------------------------------------------------------" -ForegroundColor DarkGray
Write-Host "Starting Services:" -ForegroundColor White
Write-Host "  - Backend:  FastAPI on http://127.0.0.1:8000" -ForegroundColor White
Write-Host "  - Docs:     Swagger UI on http://127.0.0.1:8000/docs" -ForegroundColor White
Write-Host "  - Frontend: Vite React on http://localhost:5173" -ForegroundColor White
Write-Host "----------------------------------------------------------------------" -ForegroundColor DarkGray
Write-Host ""

# 4. Launch Backend in separate window
Start-Process cmd.exe -ArgumentList "/k title AICTE CaseSync - Backend (FastAPI) && cd /d `"$RootPath`" && `"$PythonExe`" -m uvicorn main:app --app-dir backend --host 127.0.0.1 --port 8000 --reload"

# 5. Launch Frontend in separate window
Start-Process cmd.exe -ArgumentList "/k title AICTE CaseSync - Frontend (Vite) && cd /d `"$RootPath\frontend`" && npm run dev"

# 6. Wait 3 seconds
Start-Sleep -Seconds 3

# 7. Open browser
Write-Host "[INFO] Launching browser at http://localhost:5173" -ForegroundColor Cyan
Start-Process "http://localhost:5173"

Write-Host ""
Write-Host "======================================================================" -ForegroundColor Green
Write-Host "                    AICTE CaseSync is RUNNING!" -ForegroundColor Green
Write-Host "======================================================================" -ForegroundColor Green
Write-Host ""
Write-Host "  Demo Logins (Password for all: aicte@2026):" -ForegroundColor Yellow
Write-Host "    1. Senior Management: chairman" -ForegroundColor White
Write-Host "    2. Regulation Bureau: arvind.sharma" -ForegroundColor White
Write-Host "    3. PGRC Officer:     sunita.verma" -ForegroundColor White
Write-Host "    4. Regional Officer: m.sundaram" -ForegroundColor White
Write-Host ""
Write-Host "  URLs:" -ForegroundColor Yellow
Write-Host "    - Dashboard: http://localhost:5173" -ForegroundColor White
Write-Host "    - API Docs:  http://127.0.0.1:8000/docs" -ForegroundColor White
Write-Host ""
Write-Host "  [Tip] To stop the application, close the Backend and Frontend windows." -ForegroundColor DarkGray
Write-Host "======================================================================" -ForegroundColor Green
Write-Host ""
