@echo off
setlocal
title GenesisCore Foundation - Start & Tunnel

echo ========================================================
echo   GenesisCore Foundation - One-Click Start ^& Tunnel
echo ========================================================
echo.

:: 1. Start both Frontend (8081) and Backend (3000)
echo [1/3] Iniciando Servidor (API) e Frontend (Dashboard)...
:: Usamos o script dev:all que ja roda o concurrently
start /b cmd /c "npm run dev:all"

:: 2. Wait for systems to be ready
echo [2/3] Aguardando inicializacao dos servicos (10 segundos)...
timeout /t 10 /nobreak > nul

:: 3. Initializing Cloudflare Tunnel
echo [3/3] Criando tunel Cloudflare para o Dashboard (Porta 8081)...
echo.
echo --------------------------------------------------------
echo IMPORTANTE: Copie a URL ".trycloudflare.com" gerada abaixo.
echo Acesse essa URL de qualquer lugar para ver o Dashboard.
echo --------------------------------------------------------
echo.

:: Expondo o frontend (8081) por default para visualizacao remota
npx cloudflared tunnel --url http://localhost:8081

echo.
echo Servidor encerrado ou tunel fechado.
pause
