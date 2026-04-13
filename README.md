# Ticket Booking System

Курсовой проект: информационная система бронирования и продажи билетов на мероприятия.

## Что внутри

- `backend/` — Laravel API/приложение (PHP + SQLite по умолчанию).
- `frontend/` — минимальная фронтенд-заглушка на HTML/CSS/JS.

## Технологии

- PHP 8.4+
- Laravel 13
- Composer 2
- SQLite (база по умолчанию)

## Быстрый запуск (минимально)

Команды для PowerShell:

```powershell
cd backend
composer install
Copy-Item .env.example .env -Force
php artisan key:generate
New-Item .\database\database.sqlite -ItemType File -Force | Out-Null
php artisan migrate
php artisan serve
```

После запуска откройте:

`http://127.0.0.1:8000`

## Режим разработки (backend + Vite)

```powershell
cd backend
npm install
composer run dev
```

Эта команда поднимает сразу несколько процессов (Laravel server, queue, logs, vite).

## Frontend-заглушка

Файл заглушки:

- `frontend/index.html`

Можно открыть напрямую в браузере или через любой простой статический сервер.

## Полезные команды

```powershell
cd backend
php artisan test
php artisan migrate:status
php artisan route:list
```

## Текущее состояние проекта

- Backend запускается и миграции применяются.
- Frontend пока в виде минимальной заглушки.
