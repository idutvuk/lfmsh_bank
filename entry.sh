#!/usr/bin/env bash
# if error occures check if file has LF line endings
set -euo pipefail

echo "Ожидание запуска базы данных..."
until uv run manage.py migrate --noinput; do
  >&2 echo "$(date +'%Y-%m-%d %H:%M:%S') – база не доступна, повтор через 3 сек..."
  sleep 3
done
echo "База данных запущена."
uv run manage.py collectstatic --noinput
uv run manage.py makemigrations
uv run manage.py migrate --noinput
uv run manage.py add_static_data
cp meta_files/users_data/student_example_short.csv meta_files/users_data/student.csv
cp meta_files/users_data/staff_example_short.csv   meta_files/users_data/staff.csv
uv run manage.py add_users \
  --staff=staff.csv \
  --student=student.csv \
  --student_out=student_out.txt \
  --staff_out=staff_out.txt \
  --yes
uv run manage.py collectstatic --noinput
uv run manage.py runserver 0.0.0.0:8000
