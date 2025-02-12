function setAddColumnModalData(boardId) {
    $('#addColumnBoardId').val(boardId);
}

function setEditColumnModalData(columnId, columnName, order, columnColor) {
    $('#editColumnId').val(columnId);
    $('#editColumnName').val(columnName);
    $('#editColumnOrder').val(order);
    $('#editColumnColor').val(columnColor);
}

function setAddTaskModalData(columnId) {
    $('#addTaskColumnId').val(columnId);
}

function setEditTaskModalData(task) {
    console.log("Editing task:", task);

    // Установка основных полей
    $('#editTaskId').val(task.id);
    $('#editTaskName').val(task.taskName);
    $('#editTaskDescription').val(task.taskDescription);
    $('#editTaskColor').val(task.taskColor);
    $('#editDueDate').val(task.dueDate || '');
    $('#editPriority').val(task.priority);
    $('#editTaskAuthor').val(task.taskAuthor);
    $('#editCreatedAt').val(task.createdAt);

    // Установка RowVersion
    $('#editTaskRowVersion').val(task.rowVersion);

    // Очистка списка подзадач
    //$('#subtasksList').empty();

    // Добавление подзадач в список
    //if (task.subtasks && task.subtasks.length > 0) {
    //   task.subtasks.forEach(function (subtask) {
    //        addSubtaskToList(subtask.id, subtask.subtaskDescription, subtask.isCompleted, subtask.rowVersion);
    //    });
    //}

    // Заполнение списка комментариев
    if (task.comments && task.comments.length > 0) {
        $('#commentsList').empty();
        task.comments.forEach(function (comment) {
            addCommentToList(
                comment.id,
                comment.commentAuthor,
                comment.commentText,
                comment.createdAt,
                comment.rowVersion,
                comment.avatarUrl // Передаём avatarUrl
            );
        });
    } else {
        $('#commentsList').empty();
    }

    // Устанавливаем SubtasksJson перед отправкой формы
    $('#editSubtasksJson').val(JSON.stringify(getSubtasksData()));

    // Получаем columnId из DOM
    var taskElement = $('.kanban-task[data-id="' + task.id + '"]');
    if (taskElement.length) {
        var columnId = taskElement.closest('.kanban-column').data('id');
        console.log("Setting columnId:", columnId); // Логирование для проверки
        $('#editTaskColumnId').val(columnId);
    } else {
        console.error("Task element not found for taskId:", task.id);
    }

    // Показываем модальное окно
    $('#editTaskModal').modal('show');
}
$(document).ready(function () {
    console.log("JavaScript загружен и готов к работе");

    // Обработчик изменения выбора доски
    $('#targetBoard').on('change', function () {
        var selectedBoardId = $(this).val();
        var targetColumn = $('#targetColumn');
        targetColumn.empty().append('<option value="">Выберите колонку</option>');

        if (selectedBoardId) {
            var board = kanbanBoards.find(function (b) { return b.id === selectedBoardId; });
            if (board && board.columns) {
                board.columns.forEach(function (column) {
                    targetColumn.append('<option value="' + column.id + '">' + column.column + '</option>');
                });
            }
        }
    });

    // Обработчик отправки формы переноса задачи
    $('#moveTaskForm').on('submit', function (event) {
        event.preventDefault(); // Останавливаем стандартную отправку формы

        var formData = {
            taskId: $('#moveTaskId').val(),
            targetBoardId: $('#targetBoard').val(),
            targetColumnId: $('#targetColumn').val(),
            __RequestVerificationToken: $('input[name="__RequestVerificationToken"]').val()
        };

        // Валидация на клиенте
        if (!formData.taskId || !formData.targetBoardId || !formData.targetColumnId) {
            $('#moveTaskValidationMessage').text('Пожалуйста, заполните все поля.').show();
            return;
        }

        $('#moveTaskValidationMessage').hide();

        $.ajax({
            url: '/Kanban/MoveTaskToAnotherBoard',
            method: 'POST',
            data: formData,
            success: function (response) {
                console.log("Task moved successfully:", response);
                if (response.success && response.updatedTask) {
                    // Обновляем задачу в текущем представлении
                    updateTaskInView(response.updatedTask);

                    // Если задача перемещена в другую доску, удаляем её из текущего представления
                    var currentBoardId = $('#board-content-' + response.updatedTask.boardId).length ? response.updatedTask.boardId : null;
                    if (currentBoardId && response.updatedTask.boardId !== selectedBoardId) {
                        $('.kanban-task[data-id="' + response.updatedTask.id + '"]').remove();
                    }

                    // Обновляем RowVersion задачи
                    $('.kanban-task[data-id="' + response.updatedTask.id + '"]').attr('data-row-version', response.updatedTask.rowVersion);

                    // Устанавливаем флаг для перезагрузки страницы при следующем переключении доски
                    sessionStorage.setItem('reloadAfterMove', 'true');

                    // Закрываем модальное окно
                    $('#moveTaskModal').modal('hide');

                    alert('Задача успешно перенесена.');
                } else {
                    alert('Ошибка при перенесении задачи: ' + (response.message || 'Неизвестная ошибка.'));
                }
            },
            error: function (xhr, status, error) {
                console.error('Error moving task:', xhr.responseText, error);
                if (xhr.status === 409) { // Conflict
                    alert(xhr.responseJSON.message);
                    location.reload();
                } else {
                    alert('Произошла ошибка при перенесении задачи. Пожалуйста, попробуйте снова.');
                }
            }
        });
    });


    // Новый обработчик клика на блок задачи
    $(document).on('click', '.note-task-header', function (event) {
        // Проверяем, что клик не был по кнопке или интерактивному элементу внутри задачи
        if (!$(event.target).closest('button, .btn, input, label').length) {
            // Извлекаем JSON-данные задачи из кнопки редактирования внутри блока
            var taskDataJson = $(this).find('.edit-task-button').attr('data-task');
            console.log("Task Data JSON from task block:", taskDataJson);

            if (taskDataJson) {
                try {
                    var task = JSON.parse(taskDataJson);
                    setEditTaskModalData(task);
                } catch (e) {
                    console.error("Ошибка при парсинге JSON данных задачи:", e);
                }
            } else {
                console.error("Не найдено data-task в кнопке редактирования внутри блока задачи.");
            }
        }
    });
    // Обработчик клика для кнопок редактирования задач
    $(document).ready(function () {
        // Обработчик клика по кнопке редактирования задачи
        $('.edit-task-button').on('click', function () {
            var taskDataJson = $(this).attr('data-task');
            console.log("Task Data JSON:", taskDataJson);

            if (!taskDataJson) {
                console.error('No task data found in data-task attribute.');
                return;
            }

            var task = JSON.parse(taskDataJson);
            console.log("Parsed Task Data:", task);

            // Заполняем поля модального окна
            $('#editTaskId').val(task.id);
            $('#editTaskName').val(task.taskName);
            $('#editTaskDescription').val(task.taskDescription);
            $('#editTaskColor').val(task.taskColor);
            $('#editDueDate').val(task.dueDate ? task.dueDate.split('T')[0] : '');
            $('#editPriority').val(task.priority);
            $('#editTaskAuthor').val(task.taskAuthor);
            $('#editCreatedAt').val(task.createdAt);
            $('#editTaskRowVersion').val(task.rowVersion);
            $('#editTaskColumnId').val(task.columnId);

            // Очищаем и заполняем подзадачи
            $('#subtasksList').empty();
            if (task.subtasks && task.subtasks.length > 0) {
                task.subtasks.forEach(function (subtask) {
                    addSubtaskToList(subtask.id, subtask.subtaskDescription, subtask.isCompleted, subtask.rowVersion);
                });
            }

            // Заполняем комментарии
            if (task.comments && task.comments.length > 0) {
                $('#commentsList').empty();
                task.comments.forEach(function (comment) {
                    addCommentToList(
                        comment.id,
                        comment.commentAuthor,
                        comment.commentText,
                        comment.createdAt,
                        comment.rowVersion,
                        comment.avatarUrl
                    );
                });
            } else {
                $('#commentsList').empty();
            }

            // Устанавливаем SubtasksJson перед отправкой формы
            $('#editSubtasksJson').val(JSON.stringify(getSubtasksData()));


        });
    });

    // Обработчик отправки формы редактирования задачи
    $('#editTaskForm').on('submit', function (event) {
        event.preventDefault(); // Останавливаем стандартную отправку формы

        var form = $(this);
        var formData = new FormData(this);

        // Добавляем подзадачи в виде JSON-строки
        //formData.set('subtasksJson', JSON.stringify(getSubtasksData())); // camelCase

        // Проверка обязательных полей
        var taskName = $('#editTaskName').val().trim();
        var taskDescription = $('#editTaskDescription').val().trim();
        var columnId = $('#editTaskColumnId').val();

        if (!taskName || !columnId) {
            alert('Пожалуйста, заполните все обязательные поля.');
            return;
        }

        // Отправляем запрос AJAX
        $.ajax({
            url: '/Kanban/EditTask',
            method: 'POST',
            data: formData,
            processData: false,
            contentType: false,
            success: function (response) {
                console.log("Task updated successfully:", response);

                if (response.updatedTask) {
                    console.log("Updated Task:", response.updatedTask);

                    // Обновляем данные задачи в DOM
                    updateTaskInView(response.updatedTask);

                    // Обновляем RowVersion
                    $('#editTaskRowVersion').val(response.updatedTask.rowVersion);

                    // Закрываем модальное окно
                    $('#editTaskModal').modal('hide');
                } else {
                    console.error('Updated task data is missing in the response.');
                    alert('Произошла ошибка при обновлении задачи. Пожалуйста, попробуйте снова.');
                }
            },
            error: function (xhr, status, error) {
                console.error('Error updating task:', xhr.responseText, error);
                if (xhr.status === 400) {
                    var response = JSON.parse(xhr.responseText);
                    var errorMessages = response.errors.map(e => `${e.field}: ${e.errorMessage}`).join('\n');
                    alert(`${response.message}\n${errorMessages}`);
                } else if (xhr.status === 409) {
                    alert(xhr.responseJSON.message);
                    location.reload();
                } else {
                    alert('Произошла ошибка при обновлении задачи. Пожалуйста, попробуйте снова.');
                }
            }
        });
    });


    // Функция для получения значения параметра из URL
    function getQueryParam(name) {
        var urlParams = new URLSearchParams(window.location.search);
        return urlParams.get(name);
    }

    // Получаем selectedBoardId из URL
    var selectedBoardId = getQueryParam('selectedBoardId');
    console.log("Selected Board ID from URL:", selectedBoardId);

    if (selectedBoardId) {
        showBoard(selectedBoardId);
    } else {
        // Если selectedBoardId отсутствует, показываем первую доску по умолчанию
        var firstNavLink = document.querySelector('.nav-link');
        if (firstNavLink) {
            // Предполагается, что атрибут onclick содержит вызов showBoard('boardId')
            var match = firstNavLink.getAttribute('onclick').match(/showBoard\('(.+)'\)/);
            if (match && match[1]) {
                showBoard(match[1]);
            }
        }
    }

});



document.addEventListener('DOMContentLoaded', function () {
    document.querySelector('main').classList.add('show');
    console.log('Initializing SortableJS');

    // Инициализация сортировки для всех колонок
    document.querySelectorAll('.kanban-column').forEach(function (column) {
        new Sortable(column.querySelector('.kanban-tasks'), {
            group: 'kanban', // Разрешает перемещение между колонками с той же группой
            draggable: '.kanban-task', // Определяет, какие элементы можно перетаскивать
            animation: 150, // Анимация при перетаскивании
            ghostClass: 'sortable-ghost', // Класс для стиля "призрака" при перетаскивании
            onEnd: function (evt) {
                // Получаем идентификаторы задачи и колонок
                var taskId = evt.item.getAttribute('data-id');
                var newColumnId = evt.to.closest('.kanban-column').getAttribute('data-id');
                var oldColumnId = evt.from.closest('.kanban-column').getAttribute('data-id');
                var newIndex = evt.newIndex;

                // Проверяем, изменилась ли колонка или индекс
                if (newColumnId !== oldColumnId || evt.oldIndex !== newIndex) {
                    // Отправляем AJAX-запрос для обновления позиции задачи
                    $.ajax({
                        url: '/Kanban/MoveTask',
                        method: 'POST',
                        contentType: 'application/json',
                        data: JSON.stringify({
                            taskId: taskId,
                            newColumnId: newColumnId,
                            oldColumnId: oldColumnId,
                            newIndex: newIndex
                        }),
                        success: function (response) {
                            if (response.success) {
                                console.log('Task moved successfully');
                                if (response.rowVersion) {
                                    // Обновляем RowVersion в элементе задачи
                                    var taskElement = $('.kanban-task[data-id="' + taskId + '"]');
                                    if (taskElement.length) {
                                        taskElement.attr('data-row-version', response.rowVersion);
                                        console.log('RowVersion updated to:', response.rowVersion);
                                    } else {
                                        console.error('Task element not found in DOM.');
                                    }

                                    // Обновляем данные задачи в атрибуте data-task
                                    var editButton = taskElement.find('.edit-task-button');
                                    if (editButton.length) {
                                        var taskDataJson = editButton.attr('data-task');
                                        if (taskDataJson) {
                                            var taskData = JSON.parse(taskDataJson);
                                            taskData.rowVersion = response.rowVersion;
                                            // Обновляем columnId, если задача переместилась в другую колонку
                                            taskData.columnId = newColumnId;
                                            editButton.attr('data-task', JSON.stringify(taskData));
                                            console.log('Updated data-task attribute:', editButton.attr('data-task'));
                                        } else {
                                            console.error('No data-task attribute found on edit button.');
                                        }
                                    } else {
                                        console.error('Edit button not found in task element.');
                                    }
                                } else {
                                    console.warn('RowVersion not provided in response.');
                                }
                            } else {
                                console.error('Task move failed:', response.message);
                                alert('Ошибка при перемещении задачи: ' + response.message);
                                location.reload();
                            }
                        },
                        error: function (xhr, status, error) {
                            console.error('Error moving task:', error);
                            alert('Ошибка при перемещении задачи. Пожалуйста, попробуйте снова.');
                            location.reload();
                        }
                    });
                }
            }
        });
    });

    // Валидация форм добавления задач
    var addTaskForms = document.querySelectorAll('form[id^="addTaskForm-"]');

    addTaskForms.forEach(function (form) {
        form.addEventListener('submit', function (event) {
            // Извлекаем columnId из ID формы
            var columnId = form.id.replace('addTaskForm-', '');

            // Получаем элементы полей ввода
            var taskNameInput = document.getElementById('taskName-' + columnId);
            var taskDescriptionInput = document.getElementById('taskDescription-' + columnId);
            var validationMessage = document.getElementById('validationMessage-' + columnId);

            // Получаем значения полей
            var taskName = taskNameInput.value.trim();
            var taskDescription = taskDescriptionInput.value.trim();

            var isValid = true;
            var errorMessages = [];

            // Проверка названия задачи
            if (!taskName) {
                isValid = false;
                errorMessages.push('Пожалуйста, заполните название задачи.');
                taskNameInput.classList.add('is-invalid');
            } else {
                taskNameInput.classList.remove('is-invalid');
            }

            // Проверка описания задачи
            if (!taskDescription) {
                isValid = false;
                errorMessages.push('Пожалуйста, заполните описание задачи.');
                taskDescriptionInput.classList.add('is-invalid');
            } else {
                taskDescriptionInput.classList.remove('is-invalid');
            }

            if (!isValid) {
                event.preventDefault(); // Отменяем отправку формы
                event.stopPropagation();

                // Объединяем сообщения об ошибках
                validationMessage.innerHTML = errorMessages.join('<br>');
                validationMessage.style.display = 'block';
            } else {
                // Скрываем сообщение об ошибке, если форма валидна
                validationMessage.style.display = 'none';
                validationMessage.innerHTML = '';
            }
        });
    });

});



// Привязка события к кнопке "Отмена" для редактирования колонки
document.addEventListener('DOMContentLoaded', function () {
    

    document.querySelectorAll('.close[data-dismiss="modal"]').forEach(function (btn) {
        btn.addEventListener('click', function () {
            $(this).closest('.modal').modal('hide');
        });
    });
});



$(document).on('click', '.remove-comment-button', function () {
    var commentId = $(this).data('comment-id');
    var rowVersion = $(this).data('row-version');
    var button = $(this);
    var taskId = $('#editTaskId').val(); // Предполагается, что ID задачи хранится в скрытом поле

    if (confirm('Вы уверены, что хотите удалить этот комментарий?')) {
        $.ajax({
            url: '/Kanban/DeleteComment',
            method: 'POST',
            contentType: 'application/json',
            data: JSON.stringify({
                CommentId: commentId,
                RowVersion: rowVersion
            }),
            success: function (response) {
                // Удаляем элемент комментария из DOM
                button.closest('li').remove();

                // Обновляем RowVersion задачи, если сервер его вернул
                if (response.rowVersion) {
                    $('#editTaskRowVersion').val(response.rowVersion);
                }

                alert('Комментарий успешно удалён.');
            },
            error: function (xhr) {
                if (xhr.status === 409) { // Conflict
                    alert('Комментарий был изменён другим процессом. Пожалуйста, обновите страницу и попробуйте снова.');
                } else if (xhr.status === 404) { // Not Found
                    alert('Комментарий не найден.');
                } else {
                    alert('Произошла ошибка при удалении комментария.');
                }
            }
        });
    }
});

