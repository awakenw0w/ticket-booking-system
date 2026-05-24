# Ticket Booking System

Курсовой проект: информационная система бронирования и продажи билетов на мероприятия.

## Основные возможности

- создание и просмотр мероприятий;
- категории билетов с ценой и количеством мест;
- бронирование билетов клиентом;
- отмена бронирования и отметка оплаты;
- отчеты по бронированиям, выручке и заполненности мероприятий.

## Стек

- PHP 8.3+
- Laravel 13
- Composer
- SQLite
- HTML, CSS, JavaScript
- Vercel для статического frontend-деплоя

## Структура проекта

```text
backend/   Laravel API, база данных, миграции, seed-данные и тесты
frontend/  клиентский интерфейс на HTML, CSS и JavaScript
```

## Запуск backend

```powershell
cd backend
composer install
Copy-Item .env.example .env -Force
php artisan key:generate
New-Item .\database\database.sqlite -ItemType File -Force | Out-Null
php artisan migrate:fresh --seed
php artisan serve --host=127.0.0.1 --port=8000
```

Backend будет доступен по адресу:

```text
http://127.0.0.1:8000
```

## Запуск frontend

Во втором терминале:

```powershell
cd frontend
python -m http.server 5173 --bind 127.0.0.1
```

Frontend будет доступен по адресу:

```text
http://127.0.0.1:5173
```

## Проверка

```powershell
cd backend
php artisan test
```

Frontend использует API по адресу `http://127.0.0.1:8000/api`.

## Сборка frontend для Vercel

```powershell
npm install
npm run build
```
