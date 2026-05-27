// Получение ID номинации из URL
const urlParams = new URLSearchParams(window.location.search);
const nominationId = urlParams.get('id') || 'default';

// Используем относительный URL для работы в любой среде
const API_URL = '';  // Пустая строка означает текущий домен/порт

const nominationNames = {
    'zvezdnyy-lider': 'Звёздный лидер',
    'zvezdnyy-nastavnik': 'Звёздный наставник',
    'zvezdnyy-partner': 'Звёздный партнёр',
    'zvezdnyy-aktiv': 'Звёздный актив',
    'zvezdnaya-stsena': 'Звёздная сцена',
    'zvezdnaya-podderzhka': 'Звёздная поддержка',
    'zvezdnyy-start': 'Звёздный старт',
    'zvezdnoe-stremlenie': 'Звёздное стремление',
    'zvezdnoe-masterstvo': 'Звёздное мастерство',
    'zvezdnyy-intellekt': 'Звёздный интеллект',
    'zvezdnyy-vypusknik': 'Звёздный выпускник',
    'zvezdnoe-solo': 'Звёздное соло',
    'zvezdnoe-design': 'Звёздный дизайн',
    'zvezdnyy-humor': 'Звёздный юмор',
    'zvezdnaya-couple': 'Звёздная пара',
    'zvezdnyy-gesture': 'Звёздный жест',
    'zvezdnyy-vocals': 'Звёздный вокал',
    'zvezdnoe-word': 'Звёздное слово',
    'zvezdnoe-stylus': 'Звёздное перо',
    'zvezdnaya-role': 'Звёздная роль',
    'zvezdnyy-dance': 'Звёздный танец',
    'zvezdnyy-group': 'Звёздный коллектив',
    'zvezdnyy-lens': 'Звёздный объектив',
    'zvezdnoe-cool': 'Звёздный классный',
    'zvezdnoe-parent': 'Звёздный родитель',
    'zvezdnoe-nastavnik': 'Звёздный наставник',
    'zvezdnoe-stsena': 'Звёздная сцена'
};

// Переменные состояния
let currentPhotoData = '';
let editingEntryId = null;

// Загрузка записей при старте
document.addEventListener('DOMContentLoaded', function() {
    // Проверка авторизации
    if (localStorage.getItem('isAdmin') !== 'true') {
        alert('Доступ запрещён! Требуется авторизация.');
        window.location.href = 'login.html';
        return;
    }

    const titleElement = document.getElementById('nominationTitle');
    if (titleElement) {
        titleElement.textContent = nominationNames[nominationId] || 'Номинация';
    }
    loadEntries();
});

// Показать форму добавления
function showAddForm() {
    document.getElementById('formCard').style.display = 'block';
    document.getElementById('formTitle').textContent = 'Добавить новую запись';
    document.getElementById('saveButtonText').textContent = 'Добавить';
    editingEntryId = null;
    clearForm();
}

// Открыть папку на сервере
function openServerFolder() {
    window.open('https://vm-ftp.anosov.ru/vm/%d0%9f%d0%b0%d1%80%d0%b0%d0%b4%20%d0%97%d0%b2%d1%91%d0%b7%d0%b4!/', '_blank');
}

// Загрузка фото по URL
function loadPhotoFromUrl() {
    const url = document.getElementById('photoUrlInput').value.trim();
    
    if (!url) {
        alert('Пожалуйста, вставьте ссылку на изображение');
        return;
    }
    
    // Сохраняем URL и показываем предпросмотр
    currentPhotoData = url;
    document.getElementById('previewImg').src = url;
    document.getElementById('photoPreview').style.display = 'block';
}

// Сохранение записи
async function saveEntry() {
    const description = document.getElementById('descriptionInput').value.trim();
    
    if (!currentPhotoData || !description) {
        alert('Пожалуйста, заполните все поля');
        return;
    }
    
    const entry = {
        id: editingEntryId || Date.now().toString(),
        nominationId: nominationId,
        photo: currentPhotoData,
        description: description
    };
    
    try {
        const response = await fetch(`${API_URL}/api/entries`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(entry)
        });
        
        if (!response.ok) {
            throw new Error('Ошибка при сохранении');
        }
        
        await loadEntries();
        cancelForm();
        alert('Запись успешно сохранена!');
    } catch (error) {
        console.error('Ошибка:', error);
        alert('Ошибка при сохранении записи. Проверьте, запущен ли сервер Python (python app.py)');
    }
}

// Отмена формы
function cancelForm() {
    document.getElementById('formCard').style.display = 'none';
    clearForm();
}

// Очистка формы
function clearForm() {
    document.getElementById('photoUrlInput').value = '';
    document.getElementById('descriptionInput').value = '';
    document.getElementById('photoPreview').style.display = 'none';
    currentPhotoData = '';
    editingEntryId = null;
}

// Редактирование записи
async function editEntry(entryId) {
    try {
        const entries = await getEntries();
        const entry = entries.find(e => e.id === entryId);
        
        if (!entry) return;
        
        editingEntryId = entryId;
        currentPhotoData = entry.photo;
        
        document.getElementById('photoUrlInput').value = entry.photo;
        document.getElementById('descriptionInput').value = entry.description;
        document.getElementById('previewImg').src = entry.photo;
        document.getElementById('photoPreview').style.display = 'block';
        
        document.getElementById('formTitle').textContent = 'Редактировать запись';
        document.getElementById('saveButtonText').textContent = 'Сохранить изменения';
        document.getElementById('formCard').style.display = 'block';
        
        document.getElementById('formCard').scrollIntoView({ behavior: 'smooth' });
    } catch (error) {
        console.error('Ошибка:', error);
        alert('Ошибка при загрузке записи для редактирования');
    }
}

// Удаление записи
async function deleteEntry(entryId) {
    if (!confirm('Вы уверены, что хотите удалить эту запись?')) {
        return;
    }
    
    try {
        const response = await fetch(`${API_URL}/api/entries/${entryId}`, {
            method: 'DELETE'
        });
        
        if (!response.ok) {
            throw new Error('Ошибка при удалении');
        }
        
        await loadEntries();
        alert('Запись успешно удалена!');
    } catch (error) {
        console.error('Ошибка:', error);
        alert('Ошибка при удалении записи');
    }
}

// Получение записей с сервера
async function getEntries() {
    try {
        const response = await fetch(`${API_URL}/api/entries/${nominationId}`);
        if (!response.ok) {
            throw new Error('Ошибка при загрузке');
        }
        return await response.json();
    } catch (error) {
        console.error('Ошибка:', error);
        return [];
    }
}

// Загрузка и отображение записей
async function loadEntries() {
    const entries = await getEntries();
    const entriesList = document.getElementById('entriesList');
    const emptyState = document.getElementById('emptyState');
    
    if (!entriesList || !emptyState) return;
    
    if (entries.length === 0) {
        emptyState.style.display = 'block';
        const cards = entriesList.querySelectorAll('.entry-card');
        cards.forEach(card => card.remove());
        return;
    }
    
    emptyState.style.display = 'none';
    
    const cards = entriesList.querySelectorAll('.entry-card');
    cards.forEach(card => card.remove());
    
    entries.forEach(entry => {
        const card = createEntryCard(entry);
        entriesList.appendChild(card);
    });
}

// Создание карточки записи
function createEntryCard(entry) {
    const card = document.createElement('div');
    card.className = 'entry-card';
    
    const photoUrl = entry.photo || '';
    const description = escapeHtml(entry.description || '');
    const entryId = entry.id || '';
    
    card.innerHTML = `
        <div class="entry-content">
            <div class="entry-photo">
                <img src="${photoUrl}" alt="Фото" onerror="this.src='https://via.placeholder.com/300?text=Фото+не+загружено'">
            </div>
            <div class="entry-details">
                <p class="entry-description">${description}</p>
                <div class="entry-actions">
                    <button class="btn btn-edit" onclick="editEntry('${entryId}')">
                        <span class="icon">✏️</span> Редактировать
                    </button>
                    <button class="btn btn-delete" onclick="deleteEntry('${entryId}')">
                        <span class="icon">🗑️</span> Удалить
                    </button>
                </div>
            </div>
        </div>
    `;
    
    return card;
}

// Экранирование HTML
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
