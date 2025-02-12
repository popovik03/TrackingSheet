
// Обновленная функция для добавления подзадачи в список с RowVersion
function addSubtaskToList(id, description, isCompleted, rowVersion) {
    var subtaskItem = `
        <li class="list-group-item d-flex justify-content-between align-items-center">
            <div>
                <input type="checkbox" class="subtask-checkbox" ${isCompleted ? 'checked' : ''}>
                <input type="text" class="form-control subtask-description" value="${escapeHtml(description)}">
            </div>
            <button type="button" class="btn btn-danger btn-sm remove-subtask-button" data-subtask-id="${id}" data-row-version="${rowVersion}">Удалить</button>
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
            id: subtaskId, 
            subtaskDescription: description, 
            isCompleted: isCompleted, 
            rowVersion: rowVersion 
        });
    });
    console.log("SubtasksData:", subtasks); // Для отладки
    return subtasks;
}

function updateTaskInView(task) {
    if (!task || !task.id) {
        console.error('Invalid task data:', task);
        return;
    }

    var taskElement = $('.kanban-task[data-id="' + task.id + '"]');

    if (taskElement.length) {
        // Обновление основных данных задачи
        taskElement.find('strong').text(task.taskName);
        taskElement.find('small').text(task.taskDescription);
        taskElement.css('background-color', task.taskColor);
        taskElement.attr('data-row-version', task.rowVersion);

        // Обновление подзадач (если отображаются на карточке задачи)
        var subtasksList = taskElement.find('.subtasks-list');
        if (subtasksList.length) {
            subtasksList.empty();
            task.subtasks.forEach(function (subtask) {
                var subtaskItem = `<li>${escapeHtml(subtask.subtaskDescription)} ${subtask.isCompleted ? '(Выполнено)' : ''}</li>`;
                subtasksList.append(subtaskItem);
            });
        }

        // Обновляем атрибут data-task на кнопке редактирования
        var editButton = taskElement.find('.edit-task-button');
        if (editButton.length) {
            editButton.attr('data-task', JSON.stringify(task));
            console.log('Updated data-task attribute in updateTaskInView:', editButton.attr('data-task'));
        } else {
            console.error('Edit button not found in task element.');
        }

        // Обновление других данных задачи при необходимости
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
    var taskColor = taskElement.style.backgroundColor;
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

//функция добавления комментариев в список 
function addCommentToList(id, author, text, createdAt, rowVersion, avatarUrl) {
    // Парсим дату
    var date = new Date(createdAt);
    // Добавляем смещение +5 часов (если необходимо)
    date.setHours(date.getHours() + 5);
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
    <li class="list-group-item custom-comment-item">
        <div class="d-flex align-items-center">
            <img src="${avatarUrl}" alt="Avatar" class="avatar-image" onerror="this.onerror=null;this.src='/avatars/default.jpg';">
            <div class="comment-text">
                <strong>${escapeHtml(author)}</strong> (${escapeHtml(formattedDate)}):
                <p>${escapeHtml(text)}</p>
            </div>
        </div>
        <button type="button" class="remove-comment-button" data-comment-id="${id}" data-row-version="${rowVersion}">
            <img src="/icons/delete-new.png" alt="Удалить" class="delete-icon">
        </button>
        <input type="hidden" name="commentsRowVersion" value="${rowVersion}">
    </li>
`;
$('#commentsList').append(commentItem);


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
    $('#targetColumn').empty().append('<option value="">-- Выберите колонку --</option>');

    // Показываем модальное окно
    $('#moveTaskModal').modal('show');
}

