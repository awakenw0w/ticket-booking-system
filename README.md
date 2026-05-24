# Ticket Booking System

Курсовой проект: информационная система бронирования и продажи билетов на мероприятия с различными видами билетов.

Автор: Быстров Егор, группа 3-1ИС.

## Стек

- PHP 8.4+
- Laravel 13
- Composer 2
- SQLite
- HTML, CSS, JavaScript
- GitHub

## Быстрый запуск backend

```powershell
git clone https://github.com/awakenw0w/ticket-booking-system.git
cd ticket-booking-system\backend

composer install
Copy-Item .env.example .env -Force
php artisan key:generate

New-Item .\database\database.sqlite -ItemType File -Force | Out-Null
php artisan migrate:fresh --seed

php artisan serve --host=127.0.0.1 --port=8000
```

Адрес backend:

```text
http://127.0.0.1:8000/
```

## Быстрый запуск frontend

Во втором терминале:

```powershell
cd ticket-booking-system\frontend
python -m http.server 5173 --bind 127.0.0.1
```

Адрес frontend:

```text
http://127.0.0.1:5173/
```

Frontend подключается к API `http://127.0.0.1:8000/api`.

## Проверка

```powershell
cd backend
php artisan test
```

Тесты проверяют структуру доменной БД, тестовые данные, связи моделей и CRUD API.

## API

После запуска backend доступны маршруты:

- `GET|POST /api/events`
- `GET|PATCH|DELETE /api/events/{event}`
- `GET|POST /api/events/{event}/ticket-categories`
- `GET|PATCH|DELETE /api/ticket-categories/{ticketCategory}`
- `GET|POST /api/bookings`
- `GET|PATCH|DELETE /api/bookings/{booking}`
- `PATCH /api/bookings/{booking}/cancel`
- `PATCH /api/bookings/{booking}/pay`
- `GET /api/reports/bookings`
- `GET /api/reports/revenue`
- `GET /api/reports/events-occupancy`

## Frontend

Клиентский интерфейс реализует MVP:

- просмотр списка мероприятий;
- просмотр деталей выбранного мероприятия;
- просмотр и добавление категорий билетов;
- создание бронирования;
- просмотр журнала бронирований;
- отмена и отметка оплаты активного бронирования.
- отчеты по бронированиям, выручке и заполненности мероприятий.

## Документация

- [Требования и MVP](docs/requirements.md)
- [Модель данных](docs/data-model.md)
- [Проект API](docs/api.md)
- [Черновик пояснительной записки](docs/01_ПЗ_бронирование_билетов_Быстров_Laravel.md)
- [Руководство пользователя](docs/user-guide.md)
- [Инструкция по развертыванию](docs/admin-deployment-guide.md)
- [Чек-лист тестирования](docs/testing-checklist.md)
- [Структура презентации](docs/presentation-plan.md)

## Структура проекта

```text
backend/   Laravel backend, миграции, модели, API, тесты
frontend/  клиентский интерфейс MVP
docs/      требования, модель данных, API, ПЗ и руководства
```

## Текущий этап

Этап 5: подготовлен документационный пакет для курсовой работы.

Следующий этап: финальная проверка проекта перед защитой.
