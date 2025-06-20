#!/usr/bin/env bash
set -euo pipefail

# Ждём, пока БД не ответит на migrate
echo "Ожидание запуска базы данных..."
until uv run manage.py migrate --noinput; do
  >&2 echo "$(date +'%Y-%m-%d %H:%M:%S') – база не доступна, повтор через 3 сек..."
  sleep 3
done
echo "База данных запущена."

# Сбор статических файлов без ввода
uv run manage.py collectstatic --noinput

# Генерация миграций
uv run manage.py makemigrations

# Применение миграций
uv run manage.py migrate --noinput

# Загрузка статических данных
uv run manage.py add_static_data

# Копирование примеров CSV в реальные файлы
cp meta_files/users_data/student_example.csv meta_files/users_data/student.csv
cp meta_files/users_data/staff_example.csv   meta_files/users_data/staff.csv

# Добавление пользователей
uv run manage.py add_users \
  --staff=staff.csv \
  --student=student.csv \
  --student_out=student_out.txt \
  --staff_out=staff_out.txt \
  --yes

# Ещё раз собираем статику (если в add_users что-то нового появилось)
uv run manage.py collectstatic --noinput

# Запуск дев-сервера на 0.0.0.0:8000
uv run manage.py runserver 0.0.0.0:8000
