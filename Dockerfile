# Используем официальный образ Python (slim-версия для меньшего размера)
FROM python:3-slim

# Рабочая директория внутри контейнера
WORKDIR /app

# Копируем файл зависимостей
COPY requirements.txt .

# Устанавливаем зависимости
RUN pip install --no-cache-dir -r requirements.txt

# Копируем весь проект
COPY . .

# Создаём директорию для базы данных и даём права на запись
RUN mkdir -p /app/data && chmod 777 /app/data

# Открываем порт
EXPOSE 5001

# Команда запуска
CMD ["python", "app.py"]
