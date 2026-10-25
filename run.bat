@echo off
title AICTE CaseSync - Launcher

echo ======================================================================
echo           AICTE CaseSync (SIH 2026 - Problem Statement 26264)
echo     Integrated Dashboard for Monitoring and Tracking Complaint Cases
echo ======================================================================
echo.

cd /d "%~dp0"

REM Check Python executable
set PYTHON_EXE=backend\.venv\Scripts\python.exe

if exist "%PYTHON_EXE%" goto python_found

where python >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Python is not installed or not in PATH. Please install Python 3.10+.
    pause
    exit /b 1
)
set PYTHON_EXE=python
echo [OK] Using system Python.
goto check_node

:python_found
echo [OK] Using virtual environment Python: %PYTHON_EXE%

:check_node
where npm >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] npm or Node.js is not found in PATH. Please install Node.js 18+.
    pause
    exit /b 1
)
echo [OK] Node.js and npm detected.

if not exist "frontend\node_modules" (
    echo [INFO] Installing frontend packages
    cd frontend
    call npm install
    cd /d "%~dp0"
)

echo.
echo ----------------------------------------------------------------------
echo Starting Services:
echo   - Backend:  FastAPI on http://127.0.0.1:8000
echo   - Docs:     Swagger UI on http://127.0.0.1:8000/docs
echo   - Frontend: Vite React on http://localhost:5173
echo ----------------------------------------------------------------------
echo.

REM Launch Backend in a separate window
start "AICTE CaseSync - Backend (FastAPI)" cmd /k "cd /d "%~dp0" && "%PYTHON_EXE%" -m uvicorn main:app --app-dir backend --host 127.0.0.1 --port 8000 --reload"

REM Launch Frontend in a separate window
start "AICTE CaseSync - Frontend (Vite)" cmd /k "cd /d "%~dp0frontend" && npm run dev"

REM Wait 3 seconds before opening browser
ping -n 4 127.0.0.1 >nul

REM Open browser
echo [INFO] Launching browser at http://localhost:5173
start http://localhost:5173

echo.
echo ======================================================================
echo                     AICTE CaseSync is RUNNING
echo ======================================================================
echo.
echo   Demo Logins - Password for all: aicte@2026
echo     1. Senior Management: chairman
echo     2. Regulation Bureau: arvind.sharma
echo     3. PGRC Officer:     sunita.verma
echo     4. Regional Officer: m.sundaram
echo.
echo   URLs:
echo     - Dashboard: http://localhost:5173
echo     - API Docs:  http://127.0.0.1:8000/docs
echo.
echo   [Tip] To stop the application, close the Backend and Frontend
echo         command prompt windows.
echo ======================================================================
echo.
pause
