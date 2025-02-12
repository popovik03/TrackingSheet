var selectedFiles = [];

document.addEventListener('DOMContentLoaded', function () {
    var getDataButton = document.querySelector('#getDataButton');
    var vsatInput = document.getElementById('vsatInput');
    var mainForm = document.getElementById('mainForm');
    var loadingIndicator = document.getElementById('loadingIndicator');
    var fileInputHidden = document.getElementById('fileInputHidden');
    var quillEditor = document.getElementById('quillEditor'); // Контейнер Quill
    var solutionInput = document.getElementById('Solution'); // Скрытое поле для Quill

    // Инициализация Quill с расширенной панелью инструментов
    var quill = new Quill('#quillEditor', {
        theme: 'snow',
        placeholder: 'Введите описание инцидента...',
        modules: {
            toolbar: [
                [{ header: [1, 2, 3, false] }],
                ['bold', 'italic', 'underline', 'strike'],
                [{ 'color': [] }, { 'background': [] }],
                [{ 'list': 'ordered' }, { 'list': 'bullet' }],
                ['blockquote', 'code-block']
            ]
        }
    });

    // Загрузка сохраненного значения VSAT из localStorage
    var savedVsatValue = localStorage.getItem('vsatValue');
    // Убедитесь, что значение устанавливается правильно
    if (savedVsatValue) {
        vsatInput.value = savedVsatValue;
        console.log('VSAT установлено из localStorage:', savedVsatValue);
    }

    if (getDataButton && vsatInput) {
        getDataButton.addEventListener('click', function () {
            var ipPart = vsatInput.value;
            if (ipPart) {
                localStorage.setItem('vsatValue', ipPart);

                // Отправка AJAX-запроса для получения данных
                fetch('/Incidents/GetVsatData?ipPart=' + encodeURIComponent(ipPart), {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        'RequestVerificationToken': getCsrfToken()
                    }
                })
                    .then(response => {
                        if (!response.ok) {
                            throw new Error('Network response was not ok');
                        }
                        return response.json();
                    })
                    .then(data => {
                        console.log('Полученные данные:', data);

                        // Заполнение полей формы данными из ответа
                        if (vsatInput) {
                            vsatInput.value = data.vsat;
                        } else {
                            console.error('vsatInput не найден');
                        }

                        var runInputElement = document.getElementById('runInput');
                        if (runInputElement) {
                            runInputElement.value = data.run;
                        } else {
                            console.error('runInput не найден');
                        }

                        var wellInputElement = document.getElementById('wellInput');
                        if (wellInputElement) {
                            var wellDisplay = `${data.field} - ${data.pad} - ${data.well}`.trim().replace(/^ -| -$/g, '');
                            wellInputElement.value = wellDisplay;
                        } else {
                            console.error('wellInput не найден');
                        }

                        // Установка значения Shift, если требуется
                        var shiftSelectElement = document.getElementById('shiftSelect');
                        if (shiftSelectElement) {
                            shiftSelectElement.value = data.shift;
                        } else {
                            console.error('shiftSelect не найден');
                        }

                        // Препендинг содержимого Quill
                        if (quill) {
                            var newContent = data.bha || '';
                            if (newContent) {
                                var delta = quill.clipboard.convert(newContent);
                                var currentContents = quill.getContents();
                                var newDelta = delta.concat(currentContents);
                                quill.setContents(newDelta, 'user');
                            }
                        } else {
                            console.error('Quill редактор не инициализирован');
                        }
                    })
                    .catch(error => {
                        console.error('Ошибка при получении данных:', error);
                        alert('Ошибка при получении данных с сервера.');
                    });
            } else {
                console.error('IP-адрес не введен');
                alert('Пожалуйста, введите IP-адрес.');
            }
        });
    } else {
        console.error('Не удалось найти элементы кнопки или формы.');
    }

    // Добавляем обработчик события для выбора файлов
    if (fileInputHidden) {
        fileInputHidden.addEventListener('change', function (event) {
            handleFileSelection(event);
        });
    } else {
        console.error('Элемент с id "fileInputHidden" не найден.');
    }

    // Добавляем обработчик события для отправки формы
    if (mainForm) {
        mainForm.addEventListener('submit', function (event) {
            event.preventDefault();  // Предотвращаем обычную отправку формы

            // Перед отправкой формы сохраняем содержимое Quill в скрытое поле
            if (quill && solutionInput) {
                solutionInput.value = quill.root.innerHTML;
            } else {
                console.error('Quill редактор или скрытое поле Solution не инициализированы');
            }

            const form = this;
            const formData = new FormData();

            // Добавляем выбранные файлы
            selectedFiles.forEach(file => formData.append('UploadedFiles', file));

            // Добавляем другие поля формы, кроме файла и Solution
            const formElements = form.elements;
            for (let i = 0; i < formElements.length; i++) {
                const element = formElements[i];
                if (element.name && element.type !== 'file' && element.id !== 'Solution') {
                    formData.append(element.name, element.value);
                }
            }

            // Добавляем содержимое Quill
            if (solutionInput) {
                formData.append('Solution', solutionInput.value);
            }

            // Получаем токен антивируса (CSRF токен)
            const token = getCsrfToken();
            if (token) {
                formData.append('__RequestVerificationToken', token);
            }

            // Отображаем индикатор загрузки и отключаем кнопку
            const submitButton = form.querySelector('button[type="submit"]');
            if (submitButton) {
                submitButton.disabled = true;
            }
            if (loadingIndicator) {
                loadingIndicator.style.display = 'block';
            }

            // Отправка формы с использованием fetch
            fetch(form.action, {
                method: form.method,
                body: formData,
            })
                .then(response => {
                    if (response.ok) {
                        window.location.href = '/Home/Index';  // Перенаправление после успешной отправки
                    } else {
                        return response.text().then(text => { throw new Error(text) });
                    }
                })
                .catch(error => {
                    console.error('Ошибка при отправке формы:', error);
                    alert('Произошла ошибка при сохранении инцидента.');
                })
                .finally(() => {
                    // Исправление: Включаем кнопку и скрываем индикатор загрузки
                    if (submitButton) {
                        submitButton.disabled = true;
                    }
                });

        });
    } else {
        console.error('Элемент с id "mainForm" не найден.');
    }

    // Обработчик вставки изображений из буфера обмена
    quillEditor.addEventListener('paste', function (e) {
        var clipboard = e.clipboardData || window.clipboardData;
        if (clipboard) {
            var items = clipboard.items;
            for (var i = 0; i < items.length; i++) {
                if (items[i].type.indexOf('image') !== -1) {
                    var blob = items[i].getAsFile();
                    if (blob) {
                        

                        e.preventDefault(); // Предотвращаем стандартную вставку изображения
                    }
                }
            }
        }
    });



    // Обработчик вставки изображений из буфера обмена
    if (quillEditor) {
        quillEditor.addEventListener('paste', handlePaste);
    } else {
        console.error('Элемент с id "quillEditor" не найден.');
    }
});

// Функция для получения CSRF токена
function getCsrfToken() {
    var tokenElement = document.querySelector('input[name="__RequestVerificationToken"]');
    return tokenElement ? tokenElement.value : '';
}

// Функция для добавления файлов
function handleFileSelection(event) {
    const files = event.target.files;
    const filePreviewDiv = document.getElementById('filePreview');

    if (!filePreviewDiv) {
        console.error('Элемент с id "filePreview" не найден.');
        return; // Прекращаем выполнение функции, если элемент не найден
    }

    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        // Проверка, что файл еще не добавлен
        if (!selectedFiles.some(f => f.name === file.name && f.size === file.size && f.lastModified === file.lastModified)) {
            selectedFiles.push(file); // Добавляем каждый выбранный файл в массив
        }
    }

    updateFilePreview(); // Обновляем отображение файлов
}

// Функция для обновления предпросмотра файлов
function updateFilePreview() {
    const filePreviewDiv = document.getElementById('filePreview');

    if (!filePreviewDiv) {
        console.error('Элемент с id "filePreview" не найден.');
        return;
    }

    // Очистка предыдущего предпросмотра файлов
    filePreviewDiv.innerHTML = '';

    selectedFiles.forEach((file, index) => {
        const fileItem = document.createElement('div');
        fileItem.className = 'file-item';

        // Создаём SVG элемент для иконки файла
        const svgElement1 = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        svgElement1.setAttribute("viewBox", "0 0 24 24");
        svgElement1.setAttribute("xmlns", "http://www.w3.org/2000/svg");
        svgElement1.setAttribute("class", "icon_file");

        // Создаём путь для иконки файла
        const pathElement1 = document.createElementNS("http://www.w3.org/2000/svg", "path");
        pathElement1.setAttribute("d", getFileIcon(file.type));

        svgElement1.appendChild(pathElement1);

        // Элемент иконки файла
        const fileIcon = document.createElement('div');
        fileIcon.className = 'file-icon';
        fileIcon.title = file.name;
        fileIcon.onclick = function () {
            openFile(URL.createObjectURL(file), file.type);
        };

        fileIcon.appendChild(svgElement1);

        // Имя файла
        const fileName = document.createElement('div');
        fileName.className = 'file-name';
        fileName.style.wordBreak = 'break-all';

        // Ограничиваем имя файла до 20 символов и добавляем многоточие, если оно длиннее
        const maxLength = 20;
        fileName.textContent = file.name.length > maxLength ? file.name.substring(0, maxLength) + '...' : file.name;

        // Кнопка удаления файла
        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'delete-btn';
        deleteBtn.dataset.index = index;

        deleteBtn.addEventListener('click', function () {
            const idx = parseInt(this.dataset.index, 10);
            selectedFiles.splice(idx, 1);  // Удаляем файл из массива
            updateFilePreview(); // Обновляем отображение
        });

        // Создаём SVG элемент для иконки удаления
        const svgElement2 = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        svgElement2.setAttribute("viewBox", "0 0 24 24");
        svgElement2.setAttribute("xmlns", "http://www.w3.org/2000/svg");
        svgElement2.setAttribute("class", "icon_delete_item");

        // Создаём путь для иконки удаления
        const pathElement2 = document.createElementNS("http://www.w3.org/2000/svg", "path");
        pathElement2.setAttribute("d", "M17 7L7 17M7 7L17 17");

        svgElement2.appendChild(pathElement2);

        deleteBtn.appendChild(svgElement2);

        // Добавляем элементы в файл
        fileItem.appendChild(fileIcon);
        fileItem.appendChild(fileName);
        fileItem.appendChild(deleteBtn);

        filePreviewDiv.appendChild(fileItem);
    });
}

function deleteFile(fileName, incidentId) {
    // Код для удаления файла через AJAX
    fetch('/Incidents/DeleteFile', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'RequestVerificationToken': getCsrfToken()
        },
        body: JSON.stringify({ fileName: fileName, incidentId: incidentId })
    })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                // Удаляем элемент из DOM
                const fileElement = document.querySelector(`button[data-filename="${fileName}"][data-incidentid="${incidentId}"]`).parentElement;
                fileElement.remove();
            } else {
                alert(data.message);
            }
        })
        .catch(error => {
            console.error('Ошибка при удалении файла:', error);
            alert('Произошла ошибка при удалении файла.');
        });
}

function getFileIcon(fileType) {
    // Возвращаем иконку по типу файла
    if (fileType.includes('text/')) return "M14 2.26953V6.40007C14 6.96012 14 7.24015 14.109 7.45406C14.2049 7.64222 14.3578 7.7952 14.546 7.89108C14.7599 8.00007 15.0399 8.00007 15.6 8.00007H19.7305M14 17H8M16 13H8M20 9.98822V17.2C20 18.8802 20 19.7202 19.673 20.362C19.3854 20.9265 18.9265 21.3854 18.362 21.673C17.7202 22 16.8802 22 15.2 22H8.8C7.11984 22 6.27976 22 5.63803 21.673C5.07354 21.3854 4.6146 20.9265 4.32698 20.362C4 19.7202 4 18.8802 4 17.2V6.8C4 5.11984 4 4.27976 4.32698 3.63803C4.6146 3.07354 5.07354 2.6146 5.63803 2.32698C6.27976 2 7.11984 2 8.8 2H12.0118C12.7455 2 13.1124 2 13.4577 2.08289C13.7638 2.15638 14.0564 2.27759 14.3249 2.44208C14.6276 2.6276 14.887 2.88703 15.4059 3.40589L18.5941 6.59411C19.113 7.11297 19.3724 7.3724 19.5579 7.67515C19.7224 7.94356 19.8436 8.2362 19.9171 8.5423C20 8.88757 20 9.25445 20 9.98822Z";
    if (fileType.includes('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')) return "M14 2.26953V6.40007C14 6.96012 14 7.24015 14.109 7.45406C14.2049 7.64222 14.3578 7.7952 14.546 7.89108C14.7599 8.00007 15.0399 8.00007 15.6 8.00007H19.7305M14 17H8M16 13H8M20 9.98822V17.2C20 18.8802 20 19.7202 19.673 20.362C19.3854 20.9265 18.9265 21.3854 18.362 21.673C17.7202 22 16.8802 22 15.2 22H8.8C7.11984 22 6.27976 22 5.63803 21.673C5.07354 21.3854 4.6146 20.9265 4.32698 20.362C4 19.7202 4 18.8802 4 17.2V6.8C4 5.11984 4 4.27976 4.32698 3.63803C4.6146 3.07354 5.07354 2.6146 5.63803 2.32698C6.27976 2 7.11984 2 8.8 2H12.0118C12.7455 2 13.1124 2 13.4577 2.08289C13.7638 2.15638 14.0564 2.27759 14.3249 2.44208C14.6276 2.6276 14.887 2.88703 15.4059 3.40589L18.5941 6.59411C19.113 7.11297 19.3724 7.3724 19.5579 7.67515C19.7224 7.94356 19.8436 8.2362 19.9171 8.5423C20 8.88757 20 9.25445 20 9.98822Z";
    return "M14 2.26946V6.4C14 6.96005 14 7.24008 14.109 7.45399C14.2049 7.64215 14.3578 7.79513 14.546 7.89101C14.7599 8 15.0399 8 15.6 8H19.7305M20 9.98822V17.2C20 18.8802 20 19.7202 19.673 20.362C19.3854 20.9265 18.9265 21.3854 18.362 21.673C17.7202 22 16.8802 22 15.2 22H8.8C7.11984 22 6.27976 22 5.63803 21.673C5.07354 21.3854 4.6146 20.9265 4.32698 20.362C4 19.7202 4 18.8802 4 17.2V6.8C4 5.11984 4 4.27976 4.32698 3.63803C4.6146 3.07354 5.07354 2.6146 5.63803 2.32698C6.27976 2 7.11984 2 8.8 2H12.0118C12.7455 2 13.1124 2 13.4577 2.08289C13.7638 2.15638 14.0564 2.27759 14.3249 2.44208C14.6276 2.6276 14.887 2.88703 15.4059 3.40589L18.5941 6.59411C19.113 7.11297 19.3724 7.3724 19.5579 7.67515C19.7224 7.94356 19.8436 8.2362 19.9171 8.5423C20 8.88757 20 9.25445 20 9.98822Z";
}

function openFile(fileUrl, fileType) {
    // Определяем тип файла и выбираем подходящий способ отображения
    if (fileType.startsWith('image/')) {
        // Для изображений используем <img>
        const imageWindow = window.open('', '_blank');
        imageWindow.document.write(`
            <html>
                <head>
                    <title>Предпросмотр изображения</title>
                    <style>
                        body, html {
                            margin: 0;
                            padding: 0;
                            height: 100%;
                            display: flex;
                            justify-content: center;
                            align-items: center;
                            background-color: #f0f0f0;
                        }
                        img {
                            max-width: 100%;
                            max-height: 100%;
                            object-fit: contain;
                        }
                    </style>
                </head>
                <body>
                    <img src="${fileUrl}" alt="Предпросмотр изображения" />
                </body>
            </html>
        `);
    } else if (fileType === 'application/pdf') {
        // Для PDF используем <embed>
        const pdfWindow = window.open('', '_blank');
        pdfWindow.document.write(`
            <html>
                <head>
                    <title>Предпросмотр PDF</title>
                </head>
                <body style="margin:0; padding:0;">
                    <embed src="${fileUrl}" type="application/pdf" width="100%" height="100%" />
                </body>
            </html>
        `);
    } else {
        // Для остальных типов файлов инициируем прямое скачивание
        const link = document.createElement('a');
        link.href = fileUrl;
        link.download = ''; // Оставляем пустым, чтобы браузер использовал имя файла по умолчанию
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
}



// Обработчик вставки изображений из буфера обмена
function handlePaste(e) {
    var clipboard = e.clipboardData || window.clipboardData;
    if (clipboard) {
        var items = clipboard.items;
        for (var i = 0; i < items.length; i++) {
            if (items[i].type.indexOf('image') !== -1) { // Проверка на тип image вместо 'Screenshot'
                var blob = items[i].getAsFile();
                if (blob) {
                    // Получаем текущую дату и время
                    var date = new Date();
                    // Добавляем 5 часов к текущему времени
                    date.setHours(date.getHours());

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
                    quill.insertText(0, '[Вставлено изображение в виде вложенного файла]\n', 'user');

                    e.preventDefault(); // Предотвращаем стандартную вставку изображения
                }
            }
        }
    }
}



// Автоматически нажимаем кнопку "Сохранить" после выбора файла (если требуется)
function handleFileSelect(event) {
    console.log('handleFileSelect called');
    console.log('Selected file:', event.target.files[0]);

    // Используем setTimeout для отсрочки нажатия кнопки "Сохранить"
    setTimeout(function () {
        var submitButton = document.querySelector('button[type="submit"]');
        if (submitButton) {
            console.log('Submitting form...');
            submitButton.click();
        } else {
            console.error('Submit button not found');
        }
    }, 100); // Задержка в 100 мс для уверенности, что файл выбран
}
