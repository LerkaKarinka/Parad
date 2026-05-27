# Используем официальный образ Python (slim для уменьшения размера)
FROM python:3.11-slim

# Рабочая директория внутри контейнера
WORKDIR /app

# Копируем только файл зависимостей для ускорения сборки
COPY requirements.txt .

# Устанавливаем зависимости
RUN pip install --no-cache-dir -r requirements.txt

# Копируем весь проект
COPY . .

# Открываем порт для Flask
EXPOSE 5001

# Команда для запуска приложения
CMD ["python app.py", "app.py"]
