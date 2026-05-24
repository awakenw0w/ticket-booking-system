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

## Проверка

```powershell
cd backend
php artisan test
```

Тесты проверяют структуру доменной БД, тестовые данные и связи между бронированиями, пользователями, категориями билетов и мероприятиями.

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

## Frontend

Пока frontend является минимальной стартовой страницей.

Откройте файл:

```text
frontend/index.html
```

Клиентский интерфейс и запросы к API будут доработаны на следующих этапах.

## Документация

- [Требования и MVP](docs/requirements.md)
- [Модель данных](docs/data-model.md)
- [Проект API](docs/api.md)
- [Черновик пояснительной записки](docs/01_ПЗ_бронирование_билетов_Быстров_Laravel.md)

## Структура проекта

```text
backend/   Laravel backend, миграции, модели, тесты
frontend/  стартовая клиентская страница
docs/      требования, модель данных, API и ПЗ
```

## Текущий этап

Этап 2: реализован backend API и CRUD для мероприятий, категорий билетов и бронирований.

Следующий этап: подключение frontend к API и реализация экранов MVP.
