# Ticket Booking System

Курсовой проект "Разработка информационной системы бронирования и продажи доступа на концертные мероприятия с различными категориями зон."

## Что нужно установить

- Git
- PHP 8.4+
- Composer 2
- Node.js 20+ (только если нужен режим `composer run dev`)

## Быстрый запуск на вашем ПК

```powershell
git clone <URL_ВАШЕГО_РЕПОЗИТОРИЯ>
cd ticket-booking-system\backend

composer install
Copy-Item .env.example .env -Force
php artisan key:generate

New-Item .\database\database.sqlite -ItemType File -Force | Out-Null
php artisan migrate

php artisan serve --host=127.0.0.1 --port=8000
```

Откройте backend:

`http://127.0.0.1:8000/`

## Frontend

Откройте `frontend/index.html` в браузере и нажмите кнопку «Открыть backend».
