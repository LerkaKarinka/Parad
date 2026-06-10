# Используем официальный образ Python
FROM python:3.9-slim

# Устанавливаем рабочую директорию внутри контейнера
WORKDIR /app

# Копируем файл зависимостей и устанавливаем их
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Копируем всё содержимое проекта в контейнер
COPY . .

# Создаём директорию для базы данных (будет использоваться, если не смонтирован том)
RUN mkdir -p /app/data

# Переменные окружения
ENV DB_PATH=/app/data/parad.db
ENV PYTHONUNBUFFERED=1

# Открываем порт, который слушает приложение
EXPOSE 5001

# Запускаем приложение
CMD ["python", "app.py"]
