$(document).ready(function () {
    // Функция для экранирования HTML
    function escapeHtml(text) {
        const map = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;'
        };
        return text.replace(/[&<>"']/g, function (m) { return map[m]; });
    }

    // Функция для отображения Toast-уведомлений
    function showToast(title, message) {
        const toastContainer = $('#toastContainer');
        if (!toastContainer.length) return;

        const toastId = 'toast-' + Date.now();
        const toastHTML = `
                <div class="toast" id="${toastId}" role="alert" aria-live="assertive" aria-atomic="true" data-delay="3000">
                    <div class="toast-header">
                        <strong class="mr-auto">${escapeHtml(title)}</strong>
                        <small>Сейчас</small>
                        <button type="button" class="ml-2 mb-1 close" data-dismiss="toast" aria-label="Close">
                            <span aria-hidden="true">&times;</span>
                        </button>
                    </div>
                    <div class="toast-body">
                        ${escapeHtml(message)}
                    </div>
                </div>
            `;
        toastContainer.append(toastHTML);
        $('#' + toastId).toast('show');

        // Удаляем Toast после его закрытия
        $('#' + toastId).on('hidden.bs.toast', function () {
            $(this).remove();
        });
    }

    // Функция для делегирования событий переключения секций
    function toggleSection(buttonClass, sectionPrefix) {
        $(document).on('click', buttonClass, function () {
            var taskId = $(this).data('task-id');
            var sectionId = `#${sectionPrefix}Section-${taskId}`;

            // Переключаем видимость секции с анимацией
            $(sectionId).slideToggle(300);

            // Меняем состояние кнопки (например, добавляем/удаляем класс 'active')
            $(this).toggleClass('active');

            // Обновляем атрибут aria-expanded
            var isExpanded = $(sectionId).is(':visible');
            $(this).attr('aria-expanded', isExpanded);
        });
    }

    // Применяем делегирование событий для всех типов кнопок
    toggleSection('.toggle-description-button', 'description');
    toggleSection('.toggle-comments-button', 'comments');
    toggleSection('.toggle-subtasks-button', 'subtasks');
    toggleSection('.toggle-attachments-button', 'attachments');

    
    // Обработчик для добавления подзадачи
    $(document).on('click', '.add-subtask-button', function () {
        const button = $(this);
        const taskId = button.data('task-id');
        const input = button.closest('.input-group').find('.add-subtask-input');
        const subtaskDescription = input.val().trim();

        if (subtaskDescription === '') {
            showToast('Ошибка', 'Описание подзадачи не может быть пустым.');
            return;
        }

        // Получаем антифродовый токен
        const antiForgeryToken = $('input[name="__RequestVerificationToken"]').val();
        if (!antiForgeryToken) {
            showToast('Ошибка', 'Произошла ошибка при добавлении подзадачи. Пожалуйста, попробуйте снова.');
            return;
        }

        // AJAX-запрос для добавления подзадачи
        $.ajax({
            url: '/Kanban/AddSubtask', // Путь к вашему контроллеру
            method: 'POST',
            headers: {
                'RequestVerificationToken': antiForgeryToken
            },
            contentType: 'application/json',
            data: JSON.stringify({
                TaskId: taskId,
                SubtaskDescription: subtaskDescription
            }),
            success: function (response) {
                if (response.success && response.subtask) {
                    const subtask = response.subtask;
                    const subtasksList = $(`#subtasksSection-${taskId} .list-group`);
                    const newSubtaskItem = `
                            <li class="list-group-item d-flex justify-content-between align-items-center">
                                <div>
                                    <input type="checkbox" class="subtask-checkbox" data-subtask-id="${subtask.id}" data-row-version="${subtask.rowVersion}" ${subtask.isCompleted ? 'checked' : ''}>
                                    <span>${escapeHtml(subtask.subtaskDescription)}</span>
                                </div>
                                <button type="button" class="remove-subtask-button" data-subtask-id="${subtask.id}" data-row-version="${subtask.rowVersion}">
                                    <svg class="icon_delete" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M16 6V5.2C16 4.0799 16 3.51984 15.782 3.09202C15.5903 2.71569 15.2843 2.40973 14.908 2.21799C14.4802 2 13.9201 2 12.8 2H11.2C10.0799 2 9.51984 2 9.09202 2.21799C8.71569 2.40973 8.40973 2.71569 8.21799 3.09202C8 3.51984 8 4.0799 8 5.2V6M3 6H21M19 6V17.2C19 18.8802 19 19.7202 18.673 20.362C18.3854 20.9265 17.9265 21.3854 17.362 21.673C16.7202 22 15.8802 22 14.2 22H9.8C8.11984 22 7.27976 22 6.63803 21.673C6.07354 21.3854 5.6146 20.9265 5.32698 20.362C5 19.7202 5 18.8802 5 17.2V6"></path>
                                    </svg>
                                </button>
                            </li>
                        `;
                    subtasksList.append(newSubtaskItem);
                    input.val(''); // Очистить поле ввода
                    showToast('Успех', 'Подзадача добавлена.');
                } else {
                    showToast('Ошибка', response.message || 'Не удалось добавить подзадачу.');
                }
            },
            error: function (xhr) {
                console.error('Ошибка при добавлении подзадачи:', xhr.responseJSON);
                showToast('Ошибка', 'Произошла ошибка при добавлении подзадачи.');
            }
        });
    });

    // Обработчик для удаления подзадачи (делегирование событий)
    $(document).on('click', '.remove-subtask-button', function () {
        const button = $(this);
        const subtaskId = button.data('subtask-id');
        const rowVersion = button.data('row-version');
        const subtaskItem = button.closest('li');

        if (!subtaskId || !rowVersion) {
            showToast('Ошибка', 'Некорректные данные для удаления подзадачи.');
            return;
        }

        // Получаем антифродовый токен
        const antiForgeryToken = $('input[name="__RequestVerificationToken"]').val();
        if (!antiForgeryToken) {
            showToast('Ошибка', 'Произошла ошибка при удалении подзадачи. Пожалуйста, попробуйте снова.');
            return;
        }

        // Деактивируем кнопку удаления, чтобы предотвратить повторные клики
        button.prop('disabled', true);
        const originalButtonHTML = button.html();
        button.html('Удаление...'); // Индикация удаления

        // AJAX-запрос для удаления подзадачи
        $.ajax({
            url: '/Kanban/DeleteSubtask',
            method: 'POST',
            headers: {
                'RequestVerificationToken': antiForgeryToken
            },
            contentType: 'application/json',
            data: JSON.stringify({
                SubtaskId: subtaskId,
                RowVersion: rowVersion
            }),
            success: function (response) {
                if (response.success) {
                    subtaskItem.remove(); // Удаляем подзадачу из DOM
                    showToast('Успех', 'Подзадача успешно удалена.');
                } else {
                    showToast('Ошибка', response.message || 'Не удалось удалить подзадачу.');
                    button.prop('disabled', false);
                    button.html(originalButtonHTML);
                }
            },
            error: function (xhr) {
                console.error('Ошибка при удалении подзадачи:', xhr);
                showToast('Ошибка', 'Произошла ошибка при удалении подзадачи.');
                button.prop('disabled', false);
                button.html(originalButtonHTML);
            }
        });
    });

    // Обработчик для отметки подзадачи как выполненной
    $(document).on('change', '.subtask-checkbox', function () {
        const checkbox = $(this);
        const subtaskId = checkbox.data('subtask-id');
        const isCompleted = checkbox.is(':checked');
        const rowVersion = checkbox.data('row-version');

        if (!subtaskId || !rowVersion) {
            showToast('Ошибка', 'Некорректные данные для обновления статуса подзадачи.');
            return;
        }

        // Получаем антифродовый токен
        const antiForgeryToken = $('input[name="__RequestVerificationToken"]').val();
        if (!antiForgeryToken) {
            showToast('Ошибка', 'Произошла ошибка при обновлении статуса подзадачи. Пожалуйста, попробуйте снова.');
            checkbox.prop('checked', !isCompleted); // Откат состояния
            return;
        }

        // Деактивируем чекбокс, чтобы предотвратить повторные клики
        checkbox.prop('disabled', true);

        // AJAX-запрос для обновления статуса подзадачи
        $.ajax({
            url: '/Kanban/UpdateSubtaskStatus',
            method: 'POST',
            headers: {
                'RequestVerificationToken': antiForgeryToken
            },
            contentType: 'application/json',
            data: JSON.stringify({
                SubtaskId: subtaskId,
                IsCompleted: isCompleted,
                RowVersion: rowVersion
            }),
            success: function (response) {
                if (response.success) {
                    if (response.subtask && response.subtask.rowVersion) {
                        checkbox.data('row-version', response.subtask.rowVersion);
                        $(`.remove-subtask-button[data-subtask-id="${subtaskId}"]`).data('row-version', response.subtask.rowVersion);
                    }
                    showToast('Успех', 'Статус подзадачи обновлён.');
                } else {
                    showToast('Ошибка', response.message || 'Не удалось обновить статус подзадачи.');
                    checkbox.prop('checked', !isCompleted); // Откат состояния
                }
            },
            error: function (xhr) {
                console.error('Ошибка при обновлении статуса подзадачи:', xhr);
                showToast('Ошибка', 'Произошла ошибка при обновлении статуса подзадачи.');
                checkbox.prop('checked', !isCompleted); // Откат состояния
            },
            complete: function () {
                checkbox.prop('disabled', false);
            }
        });
    });

});