@echo off

set "PROJECT=%~dp0"

pushd "%PROJECT%backend"
call composer install
copy /Y .env.example .env
php artisan key:generate
type nul > "database\database.sqlite"
php artisan migrate:fresh --seed
popd

start "Backend" /D "%PROJECT%backend" cmd /k php artisan serve --host=127.0.0.1 --port=8000
start "Frontend" /D "%PROJECT%frontend" cmd /k python -m http.server 5173 --bind 127.0.0.1

echo.
echo PROJECT STARTED
echo FRONTEND URL:
echo http://127.0.0.1:5173
echo.
pause
