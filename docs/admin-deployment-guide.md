# Руководство администратора и инструкция по развертыванию

Документ описывает локальное развертывание проекта для проверки, демонстрации и защиты курсовой работы.

## Требования к окружению

На компьютере должны быть установлены:

- Git;
- PHP 8.4 или выше;
- Composer 2;
- Python 3 для запуска статического frontend;
- браузер;
- доступ к репозиторию GitHub.

Проверка версий:

```powershell
git --version
php -v
composer --version
python --version
```

## Получение проекта

```powershell
git clone https://github.com/awakenw0w/ticket-booking-system.git
cd ticket-booking-system
```

Для проверки текущей ветки:

```powershell
git status --short --branch
```

## Настройка backend

Перейти в папку backend:

```powershell
cd backend
```

Установить зависимости:

```powershell
composer install
```

Создать `.env`:

```powershell
Copy-Item .env.example .env -Force
```

Создать ключ приложения:

```powershell
php artisan key:generate
```

Создать SQLite-файл:

```powershell
New-Item .\database\database.sqlite -ItemType File -Force | Out-Null
```

Выполнить миграции и загрузить тестовые данные:

```powershell
php artisan migrate:fresh --seed
```

Запустить backend:

```powershell
php artisan serve --host=127.0.0.1 --port=8000
```

Адрес backend:

```text
http://127.0.0.1:8000/
```

## Запуск frontend

Открыть второй терминал из корня проекта:

```powershell
cd frontend
python -m http.server 5173 --bind 127.0.0.1
```

Адрес frontend:

```text
http://127.0.0.1:5173/
```

## Проверка API

После запуска backend можно открыть:

```text
http://127.0.0.1:8000/api/events
http://127.0.0.1:8000/api/bookings
http://127.0.0.1:8000/api/reports/bookings
```

Если отображается JSON, backend работает.

## Автоматические тесты

Из папки `backend`:

```powershell
php artisan test
```

Ожидаемый результат: все тесты проходят успешно.

В текущей версии проверяются:

- структура БД;
- тестовые данные;
- связи моделей;
- CRUD API;
- создание, отмена и оплата бронирований;
- отчеты по бронированиям, выручке и заполненности.

## Проверка frontend

1. Открыть `http://127.0.0.1:5173/`.
2. Проверить статус `API доступен`.
3. Выбрать мероприятие.
4. Проверить категории билетов.
5. Создать тестовое бронирование.
6. Отменить или оплатить бронирование.
7. Проверить блок отчетов.

## Типовые проблемы

| Ошибка | Возможная причина | Решение |
| --- | --- | --- |
| `Class not found` | Не установлены зависимости | Выполнить `composer install` |
| `No application encryption key` | Не создан `APP_KEY` | Выполнить `php artisan key:generate` |
| Ошибка подключения к БД | Нет SQLite-файла | Создать `database/database.sqlite` |
| Пустой список мероприятий | Не загружены seed-данные | Выполнить `php artisan migrate:fresh --seed` |
| Frontend не получает данные | Backend не запущен | Запустить `php artisan serve` |
| Порт занят | Уже работает другой процесс | Остановить процесс или выбрать другой порт |

## Резервное восстановление демонстрационной БД

Если во время демонстрации данные были изменены, можно вернуть исходные тестовые данные:

```powershell
cd backend
php artisan migrate:fresh --seed
```

Команда удаляет текущие локальные данные и заново создает демонстрационную базу.

## Структура проекта

```text
backend/
  app/Http/Controllers/Api/  API-контроллеры
  app/Models/                модели предметной области
  database/migrations/       структура БД
  database/seeders/          тестовые данные
  tests/Feature/             feature-тесты

frontend/
  index.html                 структура интерфейса
  style.css                  оформление
  app.js                     работа с API

docs/
  requirements.md            требования и MVP
  data-model.md              модель данных
  api.md                     описание API
  user-guide.md              руководство пользователя
  admin-deployment-guide.md  инструкция развертывания
```

## Контрольный список перед защитой

- Репозиторий доступен на GitHub.
- Ветки этапов запушены.
- Backend запускается на `127.0.0.1:8000`.
- Frontend запускается на `127.0.0.1:5173`.
- `php artisan test` проходит без ошибок.
- В БД есть тестовые мероприятия, категории и бронирования.
- В интерфейсе отображаются отчеты.
- README и документы в `docs` актуальны.
