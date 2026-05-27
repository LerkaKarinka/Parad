const API_URL = 'http://192.168.3.78:5001';  // ИЗМЕНЕНО: порт 5000 для Python

// Переменные состояния
let currentScenarioData = null;
let currentScenarioFileName = '';

// Загрузка сценариев при старте
document.addEventListener('DOMContentLoaded', function() {
    loadScenarios();
    
    // Проверка авторизации
    if (localStorage.getItem('isAdmin') !== 'true') {
        alert('Доступ запрещён! Требуется авторизация.');
        window.location.href = 'login.html';
    }
});

// Показать форму добавления
function showAddScenarioForm() {
    document.getElementById('scenarioFormCard').style.display = 'block';
    clearScenarioForm();
}

// Открыть папку на сервере
function openServerFolder() {
    window.open('https://vm-ftp.anosov.ru/vm/%d0%9f%d0%b0%d1%80%d0%b0%d0%b4%20%d0%97%d0%b2%d1%91%d0%b7%d0%b4!/', '_blank');
}

// Загрузка сценария по URL
function loadScenarioFromUrl() {
    const url = document.getElementById('scenarioUrlInput').value.trim();
    
    if (!url) {
        alert('Пожалуйста, вставьте ссылку на файл');
        return;
    }
    
    // Извлекаем имя файла из URL
    const urlParts = url.split('/');
    const fileName = decodeURIComponent(urlParts[urlParts.length - 1]);
    
    // Сохраняем URL файла
    currentScenarioFileName = fileName;
    currentScenarioData = url;
    
    document.getElementById('fileName').textContent = fileName;
    document.getElementById('filePreview').style.display = 'block';
}

// Сохранение сценария
async function saveScenario() {
    const name = document.getElementById('scenarioName').value.trim();
    
    if (!name || !currentScenarioData) {
        alert('Пожалуйста, заполните все поля');
        return;
    }
    
    const scenario = {
        id: Date.now().toString(),
        name: name,
        fileName: currentScenarioFileName,
        fileData: currentScenarioData,
        createdAt: new Date().toLocaleDateString('ru-RU')
    };
    
    try {
        const response = await fetch(`${API_URL}/api/scenarios`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(scenario)
        });
        
        if (!response.ok) {
            throw new Error('Ошибка при сохранении');
        }
        
        await loadScenarios();
        cancelScenarioForm();
        alert('Сценарий успешно добавлен!');
    } catch (error) {
        console.error('Ошибка:', error);
        alert('Ошибка при сохранении сценария. Проверьте, запущен ли сервер Python (python app.py)');
    }
}

// Отмена формы
function cancelScenarioForm() {
    document.getElementById('scenarioFormCard').style.display = 'none';
    clearScenarioForm();
}

// Очистка формы
function clearScenarioForm() {
    document.getElementById('scenarioName').value = '';
    document.getElementById('scenarioUrlInput').value = '';
    const filePreview = document.getElementById('filePreview');
    if (filePreview) {
        filePreview.style.display = 'none';
    }
    currentScenarioData = null;
    currentScenarioFileName = '';
}

// Удаление сценария
async function deleteScenario(scenarioId) {
    if (!confirm('Вы уверены, что хотите удалить этот сценарий?')) {
        return;
    }
    
    try {
        const response = await fetch(`${API_URL}/api/scenarios/${scenarioId}`, {
            method: 'DELETE'
        });
        
        if (!response.ok) {
            throw new Error('Ошибка при удалении');
        }
        
        await loadScenarios();
        alert('Сценарий успешно удалён!');
    } catch (error) {
        console.error('Ошибка:', error);
        alert('Ошибка при удалении сценария');
    }
}

// Просмотр сценария
function viewScenario(scenarioId) {
    getScenarios().then(scenarios => {
        const scenario = scenarios.find(s => s.id === scenarioId);
        
        if (!scenario) return;
        
        document.getElementById('modalTitle').textContent = scenario.name;
        
        const modalBody = document.getElementById('modalBody');
        
        const fileExtension = scenario.fileName.split('.').pop().toLowerCase();
        
        if (fileExtension === 'pdf') {
            modalBody.innerHTML = `
                <embed src="${scenario.fileData}" type="application/pdf" width="100%" height="600px" />
                <p style="text-align: center; margin-top: 10px;">
                    <a href="${scenario.fileData}" target="_blank" class="btn btn-primary">
                        Открыть в новой вкладке
                    </a>
                </p>
            `;
        } else if (fileExtension === 'txt') {
            fetch(scenario.fileData)
                .then(response => response.text())
                .then(text => {
                    modalBody.innerHTML = `
                        <pre style="white-space: pre-wrap; word-wrap: break-word; max-height: 600px; overflow-y: auto; padding: 20px; background: #f9fafb; border-radius: 8px;">${escapeHtml(text)}</pre>
                        <p style="text-align: center; margin-top: 10px;">
                            <a href="${scenario.fileData}" target="_blank" class="btn btn-primary">
                                Открыть в новой вкладке
                            </a>
                        </p>
                    `;
                })
                .catch(error => {
                    modalBody.innerHTML = `
                        <div style="text-align: center; padding: 40px;">
                            <div style="font-size: 4rem; margin-bottom: 20px;">⚠️</div>
                            <p style="color: #6b7280;">Не удалось загрузить файл с сервера</p>
                            <p style="text-align: center; margin-top: 10px;">
                                <a href="${scenario.fileData}" target="_blank" class="btn btn-primary">
                                    Открыть в новой вкладке
                                </a>
                            </p>
                        </div>
                    `;
                });
        } else {
            modalBody.innerHTML = `
                <div style="text-align: center; padding: 40px;">
                    <div style="font-size: 4rem; margin-bottom: 20px;">📄</div>
                    <h3>${escapeHtml(scenario.fileName)}</h3>
                    <p style="color: #6b7280; margin: 20px 0;">Файл формата ${fileExtension.toUpperCase()}</p>
                    <p style="color: #6b7280; margin-bottom: 30px;">Файл будет открыт с сервера</p>
                    <a href="${scenario.fileData}" target="_blank" class="btn btn-primary">
                        Открыть в новой вкладке
                    </a>
                </div>
            `;
        }
        
        document.getElementById('scenarioModal').style.display = 'flex';
    });
}

// Закрыть модальное окно
function closeScenarioModal() {
    document.getElementById('scenarioModal').style.display = 'none';
}

// Закрытие по клику вне модального окна
window.onclick = function(event) {
    const modal = document.getElementById('scenarioModal');
    if (event.target === modal) {
        closeScenarioModal();
    }
}

// Получение сценариев с сервера
async function getScenarios() {
    try {
        const response = await fetch(`${API_URL}/api/scenarios`);
        if (!response.ok) {
            throw new Error('Ошибка при загрузке');
        }
        return await response.json();
    } catch (error) {
        console.error('Ошибка:', error);
        return [];
    }
}

// Загрузка и отображение сценариев
async function loadScenarios() {
    const scenarios = await getScenarios();
    const scenariosList = document.getElementById('scenariosList');
    const emptyState = document.getElementById('emptyState');
    
    if (!scenariosList || !emptyState) return;
    
    if (scenarios.length === 0) {
        emptyState.style.display = 'block';
        const cards = scenariosList.querySelectorAll('.scenario-card');
        cards.forEach(card => card.remove());
        return;
    }
    
    emptyState.style.display = 'none';
    
    const cards = scenariosList.querySelectorAll('.scenario-card');
    cards.forEach(card => card.remove());
    
    scenarios.forEach(scenario => {
        const card = createScenarioCard(scenario);
        scenariosList.appendChild(card);
    });
}

// Создание карточки сценария
function createScenarioCard(scenario) {
    const card = document.createElement('div');
    card.className = 'scenario-card';
    
    const fileExtension = scenario.fileName.split('.').pop().toLowerCase();
    let fileIcon = '📄';
    
    if (fileExtension === 'pdf') {
        fileIcon = '📕';
    } else if (fileExtension === 'doc' || fileExtension === 'docx') {
        fileIcon = '📘';
    } else if (fileExtension === 'txt') {
        fileIcon = '📝';
    }
    
    card.innerHTML = `
        <div class="scenario-icon" onclick="viewScenario('${scenario.id}')">
            <div class="icon-circle">
                <span class="file-icon">${fileIcon}</span>
            </div>
            <p class="scenario-name">${escapeHtml(scenario.name)}</p>
            <p class="scenario-date">${scenario.createdAt || 'Без даты'}</p>
        </div>
        <div class="scenario-actions">
            <button class="btn-icon btn-view" onclick="viewScenario('${scenario.id}')" title="Просмотреть">
                👁️
            </button>
            <button class="btn-icon btn-delete" onclick="deleteScenario('${scenario.id}')" title="Удалить">
                🗑️
            </button>
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
