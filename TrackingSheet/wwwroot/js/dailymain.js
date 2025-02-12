$(document).ready(function () {

    // Переменные для отслеживания измененных записей и режима редактирования
    let modifiedRecords = [];
    let isEditMode = false;

    // Инициализация DataTables
    var table = $('#journal_table').DataTable({
        "processing": true,
        "serverSide": false,
        "ajax": {
            "url": "/Home/GetDailyIncidents",
            "type": "GET",
            "dataType": "json",
            "dataSrc": ""
        },
        "columns": [
            // Если вы решили удалить столбец details-control из HTML, удалите и этот объект
            /*
            {
                "data": null,
                "className": 'details-control',
                "orderable": false,
                "searchable": false,
                "defaultContent": '<button class="details-btn">+</button>',
                "visible": false, // Скрыть столбец
                "width": "10px"
            },
            */
            {
                "data": "date",
                "name": "date",
                "render": function (data, type, row) {
                    if (type === 'display' || type === 'filter') {
                        return moment(data).format('DD/MM/YYYY HH:mm');
                    }
                    return data;
                }
            },
            {
                "data": "shift",
                "name": "shift",
                "render": function (data) {
                    return `<p>${data}</p>`;
                }
            },
            {
                "data": "vsat",
                "name": "vsat",
                "render": function (data, type, row) {
                    if (type === 'display') {
                        return `<span class="vsat-number">${data}</span>`;
                    }
                    return data;
                }
            },
            { "data": "reporter", "name": "reporter" }, // Соответствует столбцу "431"
            { "data": "well", "name": "well" },
            { "data": "run", "name": "run" },
            { "data": "savedNPT", "name": "savedNPT" },
            { "data": "problemType", "name": "problemType" },
            {
                "data": "status",
                "name": "status",
                "render": function (data, type, row) {
                    if (type === 'display' || type === 'filter') {
                        return `<p>${data}</p>`;
                    }
                    return data;
                }
            },
            {
                title: "",
                data: "file",
                name: 'attachments', // Уникальное имя для управления видимостью
                render: function (data, type, row) {
                    if (type === 'display') {
                        if (data === 1) {
                            // SVG-иконка скрепки
                            return `
                            <svg width="24px" height="24px" viewBox="0 0 24 24" fill="lightgrey" xmlns="http://www.w3.org/2000/svg">
 <path d="M17.5 5.25581V16.5C17.5 19.5376 15.0376 22 12 22C8.96243 22 6.5 19.5376 6.5 16.5V5.66667C6.5 3.64162 8.14162 2 10.1667 2C12.1917 2 13.8333 3.64162 13.8333 5.66667V16.4457C13.8333 17.4583 13.0125 18.2791 12 18.2791C10.9875 18.2791 10.1667 17.4583 10.1667 16.4457V6.65116" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
 </svg>
                        `;
                        }
                        return '';
                    }
                    return data;
                },

                visible: true, // Видна по умолчанию
                className: 'dt-center', // Центрирование содержимого
                width: "50px" // Фиксированная ширина
            },

            {
                "data": "solution",
                "name": "solution",
                "visible": false // Скрыть столбец Solution в основной таблице
            },
            {
                "data": "highLight",
                "name": "highLight",
                "visible": false, // Скрыть столбец по умолчанию
                "className": "highlight-column", // Добавляем класс
                "render": function (data, type, row) {
                    if (type === 'display' || type === 'filter') {
                        if (isEditMode) {
                            return `
                    <select class="js-select" style= "width: 60px" data-id="${row.id}">
                        <option value=""> </option>
                        <option value="🚩" ${data === '🚩' ? 'selected' : ''}>🚩</option>
                    </select>
                `;
                        } else {
                            return data || '';
                        }
                    }
                    return data;
                }
            }

            , {
                // Столбец для кнопки удаления (скрыт по умолчанию)
                "data": null,
                "name": "Удалить",
                "className": "delete-column", // Добавляем класс для стилизации
                "defaultContent": `<button class="delete-btn-edit">
        <svg class="icon_delete" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path d="M16 6V5.2C16 4.0799 16 3.51984 15.782 3.09202C15.5903 2.71569 15.2843 2.40973 14.908 2.21799C14.4802 2 13.9201 2 12.8 2H11.2C10.0799 2 9.51984 2 9.09202 2.21799C8.71569 2.40973 8.40973 2.71569 8.21799 3.09202C8 3.51984 8 4.0799 8 5.2V6M3 6H21M19 6V17.2C19 18.8802 19 19.7202 18.673 20.362C18.3854 20.9265 17.9265 21.3854 17.362 21.673C16.7202 22 15.8802 22 14.2 22H9.8C8.11984 22 7.27976 22 6.63803 21.673C6.07354 21.3854 5.6146 20.9265 5.32698 20.362C5 19.7202 5 18.8802 5 17.2V6"></path>
        </svg>
    </button>`,
                "searchable": false,
                "orderable": false,
                "visible": false,
                "width": "50px" // Изменено с 5px на 50px
            }
        ],
        "order": [[0, "desc"]], // Измените индекс столбца для сортировки, если удалили первый столбец
        "pageLength": -1,
        "lengthMenu": false,
        "responsive": true,
        "autoWidth": false,
        "paging": false,
        "searching": false,
        "info": false,
        "createdRow": function (row, data, dataIndex) {
            // Применяем стили в зависимости от смены
            if (data.shift && data.shift.includes('Day')) {
                $(row).find('td').eq(1).find('p').eq(0).addClass('status day');
            } else {
                $(row).find('td').eq(1).find('p').eq(0).addClass('status night');
            }

            // Применяем стили в зависимости от статуса
            if (data.status && data.status.includes('Success')) {
                $(row).find('td').eq(8).find('p').eq(0).addClass('status success').css('margin-right', '5px');
            } else if (data.status && data.status.includes('Process')) {
                $(row).find('td').eq(8).find('p').eq(0).addClass('status workinprogress').css('margin-right', '5px');
            } else if (data.status && data.status.includes('Fail')) {
                $(row).find('td').eq(8).find('p').eq(0).addClass('status failed').css('margin-right', '5px');
            }

            // Добавляем атрибут data-id для удобства
            $(row).attr('data-id', data.id);

            // Окрашивание строки, если highLight содержит '🚩'
            if (data.highLight && data.highLight.includes('🚩')) {
                $(row).addClass('highlight-row');
            }
        },
        "drawCallback": function (settings) {
            var api = this.api();

            // Открываем дочерние строки для всех записей
            api.rows({ page: 'current' }).every(function () {
                var data = this.data();
                if (data.solution) {
                    this.child(format(data)).show();
                    $(this.node()).addClass('shown');
                }
            });

            //// Добавляем класс highlight-row к дочерним строкам, если родительская строка имеет этот класс
            //$('#journal_table tbody tr.highlight-row').each(function () {
            //    var parentRow = $(this);
            //    var childRow = parentRow.next('tr[data-dt-row]'); // Убедитесь, что выбирается нужный tr с data-dt-row

            //    if (childRow.length) {
            //        childRow.addClass('highlight-row');
            //    }
            //});

            // Вызываем функцию подсчета инцидентов после отрисовки таблицы
            updateIncidentCount();

            // Если в режиме редактирования, делаем ячейки редактируемыми
            if (isEditMode) {
                makeCellsEditable();
            }
        }



    });

    // Функция для форматирования дочерних строк
    function format(d) {
        var solutionContent = d.solution || '';
        // Преобразуем символы переноса строки обратно в теги <br> для отображения в HTML
        solutionContent = solutionContent.replace(/\n/g, '<br>');

        return `
        <div style="padding:10px;">
            <div ${isEditMode ? 'contenteditable="true" class="editable solution-editable"' : ''} data-id="${d.id}">
                ${solutionContent}
            </div>
        </div>
    `;
    }



    // Обработчик клика по строке таблицы для открытия подробностей инцидента
    $('#journal_table tbody').on('dblclick', 'tr', function () {
        if (isEditMode || $(this).hasClass('no-click')) {
            return; // Если в режиме редактирования, ничего не делаем
        }

        var data = table.row(this).data();
        if (data) {
            var url = `/Incidents/View/${data.id}`;
            window.location.href = url; // Открывает в том же окне
        }
    });


    // Изменение курсора при наведении на строку
    $('#journal_table tbody').on('mouseenter', 'tr', function () {
        $(this).css('cursor', 'pointer');
    });

    // Переключение в режим редактирования
    $('#toggle-edit').on('click', function () {
        isEditMode = true;

        // Показываем кнопки "Сохранить", "Отмена" и "Добавить", скрываем "Редактировать"
        $('#save-edit').show();
        $('#cancel-edit').show();
        $('#toggle-edit').hide();

        // Показываем столбец удаления
        var deleteColumn = table.column('Удалить:name');
        if (deleteColumn.length) {
            deleteColumn.visible(true);
        }

        // Показываем столбец highLight
        var highlightColumn = table.column('highLight:name');
        if (highlightColumn.length) {
            highlightColumn.visible(true);
        }

        // Инвалидация кэша и перерисовка таблицы
        table.rows().invalidate().draw();

        // Блокируем кликабельность строк
        $('#journal_table tbody').addClass('no-click');
    });

    // Отмена редактирования
    $('#cancel-edit').on('click', function () {
        isEditMode = false;

        // Скрываем кнопки "Сохранить", "Отмена" и "Добавить", показываем "Редактировать"
        $('#save-edit').hide();
        $('#cancel-edit').hide();
        $('#toggle-edit').show();

        // Скрываем столбец удаления
        var deleteColumn = table.column('Удалить:name');
        if (deleteColumn.length) {
            deleteColumn.visible(false);
        }

        // Скрываем столбец highLight
        var highlightColumn = table.column('highLight:name');
        if (highlightColumn.length) {
            highlightColumn.visible(false);
        }

        // Перезагрузка данных через AJAX
        table.ajax.reload(null, false); // Второй параметр false сохраняет текущую страницу

        // Разрешаем кликабельность строк
        $('#journal_table tbody').removeClass('no-click');

        // Очищаем массив измененных записей
        modifiedRecords = [];
    });


    // Сохранение изменений
    $('#save-edit').on('click', async function () {
        if (modifiedRecords.length === 0) {
            alert('Нет изменений для сохранения.');
            return;
        }

        // Сохранение состояния открытых строк
        var openedRows = [];
        table.rows().every(function () {
            if (this.child.isShown()) {
                openedRows.push(this.data().id);
            }
        });

        // Разделение измененных и новых записей
        let updatedRecords = modifiedRecords.filter(record => record.id && record.id !== null);
        let newRecords = modifiedRecords.filter(record => !record.id || record.id === null);

        try {
            // Отправка обновленных записей
            if (updatedRecords.length > 0) {
                console.log('Отправка обновленных записей:', updatedRecords); // Добавлено для отладки
                let response = await fetch('/Home/UpdateIncidents', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'RequestVerificationToken': $('input[name="__RequestVerificationToken"]').val()
                    },
                    body: JSON.stringify(updatedRecords)
                });

                if (response.ok) {
                    let result = await response.json();
                    console.log(result.message || 'Изменения обновлены.');
                } else {
                    let errorText = await response.text();
                    let errorResult;
                    try {
                        errorResult = JSON.parse(errorText);
                    } catch (e) {
                        errorResult = { message: errorText };
                    }
                    alert(errorResult.message || 'Ошибка при обновлении данных.');
                }
            }

            // Отправка новых записей
            if (newRecords.length > 0) {
                for (let newRecord of newRecords) {
                    console.log('Отправка новой записи:', newRecord); // Добавлено для отладки
                    let response = await fetch('/Home/AddIncident', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'RequestVerificationToken': $('input[name="__RequestVerificationToken"]').val()
                        },
                        body: JSON.stringify(newRecord)
                    });

                    if (response.ok) {
                        let result = await response.json();
                        console.log(result.message || 'Новая запись добавлена.');
                    } else {
                        let errorText = await response.text();
                        let errorResult;
                        try {
                            errorResult = JSON.parse(errorText);
                        } catch (e) {
                            errorResult = { message: errorText };
                        }
                        alert(errorResult.message || 'Ошибка при добавлении новой записи.');
                    }
                }
            }

            // Перезагружаем таблицу
            table.ajax.reload(function () {
                // После перезагрузки открываем ранее открытые строки
                table.rows().every(function () {
                    var data = this.data();
                    if (openedRows.includes(data.id)) {
                        this.child(format(data)).show();
                        $(this.node()).addClass('shown');
                    }
                });
            }, false);

            // Выходим из режима редактирования
            isEditMode = false;
            $('#save-edit').hide();
            $('#cancel-edit').hide();
            $('#toggle-edit').show();

            // Скрываем столбец удаления
            var deleteColumn = table.column('Удалить:name');
            if (deleteColumn.length) {
                deleteColumn.visible(false);
            }

            // Закрываем все открытые дочерние строки
            $('#journal_table tbody tr.shown').each(function () {
                var tr = $(this);
                var row = table.row(tr);
                row.child.hide();
                tr.removeClass('shown');
                tr.find('.details-btn').text('+');
            });

            // Удаляем классы и атрибуты
            $('#journal_table tbody tr').each(function () {
                $(this).find('td').each(function () {
                    $(this).removeAttr('contenteditable').removeClass('editable');
                });
            });

            // Разрешаем кликабельность строк
            $('#journal_table tbody').removeClass('no-click');

            // Очищаем массив измененных записей
            modifiedRecords = [];


            //alert('Изменения успешно сохранены.');
        } catch (error) {
            console.error('Ошибка при сохранении данных:', error);
            alert('Произошла ошибка при сохранении данных.');

        }
    });

    $('#add-record').on('click', async function () {
        // Создаем новую запись с предопределенными данными
        var newRecord = {
            id: null, // ID будет сгенерирован сервером
            date: moment().format('YYYY-MM-DDTHH:mm:ss'), // Текущая дата и время в формате ISO
            shift: shift,       // Используем переменную из представления
            vsat: null,
            reporter: loggedUser, // Используем переменную из представления
            well: '',            // Измените на пустую строку, если это текстовое поле
            run: 0,
            savedNPT: 0,
            problemType: '',
            status: '',
            highLight: null,
            solution: " ", // Предопределённое значение
            dateEnd: null,
            update: null
        };

        try {
            // Отправка новой записи на сервер
            let response = await fetch('/Home/AddIncident', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'RequestVerificationToken': $('input[name="__RequestVerificationToken"]').val()
                },
                body: JSON.stringify(newRecord)
            });

            if (response.ok) {
                let result = await response.json();
                console.log(result); // Проверяем структуру ответа

                if (result.data) {
                    let addedRecord = result.data; // Получаем добавленную запись

                    // Преобразуем дату в нужный формат, если необходимо
                    //addedRecord.date = moment(addedRecord.date).format('DD/MM/YYYY HH:mm');

                    // Добавляем новую строку в таблицу
                    table.row.add(addedRecord).draw(false);

                    // Открываем дочернюю строку для новой записи
                    let newRow = table.row(':last');
                    if (addedRecord.solution) {
                        newRow.child(format(addedRecord)).show();
                        $(newRow.node()).addClass('shown');
                    }

                    //alert(result.message || 'Новая запись успешно добавлена.');
                } else {
                    alert('Ошибка: сервер не вернул данные добавленной записи.');
                }
            } else {
                let errorText = await response.text();
                let errorResult;
                try {
                    errorResult = JSON.parse(errorText);
                } catch (e) {
                    errorResult = { message: errorText };
                }
                alert(errorResult.message || 'Ошибка при добавлении новой записи.');
            }
        } catch (error) {
            console.error('Ошибка при добавлении записи:', error);
            alert('Произошла ошибка при добавлении записи.');
        }
    });


    // Функция для превращения ячеек в редактируемые
    function makeCellsEditable() {
        const editableColumns = ['shift', 'vsat', 'run', 'savedNPT', 'problemType', 'status', 'reporter', 'well'];

        $('#journal_table tbody tr').each(function () {
            $(this).find('td').each(function () {
                var cell = table.cell(this);
                var colIdx = cell.index().column;
                var columnName = table.column(colIdx).dataSrc();

                if (!editableColumns.includes(columnName)) {
                    // Не делаем редактируемым
                    return;
                }

                // Определяем, как сделать столбец редактируемым
                if (columnName === 'status') {
                    $(this).html(`
                        <select class="js-select">
                            <option value="Success" ${cell.data() === 'Success' ? 'selected' : ''}>Success</option>
                            <option value="Fail" ${cell.data() === 'Fail' ? 'selected' : ''}>Fail</option>
                            <option value="Process" ${cell.data() === 'Process' ? 'selected' : ''}>Process</option>
                        </select>
                    `);
                    $(this).find('select').val(cell.data());
                } else if (columnName === 'problemType') {
                    $(this).html(`
                        <select class="js-select">
                            <option value="">Все</option>
                            <option value="Advantage" ${cell.data() === 'Advantage' ? 'selected' : ''}>Advantage</option>
                            <option value="ATK issue" ${cell.data() === 'ATK issue' ? 'selected' : ''}>ATK issue</option>
                            <option value="APS" ${cell.data() === 'APS' ? 'selected' : ''}>APS</option>
                            <option value="BCPM II" ${cell.data() === 'BCPM II' ? 'selected' : ''}>BCPM II</option>
                            <option value="Cadence" ${cell.data() === 'Cadence' ? 'selected' : ''}>Cadence</option>
                            <option value="Computer" ${cell.data() === 'Computer' ? 'selected' : ''}>Computer</option>
                            <option value="Curve Failure" ${cell.data() === 'Curve Failure' ? 'selected' : ''}>Curve Failure</option>
                            <option value="Decoding" ${cell.data() === 'Decoding' ? 'selected' : ''}>Decoding</option>
                            <option value="Desync" ${cell.data() === 'Desync' ? 'selected' : ''}>Desync</option>
                            <option value="Downlink" ${cell.data() === 'Downlink' ? 'selected' : ''}>Downlink</option>
                            <option value="LTK" ${cell.data() === 'LTK' ? 'selected' : ''}>LTK</option>
                            <option value="M30" ${cell.data() === 'M30' ? 'selected' : ''}>M30</option>
                            <option value="Memfix" ${cell.data() === 'Memfix' ? 'selected' : ''}>Memfix</option>
                            <option value="Organisation" ${cell.data() === 'Organisation' ? 'selected' : ''}>Organisation</option>
                            <option value="OTK" ${cell.data() === 'OTK' ? 'selected' : ''}>OTK</option>
                            <option value="Pressure" ${cell.data() === 'Pressure' ? 'selected' : ''}>Pressure</option>
                            <option value="Procedures" ${cell.data() === 'Procedures' ? 'selected' : ''}>Procedures</option>
                            <option value="Programming | Tip" ${cell.data() === 'Programming | Tip' ? 'selected' : ''}>Programming | Tip</option>
                            <option value="Pulser issue" ${cell.data() === 'Pulser issue' ? 'selected' : ''}>Pulser issue</option>
                            <option value="Service delivery" ${cell.data() === 'Service delivery' ? 'selected' : ''}>Service delivery</option>
                            <option value="Surface issue" ${cell.data() === 'Surface issue' ? 'selected' : ''}>Surface issue</option>
                            <option value="Survey issue" ${cell.data() === 'Survey issue' ? 'selected' : ''}>Survey issue</option>
                            <option value="UsMPR" ${cell.data() === 'UsMPR' ? 'selected' : ''}>USMPR</option>
                            <option value="WellArchitect" ${cell.data() === 'WellArchitect' ? 'selected' : ''}>WellArchitect</option>
                            <option value="Win10" ${cell.data() === 'Win10' ? 'selected' : ''}>Win10</option>
                            <option value="WITS" ${cell.data() === 'WITS' ? 'selected' : ''}>WITS</option>
                            <option value="Other" ${cell.data() === 'Other' ? 'selected' : ''}>Other</option>
                        </select>
                    `);
                    $(this).find('select').val(cell.data());
                } else if (columnName === 'savedNPT') {
                    $(this).html(`
                        <select class="js-select" style="width: 60px">
                            <option value=""></option>
                            <option value="1" ${cell.data() === '1' ? 'selected' : ''}>1</option>
                            <option value="3" ${cell.data() === '3' ? 'selected' : ''}>3</option>
                            <option value="6" ${cell.data() === '6' ? 'selected' : ''}>6</option>
                            <option value="12" ${cell.data() === '12' ? 'selected' : ''}>12</option>
                            <option value="24" ${cell.data() === '24' ? 'selected' : ''}>24</option>
                        </select>
                    `);
                    $(this).find('select').val(cell.data());
                } else if (columnName === 'shift') {
                    $(this).html(`
                        <select class="js-select" style="width: 75px">
                            <option value="Day" ${cell.data() === 'Day' ? 'selected' : ''}>Day</option>
                            <option value="Night" ${cell.data() === 'Night' ? 'selected' : ''}>Night</option>
                        </select>
                    `);
                    $(this).find('select').val(cell.data());
                } else if (columnName === 'vsat') {
                    // Добавляем иконки в ячейку VSAT
                    const cellValue = cell.data() || '';
                    $(this).html(`
        <div class="vsat-cell">
            <div contenteditable="true" class="editable numeric vsat-edit">${cellValue}</div>
            <button class="vsat-icon-with-solution" title="Обновить с решением">
                <!-- SVG иконка 1 -->
                <svg class= "icon-update" viewBox="0 0 16 14" xmlns="http://www.w3.org/2000/svg" version="1.1" fill="none" stroke="#000000" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5">
                    <path d="m3.25 13.25h9m-8.5-6.5 4 3.5 4-3.5m-4-5v8.5"/>
                </svg>
            </button>
            <button class="vsat-icon-without-solution" title="Обновить без решения">
                <!-- SVG иконка 2 -->
                <svg class= "icon-update-no-solution" viewBox="0 0 16 14" xmlns="http://www.w3.org/2000/svg" version="1.1" fill="none" stroke="#000000" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5">
                    <path d="m3.25 13.25h9m-8.5-6.5 4 3.5 4-3.5m-4-5v8.5"/>
            </svg>
            </button>
        </div>
    `);
                } else if (columnName === 'well') {
                    $(this).attr('contenteditable', 'true').addClass('editable');
                } else if (columnName === 'reporter') {
                    // Делаем ячейку "reporter" редактируемой как текстовое поле
                    $(this).attr('contenteditable', 'true').addClass('editable');
                }
            });
        });
    }

    // Обработчик клика по иконке с решением
    $('#journal_table tbody').on('click', '.vsat-icon-with-solution', function (e) {
        e.stopPropagation(); // Предотвращаем всплытие события
        var $cellElement = $(this).closest('td');
        var row = $(this).closest('tr');
        var rowData = table.row(row).data();
        var incidentId = rowData.id;

        // Получаем значение VSAT из редактируемого поля
        var vsatValue = $cellElement.find('.vsat-edit').text().trim();

        if (vsatValue) {
            fetchVsatDataForRow(vsatValue, incidentId, true); // true означает, что нужно обновить solution
        }
    });

    // Обработчик клика по иконке без решения
    $('#journal_table tbody').on('click', '.vsat-icon-without-solution', function (e) {
        e.stopPropagation(); // Предотвращаем всплытие события
        var $cellElement = $(this).closest('td');
        var row = $(this).closest('tr');
        var rowData = table.row(row).data();
        var incidentId = rowData.id;

        // Получаем значение VSAT из редактируемого поля
        var vsatValue = $cellElement.find('.vsat-edit').text().trim();

        if (vsatValue) {
            fetchVsatDataForRow(vsatValue, incidentId, false); // false означает, что не нужно обновлять solution
        }
    });

    // Отслеживание изменений в ячейках и поле VSAT
    $('#journal_table tbody').on('input change', 'td[contenteditable="true"], select, .vsat-edit', function () {
        var $cellElement = $(this).closest('td');
        var row = $(this).closest('tr');
        var rowData = table.row(row).data();

        // Получаем индекс ячейки
        var cell = table.cell($cellElement);
        var cellIndex = cell.index();
        var colIdx = cellIndex.column;
        var columnName = table.column(colIdx).dataSrc();

        var newValue;

        if ($(this).is('select')) {
            newValue = $(this).val();
        } else {
            newValue = $(this).text().trim();
        }

        // Если элемент имеет класс .vsat-edit, устанавливаем columnName вручную
        if ($(this).hasClass('vsat-edit')) {
            columnName = 'vsat';
        }

        // Проверка и ограничение ввода для числовых полей
        if (['vsat', 'run'].includes(columnName)) {
            newValue = newValue.replace(/\D/g, '');
        }

        // Добавьте отладочные сообщения
        console.log(`Редактирование поля: ${columnName}, Новое значение: ${newValue}`);

        // Проверяем, есть ли уже запись с этим ID в массиве
        var existingRecord = modifiedRecords.find(record => record.id === rowData.id);

        if (existingRecord) {
            existingRecord[columnName] = newValue;
        } else {
            var updatedData = { ...rowData };
            updatedData[columnName] = newValue;
            modifiedRecords.push(updatedData);
        }

        // Еще одно отладочное сообщение
        console.log('Модифицированные записи:', modifiedRecords);
    });



    // Отслеживание изменений в поле solution внутри дочерних строк
    $('#journal_table tbody').on('input', '.solution-editable', function () {
        var newValue = $(this).html().trim();

        var incidentId = $(this).data('id');

        // Находим соответствующую запись в modifiedRecords
        var existingRecord = modifiedRecords.find(record => record.id === incidentId);

        if (existingRecord) {
            existingRecord['solution'] = newValue;
        } else {
            // Найти основную строку с данным id
            var mainRow = table.row('tr[data-id="' + incidentId + '"]');
            if (mainRow.any()) {
                var rowData = mainRow.data();
                var updatedData = { ...rowData };
                updatedData['solution'] = newValue;
                modifiedRecords.push(updatedData);
            } else {
                console.error('Не удалось найти основную строку для инцидента с id:', incidentId);
            }
        }

        console.log('Модифицированные записи:', modifiedRecords);
    });

    // Обработчик клика по кнопке удаления
    $('#journal_table tbody').on('click', '.delete-btn-edit', function (e) {
        e.stopPropagation(); // Предотвращаем открытие детального просмотра при клике на кнопку

        var row = $(this).closest('tr');
        var rowData = table.row(row).data();
        var incidentId = rowData.id;

        if (!incidentId || !isValidGuid(incidentId)) {
            alert('Некорректный идентификатор инцидента.');
            return;
        }

        if (confirm('Вы уверены, что хотите удалить этот инцидент?')) {
            var token = getAntiForgeryToken();

            $.ajax({
                url: '/Incidents/DeleteIncident',
                type: 'POST',
                contentType: 'application/json',
                data: JSON.stringify({ Id: incidentId }),
                headers: {
                    'RequestVerificationToken': token
                },
                success: function (response) {
                    //alert(response.message || 'Инцидент успешно удалён.');
                    table.ajax.reload(null, false);
                },
                error: function (xhr, status, error) {
                    alert(xhr.responseJSON?.message || 'Произошла ошибка при удалении инцидента.');
                }
            });
        }
    });

    // Функция проверки корректности GUID
    function isValidGuid(guid) {
        var regex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        return regex.test(guid);
    }

    // Функция для получения анти-форжери токена
    function getAntiForgeryToken() {
        return $('input[name="__RequestVerificationToken"]').val();
    }
    $('#messageFiles').on('change', function () {
        var fileNames = $.map(this.files, function (file) {
            return file.name;
        }).join(', ');
        $('#file-names').text(fileNames || 'Нет файлов');
    });


    // Функция для обновления времени на часах
    function updateClocks() {
        const cities = [
            { id: 'kaliningrad-clock', name: 'Калининград', utcOffset: 2 },
            { id: 'moscow-clock', name: 'Москва', utcOffset: 3 },
            { id: 'tyumen-clock', name: 'Тюмень', utcOffset: 5 },
            { id: 'leninsk-clock', name: 'Ленск', utcOffset: 7 }
        ];

        const now = new Date();

        cities.forEach(city => {
            const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
            const cityTime = new Date(utc + (3600000 * city.utcOffset));

            const hours = String(cityTime.getHours()).padStart(2, '0');
            const minutes = String(cityTime.getMinutes()).padStart(2, '0');

            const formattedTime = `${hours}:${minutes}`;

            const clockElement = document.getElementById(city.id);
            if (clockElement) {
                clockElement.querySelector('.time').textContent = formattedTime;
            }
        });
    }

    updateClocks();
    setInterval(updateClocks, 60000);

    // Обработка формы отправки сообщения
    const form = document.getElementById("sendMessageForm");

    form.addEventListener("submit", async function (event) {
        event.preventDefault();

        const messageText = document.getElementById("messageText").value.trim();
        const messageFiles = document.getElementById("messageFiles").files;
        const apiKey = "44uk0vM7E25C"; // Убедитесь, что API-ключ хранится безопасно

        if (!messageText && messageFiles.length === 0) {
            alert("Введите сообщение или выберите файлы для отправки!");
            return;
        }

        const formData = new FormData();
        formData.append("Text", messageText);

        // Добавляем файлы, если они есть
        if (messageFiles.length > 0) {
            for (let i = 0; i < messageFiles.length; i++) {
                formData.append("Files", messageFiles[i]);
            }
        }

        try {
            const response = await fetch("/api/TelegramMessages/Send", {
                method: "POST",
                headers: {
                    "X-API-KEY": apiKey
                },
                body: formData
            });

            const textResponse = await response.text();

            let result;
            try {
                result = JSON.parse(textResponse);
            } catch (e) {
                console.error("Ошибка парсинга JSON:", e);
                console.error("Ответ сервера:", textResponse);
                alert("Произошла ошибка на сервере.");
                return;
            }

            if (response.ok) {
                alert(result.status);
                form.reset();
                $('#file-names').text('Нет файлов'); // Сброс отображения имен файлов
                location.reload();
            } else {
                if (result.status) {
                    alert(`Ошибка: ${result.status}`);
                } else {
                    alert("Произошла неизвестная ошибка.");
                }
            }
        } catch (error) {
            console.error("Ошибка:", error);
            alert("Произошла ошибка при отправке сообщения");
        }
    });

    // Функция для обновления количества инцидентов
    function updateIncidentCount() {
        const table = $('#journal_table').DataTable();
        const pageInfo = table.page.info();
        const totalIncidents = pageInfo.recordsTotal;

        // Получаем количество выделенных (highlighted) инцидентов
        const highlightedIncidents = table
            .rows()
            .data()
            .filter(row => row.highLight && row.highLight.includes('🚩'))
            .count();

        // Обновляем содержимое элемента с количеством инцидентов
        const incidentCountDiv = document.getElementById('incident-count');
        if (incidentCountDiv) {
            incidentCountDiv.innerHTML = `
                <strong>Всего записей:</strong> ${totalIncidents} <br>
                <strong>Отмеченных:</strong> ${highlightedIncidents}
            `;
        }
    }

    // Функция для получения и отображения задач из Kanban-доски
    function fetchAndRenderKanbanTasks() {
        $.ajax({
            url: '/Home/GetDailyTasks',
            type: 'GET',
            dataType: 'json',
            success: function (response) {
                if (response.success) {
                    let columns = response.data.columns;

                    // Проверяем, что есть колонки и задачи
                    if (columns && columns.length > 0) {
                        renderKanbanTasks(columns);
                    } else {
                        $('#kanban-tasks-container').html('<p>Задач нет.</p>');
                    }
                } else {
                    console.error('Ошибка при получении задач:', response.message);
                    $('#kanban-tasks-container').html('<p>Не удалось загрузить задачи.</p>');
                }
            },
            error: function (xhr, status, error) {
                console.error('AJAX ошибка при получении задач:', error);
                $('#kanban-tasks-container').html('<p>Произошла ошибка при загрузке задач.</p>');
            }
        });
    }



    // Функция для генерации и вставки HTML задач
    function renderKanbanTasks(columns) {
        const container = $('#kanban-tasks-container');
        container.empty(); // Очищаем контейнер перед добавлением новых задач

        columns.forEach(column => {
            // Создаём заголовок колонки с цветом и счётчиком задач
            const columnHeader = $('<h3>')
                .css({
                    'display': 'flex',
                    'justify-content': 'space-between',
                    'align-items': 'center',
                    'background-color': column.columnColor || '#ccc',
                    'color': '#fff',
                    'padding-left': '10px',
                    'padding-right': '10px',
                    'border-radius': '4px',
                    'margin-top': '10px'
                });

            // Создаём элемент для названия колонки
            const columnNameSpan = $('<span>').text(column.columnName);

            // Создаём элемент для счётчика задач
            const taskCountSpan = $('<span>')
                .addClass('task-count')
                .text(`(${column.tasks.length})`);

            // Добавляем название колонки и счётчик в заголовок
            columnHeader.append(columnNameSpan, taskCountSpan);
            container.append(columnHeader);

            // Проверяем, есть ли задачи в колонке
            if (column.tasks && column.tasks.length > 0) {
                const tasksContainer = $('<div>').addClass('dmr-center-task');

                column.tasks.forEach(task => {
                    const taskCard = createTaskCard(task);
                    tasksContainer.append(taskCard);
                });

                container.append(tasksContainer);
            } else {
                container.append('<p>Задач нет</p>');
            }
        });

        // Обновляем количество задач, если это необходимо
        updateTaskCount(columns);
    }


    // Функция для создания HTML-элемента карточки задачи
    function createTaskCard(task) {
        // Всю карточку делаем белой
        const card = $('<div>')
            .addClass('task-card')
            .css('background-color', '#fff'); 

        // header красим в taskColor
        const header = $('<div>')
            .addClass('task-header')
            .css('background-color', '#fff'); 
            

        // Контейнер для названия и срока задачи
        const titleContainer = $('<div>').addClass('title-container');
        const title = $('<div>').addClass('task-title').text(task.taskName).css('background-color', task.taskColor || '#f4f5f7');

        // Проверка срока задачи
        const dueDateText = task.dueDate ? moment(task.dueDate).format('DD/MM/YYYY') : 'Не установлен';
        const dueDateHeader = $('<div>').addClass('task-due-date').text(`Срок: ${dueDateText}`);

        // Определяем, если срок прошёл, сегодня или остался 1 день
        if (task.dueDate) {
            const currentDate = moment().startOf('day');
            const dueDateMoment = moment(task.dueDate).startOf('day');
            const diffDays = dueDateMoment.diff(currentDate, 'days');

            if (diffDays < 0 || diffDays === 0 || diffDays === 1) {
                dueDateHeader.addClass('due-soon'); // Добавим класс для красного текста
            }
        }

        // Контейнер для иконок
        const iconsContainer = $('<div>').addClass('task-icons');

        // Иконка для описания
        const descriptionIcon = $(`
        <button class="toggle-description-btn" title="Развернуть/Свернуть описание">
            <!-- SVG иконка для описания -->
            <svg class="icon_task" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M14 2.26953V6.40007C14 6.96012 14 7.24015 14.109 7.45406C14.2049 7.64222 14.3578 7.7952 14.546 7.89108C14.7599 8.00007 15.0399 8.00007 15.6 8.00007H19.7305M14 17H8M16 13H8M20 9.98822V17.2C20 18.8802 20 19.7202 19.673 20.362C19.3854 20.9265 18.9265 21.3854 18.362 21.673C17.7202 22 16.8802 22 15.2 22H8.8C7.11984 22 6.27976 22 5.63803 21.673C5.07354 21.3854 4.6146 20.9265 4.32698 20.362C4 19.7202 4 18.8802 4 17.2V6.8C4 5.11984 4 4.27976 4.32698 3.63803C4.6146 3.07354 5.07354 2.6146 5.63803 2.32698C6.27976 2 7.11984 2 8.8 2H12.0118C12.7455 2 13.1124 2 13.4577 2.08289C13.7638 2.15638 14.0564 2.27759 14.3249 2.44208C14.6276 2.6276 14.887 2.88703 15.4059 3.40589L18.5941 6.59411C19.113 7.11297 19.3724 7.3724 19.5579 7.67515C19.7224 7.94356 19.8436 8.2362 19.9171 8.5423C20 8.88757 20 9.25445 20 9.98822Z"></path>
            </svg>
        </button>
    `);

        // Иконка для комментариев
        const commentsIcon = $(`
        <button class="toggle-comments-btn" title="Развернуть/Свернуть комментарии">
            <!-- SVG иконка для комментариев -->
            <svg class="icon_task" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M7.5 10.5H7.51M12 10.5H12.01M16.5 10.5H16.51M7 18V20.3355C7 20.8684 7 21.1348 7.10923 21.2716C7.20422 21.3906 7.34827 21.4599 7.50054 21.4597C7.67563 21.4595 7.88367 21.2931 8.29976 20.9602L10.6852 19.0518C11.1725 18.662 11.4162 18.4671 11.6875 18.3285C11.9282 18.2055 12.1844 18.1156 12.4492 18.0613C12.7477 18 13.0597 18 13.6837 18H16.2C17.8802 18 18.7202 18 19.362 17.673C19.9265 17.3854 20.3854 16.9265 20.673 16.362C21 15.7202 21 14.8802 21 13.2V7.8C21 6.11984 21 5.27976 20.673 4.63803C20.3854 4.07354 19.9265 3.6146 19.362 3.32698C18.7202 3 17.8802 3 16.2 3H7.8C6.11984 3 5.27976 3 4.63803 3.32698C4.07354 3.6146 3.6146 4.07354 3.32698 4.63803C3 5.27976 3 6.11984 3 7.8V14C3 14.93 3 15.395 3.10222 15.7765C3.37962 16.8117 4.18827 17.6204 5.22354 17.8978C5.60504 18 6.07003 18 7 18ZM8 10.5C8 10.7761 7.77614 11 7.5 11C7.22386 11 7 10.7761 7 10.5C7 10.2239 7.22386 10 7.5 10C7.77614 10 8 10.2239 8 10.5ZM12.5 10.5C12.5 10.7761 12.2761 11 12 11C11.7239 11 11.5 10.7761 11.5 10.5C11.5 10.2239 11.7239 10 12 10C12.2761 10 12.5 10.2239 12.5 10.5ZM17 10.5C17 10.7761 16.7761 11 16.5 11C16.2239 11 16 10.7761 16 10.5C16 10.2239 16.2239 10 16.5 10C16.7761 10 17 10.2239 17 10.5Z"></path>
            </svg>
        </button>
    `);

        // Иконка для подзадач
        const subtasksIcon = $(`
        <button class="toggle-subtasks-btn" title="Развернуть/Свернуть подзадачи">
            <!-- SVG иконка для подзадач -->
            <svg class="icon_task" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M21 5L10 5M21 19L10 19M21 12L10 12M6 5C6 5.82843 5.32843 6.5 4.5 6.5C3.67157 6.5 3 5.82843 3 5C3 4.17157 3.67157 3.5 4.5 3.5C5.32843 3.5 6 4.17157 6 5ZM6 19C6 19.8284 5.32843 20.5 4.5 20.5C3.67157 20.5 3 19.8284 3 19C3 18.1716 3.67157 17.5 4.5 17.5C5.32843 17.5 6 18.1716 6 19ZM6 12C6 12.8284 5.32843 13.5 4.5 13.5C3.67157 13.5 3 12.8284 3 12C3 11.1716 3.67157 10.5 4.5 10.5C5.32843 10.5 6 11.1716 6 12Z"></path>
            </svg>
        </button>
    `);

        // Добавляем иконки в контейнер
        iconsContainer.append(descriptionIcon, commentsIcon, subtasksIcon);

        // Добавляем заголовок и дедлайн в titleContainer вместе с иконками
        titleContainer.append(title, dueDateHeader, iconsContainer);

        // Определяем класс для приоритета
        let priorityClass = '';
        switch (task.priority) {
            case 'Низкий':
                priorityClass = 'priority-low';
                break;
            case 'Средний':
                priorityClass = 'priority-medium';
                break;
            case 'Высокий':
                priorityClass = 'priority-high';
                break;
            default:
                priorityClass = ''; // Если приоритет не задан
        }

        // Создаем контейнер для приоритета с соответствующим классом
        const priority = $('<div>').addClass(`task-priority ${priorityClass}`);
        // Вставляем SVG-иконку звонка
        const bellIcon = `
        <svg class="notification-bell" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" aria-label="Приоритет задачи">
            <path d="M12 24c1.1046 0 2-.8954 2-2h-4c0 1.1046.8954 2 2 2zm6-6V11c0-3.07-1.64-5.64-4.5-6.32V4a1.5 1.5 0 0 0-3 0v.68C7.64 5.36 6 7.92 6 11v7l-2 2v1h16v-1l-2-2z" fill="#FFFFFF"/>
        </svg>
    `;
        priority.html(bellIcon);

        // Вставляем заголовок и приоритет в header
        header.append(titleContainer, priority);

        // Создаем блок деталей задачи, изначально скрытый
        const details = $('<div>').addClass('task-details');

        // Блок описания
        const descriptionDiv = $('<div>').addClass('task-description').hide();
        const descriptionText = $('<p>').text(task.taskDescription || 'Нет описания.');
        descriptionDiv.append(descriptionText);

        // Блок подзадач
        const subtasksDiv = $('<div>').addClass('task-subtasks').hide();
        if (task.subtasks && task.subtasks.length > 0) {
            const subtasksList = $('<ul>');
            task.subtasks.forEach(subtask => {
                const subtaskItem = $('<li>').text(subtask.subtaskDescription);
                if (subtask.isCompleted) {
                    subtaskItem.addClass('completed-subtask');
                }
                subtasksList.append(subtaskItem);
            });
            subtasksDiv.append(subtasksList);
        } else {
            subtasksDiv.append('<p>Нет подзадач.</p>');
        }

        // Блок комментариев
        const commentsDiv = $('<div>').addClass('task-comments').hide();
        if (task.comments && task.comments.length > 0) {
            const commentsList = $('<ul>').addClass('comments-list');
            task.comments.forEach(comment => {
                const commentItem = $('<li>').addClass('comment');

                // Контейнер для аватарки и содержимого комментария
                const commentContainer = $('<div>').addClass('comment-container');

                // Определяем путь к аватарке
                const avatarUrl = `/avatars/${encodeURIComponent(comment.commentAuthor)}.jpg`;

                // Создаём элемент изображения аватарки с обработкой ошибки загрузки
                const commentAvatar = $('<img>')
                    .attr('src', avatarUrl)
                    .attr('alt', `${comment.commentAuthor}'s avatar`)
                    .addClass('comment-avatar')
                    .on('error', function () {
                        $(this).attr('src', '/avatars/default.jpg'); // Путь к стандартной аватарке
                    });

                // Создаём блок для автора и текста комментария
                const commentContent = $('<div>').addClass('comment-content');

                // Контейнер для автора и даты
                const authorDateContainer = $('<div>').addClass('author-date-container');
                const commentAuthor = $('<div>').addClass('comment-author').text(comment.commentAuthor);
                const commentDate = $('<div>').addClass('comment-date').text(moment(comment.createdAt).format('DD/MM/YYYY HH:mm'));

                // Добавляем автора и дату в контейнер
                authorDateContainer.append(commentAuthor, commentDate);

                // Текст комментария
                const commentText = $('<div>').addClass('comment-text').text(comment.commentText);

                // Собираем содержимое комментария
                commentContent.append(authorDateContainer, commentText);
                commentContainer.append(commentAvatar, commentContent);
                commentItem.append(commentContainer);

                commentsList.append(commentItem);
            });
            commentsDiv.append(commentsList);
        } else {
            commentsDiv.append('<p>Нет комментариев.</p>');
        }


        // Добавляем все секции в details
        details.append(descriptionDiv, subtasksDiv, commentsDiv);

        // Добавляем блок деталей в карточку
        card.append(header, details);

        return card;
    }


    // Обработчик клика по иконке описания
    $('#kanban-tasks-container').on('click', '.toggle-description-btn', function (e) {
        e.stopPropagation();

        const button = $(this);
        const taskCard = button.closest('.task-card');
        const descriptionDiv = taskCard.find('.task-description');

        // Переключаем видимость блока описания с анимацией
        descriptionDiv.slideToggle(200);

        // Переключаем класс активности иконки (для анимации поворота, если нужно)
        button.find('.icon_task').toggleClass('active');
    });

    // Обработчик клика по иконке комментариев
    $('#kanban-tasks-container').on('click', '.toggle-comments-btn', function (e) {
        e.stopPropagation();

        const button = $(this);
        const taskCard = button.closest('.task-card');
        const commentsDiv = taskCard.find('.task-comments');

        // Переключаем видимость блока комментариев с анимацией
        commentsDiv.slideToggle(200);

        // Переключаем класс активности иконки
        button.find('.icon_task').toggleClass('active');
    });

    // Обработчик клика по иконке подзадач
    $('#kanban-tasks-container').on('click', '.toggle-subtasks-btn', function (e) {
        e.stopPropagation();

        const button = $(this);
        const taskCard = button.closest('.task-card');
        const subtasksDiv = taskCard.find('.task-subtasks');

        // Переключаем видимость блока подзадач с анимацией
        subtasksDiv.slideToggle(200);

        // Переключаем класс активности иконки
        button.find('.icon_task').toggleClass('active');
    });



    // Добавление стилей для карточек задач (можно перенести в CSS)
    const styles = `
        
        .task-card {
            background-color: #f4f5f7;
            border-radius: 8px;
            padding: 15px;
            width: 100%;
            box-shadow: 0 2px 5px rgba(0,0,0,0.1);
        }
        .task-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        .task-title {
            font-size: 18px;
            font-weight: bold;
            
        }
        .task-priority {
            padding: 5px 10px;
            border-radius: 4px;
            color: #fff;
            font-size: 12px;
            text-transform: uppercase;
        }
        .priority-Низкий { background-color: green; }
        .priority-Средний { background-color: orange; }
        .priority-Высокий { background-color: red; }
        .task-details {
            margin-top: 10px;
        }
        .subtasks, .comments {
            margin-top: 10px;
        }
        .subtasks ul, .comments ul {
            list-style-type: disc;
            padding-left: 20px;
        }
        .comment {
            margin-bottom: 5px;
        }
        .toggle-comments-btn {
            cursor: pointer;
        }
        /* Стили для скрытого столбца Solution */
        th:nth-child(10), td:nth-child(10) { /* Индекс может отличаться */
           
        }
    `;
    $('<style>').text(styles).appendTo('head');

    // Вызов функции для получения и отображения задач
    fetchAndRenderKanbanTasks();

    // Функция для получения данных по VSAT и обновления строки
    function fetchVsatDataForRow(ipPart, incidentId, updateSolution) {
        $.ajax({
            url: '/Home/GetLatestVsatData',
            type: 'GET',
            data: { ipPart: ipPart },
            headers: {
                'RequestVerificationToken': $('input[name="__RequestVerificationToken"]').val()
            },
            success: function (data) {
                console.log('Полученные данные для инцидента:', incidentId, data);
                updateRowFields(incidentId, data, updateSolution);
            },
            error: function (xhr, status, error) {
                console.error('Ошибка при получении данных:', error);
                alert('Ошибка при получении данных с сервера.');
            }
        });
    }

    function updateRowFields(incidentId, data, updateSolution) {
        console.log(`updateRowFields вызван с incidentId=${incidentId}, updateSolution=${updateSolution}`);
        var rowSelector = 'tr[data-id="' + incidentId + '"]';
        var rowNode = $(rowSelector);

        if (rowNode.length > 0) {
            var wellCell = rowNode.find('td').eq(table.column('well:name').index());
            var runCell = rowNode.find('td').eq(table.column('run:name').index());
            var solutionCell = rowNode.next('tr').find('.solution-editable');

            // Обновляем Скважину и Рейс из данных сервера
            wellCell.text(`${data.field} - ${data.pad} - ${data.well}`);
            runCell.text(data.run);

            // Если ячейка Run редактируемая, добавляем класс editable
            if (isEditMode && runCell.attr('contenteditable') !== 'true') {
                runCell.attr('contenteditable', 'true').addClass('editable numeric');
            }

            // Обновить значение в поле Решение (Solution) только если updateSolution === true
            if (updateSolution && solutionCell.length > 0) {
                console.log('Обновляем поле Solution');
                var existingSolution = solutionCell.text().trim();
                var newSolutionEntry = data.bha.trim();

                if (existingSolution) {
                    // Добавляем новое решение перед существующим
                    solutionCell.text(`${newSolutionEntry}  ${existingSolution}`);
                } else {
                    solutionCell.text(newSolutionEntry);
                }

                // Обновляем поле solution в данных таблицы
                var rowData = table.row(rowNode).data();
                rowData.solution = rowData.solution ? `${data.bha}; ${rowData.solution}` : data.bha;

                // Обновляем запись в modifiedRecords
                var existingRecord = modifiedRecords.find(record => record.id === incidentId);
                if (existingRecord) {
                    existingRecord.solution = rowData.solution;
                    existingRecord.well = `${data.field} - ${data.pad} - ${data.well}`;
                    existingRecord.run = data.run;
                    // Не трогаем 'vsat'
                } else {
                    var updatedData = { ...rowData };
                    updatedData.well = `${data.field} - ${data.pad} - ${data.well}`;
                    updatedData.run = data.run;
                    updatedData.solution = rowData.solution;
                    // 'vsat' остается как есть
                    modifiedRecords.push(updatedData);
                }

            } else {
                console.log('Не обновляем поле Solution');
                // Обновляем только 'well' и 'run', не затрагивая 'solution' и 'vsat'
                var rowData = table.row(rowNode).data();
                rowData.well = `${data.field} - ${data.pad} - ${data.well}`;
                rowData.run = data.run;

                var existingRecord = modifiedRecords.find(record => record.id === incidentId);
                if (existingRecord) {
                    existingRecord.well = rowData.well;
                    existingRecord.run = rowData.run;
                    // Не трогаем 'solution' и 'vsat'
                } else {
                    var updatedData = { ...rowData };
                    updatedData.well = `${data.field} - ${data.pad} - ${data.well}`;
                    updatedData.run = data.run;
                    // 'solution' и 'vsat' остаются как есть
                    modifiedRecords.push(updatedData);
                }
            }

            console.log('Модифицированные записи:', modifiedRecords);
        } else {
            console.error('Не удалось найти строку с id:', incidentId);
        }
    }

});
