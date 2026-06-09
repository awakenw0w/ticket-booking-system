@echo off
chcp 65001 > nul
title Ticket Booking System launcher

set "PROJECT=%~dp0"
set "BACKEND=%PROJECT%backend"
set "FRONTEND=%PROJECT%frontend"

echo ================================================
echo Ticket Booking System
echo Automatic project launcher
echo ================================================
echo.

if not exist "%BACKEND%" (
    echo Error: backend folder was not found:
    echo %BACKEND%
    pause
    exit /b 1
)

if not exist "%FRONTEND%" (
    echo Error: frontend folder was not found:
    echo %FRONTEND%
    pause
    exit /b 1
)

cd /d "%BACKEND%"

echo [1/6] Checking PHP dependencies...
if not exist "%BACKEND%\vendor" (
    echo vendor folder was not found. Running composer install...
    composer install --no-interaction --no-progress
    if errorlevel 1 (
        echo composer install failed.
        pause
        exit /b 1
    )
) else (
    echo PHP dependencies are already installed.
)

echo.
echo [2/6] Checking .env file...
set "NEED_KEY=0"
if not exist "%BACKEND%\.env" (
    copy "%BACKEND%\.env.example" "%BACKEND%\.env" > nul
    set "NEED_KEY=1"
    echo .env file has been created.
) else (
    echo .env file already exists.
)

echo.
echo [3/6] Checking application key...
if "%NEED_KEY%"=="1" (
    php artisan key:generate --force
) else (
    findstr /C:"APP_KEY=base64:" "%BACKEND%\.env" > nul
    if errorlevel 1 (
        php artisan key:generate --force
    ) else (
        echo APP_KEY is already set.
    )
)

echo.
echo [4/6] Checking SQLite database...
set "FIRST_RUN=0"
if not exist "%BACKEND%\database\database.sqlite" (
    type nul > "%BACKEND%\database\database.sqlite"
    set "FIRST_RUN=1"
    echo database.sqlite file has been created.
) else (
    echo database.sqlite file already exists.
)

echo.
echo [5/6] Running database migrations...
if "%FIRST_RUN%"=="1" (
    echo First run: creating database structure and loading demo data.
    php artisan migrate:fresh --seed --force
) else (
    echo Regular run: applying new migrations without deleting data.
    php artisan migrate --force
)

if errorlevel 1 (
    echo Database migration failed.
    pause
    exit /b 1
)

echo.
echo [6/6] Starting servers...

start "Ticket Booking Backend 8000" cmd /k "cd /d "%BACKEND%" && php artisan serve --host=127.0.0.1 --port=8000"

timeout /t 3 /nobreak > nul

start "Ticket Booking Frontend 5173" cmd /k "cd /d "%FRONTEND%" && python -m http.server 5173 --bind 127.0.0.1"

echo.
echo ================================================
echo Project is starting.
echo.
echo Frontend:
echo http://127.0.0.1:5173
echo.
echo Backend:
echo http://127.0.0.1:8000
echo.
echo API:
echo http://127.0.0.1:8000/api/events
echo ================================================
echo.
echo Open in browser:
echo http://127.0.0.1:5173
echo.
echo To stop the project, close the two opened windows:
echo Ticket Booking Backend 8000
echo Ticket Booking Frontend 5173
echo.
pause
