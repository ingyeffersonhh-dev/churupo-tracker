@echo off
echo ==============================================
echo   Sistema de Gastos Personales - FinanzasVE
echo ==============================================
echo.

REM Verificar que el backend esta corriendo
echo [1/2] Iniciando Bot de Telegram...
cd /d "%~dp0telegram_bot"
start "Bot Telegram" cmd /k "venv_bot\Scripts\python.exe bot.py"

echo.
echo [OK] Bot iniciado en una ventana separada.
echo.
echo RECUERDA:
echo  - El backend debe estar corriendo en http://localhost:8000
echo  - El frontend en http://localhost:3000
echo  - El bot escucha en Telegram 24/7 mientras esta abierta la ventana
echo.
pause
