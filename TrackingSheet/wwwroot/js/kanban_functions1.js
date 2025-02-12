
// Обновленная функция для добавления подзадачи в список с RowVersion
function addSubtaskToList(id, description, isCompleted, rowVersion) {
    var subtaskItem = `
        <li class="list-group-item">
            <div class="checkbox-list-group-item">
                <input type="checkbox" class="subtask-checkbox" ${isCompleted ? 'checked' : ''}>
                <input type="text" class="form-control subtask-description" value="${escapeHtml(description)}">
            </div>
            <button type="button" class="remove-subtask-button" data-subtask-id="${id}" data-row-version="${rowVersion}">
                <svg class="icon_delete" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path d="M16 6V5.2C16 4.0799 16 3.51984 15.782 3.09202C15.5903 2.71569 15.2843 2.40973 14.908 2.21799C14.4802 2 13.9201 2 12.8 2H11.2C10.0799 2 9.51984 2 9.09202 2.21799C8.71569 2.40973 8.40973 2.71569 8.21799 3.09202C8 3.51984 8 4.0799 8 5.2V6M3 6H21M19 6V17.2C19 18.8802 19 19.7202 18.673 20.362C18.3854 20.9265 17.9265 21.3854 17.362 21.673C16.7202 22 15.8802 22 14.2 22H9.8C8.11984 22 7.27976 22 6.63803 21.673C6.07354 21.3854 5.6146 20.9265 5.32698 20.362C5 19.7202 5 18.8802 5 17.2V6"></path>
                </svg>
            </button>
            <input type="hidden" name="subtasksRowVersion" value="${rowVersion}">
        </li>
    `;
    $('#subtasksList').append(subtaskItem);
}

// Функция для добавления новой подзадачи 
function addSubtask() {
    var description = $('#newSubtaskDescription').val().trim();
    if (description === '') {
        alert('Подзадача не может быть пустой.');
        return;
    }

    var subtaskId = generateUUID(); // Генерация уникального ID
    var rowVersion = ''; // Оставляем пустым, будет заполнено сервером

    addSubtaskToList(subtaskId, description, false, rowVersion);

    $('#newSubtaskDescription').val('');
}


// Функция для удаления подзадачи из списка
function removeSubtask(subtaskId) {
    $(`li input[data-subtask-id='${subtaskId}']`).closest('li').remove();
    console.log("Удалена подзадача с ID:", subtaskId);
}

// Генератор UUID для новых подзадач
function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        var r = Math.random() * 16 | 0,
            v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

function getSubtasksData() {
    var subtasks = [];
    $('#subtasksList li').each(function () {
        // Получаем subtaskId из кнопки удаления
        var subtaskId = $(this).find('.remove-subtask-button').data('subtask-id') || '00000000-0000-0000-0000-000000000000';
        var description = $(this).find('input[type="text"]').val();
        var isCompleted = $(this).find('input[type="checkbox"]').is(':checked');
        var rowVersion = $(this).find('input[name="subtasksRowVersion"]').val() || 'AAAAAAAAAAA='; // Дефолтное значение

        subtasks.push({
            id: subtaskId, // camelCase
            subtaskDescription: description, // camelCase
            isCompleted: isCompleted, // camelCase
            rowVersion: rowVersion // camelCase
        });
    });
    console.log("SubtasksData:", subtasks); // Для отладки
    return subtasks;
}

// Функция для обновления задачи в DOM
// Функция для обновления задачи в DOM
function updateTaskInView(task) {
    if (!task || !task.id) {
        console.error('Invalid task data:', task);
        return;
    }

    var taskElement = $('.kanban-task[data-id="' + task.id + '"]');

    if (taskElement.length) {
        console.log("Updating task:", task);

        // Обновление названия задачи
        var taskNameElement = taskElement.find('.note-task-header strong');
        if (taskNameElement.length) {
            taskNameElement.text(task.taskName);
            console.log("Название задачи обновлено.");
        } else {
            console.error('Element for taskName not found.');
        }

        // Обновление описания задачи в секции описания
        var descriptionElement = $('#descriptionSection-' + task.id + ' .description');
        if (descriptionElement.length) {
            descriptionElement.text(task.taskDescription || '');
        }

        // Обновление цвета задачи в .note-task-header
        var noteTaskHeader = taskElement.find('.note-task-header');
        if (noteTaskHeader.length) {
            noteTaskHeader.css('background-color', task.taskColor);
            console.log("Цвет .note-task-header обновлен.");

            // Обновление цвета текста внутри .note-task-header, если необходимо
            var taskNameText = noteTaskHeader.find('strong');
            if (taskNameText.length) {
                taskNameText.css('color', task.taskColor);
                console.log("Цвет текста задачи обновлен.");
            }
        } else {
            console.warn('.note-task-header элемент не найден.');
        }

        // Обновление RowVersion задачи
        taskElement.attr('data-row-version', task.rowVersion);
        console.log("RowVersion задачи обновлен.");

        // Обновление дедлайна
        var deadLineElement = taskElement.find('.dead_line');
        if (task.dueDate) {
            if (deadLineElement.length === 0) {
                // Элемент дедлайна не существует, создаём его
                deadLineElement = $('<div class="dead_line"></div>');
                taskElement.find('.note-task-buttons').append(deadLineElement);
            }
            var dueDate = new Date(task.dueDate);
            var now = new Date();
            var timeRemaining = dueDate - now;
            var isWarning = timeRemaining <= 24 * 60 * 60 * 1000 || timeRemaining < 0;
            deadLineElement.text("Дедлайн: " + dueDate.toLocaleDateString('ru-RU'));
            if (isWarning) {
                deadLineElement.addClass('warning');
            } else {
                deadLineElement.removeClass('warning');
            }
        } else {
            // Если дедлайн отсутствует, удаляем элемент дедлайна
            if (deadLineElement.length > 0) {
                deadLineElement.remove();
            }
        }

        // Обновление приоритета
        var priorityElement = taskElement.find('.priority');
        if (priorityElement.length) {
            priorityElement.text("Приоритет: " + task.priority);
            console.log("Приоритет задачи обновлен.");
        } else {
            console.warn('Priority element not found.');
        }

        // Обновление иконок в .note-task-icons
        var noteTaskIcons = taskElement.find('.note-task-icons');
        if (noteTaskIcons.length) {
            // Обновление кнопки описания
            var descriptionButton = noteTaskIcons.find('.toggle-description-button');
            if (task.taskDescription && task.taskDescription.trim() !== '') {
                if (descriptionButton.length === 0) {
                    // Кнопка описания не существует, добавляем её
                    var descriptionButtonHtml = `
                        <button type="button" class="btn btn-sm btn-link toggle-description-button" data-task-id="${task.id}">
                            <svg class="icon_task" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path d="M14 2.26953V6.40007C14 6.96012 14 7.24015 14.109 7.45406C14.2049 7.64222 14.3578 7.7952 14.546 7.89108C14.7599 8.00007 15.0399 8.00007 15.6 8.00007H19.7305M14 17H8M16 13H8M20 9.98822V17.2C20 18.8802 20 19.7202 19.673 20.362C19.3854 20.9265 18.9265 21.3854 18.362 21.673C17.7202 22 16.8802 22 15.2 22H8.8C7.11984 22 6.27976 22 5.63803 21.673C5.07354 21.3854 4.6146 20.9265 4.32698 20.362C4 19.7202 4 18.8802 4 17.2V6.8C4 5.11984 4 4.27976 4.32698 3.63803C4.6146 3.07354 5.07354 2.6146 5.63803 2.32698C6.27976 2 7.11984 2 8.8 2H12.0118C12.7455 2 13.1124 2 13.4577 2.08289C13.7638 2.15638 14.0564 2.27759 14.3249 2.44208C14.6276 2.6276 14.887 2.88703 15.4059 3.40589L18.5941 6.59411C19.113 7.11297 19.3724 7.3724 19.5579 7.67515C19.7224 7.94356 19.8436 8.2362 19.9171 8.5423C20 8.88757 20 9.25445 20 9.98822Z"></path>
                            </svg>
                        </button>
                    `;
                    noteTaskIcons.append(descriptionButtonHtml);
                }
            } else {
                if (descriptionButton.length > 0) {
                    // Кнопка описания существует, удаляем её
                    descriptionButton.remove();
                }
            }

            // Обновление кнопки комментариев
            var commentsButton = noteTaskIcons.find('.toggle-comments-button');
            if (task.comments && task.comments.length > 0) {
                if (commentsButton.length === 0) {
                    // Кнопка комментариев не существует, добавляем её
                    var commentsButtonHtml = `
                        <button type="button" class="btn btn-sm btn-link toggle-comments-button" data-task-id="${task.id}">
                            <svg class="icon_task" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path d="M7.5 10.5H7.51M12 10.5H12.01M16.5 10.5H16.51M7 18V20.3355C7 20.8684 7 21.1348 7.10923 21.2716C7.20422 21.3906 7.34827 21.4599 7.50054 21.4597C7.67563 21.4595 7.88367 21.2931 8.29976 20.9602L10.6852 19.0518C11.1725 18.662 11.4162 18.4671 11.6875 18.3285C11.9282 18.2055 12.1844 18.1156 12.4492 18.0613C12.7477 18 13.0597 18 13.6837 18H16.2C17.8802 18 18.7202 18 19.362 17.673C19.9265 17.3854 20.3854 16.9265 20.673 16.362C21 15.7202 21 14.8802 21 13.2V7.8C21 6.11984 21 5.27976 20.673 4.63803C20.3854 4.07354 19.9265 3.6146 19.362 3.32698C18.7202 3 17.8802 3 16.2 3H7.8C6.11984 3 5.27976 3 4.63803 3.32698C4.07354 3.6146 3.6146 4.07354 3.32698 4.63803C3 5.27976 3 6.11984 3 7.8V14C3 14.93 3 15.395 3.10222 15.7765C3.37962 16.8117 4.18827 17.6204 5.22354 17.8978C5.60504 18 6.07003 18 7 18ZM8 10.5C8 10.7761 7.77614 11 7.5 11C7.22386 11 7 10.7761 7 10.5C7 10.2239 7.22386 10 7.5 10C7.77614 10 8 10.2239 8 10.5ZM12.5 10.5C12.5 10.7761 12.2761 11 12 11C11.7239 11 11.5 10.7761 11.5 10.5C11.5 10.2239 11.7239 10 12 10C12.2761 10 12.5 10.2239 12.5 10.5ZM17 10.5C17 10.7761 16.7761 11 16.5 11C16.2239 11 16 10.7761 16 10.5C16 10.2239 16.2239 10 16.5 10C16.7761 10 17 10.2239 17 10.5Z"></path>
                            </svg>
                        </button>
                    `;
                    noteTaskIcons.append(commentsButtonHtml);
                }
            } else {
                if (commentsButton.length > 0) {
                    // Кнопка комментариев существует, удаляем её
                    commentsButton.remove();
                }
            }

            // При необходимости аналогично обновите кнопки подзадач и вложений

        } else {
            console.warn('.note-task-icons элемент не найден.');
        }

        // Обновление секции комментариев
        var commentsSection = $('#commentsSection-' + task.id);
        if (commentsSection.length) {
            var commentsList = commentsSection.find('ul.list-group');
            commentsList.empty();
            task.comments.forEach(function (comment) {
                var date = new Date(comment.createdAt);
                var options = {
                    year: 'numeric', month: '2-digit', day: '2-digit',
                    hour: '2-digit', minute: '2-digit', second: '2-digit'
                };
                var formattedDate = date.toLocaleString('ru-RU', options);

                // Проверяем наличие avatarUrl, если нет, используем default
                var avatarUrl = comment.avatarUrl ? comment.avatarUrl : '/avatars/default.jpg';

                var commentItem = `
                    <li class="list-group-item">
                        <div class="comm-info-group">
                            <img src="${escapeHtml(avatarUrl)}" alt="Avatar" class="avatar-image mr-2" onerror="this.onerror=null;this.src='/avatars/default.jpg';" />
                            <div class="comm-info-group">
                                <div class="comm-info">
                                    <div class="comm_author">${escapeHtml(comment.commentAuthor)}</div>
                                    <div class="comm_date">${escapeHtml(formattedDate)}</div>
                                </div>
                                <span>${escapeHtml(comment.commentText)}</span>
                            </div>
                        </div>
                    </li>
                `;
                commentsList.append(commentItem);
            });
        }

        // Обновление атрибута data-task на кнопке редактирования
        var editButton = taskElement.find('.edit-task-button');
        if (editButton.length) {
            editButton.attr('data-task', JSON.stringify(task));
            console.log('Updated data-task attribute:', editButton.attr('data-task'));
        } else {
            console.error('Edit button not found in task element.');
        }

    } else {
        console.error('Task element not found for task ID:', task.id);
    }
}



// Функция для отображения выбранной доски
function showBoard(boardId) {
    // Проверяем, нужно ли перезагрузить страницу после переноса задачи
    if (sessionStorage.getItem('reloadAfterMove') === 'true') {
        // Удаляем флаг
        sessionStorage.removeItem('reloadAfterMove');
        // Перезагружаем страницу с выбранной доской
        var newUrl = window.location.protocol + "//" + window.location.host + window.location.pathname + '?selectedBoardId=' + boardId;
        window.location.href = newUrl;
    } else {
        // Обычное переключение досок без перезагрузки
        // Скрываем все доски
        document.querySelectorAll('.board-content').forEach(function (element) {
            element.classList.remove('show', 'active');
        });

        // Отображаем выбранную доску
        var selectedBoard = document.getElementById('board-content-' + boardId);
        if (selectedBoard) {
            selectedBoard.classList.add('show', 'active');
        }

        // Обновляем активную вкладку
        document.querySelectorAll('.nav-link').forEach(function (element) {
            element.classList.remove('active');
        });
        var activeNavLink = document.querySelector('.nav-link[onclick="showBoard(\'' + boardId + '\')"]');
        if (activeNavLink) {
            activeNavLink.classList.add('active');
        }

        // Обновляем URL без перезагрузки страницы
        var newUrl = window.location.protocol + "//" + window.location.host + window.location.pathname + '?selectedBoardId=' + boardId;
        window.history.replaceState({ path: newUrl }, '', newUrl);
    }
}

// Функция для редактирования названия доски
function editBoardName(boardId) {
    var boardNameElement = document.getElementById('board-name-' + boardId);
    var currentName = boardNameElement.textContent;
    var newName = prompt("Введите новое название доски:", currentName);

    if (newName && newName.trim() !== "") {
        $.ajax({
            url: '/Kanban/RenameBoard',
            method: 'POST',
            data: {
                id: boardId,
                newName: newName
            },
            success: function () {
                boardNameElement.textContent = newName;
                alert('Название доски обновлено успешно');
            },
            error: function () {
                alert('Ошибка при обновлении названия доски');
            }
        });
    }
}

// Функция для удаления доски
function deleteBoard(boardId) {
    if (confirm("Вы действительно хотите удалить эту доску?")) {
        $.ajax({
            url: '/Kanban/DeleteBoard',
            method: 'POST',
            data: {
                id: boardId
            },
            success: function () {
                location.reload();
            },
            error: function () {
                alert('Ошибка при удалении доски');
            }
        });
    }
}


// Открыть модальное окно для редактирования колонки
function editColumnName(columnId) {
    var columnElement = document.querySelector('[data-id="' + columnId + '"]');
    var currentName = columnElement.querySelector('.column-header h4').textContent;
    var currentOrder = parseInt(columnElement.getAttribute('data-order')) + 1; // Начинаем с 1
    var currentColor = columnElement.style.backgroundColor;

    // Преобразуем цвет из RGB в HEX
    var rgb = currentColor.match(/\d+/g);
    var hexColor = rgb && rgb.length === 3 ? '#' + ((1 << 24) + (parseInt(rgb[0]) << 16) + (parseInt(rgb[1]) << 8) + parseInt(rgb[2])).toString(16).slice(1) : "#ffffff";

    document.getElementById('editColumnId').value = columnId;
    document.getElementById('editColumnName').value = currentName;
    document.getElementById('editColumnOrder').value = currentOrder;
    document.getElementById('editColumnColor').value = hexColor;

    $('#editColumnModal').modal('show');
}

// Сохранить изменения колонки
function saveColumnChanges() {
    var columnId = document.getElementById('editColumnId').value;
    var newName = document.getElementById('editColumnName').value;
    var newOrder = parseInt(document.getElementById('editColumnOrder').value) - 1; // Преобразуем обратно к 0-индексации
    var newColor = document.getElementById('editColumnColor').value;

    if (newName && newOrder >= 0) {
        $.ajax({
            url: '/Kanban/RenameReorderAndRecolorColumn',
            method: 'POST',
            data: {
                columnId: columnId,
                newName: newName,
                newOrder: newOrder,
                newColor: newColor
            },
            success: function () {
                $('#editColumnModal').modal('hide'); // Закрываем модальное окно
                location.reload(); // Обновляем страницу после успешного обновления
            },
            error: function () {
                alert('Ошибка при обновлении колонки');
            }
        });
    } else {
        alert('Пожалуйста, введите корректные данные.');
    }
}

// Функция для удаления колонки
function deleteColumn(columnId) {
    if (confirm("Вы действительно хотите удалить эту колонку?")) {
        $.ajax({
            url: '/Kanban/DeleteColumn',
            method: 'POST',
            data: {
                columnId: columnId
            },
            success: function () {
                location.reload();
            },
            error: function () {
                alert('Ошибка при удалении колонки');
            }
        });
    }
}

// Функция для редактирования задачи
function editTask(taskId) {
    var taskElement = document.querySelector('.kanban-task[data-id="' + taskId + '"]');
    var taskName = taskElement.querySelector('strong').textContent;
    var taskDescription = taskElement.querySelector('small').textContent;
    var taskColor = document.getElementById('editTaskColor').value;

    var dueDateElement = taskElement.querySelector('div:nth-of-type(1)');
    var priorityElement = taskElement.querySelector('div:nth-of-type(2)');

    var dueDate = dueDateElement ? dueDateElement.textContent.replace('Дедлайн: ', '') : '';
    var priority = priorityElement ? priorityElement.textContent.replace('Приоритет: ', '') : '';

    var rgb = taskColor.match(/\d+/g);
    var hexColor = rgb && rgb.length === 3 ? '#' + ((1 << 24) + (parseInt(rgb[0]) << 16) + (parseInt(rgb[1]) << 8) + parseInt(rgb[2])).toString(16).slice(1) : "#ffffff";

    var columnId = taskElement.closest('.kanban-column').getAttribute('data-id');

    // Проверка наличия элементов перед установкой значений
    if (document.getElementById('editTaskId')) {
        document.getElementById('editTaskId').value = taskId;
    }

    if (document.getElementById('editTaskColumnId')) {
        document.getElementById('editTaskColumnId').value = columnId;
    }

    if (document.getElementById('editTaskName')) {
        document.getElementById('editTaskName').value = taskName;
    }

    if (document.getElementById('editTaskDescription')) {
        document.getElementById('editTaskDescription').value = taskDescription;
    }

    if (document.getElementById('editTaskColor')) {
        document.getElementById('editTaskColor').value = hexColor;
    }

    if (document.getElementById('editDueDate')) {
        document.getElementById('editDueDate').value = dueDate;
    }

    if (document.getElementById('editPriority')) {
        document.getElementById('editPriority').value = priority;
    }

    // Показываем модальное окно только если все элементы существуют
    if ($('#editTaskModal').length) {
        $('#editTaskModal').modal('show');
    } else {
        console.error("Modal not found.");
    }
}


// Функция для удаления задачи
function deleteTask(taskId) {
    if (confirm("Вы действительно хотите удалить эту задачу?")) {
        $.ajax({
            url: '/Kanban/DeleteTask',
            method: 'POST',
            data: {
                taskId: taskId,
                __RequestVerificationToken: $('input[name="__RequestVerificationToken"]').val()
            },
            success: function () {
                // Удаляем задачу из DOM без перезагрузки страницы
                var taskElement = $('.kanban-task[data-id="' + taskId + '"]');
                if (taskElement.length) {
                    taskElement.remove();
                }
            },
            error: function () {
                alert('Ошибка при удалении задачи');
            }
        });
    }
}

// Функция для обновления задачи в DOM
function updateTaskInView(task) {
    if (!task || !task.id) {
        console.error('Invalid task data:', task);
        return;
    }

    var taskElement = $('.kanban-task[data-id="' + task.id + '"]');

    if (taskElement.length) {
        console.log("Updating task:", task);

        // Обновление названия задачи
        var taskNameElement = taskElement.find('.note-task-header strong');
        if (taskNameElement.length) {
            taskNameElement.text(task.taskName);
            console.log("Название задачи обновлено.");
        } else {
            console.error('Element for taskName not found.');
        }

        // Обновление описания задачи в секции описания
        var descriptionElement = $('#descriptionSection-' + task.id + ' .description');
        if (descriptionElement.length) {
            descriptionElement.text(task.taskDescription || '');
        }

        // Обновление цвета задачи в .note-task-header
        var noteTaskHeader = taskElement.find('.note-task-header');
        if (noteTaskHeader.length) {
            noteTaskHeader.css('background-color', task.taskColor);
            console.log("Цвет .note-task-header обновлен.");

            // Обновление цвета текста внутри .note-task-header, если необходимо
            var taskNameText = noteTaskHeader.find('strong');
            if (taskNameText.length) {
                taskNameText.css('color', task.taskColor);
                console.log("Цвет текста задачи обновлен.");
            }
        } else {
            console.warn('.note-task-header элемент не найден.');
        }

        // Обновление RowVersion задачи
        taskElement.attr('data-row-version', task.rowVersion);
        console.log("RowVersion задачи обновлен.");

        // Обновление дедлайна
        var deadLineElement = taskElement.find('.dead_line');
        if (task.dueDate) {
            if (deadLineElement.length === 0) {
                // Элемент дедлайна не существует, создаём его
                deadLineElement = $('<div class="dead_line"></div>');
                taskElement.find('.note-task-buttons').append(deadLineElement);
            }
            var dueDate = new Date(task.dueDate);
            var now = new Date();
            var timeRemaining = dueDate - now;
            var isWarning = timeRemaining <= 24 * 60 * 60 * 1000 || timeRemaining < 0;
            deadLineElement.text("Дедлайн: " + dueDate.toLocaleDateString('ru-RU'));
            if (isWarning) {
                deadLineElement.addClass('warning');
            } else {
                deadLineElement.removeClass('warning');
            }
        } else {
            // Если дедлайн отсутствует, удаляем элемент дедлайна
            if (deadLineElement.length > 0) {
                deadLineElement.remove();
            }
        }

        // Обновление приоритета
        var priorityElement = taskElement.find('.priority');
        if (priorityElement.length) {
            priorityElement.text("Приоритет: " + task.priority);
            console.log("Приоритет задачи обновлен.");
        } else {
            console.warn('Priority element not found.');
        }

        // Обновление иконок в .note-task-icons
        var noteTaskIcons = taskElement.find('.note-task-icons');
        if (noteTaskIcons.length) {
            // Обновление кнопки описания
            var descriptionButton = noteTaskIcons.find('.toggle-description-button');
            if (task.taskDescription && task.taskDescription.trim() !== '') {
                if (descriptionButton.length === 0) {
                    // Кнопка описания не существует, добавляем её
                    var descriptionButtonHtml = `
                        <button type="button" class="btn btn-sm btn-link toggle-description-button" data-task-id="${task.id}">
                            <svg class="icon_task" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path d="M14 2.26953V6.40007C14 6.96012 14 7.24015 14.109 7.45406C14.2049 7.64222 14.3578 7.7952 14.546 7.89108C14.7599 8.00007 15.0399 8.00007 15.6 8.00007H19.7305M14 17H8M16 13H8M20 9.98822V17.2C20 18.8802 20 19.7202 19.673 20.362C19.3854 20.9265 18.9265 21.3854 18.362 21.673C17.7202 22 16.8802 22 15.2 22H8.8C7.11984 22 6.27976 22 5.63803 21.673C5.07354 21.3854 4.6146 20.9265 4.32698 20.362C4 19.7202 4 18.8802 4 17.2V6.8C4 5.11984 4 4.27976 4.32698 3.63803C4.6146 3.07354 5.07354 2.6146 5.63803 2.32698C6.27976 2 7.11984 2 8.8 2H12.0118C12.7455 2 13.1124 2 13.4577 2.08289C13.7638 2.15638 14.0564 2.27759 14.3249 2.44208C14.6276 2.6276 14.887 2.88703 15.4059 3.40589L18.5941 6.59411C19.113 7.11297 19.3724 7.3724 19.5579 7.67515C19.7224 7.94356 19.8436 8.2362 19.9171 8.5423C20 8.88757 20 9.25445 20 9.98822Z"></path>
                            </svg>
                        </button>
                    `;
                    noteTaskIcons.append(descriptionButtonHtml);
                }
            } else {
                if (descriptionButton.length > 0) {
                    // Кнопка описания существует, удаляем её
                    descriptionButton.remove();
                }
            }

            // Обновление кнопки комментариев
            var commentsButton = noteTaskIcons.find('.toggle-comments-button');
            if (task.comments && task.comments.length > 0) {
                if (commentsButton.length === 0) {
                    // Кнопка комментариев не существует, добавляем её
                    var commentsButtonHtml = `
                        <button type="button" class="btn btn-sm btn-link toggle-comments-button" data-task-id="${task.id}">
                            <svg class="icon_task" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path d="M7.5 10.5H7.51M12 10.5H12.01M16.5 10.5H16.51M7 18V20.3355C7 20.8684 7 21.1348 7.10923 21.2716C7.20422 21.3906 7.34827 21.4599 7.50054 21.4597C7.67563 21.4595 7.88367 21.2931 8.29976 20.9602L10.6852 19.0518C11.1725 18.662 11.4162 18.4671 11.6875 18.3285C11.9282 18.2055 12.1844 18.1156 12.4492 18.0613C12.7477 18 13.0597 18 13.6837 18H16.2C17.8802 18 18.7202 18 19.362 17.673C19.9265 17.3854 20.3854 16.9265 20.673 16.362C21 15.7202 21 14.8802 21 13.2V7.8C21 6.11984 21 5.27976 20.673 4.63803C20.3854 4.07354 19.9265 3.6146 19.362 3.32698C18.7202 3 17.8802 3 16.2 3H7.8C6.11984 3 5.27976 3 4.63803 3.32698C4.07354 3.6146 3.6146 4.07354 3.32698 4.63803C3 5.27976 3 6.11984 3 7.8V14C3 14.93 3 15.395 3.10222 15.7765C3.37962 16.8117 4.18827 17.6204 5.22354 17.8978C5.60504 18 6.07003 18 7 18ZM8 10.5C8 10.7761 7.77614 11 7.5 11C7.22386 11 7 10.7761 7 10.5C7 10.2239 7.22386 10 7.5 10C7.77614 10 8 10.2239 8 10.5ZM12.5 10.5C12.5 10.7761 12.2761 11 12 11C11.7239 11 11.5 10.7761 11.5 10.5C11.5 10.2239 11.7239 10 12 10C12.2761 10 12.5 10.2239 12.5 10.5ZM17 10.5C17 10.7761 16.7761 11 16.5 11C16.2239 11 16 10.7761 16 10.5C16 10.2239 16.2239 10 16.5 10C16.7761 10 17 10.2239 17 10.5Z"></path>
                            </svg>
                        </button>
                    `;
                    noteTaskIcons.append(commentsButtonHtml);
                }
            } else {
                if (commentsButton.length > 0) {
                    // Кнопка комментариев существует, удаляем её
                    commentsButton.remove();
                }
            }

            // При необходимости аналогично обновите кнопки подзадач и вложений

        } else {
            console.warn('.note-task-icons элемент не найден.');
        }

        // Обновление секции комментариев
        var commentsSection = $('#commentsSection-' + task.id);
        if (commentsSection.length) {
            var commentsList = commentsSection.find('ul.list-group');
            commentsList.empty();
            task.comments.forEach(function (comment) {
                var date = new Date(comment.createdAt);
                var options = {
                    year: 'numeric', month: '2-digit', day: '2-digit',
                    hour: '2-digit', minute: '2-digit', second: '2-digit'
                };
                var formattedDate = date.toLocaleString('ru-RU', options);

                // Проверяем наличие avatarUrl, если нет, используем default
                var avatarUrl = comment.avatarUrl ? comment.avatarUrl : '/avatars/default.jpg';

                var commentItem = `
                    <li class="list-group-item">
                        <div class="comm-info-group">
                            <img src="${escapeHtml(avatarUrl)}" alt="Avatar" class="avatar-image mr-2" onerror="this.onerror=null;this.src='/avatars/default.jpg';" />
                            <div class="comm-info">
                                <div class="comm">
                                    <div class="comm_author">${escapeHtml(comment.commentAuthor)}</div>
                                    <div class="comm_date">${escapeHtml(formattedDate)}</div>
                                </div>
                                <span>${escapeHtml(comment.commentText)}</span>
                            </div>
                        </div>
                    </li>
                `;
                commentsList.append(commentItem);
            });
        }

        // Обновление атрибута data-task на кнопке редактирования
        var editButton = taskElement.find('.edit-task-button');
        if (editButton.length) {
            editButton.attr('data-task', JSON.stringify(task));
            console.log('Updated data-task attribute:', editButton.attr('data-task'));
        } else {
            console.error('Edit button not found in task element.');
        }

    } else {
        console.error('Task element not found for task ID:', task.id);
    }
}


// Функция добавления нового комментария
function addComment() {
    var taskId = $('#editTaskId').val();
    var commentAuthor = loggedUser; // Используем переменную loggedUser
    var commentText = $('#newCommentText').val().trim();
    var rowVersion = $('#editTaskRowVersion').val();

    // Проверка наличия loggedUser
    if (!commentAuthor || commentAuthor === "Гость") {
        commentAuthor = prompt('Пожалуйста, введите ваше имя для добавления комментария:');
        if (!commentAuthor) {
            alert('Имя автора комментария обязательно.');
            return;
        }
        // Если пользователь ввёл своё имя, вы можете решить, сохранять ли его для будущих комментариев
        // Например, отправить его на сервер или сохранить в локальном хранилище
    }

    if (commentText === '') {
        alert('Комментарий не может быть пустым.');
        return;
    }

    $.ajax({
        url: '/Kanban/AddComment',
        method: 'POST',
        contentType: 'application/json',
        data: JSON.stringify({
            TaskId: taskId,
            CommentAuthor: commentAuthor,
            CommentText: commentText,
            RowVersion: rowVersion
        }),
        success: function (response) {
            console.log(response); // Для отладки

            if (response.comment) {
                var comment = response.comment;

                // Добавляем комментарий в список с avatarUrl
                addCommentToList(
                    comment.id,
                    comment.commentAuthor,
                    comment.commentText,
                    comment.createdAt,
                    comment.rowVersion,
                    comment.avatarUrl // Передаём avatarUrl
                );

                // Обновляем RowVersion задачи
                $('#editTaskRowVersion').val(response.rowVersion);

                // Очищаем поле ввода
                $('#newCommentText').val('');
            } else {
                console.error('Comment data is missing in the response.');
            }
        },
        error: function (xhr) {
            // Обработка ошибок
            alert('Произошла ошибка при добавлении комментария.');
        }
    });
}

// Функция для удаления комментария
function deleteComment(commentId, commentRowVersion) {
    if (confirm("Вы действительно хотите удалить этот комментарий?")) {
        $.ajax({
            url: '/Kanban/DeleteComment',
            method: 'POST',
            contentType: 'application/json',
            data: JSON.stringify({
                CommentId: commentId,
                RowVersion: commentRowVersion
            }),
            success: function (response) {
                console.log("DeleteComment Response:", response); // Для отладки

                if (response.message) {
                    alert(response.message);

                    // Удаляем комментарий из списка
                    $(`li[data-id='${commentId}']`).remove();

                    // Обновляем RowVersion задачи, если он был обновлён
                    if (response.RowVersion) {
                        $('#editTaskRowVersion').val(response.RowVersion);
                    }
                } else {
                    console.error('Unexpected response format.');
                }
            },
            error: function (xhr) {
                if (xhr.status === 409) {
                    alert(xhr.responseJSON.message);
                    location.reload();
                } else if (xhr.status === 400) {
                    var errors = xhr.responseJSON.errors || [];
                    var message = xhr.responseJSON.message || 'Ошибки при удалении комментария.';
                    if (errors.length > 0) {
                        alert(message + '\n' + errors.join('\n'));
                    } else {
                        alert(message);
                    }
                } else {
                    alert('Произошла ошибка при удалении комментария.');
                }
            }
        });
    }
}

// Функция для экранирования HTML (предотвращение XSS)
function escapeHtml(text) {
    var map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return text ? text.replace(/[&<>"']/g, function (m) { return map[m]; }) : '';
}

// Функция для добавления комментария в список комментариев модального окна
function addCommentToList(id, author, text, createdAt, rowVersion, avatarUrl) {
    console.log("addCommentToList called with id:", id);

    // Парсим дату
    var date = new Date(createdAt);
    // Форматируем дату
    var options = {
        year: 'numeric', month: '2-digit', day: '2-digit',
        hour: '2-digit', minute: '2-digit'
    };
    var formattedDate = date.toLocaleString('ru-RU', options);

    // Если avatarUrl не передан, используем стандартный путь
    if (!avatarUrl) {
        avatarUrl = '/avatars/default.jpg';
    }

    var commentItem = `
        <li class="list-group-item" data-id="${escapeHtml(id)}">
            <div class="comm-info-group">
                <div class="left-side-comm">
                    <img src="${escapeHtml(avatarUrl)}" alt="Avatar" class="avatar-image mr-2" onerror="this.onerror=null;this.src='/avatars/default.jpg';" />
                    <div class="comm-info">
                        <div class="comm">
                            <div class="comm_author">${escapeHtml(author)}</div>
                            <div class="comm_date">${escapeHtml(formattedDate)}</div>
                        </div>
                        <span>${escapeHtml(text)}</span>
                    </div>
                </div>

                <button class="remove-comment-button" data-comment-id="${escapeHtml(id)}" data-row-version="${escapeHtml(rowVersion)}" title="Удалить комментарий">
                    <svg class="icon_delete" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path d="M16 6V5.2C16 4.0799 16 3.51984 15.782 3.09202C15.5903 2.71569 15.2843 2.40973 14.908 2.21799C14.4802 2 13.9201 2 12.8 2H11.2C10.0799 2 9.51984 2 9.09202 2.21799C8.71569 2.40973 8.40973 2.71569 8.21799 3.09202C8 3.51984 8 4.0799 8 5.2V6M3 6H21M19 6V17.2C19 18.8802 19 19.7202 18.673 20.362C18.3854 20.9265 17.9265 21.3854 17.362 21.673C16.7202 22 15.8802 22 14.2 22H9.8C8.11984 22 7.27976 22 6.63803 21.673C6.07354 21.3854 5.6146 20.9265 5.32698 20.362C5 19.7202 5 18.8802 5 17.2V6"></path>
                    </svg>

            </div>
        </li>
    `;
    $('#commentsList').append(commentItem);
}

// Функционал для работы с файлами
// Функция для переключения секции вложений
function toggleAttachments(taskId) {
    $('#attachmentsSection-' + taskId).toggle();
}

// Функция для загрузки вложений
function uploadAttachments(taskId) {
    var input = $('#attachmentsInput-' + taskId)[0];
    var files = input.files;
    if (files.length === 0) {
        alert('Файлы не выбраны.');
        return;
    }

    var formData = new FormData();
    for (var i = 0; i < files.length; i++) {
        formData.append('Files', files[i]);
    }
    formData.append('TaskId', taskId);

    $.ajax({
        url: '/Kanban/UploadAttachments',
        method: 'POST',
        data: formData,
        processData: false,
        contentType: false,
        success: function (response) {
            console.log("Attachments uploaded successfully:", response);
            if (response.files) {
                response.files.forEach(function (file) {
                    var fileItem = `
                        <li class="list-group-item">
                            <a href="${file.fileUrl}" target="_blank">${escapeHtml(file.fileName)}</a>
                        </li>
                    `;
                    $('#attachmentsSection-' + taskId + ' ul.list-group').append(fileItem);
                });
            }
            alert('Файлы успешно загружены.');
            // Очистка инпута после загрузки
            $('#attachmentsInput-' + taskId).val('');
        },
        error: function (xhr, status, error) {
            console.error('Error uploading attachments:', xhr.responseText, error);
            alert('Произошла ошибка при загрузке файлов. Пожалуйста, попробуйте снова.');
        }
    });
}

// Функция для переключения отображения секции комментариев
function toggleComments(taskId) {
    $('#commentsSection-' + taskId).toggle();
}

// Функция для переключения отображения секции описания
function toggleDescription(taskId) {
    $('#descriptionSection-' + taskId).toggle();
}

// Функция для переключения отображения секции подзадач
function toggleSubtasks(taskId) {
    $('#subtasksSection-' + taskId).toggle();
}

function openMoveTaskModal(taskId) {
    // Устанавливаем ID задачи в скрытое поле
    $('#moveTaskId').val(taskId);

    // Сбрасываем выбор доски и колонок
    $('#targetBoard').val('');
    $('#targetColumn').empty().append('<option value="">Выберите колонку</option>');

    // Показываем модальное окно
    $('#moveTaskModal').modal('show');
}

// Функция для закрытия всех открытых модальных окон
function closeAllModals(callback) {
    var openModals = $('.modal.show');
    if (openModals.length === 0) {
        if (callback) callback();
        return;
    }

    var closedCount = 0;
    openModals.each(function () {
        $(this).modal('hide').on('hidden.bs.modal', function () {
            closedCount++;
            if (closedCount === openModals.length && callback) {
                callback();
            }
        });
    });
}


