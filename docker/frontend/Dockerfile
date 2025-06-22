# Используем официальный Node.js с pnpm
FROM node:20-alpine

# Устанавливаем pnpm глобально
RUN npm install -g pnpm

# Создаём рабочую директорию
WORKDIR /app

# Копируем манифесты для установки зависимостей
COPY package.json pnpm-lock.yaml* ./

# Опционально: если у вас .npmrc в корне проекта
COPY .npmrc ./

# Устанавливаем зависимости (hoisted mode для exFAT-дисков)
RUN pnpm config set node-linker hoisted \
 && pnpm install

# Копируем весь исходный код
COPY . .

# Запускаем dev-сервер
CMD ["pnpm", "run", "dev", "--host"]
