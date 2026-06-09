@echo off
chcp 65001 > nul
title Ticket Booking System

set "PROJECT=%~dp0"

echo Ticket Booking System
echo.
echo Starting backend setup...
echo.

cd /d "%PROJECT%backend"
composer install --no-dev --no-interaction --no-progress --prefer-dist
copy .env.example .env /Y
php artisan key:generate --force
type nul > ".\database\database.sqlite"
php artisan migrate:fresh --seed --force

echo.
echo Starting backend server...
start "Ticket Booking Backend" cmd /k "cd /d "%PROJECT%backend" && php artisan serve --host=127.0.0.1 --port=8000"

timeout /t 3 /nobreak > nul

echo.
echo Starting frontend server...
start "Ticket Booking Frontend" cmd /k "cd /d "%PROJECT%frontend" && python -m http.server 5173 --bind 127.0.0.1"

echo.
echo ================================================
echo PROJECT STARTED
echo.
echo Open frontend in browser:
echo http://127.0.0.1:5173
echo.
echo Backend address:
echo http://127.0.0.1:8000
echo ================================================
echo.
echo Copy this link and open it in browser:
echo http://127.0.0.1:5173
echo.
pause
