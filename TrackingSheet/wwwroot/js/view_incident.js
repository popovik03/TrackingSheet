
// Глобальные переменные
let modal;
let imageModal;
// let quill; // Удалено, так как функциональность редактора обновлений убрана
let selectedFiles = [];
let existingFiles = window.appSettings.existingFiles || [];

// Функция для обновления значения поля 'File'
function updateFileField() {
    const totalFiles = selectedFiles.length + existingFiles.length;
    const fileField = document.getElementById('File');
    if (fileField) {
        fileField.value = totalFiles > 0 ? 1 : 0;
    }
}
// Функция для подтверждения и удаления инцидента
function confirmDelete(deleteUrl) {
    if (confirm('Вы уверены, что хотите удалить этот инцидент?')) {
        window.location.href = deleteUrl;
    }
}

// Функция для удаления файла через AJAX
async function deleteFile(fileName, incidentId, fileItemElement) {
    if (!confirm('Вы уверены, что хотите удалить этот файл?')) return false;

    try {
        const token = getAntiForgeryToken();
        const response = await fetch(`/Incidents/DeleteFile`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'RequestVerificationToken': token
            },
            body: JSON.stringify({ fileName, IncidentId: incidentId })
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(errorText || 'Ошибка сети');
        }

        const data = await response.json();

        if (data.success) {
            // Удаляем элемент файла из DOM
            if (fileItemElement) {
                fileItemElement.remove();
            }
            return true; // Добавлено: возвращаем true при успешном удалении
        } else {
            alert('Ошибка при удалении файла: ' + (data.message || 'Неизвестная ошибка.'));
            return false; // Добавлено: возвращаем false при ошибке
        }
    } catch (error) {
        console.error('Ошибка:', error);
        alert('Ошибка при удалении файла: ' + error.message);
        return false; // Добавлено: возвращаем false при исключении
    }
}


// Функция для получения CSRF-токена
function getAntiForgeryToken() {
    const tokenElement = document.querySelector('input[name="__RequestVerificationToken"]');
    return tokenElement ? tokenElement.value : '';
}

// Функция для получения даты с учётом смещения часового пояса
function getDateWithTimezoneOffset(offset) {
    const currentDate = new Date();
    const utcTime = currentDate.getTime() + (currentDate.getTimezoneOffset() * 60000);
    const targetTime = utcTime + (offset * 3600000);
    const targetDate = new Date(targetTime);

    const year = targetDate.getFullYear();
    const month = ('0' + (targetDate.getMonth() + 1)).slice(-2);
    const day = ('0' + targetDate.getDate()).slice(-2);
    const hours = ('0' + targetDate.getHours()).slice(-2);
    const minutes = ('0' + targetDate.getMinutes()).slice(-2);

    return `${year}-${month}-${day}T${hours}:${minutes}`;
}

document.addEventListener('DOMContentLoaded', () => {
    console.log("JavaScript загружен и готов к работе");
    console.log("App Settings:", window.appSettings);


    // Инициализируем глобальные переменные modal и imageModal
    modal = document.getElementById("incidentUpdateModal");
    imageModal = document.getElementById('imageModal');
    var getDataButton = document.querySelector('#getDataButton');
    var vsatInput = document.querySelector('input[name="VSAT"]');
    var runInput = document.querySelector('input[name="Run"]');
    var wellInput = document.querySelector('input[name="Well"]');
    var quillEditor = document.getElementById('quillEditor');
    var quill = new Quill('#quillEditor', {
        theme: 'snow',
        placeholder: 'Введите описание инцидента...',
        modules: {
            toolbar: [
                [{ 'header': [1, 2, 3, false] }],
                ['bold', 'italic', 'underline', 'strike'],
                [{ 'color': [] }, { 'background': [] }],
                [{ 'list': 'ordered' }, { 'list': 'bullet' }],
                ['blockquote', 'code-block']
            ],
            keyboard: {
                bindings: {
                    insertUpdate: {
                        key: 'Enter',
                        shortKey: true, //  Ctrl+Enter
                        handler: function (range, context) {
                            insertUpdate();
                            return false; 
                        }
                    }
                }
            }
        }
    });

    // Обработчик нажатия на getDataButton
    if (getDataButton && vsatInput) {
        getDataButton.addEventListener('click', function () {
            var ipPart = vsatInput.value;
            if (ipPart) {
                fetch('/Incidents/GetVsatData?ipPart=' + encodeURIComponent(ipPart), {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        'RequestVerificationToken': getAntiForgeryToken()
                    }
                })
                    .then(response => {
                        if (!response.ok) {
                            throw new Error('Network response was not ok');
                        }
                        return response.json();
                    })
                    // In your .then(data => { ... }) block
                    .then(data => {
                        // Update form fields with data from the server
                        if (vsatInput) {
                            vsatInput.value = data.vsat;
                        }
                        if (runInput) {
                            runInput.value = data.run;
                        }
                        if (wellInput) {
                            var wellDisplay = `${data.field} - ${data.pad} - ${data.well}`.trim().replace(/^ -| -$/g, '');
                            wellInput.value = wellDisplay;
                        }

                        // Not updating Shift and Reporter as per your requirement

                        // Update Quill editor content
                        if (quill) {
                            var newContent = data.bha || '';
                            if (newContent) {
                                var delta = quill.clipboard.convert(newContent);
                                var currentContents = quill.getContents();
                                var newDelta = delta.concat(currentContents);
                                quill.setContents(newDelta, 'user');
                            }
                        }
                    })

                    .catch(error => {
                        console.error('Ошибка при получении данных:', error);
                        alert('Ошибка при получении данных с сервера.');
                    });
            } else {
                alert('Пожалуйста, введите номер VSAT.');
            }
        });
    } else {
        console.error('Не удалось найти getDataButton или vsatInput.');
    }

    const btn = document.getElementById("openModalButton");
    const span = document.querySelector(".close-modal");

    if (!modal || !btn) {
        console.error('Необходимые элементы модального окна не найдены.');
        // Не прерываем выполнение, так как функциональность модального окна отключена
    }

    // Функция для вставки обновления в редактор Quill
    function insertUpdate() {
        if (!quill) {
            console.error('Quill editor not initialized.');
            return;
        }

        const reporter = window.appSettings.reporter;
        const now = new Date();
        const day = String(now.getDate()).padStart(2, '0');
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const year = now.getFullYear();
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        const formattedDate = `${day}/${month}/${year} ${hours}:${minutes}`;

        // Добавляем переносы строк перед и после вставляемого текста
        const insertTextBefore = '\n';
        const insertTextAfter = '\n';
        const insertText = `Обновление: ${formattedDate} ${reporter}`;

        const index = quill.getLength(); // Позиция в конце документа

        // Вставляем перенос строки перед текстом
        quill.insertText(index, insertTextBefore, 'user');

        // Вставляем жирный текст обновления
        quill.insertText(index + insertTextBefore.length, insertText, { bold: true });

        // Вставляем перенос строки после текста
        quill.insertText(index + insertTextBefore.length + insertText.length, insertTextAfter, 'user');

        // Перемещаем курсор на новую строку после вставленного текста
        quill.setSelection(index + insertTextBefore.length + insertText.length + insertTextAfter.length, 0);
    }

    // Присваиваем функцию insertUpdate глобально
    window.insertUpdate = insertUpdate;

    // Добавляем обработчик события submit для основной формы
    const editForm = document.getElementById('editIncidentForm');
    const saveButton = editForm ? editForm.querySelector('button[type="submit"]') : null;

    if (editForm) {
        editForm.addEventListener('submit', async (event) => {
            event.preventDefault();

            // Отображаем индикатор загрузки
            const loadingIndicator = document.getElementById('loadingIndicator');
            if (loadingIndicator) {
                loadingIndicator.style.display = 'block';
            }

            // Отключаем кнопку сохранения
            if (saveButton) {
                saveButton.disabled = true;
            }

            // Сохраняем содержимое Quill в скрытое поле перед отправкой
            const quillContent = quill.root.innerHTML;
            document.getElementById('Solution').value = quillContent;

            // Создаём пустой FormData
            const formData = new FormData();

            // Добавляем все поля формы, кроме fileInput
            Array.from(editForm.elements).forEach(element => {
                if (element.name && element !== fileInput) {
                    formData.append(element.name, element.value);
                }
            });

            // Добавляем файлы из selectedFiles
            selectedFiles.forEach((file) => {
                formData.append('UploadedFiles', file);
            });

            try {
                const response = await fetch(editForm.action, {
                    method: 'POST',
                    headers: {
                        'RequestVerificationToken': getAntiForgeryToken()
                        // Не указываем 'Content-Type', так как fetch сам установит его для FormData
                    },
                    body: formData
                });

                const result = await response.json();
                console.log('Ответ сервера:', result);

                if (result.success) {
                    // Перенаправление на указанную в ответе страницу
                    console.log('Сохранение успешное. Переход на:', result.redirectUrl);
                    window.location.href = result.redirectUrl;
                } else {
                    alert('Ошибка при сохранении инцидента: ' + result.message);
                }
            } catch (error) {
                console.error('Ошибка при отправке формы:', error);
                alert('Произошла ошибка при обновлении инцидента: ' + error.message);
            } finally {
                // Скрываем индикатор загрузки и включаем кнопку
                if (loadingIndicator) {
                    loadingIndicator.style.display = 'block';
                }

                if (saveButton) {
                    saveButton.disabled = false;
                }
            }
        });
    }

    // Инициализация переменных для файлов
    let selectedFiles = [];

    const fileInput = document.getElementById('fileInput');
    const filePreviewDiv = document.getElementById('filePreview');
    const descriptionTextarea = document.getElementById('exampleFormControlTextarea1');
    const dragDropContainer = document.getElementById('dragDropContainer'); // Если добавлен

    if (!filePreviewDiv) {
        console.error('Элемент с id "filePreview" не найден.');
        return;
    }

    // Обработчик выбора файлов через input
    if (fileInput) {
        fileInput.addEventListener('change', handleFileSelect);
    }

    // Обработчик вставки изображений в textarea
    if (descriptionTextarea) {
        descriptionTextarea.addEventListener('paste', handlePaste);
    }

    // Импортируем Delta
    const Delta = Quill.import('delta');

    // Добавляем матчер для предотвращения вставки изображений
    quill.clipboard.addMatcher('IMG', function (node, delta) {
        return new Delta();
    });

    // Привязка обработчика handlePaste к событию paste
    quill.root.addEventListener('paste', handlePaste);

    // Обработчик вставки изображений из буфера обмена
    function handlePaste(e) {
        var clipboard = e.clipboardData || window.clipboardData;
        if (clipboard) {
            var items = clipboard.items;
            for (var i = 0; i < items.length; i++) {
                if (items[i].type.indexOf('image') !== -1) {
                    var blob = items[i].getAsFile();
                    if (blob) {
                        // Фокусируем редактор
                        quill.focus();

                        // Получаем текущую дату и время
                        var date = new Date();

                        // Форматируем дату
                        var year = date.getFullYear();
                        var month = String(date.getMonth() + 1).padStart(2, '0');
                        var day = String(date.getDate()).padStart(2, '0');
                        var hours = String(date.getHours()).padStart(2, '0');
                        var minutes = String(date.getMinutes()).padStart(2, '0');
                        var seconds = String(date.getSeconds()).padStart(2, '0');

                        // Формируем строку временной метки
                        var timestamp = `${year}-${month}-${day} ${hours}-${minutes}-${seconds}`;

                        // Добавляем временную метку в название файла
                        var newFileName = `screenshot_${timestamp}.${blob.type.split('/')[1]}`;
                        var newFile = new File([blob], newFileName, { type: blob.type });

                        // Добавляем файл в selectedFiles
                        selectedFiles.push(newFile);
                        updateFilePreview();

                        // Вставляем заметку в редактор
                        const selection = quill.getSelection();
                        const index = selection ? selection.index : quill.getLength();
                        quill.insertText(index, '[Вставлено изображение в виде вложенного файла]\n', 'user');

                        e.preventDefault(); // Предотвращаем стандартную вставку
                    }
                }
            }
        }
    }


    // Устанавливаем существующее содержимое в редактор Quill (если есть)
    const existingContent = document.getElementById('Solution').value;
    if (existingContent) {
        quill.root.innerHTML = existingContent;
    }

    // Обработчик Drag-and-Drop (если добавлен контейнер)
    if (dragDropContainer) {
        // Обработчик события dragover
        dragDropContainer.addEventListener('dragover', (event) => {
            event.preventDefault();
            event.stopPropagation();
            dragDropContainer.classList.add('dragover');
        });

        // Обработчик события dragleave
        dragDropContainer.addEventListener('dragleave', (event) => {
            event.preventDefault();
            event.stopPropagation();
            dragDropContainer.classList.remove('dragover');
        });

        // Обработчик события drop
        dragDropContainer.addEventListener('drop', (event) => {
            event.preventDefault();
            event.stopPropagation();
            dragDropContainer.classList.remove('dragover');

            const files = event.dataTransfer.files;
            if (files && files.length > 0) {
                handleDroppedFiles(files);
            }
        });

        // Обработчик клика на контейнер для открытия выбора файлов
        dragDropContainer.addEventListener('click', () => {
            fileInput.click();
        });
    }

    // Функция для обработки выбора файла через input
    function handleFileSelect(event) {
        const files = event.target.files;

        for (let i = 0; i < files.length; i++) {
            const file = files[i];

            //// Проверка типа и размера файла
            //if (!isValidFile(file)) {
            //    continue;
            //}

            // Проверка, что файл ещё не добавлен
            if (!selectedFiles.some((f) => f.name === file.name && f.size === file.size && f.lastModified === file.lastModified)) {
                selectedFiles.push(file); // Добавление файла в массив
            }
        }

        updateFilePreview(); // Обновление предпросмотра файлов
    }

    // Функция для обновления поля fileInput.files
    function updateFileInputFiles() {
        const dataTransfer = new DataTransfer();
        selectedFiles.forEach(file => dataTransfer.items.add(file));
        fileInput.files = dataTransfer.files;
    }

    // Модифицированная функция updateFilePreview
    function updateFilePreview() {
        // Очистка предыдущего предпросмотра
        filePreviewDiv.innerHTML = '';

        selectedFiles.forEach((file, index) => {
            const fileItem = document.createElement('div');
            fileItem.className = 'file-item';
            fileItem.setAttribute('data-filename', file.name);
            fileItem.setAttribute('data-index', index);
            fileItem.setAttribute('data-is-new', 'true');

            // Создание иконки файла
            const fileIcon = document.createElement('div');
            fileIcon.className = 'file-icon';
            fileIcon.title = file.name;
            fileIcon.setAttribute('data-fileurl', URL.createObjectURL(file));
            fileIcon.setAttribute('data-filetype', file.type);

            const svgElement1 = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
            svgElement1.setAttribute('viewBox', '0 0 24 24');
            svgElement1.setAttribute('class', 'icon_file');
            svgElement1.setAttribute('width', '12');
            svgElement1.setAttribute('height', '12');

            const pathElement1 = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            pathElement1.setAttribute('d', getFileIconPath(file.name));

            svgElement1.appendChild(pathElement1);
            fileIcon.appendChild(svgElement1);

            // Имя файла
            const fileName = document.createElement('div');
            fileName.className = 'file-name';
            fileName.style.wordBreak = 'break-all';
            const maxLength = 20;
            fileName.textContent = file.name.length > maxLength ? `${file.name.substring(0, maxLength)}...` : file.name;

            // Кнопка удаления
            const deleteBtn = document.createElement('button');
            deleteBtn.type = 'button';
            deleteBtn.className = 'delete-btn';
            deleteBtn.setAttribute('data-index', index);
            deleteBtn.setAttribute('data-is-new', 'true');

            const svgElement2 = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
            svgElement2.setAttribute('viewBox', '0 0 24 24');
            svgElement2.setAttribute('class', 'icon_delete_item');
            svgElement2.setAttribute('width', '12');
            svgElement2.setAttribute('height', '12');

            const pathElement2 = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            pathElement2.setAttribute('d', 'M17 7L7 17M7 7L17 17');

            svgElement2.appendChild(pathElement2);
            deleteBtn.appendChild(svgElement2);

            // Добавление элементов в fileItem
            fileItem.appendChild(fileIcon);
            fileItem.appendChild(fileName);
            fileItem.appendChild(deleteBtn);

            // Добавление fileItem в предпросмотр
            filePreviewDiv.appendChild(fileItem);
        });

        // Обновляем поле fileInput.files
        updateFileInputFiles();

        // Обновляем значение поля 'File'
        updateFileField();
    }

    // Функция для получения пути к иконке файла на основе расширения
    function getFileIconPath(fileName) {
        const extension = '.' + fileName.split('.').pop().toLowerCase();
        switch (extension) {
            case '.txt':
                return "M14 2.26953V6.40007C14 6.96012 14 7.24015 14.109 7.45406C14.2049 7.64222 14.3578 7.7952 14.546 7.89108C14.7599 8 15.0399 8 15.6 8H19.7305M14 17H8M16 13H8M20 9.98822V17.2C20 18.8802 20 19.7202 19.673 20.362C19.3854 20.9265 18.9265 21.3854 18.362 21.673C17.7202 22 16.8802 22 15.2 22H8.8C7.11984 22 6.27976 22 5.63803 21.673C5.07354 21.3854 4.6146 20.9265 4.32698 20.362C4 19.7202 4 18.8802 4 17.2V6.8C4 5.11984 4 4.27976 4.32698 3.63803C4.6146 3.07354 5.07354 2.6146 5.63803 2.32698C6.27976 2 7.11984 2 8.8 2H12.0118C12.7455 2 13.1124 2 13.4577 2.08289C13.7638 2.15638 14.0564 2.27759 14.3249 2.44208C14.6276 2.6276 14.887 2.88703 15.4059 3.40589L18.5941 6.59411C19.113 7.11297 19.3724 7.3724 19.5579 7.67515C19.7224 7.94356 19.8436 8.2362 19.9171 8.5423C20 8.88757 20 9.25445 20 9.98822Z";
            case '.xlsx':
                return "M14 2.26953V6.40007C14 6.96012 14 7.24015 14.109 7.45406C14.2049 7.64222 14.3578 7.7952 14.546 7.89108C14.7599 8 15.0399 8 15.6 8H19.7305M14 17H8M16 13H8M20 9.98822V17.2C20 18.8802 20 19.7202 19.673 20.362C19.3854 20.9265 18.9265 21.3854 18.362 21.673C17.7202 22 16.8802 22 15.2 22H8.8C7.11984 22 6.27976 22 5.63803 21.673C5.07354 21.3854 4.6146 20.9265 4.32698 20.362C4 19.7202 4 18.8802 4 17.2V6.8C4 5.11984 4 4.27976 4.32698 3.63803C4.6146 3.07354 5.07354 2.6146 5.63803 2.32698C6.27976 2 7.11984 2 8.8 2H12.0118C12.7455 2 13.1124 2 13.4577 2.08289C13.7638 2.15638 14.0564 2.27759 14.3249 2.44208C14.6276 2.6276 14.887 2.88703 15.4059 3.40589L18.5941 6.59411C19.113 7.11297 19.3724 7.3724 19.5579 7.67515C19.7224 7.94356 19.8436 8.2362 19.9171 8.5423C20 8.88757 20 9.25445 20 9.98822Z";
            default:
                return "M14 2.26946V6.4C14 6.96005 14 7.24008 14.109 7.45399C14.2049 7.64215 14.3578 7.79513 14.546 7.89101C14.7599 8 15.0399 8 15.6 8H19.7305M20 9.98822V17.2C20 18.8802 20 19.7202 19.673 20.362C19.3854 20.9265 18.9265 21.3854 18.362 21.673C17.7202 22 16.8802 22 15.2 22H8.8C7.11984 22 6.27976 22 5.63803 21.673C5.07354 21.3854 4.6146 20.9265 4.32698 20.362C4 19.7202 4 18.8802 4 17.2V6.8C4 5.11984 4 4.27976 4.32698 3.63803C4.6146 3.07354 5.07354 2.6146 5.63803 2.32698C6.27976 2 7.11984 2 8.8 2H12.0118C12.7455 2 13.1124 2 13.4577 2.08289C13.7638 2.15638 14.0564 2.27759 14.3249 2.44208C14.6276 2.6276 14.887 2.88703 15.4059 3.40589L18.5941 6.59411C19.113 7.11297 19.3724 7.3724 19.5579 7.67515C19.7224 7.94356 19.8436 8.2362 19.9171 8.5423C20 8.88757 20 9.25445 20 9.98822Z";
        }

    }

    // Функция для открытия файла в новом окне или модальном окне
    function openFile(fileUrl, fileType) {
        console.log('openFile вызвана с URL:', fileUrl, 'Тип файла:', fileType);
        const newWindow = window.open(fileUrl, '_blank');
        if (!newWindow) {
            alert('Не удалось открыть файл. Проверьте настройки блокировщика всплывающих окон.');
        }
    }

    // Обновите обработчики удаления файлов
    filePreviewDiv.addEventListener('click', async (event) => {
        // Обработка клика по кнопке удаления
        const deleteBtn = event.target.closest('.delete-btn');
        if (deleteBtn) {
            const fileItem = deleteBtn.closest('.file-item');
            const isNew = deleteBtn.getAttribute('data-is-new') === 'true';

            if (isNew) {
                const index = parseInt(deleteBtn.getAttribute('data-index'));
                if (!isNaN(index)) {
                    // Удаляем файл из selectedFiles
                    selectedFiles.splice(index, 1);
                    // Обновляем предпросмотр и поле fileInput.files
                    updateFilePreview();
                }
            } else {
                // Удаление файлов, уже загруженных на сервер
                const fileName = fileItem.getAttribute('data-filename');
                const incidentId = fileItem.getAttribute('data-incidentid');
                if (fileName && incidentId) {
                    const success = await deleteFile(fileName, incidentId, fileItem);
                    if (success) {
                        // Удаляем файл из existingFiles
                        const index = existingFiles.indexOf(fileName);
                        if (index > -1) {
                            existingFiles.splice(index, 1);
                        }
                        // Обновляем значение поля 'File'
                        updateFileField();
                    }
                }
            }
            return; // Прерываем дальнейшую обработку, если клик был по deleteBtn
        }

        // Обработка клика по иконке файла
        const fileIcon = event.target.closest('.file-icon');
        if (fileIcon) {
            const fileUrl = fileIcon.getAttribute('data-fileurl');
            const fileType = fileIcon.getAttribute('data-filetype');
            if (fileUrl) {
                openFile(fileUrl, fileType);
            }
            return; // Прерываем дальнейшую обработку, если клик был по fileIcon
        }

        // Обработка клика по имени файла
        const fileNameDiv = event.target.closest('.file-name');
        if (fileNameDiv) {
            const fileItem = fileNameDiv.closest('.file-item');
            if (fileItem) {
                const isNew = fileItem.getAttribute('data-is-new') === 'true';
                let fileUrl;
                let fileType;

                if (isNew) {
                    // Для новых файлов, URL создается локально
                    const fileIcon = fileItem.querySelector('.file-icon');
                    fileUrl = fileIcon ? fileIcon.getAttribute('data-fileurl') : null;
                    fileType = fileIcon ? fileIcon.getAttribute('data-filetype') : null;
                } else {
                    // Для существующих файлов, URL указывается на сервере
                    const incidentId = fileItem.getAttribute('data-incidentid');
                    const fileName = fileItem.getAttribute('data-filename');
                    fileUrl = `/uploads/${incidentId}/${fileName}`;
                    fileType = getFileTypeFromExtension(fileName);
                }

                if (fileUrl) {
                    openFile(fileUrl, fileType);
                }
            }
        }
    });


    // Функция для рендеринга существующих файлов
    function renderExistingFiles() {
        const existingFiles = window.appSettings.existingFiles || [];
        const incidentId = window.appSettings.incidentId;

        existingFiles.forEach((fileName) => {
            const fileItem = document.createElement('div');
            fileItem.className = 'file-item';
            fileItem.setAttribute('data-filename', fileName);
            fileItem.setAttribute('data-incidentid', incidentId);
            fileItem.setAttribute('data-is-new', 'false');

            // Создание иконки файла
            const fileIcon = document.createElement('div');
            fileIcon.className = 'file-icon';
            fileIcon.title = fileName;
            fileIcon.setAttribute('data-fileurl', `/uploads/${incidentId}/${fileName}`);
            fileIcon.setAttribute('data-filetype', getFileTypeFromExtension(fileName));

            const svgElement1 = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
            svgElement1.setAttribute('viewBox', '0 0 24 24');
            svgElement1.setAttribute('class', 'icon_file');
            svgElement1.setAttribute('width', '12');
            svgElement1.setAttribute('height', '12');

            const pathElement1 = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            pathElement1.setAttribute('d', getFileIconPath(fileName));

            svgElement1.appendChild(pathElement1);
            fileIcon.appendChild(svgElement1);

            // Имя файла
            const fileNameDiv = document.createElement('div');
            fileNameDiv.className = 'file-name';
            fileNameDiv.style.wordBreak = 'break-all';
            const maxLength = 20;
            fileNameDiv.textContent = fileName.length > maxLength ? `${fileName.substring(0, maxLength)}...` : fileName;

            // Кнопка удаления
            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'delete-btn';
            deleteBtn.setAttribute('data-filename', fileName);
            deleteBtn.setAttribute('data-incidentid', incidentId);
            deleteBtn.setAttribute('data-is-new', 'false');
            deleteBtn.type = 'button';

            const svgElement2 = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
            svgElement2.setAttribute('viewBox', '0 0 24 24');
            svgElement2.setAttribute('class', 'icon_delete_item');
            svgElement2.setAttribute('width', '12');
            svgElement2.setAttribute('height', '12');

            const pathElement2 = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            pathElement2.setAttribute('d', 'M17 7L7 17M7 7L17 17');

            svgElement2.appendChild(pathElement2);
            deleteBtn.appendChild(svgElement2);

            // Добавление элементов в fileItem
            fileItem.appendChild(fileIcon);
            fileItem.appendChild(fileNameDiv);
            fileItem.appendChild(deleteBtn);

            // Добавление fileItem в предпросмотр
            filePreviewDiv.appendChild(fileItem);
        });
    }

    // Функция для получения типа файла на основе расширения
    function getFileTypeFromExtension(fileName) {
        const extension = '.' + fileName.split('.').pop().toLowerCase();
        switch (extension) {
            case '.jpg':
            case '.jpeg':
                return 'image/jpeg';
            case '.png':
                return 'image/png';
            case '.pdf':
                return 'application/pdf';
            case '.xlsx':
                return 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
            case '.txt':
                return 'text/plain';
            default:
                return 'application/octet-stream';
        }
    }

    // Вызовем функцию для рендеринга существующих файлов
    renderExistingFiles();

});
