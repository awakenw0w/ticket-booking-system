@echo off
chcp 65001 > nul

cd /d "%~dp0backend"
call composer install
copy .env.example .env /Y
php artisan key:generate
type nul > ".\database\database.sqlite"
php artisan migrate:fresh --seed

start "Backend" cmd /k "cd /d ""%~dp0backend"" && php artisan serve --host=127.0.0.1 --port=8000"
start "Frontend" cmd /k "cd /d ""%~dp0frontend"" && python -m http.server 5173 --bind 127.0.0.1"

echo.
echo Проект запущен.
echo Открой в браузере:
echo http://127.0.0.1:5173
echo.
pause
