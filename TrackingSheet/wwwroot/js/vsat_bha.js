
// Функция для заполнения селекта ipPart с диапазоном от 1 до 200
function populateIpPartSelect() {
    var select = document.getElementById('ipPart');
    for (var i = 1; i <= 200; i++) {
        var option = document.createElement('option');
        option.value = i;
        option.text = i;
        select.appendChild(option);
    }
}

// Функция для загрузки сохранённого значения из localStorage
function loadSavedIpPart() {
    var savedValue = localStorage.getItem('selectedVSAT');
    if (savedValue) {
        var select = document.getElementById('ipPart');
        select.value = savedValue;
        updateVsatLabel(savedValue);
        // Автоматически загружаем данные, если сохранено значение
        fetchVsatData(savedValue);
    }
}

// Функция для обновления лейбла с выбранным VSAT
function updateVsatLabel(value) {
    const label = document.getElementById('vsat_label');
    label.textContent = "Информация по VSAT " + value;
}

// Функция для привязки обработчиков событий к селекту ipPart
function bindIpPartSelect() {
    var select = document.getElementById('ipPart');
    select.addEventListener('change', function () {
        const selectedValue = select.value;
        console.log('Selected VSAT:', selectedValue);

        if (!selectedValue) {
            // Если ничего не выбрано, очищаем и отключаем селект рейса
            clearRunSelect();
            clearContainers();
            return;
        }

        // Сохраняем выбранное значение в localStorage
        localStorage.setItem('selectedVSAT', selectedValue);

        // Обновляем лейбл VSAT
        updateVsatLabel(selectedValue);

        // Отправляем AJAX-запрос для получения данных VSAT
        fetchVsatData(selectedValue);
    });
}

// Функция для очистки селекта рейса
function clearRunSelect() {
    var runSelect = document.getElementById('runSelect');
    
    runSelect.disabled = true;
}

// Функция для очистки контейнеров информации
function clearContainers() {
    const vsatInfoContainer = document.getElementById('vsatInfoContainer');
    const vsatComponentsContainer = document.getElementById('vsatComponentsContainer');
    vsatInfoContainer.innerHTML = '';
    vsatComponentsContainer.innerHTML = '';
}

// Функция для отправки AJAX-запроса и получения данных VSAT
async function fetchVsatData(ipPart) {
    try {
        // Получаем анти-форджери токен из формы
        const tokenElement = document.querySelector('input[name="__RequestVerificationToken"]');
        const token = tokenElement ? tokenElement.value : '';

        const response = await fetch('/VsatInfo/GetAllRunsVsatInfo', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'RequestVerificationToken': token // Отправляем токен в заголовках
            },
            body: JSON.stringify({ ipPart: parseInt(ipPart) })
        });

        if (response.ok) {
            const data = await response.json();
            populateRunSelect(data);
        } else {
            const error = await response.text();
            toastr.error(error || 'Ошибка при получении данных.');
            clearRunSelect();
            clearContainers();
        }
    } catch (error) {
        console.error('Ошибка при отправке запроса:', error);
        toastr.error('Произошла ошибка при получении данных.');
        clearRunSelect();
        clearContainers();
    }
}

// Функция для заполнения селекта рейсов
function populateRunSelect(data) {
    var runSelect = document.getElementById('runSelect');
    

    if (!Array.isArray(data) || data.length === 0) {
        toastr.info('Нет доступных рейсов для выбранного VSAT.');
        runSelect.disabled = true;
        return;
    }

    // Сортируем рейсы по дате начала (от последнего к первому)
    data.sort((a, b) => new Date(b.mwruDatetimeStart) - new Date(a.mwruDatetimeStart));

    data.forEach(run => {
        var option = document.createElement('option');
        option.value = run.mwruNumber; // Используем номер рейса в качестве значения
        option.text = `Рейс №${run.mwruNumber} (${new Date(run.mwruDatetimeStart).toLocaleDateString()})`;
        runSelect.appendChild(option);
    });

    runSelect.disabled = false;

    // Автоматически выбираем последний рейс (после сортировки это первый элемент)
    const latestRun = data[0];
    if (latestRun) {
        runSelect.value = latestRun.mwruNumber;
        // Вызываем функцию отображения информации о рейсе
        displayVsatInfo(latestRun, data[0]); // Передаём информацию о VSAT (data[0]) и выбранном рейсе
    }

    // Если нужно позволить пользователю выбирать другие рейсы, можно добавить обработчик события 'change'
    // Но чтобы избежать множественного добавления обработчиков, сначала удалим предыдущие
    runSelect.removeEventListener('change', runSelectChangeHandler);
    runSelect.addEventListener('change', runSelectChangeHandler.bind(null, data));
}

// Обработчик события выбора рейса
function runSelectChangeHandler(data, event) {
    const runSelect = event.target;
    const selectedRunNumber = runSelect.value;
    console.log('Selected Run:', selectedRunNumber);

    if (!selectedRunNumber) {
        clearContainers();
        return;
    }

    // Находим выбранный рейс
    const selectedRun = data.find(run => run.mwruNumber == selectedRunNumber);
    if (selectedRun) {
        displayVsatInfo(selectedRun, data[0]); // Передаём информацию о VSAT (data[0]) и выбранном рейсе
    } else {
        toastr.error('Выбранный рейс не найден.');
    }
}

// Функция для отображения информации о VSAT и выбранном рейсе
function displayVsatInfo(run, vsatInfo) {
    const vsatInfoContainer = document.getElementById('vsatInfoContainer');
    const vsatComponentsContainer = document.getElementById('vsatComponentsContainer');
    vsatInfoContainer.innerHTML = '';
    vsatComponentsContainer.innerHTML = '';

    // Объединённый div для информации о VSAT и рейсе
    vsatInfoContainer.innerHTML = `
        <div class="container-vsat-info">
            <div class="row">
                <div class="col-md-6">
                    <p class="info_header">Номер скважины:</p>
                    <p class="info_value">${vsatInfo.wellName || 'N/A'}</p>
                </div>
                <div class="col-md-6">
                    <p class="info_header">Куст:</p>
                    <p class="info_value">${vsatInfo.fctyName || 'N/A'}</p>
                </div>
            </div>
            <div class="row">
                <div class="col-md-6">
                    <p class="info_header">Заказчик:</p>
                    <p class="info_value">${vsatInfo.cpnmName || 'N/A'}</p>
                </div>
                <div class="col-md-6">
                    <p class="info_header">Месторождение:</p>
                    <p class="info_value">${vsatInfo.ooinName || 'N/A'}</p>
                </div>
            </div>
            <div class="row">
                <div class="col-md-6">
                    <p class="info_header">Рейс:</p>
                    <p class="info_value">${run.mwruNumber}</p>
                </div>
                <div class="col-md-6">
                    <p class="info_header">Секция:</p>
                    <p class="info_value">${run.mwruHoleDiameter}</p>
                </div>
            </div>
            <div class="row">
                <div class="col-md-6">
                    <p class="info_header">Полевой инженер 1:</p>
                    <p class="info_value">${run.mwruFse1 || 'N/A'}</p>
                </div>
                <div class="col-md-6">
                    <p class="info_header">Полевой инженер 2:</p>
                    <p class="info_value">${run.mwruFse2 || 'N/A'}</p>
                </div>
            </div>
            <div class="row">
                <div class="col-md-6">
                    <p class="info_header">Начало рейса:</p>
                    <p class="info_value">${new Date(run.mwruDatetimeStart).toLocaleString()}</p>
                </div>
                <div class="col-md-6">
                    <p class="info_header">Конец рейса:</p>
                    <p class="info_value">${new Date(run.mwruDatetimeEnd).toLocaleString()}</p>
                </div>
            </div>
        </div>
    `;

    // Отображаем таблицу компонентов выбранного рейса
    if (run.components && run.components.length > 0) {
        const tableSection = document.createElement('section');
        tableSection.classList.add('table__body');

        const table = document.createElement('table');
        table.classList.add('table', 'table-striped');
        table.innerHTML = `
            <thead>
                <tr>
                    <th>№</th>
                    <th>Расстояние от низа</th>
                    <th>Элемент КНБК</th>
                    <th>Серийный №</th>
                    <th>Паспорт</th>
                    <th>История</th>
                </tr>
            </thead>
            <tbody>
                ${run.components.map(component => `
                    <tr>
                        <td>${component.mwrcPosition}</td>
                        <td>${component.mwrcOffsetFromBit}</td>
                        <td>${component.mwcoRealName || 'N/A'}</td>
                        <td>${component.mwcoSn || 'N/A'}</td>
                        <td>
                            <a href="/VsatInfo/SearchAndOpenFolders?folderName=${encodeURIComponent(component.mwcoSn)}" target="_blank" class="btn btn-primary btn-sm">
                                <!-- SVG иконка паспорта -->
                                <svg class="icon_passport" viewBox="0 0 24 24" width="16" height="16">
                                    <path d="M6.5 20H5C3.89543 20 3 19.1046 3 18V4C3 2.89543 3.89543 2 5 2H19C20.1046 2 21 2.89543 21 4V18C21 19.1046 20.1046 20 19 20H17.5M12 19C13.6569 19 15 17.6569 15 16C15 14.3431 13.6569 13 12 13C10.3431 13 9 14.3431 9 16C9 17.6569 10.3431 19 12 19ZM12 19L12.0214 18.9998L8.82867 22.1926L6.00024 19.3641L9.01965 16.3447M12 19L15.1928 22.1926L18.0212 19.3641L15.0018 16.3447M9 6H15M7 9.5H17" />
                                </svg>
                            </a>
                        </td>
                        <td>
                            ${component.mwcoSn ? `
                                <button type="button" class="history-button" style ="all:unset;" data-sn="${component.mwcoSn}">
                                    <!-- SVG иконка истории -->
                                    <svg class="icon_passport" viewBox="0 0 24 24" width="16" height="16">
                                        <path d="M22.7 11.5L20.7005 13.5L18.7 11.5M20.9451 13C20.9814 12.6717 21 12.338 21 12C21 7.02944 16.9706 3 12 3C7.02944 3 3 7.02944 3 12C3 16.9706 7.02944 21 12 21C14.8273 21 17.35 19.6963 19 17.6573M12 7V12L15 14"></path>
                                    </svg>
                                </button>
                            ` : '<span class="text-muted">Нет данных</span>'}
                        </td>
                    </tr>
                `).join('')}
            </tbody>
        `;

        tableSection.appendChild(table);
        vsatComponentsContainer.appendChild(tableSection);
    } else {
        vsatComponentsContainer.innerHTML = '<p>Нет компонентов для этого рейса.</p>';
    }

    // Привязываем обработчики событий для кнопок истории
    bindHistoryButtons();
}

// Функция для привязки обработчиков событий к кнопкам истории
function bindHistoryButtons() {
    const historyButtons = document.querySelectorAll('.history-button');
    historyButtons.forEach(button => {
        button.addEventListener('click', async function () {
            const sn = this.getAttribute('data-sn');
            await fetchHistory(sn);
        });
    });
}

// Функция для получения истории по серийному номеру и отображения модального окна
async function fetchHistory(sn) {
    try {
        const apiUrl = "http://10.7.129.186/api/v1/incidents/tool_incidents/?sn=" + encodeURIComponent(sn);
        // Открываем модальное окно
        openModal();

        // Устанавливаем текст загрузки с индикатором
        $('#historyContent').html('<div class="text-center"><div class="spinner-border" role="status"><span class="sr-only">Загрузка...</span></div><p>Загрузка...</p></div>');

        const response = await fetch(apiUrl, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        if (response.ok) {
            const historyData = await response.json();
            displayHistoryModal(historyData);
        } else {
            toastr.error('Не удалось получить историю оборудования.');
            $('#historyContent').html('<p>Не удалось получить историю оборудования.</p>');
        }
    } catch (error) {
        console.error('Ошибка при загрузке истории:', error);
        toastr.error('Произошла ошибка при получении истории оборудования.');
        $('#historyContent').html('<p>Произошла ошибка при получении истории оборудования.</p>');
    }
}


// Функция для отображения модального окна с историей
function displayHistoryModal(historyData) {
    console.log('Displaying history modal with data:', historyData);
    const modal = document.getElementById('historyModal');
    const historyContent = document.getElementById('historyContent');

    if (!historyData || historyData.length === 0) {
        historyContent.innerHTML = '<p>Данные не найдены.</p>';
    } else {
        let html = '';

        historyData.forEach((incident, index) => {
            html += `
                <h5 style="font-family: Gilroy-Bold; font-size: 20px; padding: 10px 15px">Инцидент ${index + 1}</h5>
                <table class="table table-bordered">
                    <thead>
                        <tr>
                            <th>Параметр</th>
                            <th>Значение</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${generateTableRows(incident.incident)}
                    </tbody>
                </table>
                <h6 style="font-family: Gilroy-Bold; font-size: 20px; padding: 10px 15px">Инструмент</h6>
                <table class="table table-bordered">
                    <thead>
                        <tr>
                            <th>Параметр</th>
                            <th>Значение</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${generateTableRows(incident.tool)}
                    </tbody>
                </table>
                <hr />
            `;
        });

        historyContent.innerHTML = html;
    }

    // Показать модальное окно
    openModal();
}

// Вспомогательная функция для генерации строк таблицы
function generateTableRows(data) {
    if (!data || typeof data !== 'object') return '';

    return Object.keys(data)
        .filter(key => hasValue(data[key])) // Фильтрация ключей с непустыми значениями
        .map(key => `
            <tr>
                <td>${capitalizeFirstLetter(key.replace(/_/g, ' '))}</td>
                <td>${formatValue(data[key])}</td>
            </tr>
        `)
        .join('');
}

// Функция для проверки наличия значения
function hasValue(value) {
    return value !== null && value !== undefined && value !== '';
}



// Функция для форматирования значений (например, объектов)
function formatValue(value) {
    if (typeof value === 'object' && value !== null) {
        return '<pre>' + JSON.stringify(value, null, 2) + '</pre>';
    }
    return value !== null ? value : '';
}

// Функция для капитализации первой буквы строки
function capitalizeFirstLetter(string) {
    if (typeof string !== 'string') return '';
    return string.charAt(0).toUpperCase() + string.slice(1);
}

// Функции для открытия и закрытия модального окна
function openModal() {
    var modal = document.getElementById('historyModal');
    modal.style.display = 'block';
    modal.classList.add('show'); // Если используете CSS-классы для отображения
}

function closeModal() {
    var modal = document.getElementById('historyModal');
    modal.style.display = 'none';
    modal.classList.remove('show');
}

// Функция для инициализации всего скрипта
function initializeVsatBha() {
    populateIpPartSelect();
    loadSavedIpPart();
    bindIpPartSelect();
}

// Инициализация после загрузки DOM
document.addEventListener('DOMContentLoaded', function () {
    initializeVsatBha();
});

// Обработчик закрытия модального окна при клике вне его содержимого
window.addEventListener('click', function (event) {
    var modal = document.getElementById('historyModal');
    var modalContent = document.querySelector('.modal-content-vsat');
    if (event.target == modal) {
        closeModal();
    }
});
