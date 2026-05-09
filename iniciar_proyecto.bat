@echo off
color 0A
echo ==============================================
echo       Iniciando Churupo Tracker
echo ==============================================
echo.

echo [1/3] Iniciando el Servidor Backend (FastAPI)...
start "Backend - Churupo Tracker" cmd /k "cd /d %~dp0backend && ..\venv\Scripts\python.exe -m uvicorn main:app --port 8000"
timeout /t 3 /nobreak > nul

echo [2/3] Iniciando la Pagina Web (Next.js)...
start "Frontend - Churupo Tracker" cmd /k "cd /d %~dp0frontend && npm run dev"
timeout /t 3 /nobreak > nul

echo [3/3] Iniciando el Bot de Telegram...
start "Telegram Bot - Churupo Tracker" cmd /k "cd /d %~dp0telegram_bot && venv_bot\Scripts\python.exe bot.py"
timeout /t 3 /nobreak > nul

echo.
echo ==============================================
echo [OK] Todos los servicios han sido iniciados en ventanas separadas.
echo.
echo En unos segundos, se abrira tu navegador web...
echo Si no se abre automaticamente, ingresa a: http://localhost:3000
echo ==============================================
echo.
timeout /t 5 /nobreak > nul
start http://localhost:3000
