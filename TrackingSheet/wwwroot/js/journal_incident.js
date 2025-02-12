// Определяем функцию parseLong
function parseLong(value) {
    var parsed = parseInt(value, 10);
    return isNaN(parsed) ? 0 : parsed;
}

// Функция для получения анти-форжери токена
function getAntiForgeryToken() {
    return $('input[name="__RequestVerificationToken"]').val();
}

document.addEventListener('DOMContentLoaded', function () {
    try {
        // Регистрация форматов даты с DataTables
        $.fn.dataTable.moment('DD/MM/YYYY HH:mm'); // Формат отображения
        $.fn.dataTable.moment('YYYY-MM-DDTHH:mm:ss'); // ISO-формат данных

        // Массив для хранения изменённых записей
        let modifiedRecords = [];

        // Флаг режима редактирования
        let isEditMode = false;

        // Инициализация DataTable с параметром ajax
        var table = $('#journal_table').DataTable({
            autoWidth: false,
            ajax: {
                url: '/api/incidents/all', // URL для получения данных
                type: 'GET', // Метод запроса
                dataSrc: 'data' // Поле в JSON, содержащее массив данных
            },
            columns: [
                {
                    title: "Дата",
                    data: "date",
                    orderSequence: ["asc", "desc"],
                    render: function (data, type, row) {
                        var m = moment(data, moment.ISO_8601);
                        if (!m.isValid()) {
                            return '';
                        }

                        if (type === 'display' || type === 'filter') {
                            return m.format('DD/MM/YYYY HH:mm');
                        }

                        return data; // Для сортировки и других типов возвращаем исходные данные
                    }
                },
                {
                    title: "Смена",
                    data: "shift",
                    render: function (data) {
                        return `<p>${data}</p>`;
                    }
                },
                { title: "431", data: "reporter" },
                {
                    title: "VSAT", // Добавляем заголовок
                    data: "vsat",
                    name: "vsat",
                    render: function (data, type, row) {
                        if (type === 'display') {
                            return `<span class="vsat-number">${data}</span>`;
                        }
                        return data;
                    }
                },

                { title: "Скважина", data: "well", width: "100px"},
                { title: "Рейс", data: "run" },
                { title: "Сохр. НПВ", data: "savedNPT" },
                { title: "Тип", data: "problemType", name: "problemType" },
                {
                    title: "Статус",
                    data: "status",
                    render: function (data) {
                        return `<p>${data}</p>`;
                    }
                },
                { title: "Описание/Решение", data: "solution" },
                {
                    title: "Вложения",
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
                    searchable: false,
                    orderable: true, // Включаем сортировку
                    type: 'num', // Указываем тип сортировки как числовой
                    visible: true, // Видна по умолчанию
                    className: 'dt-center', // Центрирование содержимого
                    width: "50px" // Фиксированная ширина
                },
                {
                    title: "", // highLight column
                    data: "highLight",
                    render: function (data) {
                        if (data && data.includes('🚩')) {
                            return ''; // Не отображаем флаг напрямую
                        }
                        return data; // Или другое значение, если нужно
                    }
                },

                {
                    title: " ", // Новый столбец для кнопки удаления
                    data: null,
                    name: 'Удалить', // Имя столбца для обращения
                    className: 'dt-right', // Используем стандартный класс для выравнивания по правому краю
                    defaultContent: '<button class="delete-btn-edit"><svg class="icon_delete" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M16 6V5.2C16 4.0799 16 3.51984 15.782 3.09202C15.5903 2.71569 15.2843 2.40973 14.908 2.21799C14.4802 2 13.9201 2 12.8 2H11.2C10.0799 2 9.51984 2 9.09202 2.21799C8.71569 2.40973 8.40973 2.71569 8.21799 3.09202C8 3.51984 8 4.0799 8 5.2V6M3 6H21M19 6V17.2C19 18.8802 19 19.7202 18.673 20.362C18.3854 20.9265 17.9265 21.3854 17.362 21.673C16.7202 22 15.8802 22 14.2 22H9.8C8.11984 22 7.27976 22 6.63803 21.673C6.07354 21.3854 5.6146 20.9265 5.32698 20.362C5 19.7202 5 18.8802 5 17.2V6"></path></svg></button > ',
                    searchable: false, // Отключаем поиск для этого столбца
                    orderable: false,
                    visible: false, // Скрыт по умолчанию
                    width: "5px" // Устанавливаем фиксированную ширину для столбца
                }

                
            ],
            lengthMenu: [
                [10, 25, 50, 100, 1000], // Значения
                [10, 25, 50, 100, 1000] // Метки для отображения
            ],
            pageLength: 25, // Количество записей на странице по умолчанию
            order: [[0, 'desc']], // Сортировка по первой колонке ("Дата и время") по убыванию
            language: {
                search: "Поиск:",
                lengthMenu: "Показать _MENU_ записей на странице.",
                zeroRecords: "Ничего не найдено.",
                info: "Показаны записи с _START_ по _END_ из _TOTAL_.",
                infoEmpty: "",
                infoFiltered: "(отфильтровано из _MAX_ записей)",
                paginate: {
                    first: "Первая",
                    previous: "Предыдущая",
                    next: "Следующая",
                    last: "Последняя"
                }
            },
            createdRow: function (row, data, dataIndex) {
                // Применяем стили в зависимости от смены
                if (data.shift && data.shift.includes('Day')) {
                    $(row).find('td').eq(1).find('p').eq(0).addClass('status day');
                } else {
                    $(row).find('td').eq(1).find('p').eq(0).addClass('status night');
                }

                // Применяем стили в зависимости от статуса
                if (data.status && data.status.includes('Success')) {
                    $(row).find('td').eq(8).find('p').eq(0).addClass('status success');
                } else if (data.status && data.status.includes('Process')) {
                    $(row).find('td').eq(8).find('p').eq(0).addClass('status workinprogress');
                } else if (data.status && data.status.includes('Fail')) {
                    $(row).find('td').eq(8).find('p').eq(0).addClass('status failed');
                }

                // Добавляем атрибут data-id для удобства
                $(row).attr('data-id', data.iD); // Используем правильное поле ID

                // Применяем градиент, если есть отметка "🚩"
                if (data.highLight && data.highLight.includes('🚩')) {
                    // Красим строку
                    $(row).css('background', 'rgba(254, 255, 201, 0.7)');
                }
            }
        });

        // Добавление полей ввода или select в заголовки
        $('#journal_table thead th').each(function (index) {
            var title = $(this).text();

            // Если столбец "Смена", создаем select для выбора
            if (title === "Смена") {
                $(this).html(`
                    <div class="search-row">
                        ${title}
                        <br>
                        <select class="js-select">
                            <option value="">Все</option>
                            <option value="Day">Day</option>
                            <option value="Night">Night</option>
                        </select>
                    </div>
                `);
            }
            // Если столбец "Статус", создаем select для выбора Process - Success - Fail
            else if (title === "Статус") {
                $(this).html(`
                    <div class="search-row">
                        ${title}
                        <br>
                        <select class="js-select"">
                            <option value="">Все</option>
                            <option value="Process">Process</option>
                            <option value="Success">Success</option>
                            <option value="Fail">Fail</option>
                        </select>
                    </div>
                `);
            }
            // Если столбец "Тип", создаем select с опциями
            else if (title === "Тип") {
                $(this).html(`
                    <div class="search-row">
                        ${title}
                        <br>
                        <select class="js-select"">
                            <option value="">Все</option>
                            <option value="Advantage">Advantage</option>
                            <option value="ATK issue">ATK issue</option>
                            <option value="APS">APS</option>
                            <option value="BCPM II">BCPM II</option>
                            <option value="Cadence">Cadence</option>
                            <option value="Computer">Computer</option>
                            <option value="Curve Failure">Curve Failure</option>
                            <option value="Decoding">Decoding</option>
                            <option value="Desync">Desync</option>
                            <option value="Downlink">Downlink</option>
                            <option value="LTK">LTK</option>
                            <option value="M30">M30</option>
                            <option value="Memfix">Memfix</option>
                            <option value="Organisation">Organisation</option>
                            <option value="OTK">OTK</option>
                            <option value="Pressure">Pressure</option>
                            <option value="Procedures">Procedures</option>
                            <option value="Programming | Tip">Programming | Tip</option>
                            <option value="Pulser issue">Pulser issue</option>
                            <option value="Service delivery">Service delivery</option>
                            <option value="Surface issue">Surface issue</option>
                            <option value="Survey issue">Survey issue</option>
                            <option value="UsMPR">USMPR</option>
                            <option value="WellArchitect">WellArchitect</option>
                            <option value="Win10">Win10</option>
                            <option value="WITS">WITS</option>
                            <option value="Other">Other</option>
                        </select>
                    </div>
                `);
            }
            // Для столбцов "Скважина" и "Описание/Решение" добавляем уникальные классы
            else if (title === "Скважина") {
                $(this).html(`
                    <div class="search-row">
                        ${title}
                        <br>
                        <input type="text" class="search-input well-search" placeholder="Найти..." />
                    </div>
                `);
            }
            else if (title === "Описание/Решение") {
                $(this).html(`
                    <div class="search-row">
                        ${title}
                        <br>
                        <input type="text" class="search-input solution-search" placeholder="Найти..." />
                    </div>
                `);
            }


            // Для других столбцов оставляем текстовые поля
            else if (title !== "") {
                $(this).html(`
                    <div class="search-row">
                        ${title}
                        <br>
                        <input type="text" placeholder="Найти..." />
                    </div>
                `);
            }
        });


        // Вызов подсветки после загрузки данных
        table.on('init', function () {
            highlightSearchTerms();
        });

        // После инициализации DataTable
        var urlParams = new URLSearchParams(window.location.search);
        var problemTypeParam = urlParams.get('problemType');

        if (problemTypeParam) {
            var problemTypeColumn = table.column('problemType:name');
            problemTypeColumn.search(problemTypeParam).draw();

            // Устанавливаем значение select в заголовке столбца
            $('.problem-type-select').val(problemTypeParam);

            // Вызываем функцию подсветки, если она есть
            if (typeof highlightSearchTerms === 'function') {
                highlightSearchTerms();
            }
        }

        function highlightSearchTerms() {
            // Получаем глобальный поисковый запрос через API DataTables
            var searchTerm = table.search().trim();
            console.log('Глобальный поисковый запрос через API:', searchTerm);

            // Разбиваем поиск на отдельные термины, если используется регулярное выражение
            var terms = [];
            if (searchTerm) {
                // Предполагаем, что поисковый запрос является регулярным выражением с разделителями |
                terms = searchTerm.split('|').map(term => term.trim()).filter(term => term.length > 0);
            }

            // Получаем поисковые запросы по столбцам через API DataTables
            var columnSearchTerms = [];
            table.columns().every(function () {
                var search = this.search().trim();
                columnSearchTerms.push(search);
            });

            // Проходимся по всем видимым строкам и ячейкам
            $('#journal_table tbody tr').each(function () {
                $(this).find('td').each(function (index) {
                    var cell = table.cell(this);
                    var cellData = cell.data();
                    

                    // Очистка предыдущей подсветки
                    $(this).unmark({
                        done: function () {
                            // Подсветка глобального поиска
                            terms.forEach(function (term) {
                                if (term) {
                                    console.log('Подсвечиваем глобальный поиск:', term);
                                    $(this).mark(term, {
                                        className: 'journal-highlight-global',
                                        separateWordSearch: false,
                                        caseSensitive: false
                                    });
                                }
                            }, this);

                            // Подсветка поисков по столбцам
                            if (columnSearchTerms[index]) {
                                console.log('Подсвечиваем поиск по столбцу:', columnSearchTerms[index]);
                                $(this).mark(columnSearchTerms[index], {
                                    className: 'journal-highlight-column',
                                    separateWordSearch: false,
                                    caseSensitive: false
                                });
                            }
                        }.bind(this)
                    });
                });
            });
        }


        //// Обработчики событий для глобального поиска
        //$('#ds-search-0').on('keyup change', function () { // Обновлённый селектор
        //    highlightSearchTerms();
        //});

        // Добавьте или убедитесь, что используется правильный селектор
        // Обработчик глобального поиска с поддержкой нескольких терминов
        $('#journal_table_filter input').on('keyup change', function () {
            var searchTerms = this.value.trim();

            // Разбиваем строку поиска по запятым и пробелам
            var terms = searchTerms.split(/[\s,]+/).filter(term => term.length > 0);

            // Если есть термины, формируем регулярное выражение
            if (terms.length > 0) {
                // Экранируем специальные символы для использования в RegExp
                var escapedTerms = terms.map(term => term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
                var regex = escapedTerms.join('|');

                // Используем RegExp для поиска
                table.search(regex, true, false).draw();
            } else {
                // Если нет терминов, сбрасываем поиск
                table.search('').draw();
            }

            // Вызываем функцию подсветки после поиска
            highlightSearchTerms();
        });


        // Массив имён столбцов с точным поиском
        var exactMatchColumns = ['vsat']; // Добавьте другие имена столбцов по необходимости

        // Применение поиска по столбцам
        table.columns().every(function () {
            var that = this;
            var columnName = this.dataSrc(); // Получаем имя текущего столбца

            // Если поле - input
            $('input', this.header()).on('keyup change clear', function () {
                var searchTerms = this.value.trim();

                // Разбиваем строку поиска по запятым и пробелам
                var terms = searchTerms.split(/[\s,]+/).filter(term => term.length > 0);

                if (terms.length > 0) {
                    // Экранируем специальные символы для использования в RegExp
                    var escapedTerms = terms.map(term => term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));

                    var regex;
                    if (exactMatchColumns.includes(columnName)) {
                        // Для точного поиска оборачиваем каждое выражение в ^ и $
                        var exactTerms = escapedTerms.map(term => '^' + term + '$');
                        regex = exactTerms.join('|');
                    } else {
                        // Для частичного поиска оставляем как есть
                        regex = escapedTerms.join('|');
                    }

                    if (that.search() !== regex) {
                        that.search(regex, true, false).draw();
                    }
                } else {
                    if (that.search() !== '') {
                        that.search('').draw();
                    }
                }

                // Вызываем функцию подсветки после поиска
                highlightSearchTerms();
            });

            // Если поле - select
            $('select', this.header()).on('change', function () {
                if (that.search() !== this.value) {
                    that.search(this.value).draw();
                }
            });

            // Остановка распространения клика для обоих элементов
            $('input, select', this.header()).on('click', function (e) {
                e.stopPropagation();
            });
        });

        // Функция для назначения класса в зависимости от значения
        function applyStatusColor($select, value) {
            // Сначала убираем старые классы
            $select.removeClass('day night success failed workinprogress');

            // В зависимости от значения добавляем нужный
            if (value === 'Day') {
                $select.addClass('day');
            } else if (value === 'Night') {
                $select.addClass('night');
            } else if (value === 'Success') {
                $select.addClass('success');
            } else if (value === 'Fail') {
                $select.addClass('failed');
            } else if (value === 'Process') {
                $select.addClass('workinprogress');
            }
        }

        function makeCellsEditable() {
            // Проходим по каждой строке таблицы
            $('#journal_table tbody tr').each(function () {
                // Проходим по каждой ячейке в строке
                $(this).find('td').each(function () {
                    var cell = table.cell(this);
                    var cellData = cell.data();             // Текущее значение ячейки
                    var colIdx = cell.index().column;       // Индекс колонки
                    var columnName = table.column(colIdx).dataSrc(); // Имя поля (dataSrc) из columns

                    // Выбираем логику для конкретных колонок
                    if (columnName === 'status') {
                        // Формируем select для статуса
                        $(this).html(`
                    <select class="js-select">
                        <option value="Success">Success</option>
                        <option value="Fail">Fail</option>
                        <option value="Process">Process</option>
                    </select>
                `);
                        // Устанавливаем текущее значение
                        $(this).find('select').val(cellData);
                        // Сразу окрашиваем <select>
                        applyStatusColor($(this).find('select'), cellData);

                    } else if (columnName === 'problemType') {
                        // Формируем select для типа
                        $(this).html(`
                    <select class="js-select">
                        <option value="">Все</option>
                        <option value="Advantage">Advantage</option>
                        <option value="ATK issue">ATK issue</option>
                        <option value="APS">APS</option>
                        <option value="BCPM II">BCPM II</option>
                        <option value="Cadence">Cadence</option>
                        <option value="Computer">Computer</option>
                        <option value="Curve Failure">Curve Failure</option>
                        <option value="Decoding">Decoding</option>
                        <option value="Desync">Desync</option>
                        <option value="Downlink">Downlink</option>
                        <option value="LTK">LTK</option>
                        <option value="M30">M30</option>
                        <option value="Memfix">Memfix</option>
                        <option value="Organisation">Organisation</option>
                        <option value="OTK">OTK</option>
                        <option value="Pressure">Pressure</option>
                        <option value="Procedures">Procedures</option>
                        <option value="Programming | Tip">Programming | Tip</option>
                        <option value="Pulser issue">Pulser issue</option>
                        <option value="Service delivery">Service delivery</option>
                        <option value="Surface issue">Surface issue</option>
                        <option value="Survey issue">Survey issue</option>
                        <option value="UsMPR">USMPR</option>
                        <option value="WellArchitect">WellArchitect</option>
                        <option value="Win10">Win10</option>
                        <option value="WITS">WITS</option>
                        <option value="Other">Other</option>
                    </select>
                `);
                        $(this).find('select').val(cellData);

                    } else if (columnName === 'shift') {
                        // Формируем select для смены (Day/Night)
                        $(this).html(`
                    <select class="js-select">
                        <option value="Day">Day</option>
                        <option value="Night">Night</option>
                    </select>
                `);
                        $(this).find('select').val(cellData);
                        // Окрашиваем <select> в зависимости от выбранной смены
                        applyStatusColor($(this).find('select'), cellData);

                    } else if (columnName === 'highLight') {
                        // Select для флажка
                        const currentData = cellData || '';
                        $(this).html(`
                    <select class="js-select" style="width: 60px">
                        <option value="🚩" ${currentData === '🚩' ? 'selected' : ''}>🚩</option>
                        <option value=""></option>
                    </select>
                `);
                        $(this).find('select').val(currentData);

                    } else if (columnName === 'savedNPT') {
                        // Select для сохранённого НПВ
                        $(this).html(`
                    <select class="js-select">
                        <option value="1">1</option>
                        <option value="3">3</option>
                        <option value="6">6</option>
                        <option value="12">12</option>
                        <option value="24">24</option>
                        <option value="48">48</option>
                    </select>
                `);
                        $(this).find('select').val(cellData);

                    } else {
                        // По умолчанию делаем ячейку редактируемой "как текст"
                        $(this).attr('contenteditable', 'true').addClass('editable');
                    }
                });
            });
        }



        // Кастомный фильтр для диапазона дат
        $.fn.dataTable.ext.search.push(
            function (settings, data, dataIndex) {
                var minDate = $('#min-date').val();
                var maxDate = $('#max-date').val();

                // Если даты не выбраны, показываем все записи
                if (!minDate && !maxDate) {
                    return true;
                }

                // Получаем дату из первого столбца (индекс 0)
                var dateStr = data[0]; // Предполагается, что дата в первом столбце
                var date = moment(dateStr, 'DD/MM/YYYY HH:mm');

                // Если дата некорректна, не отображаем запись
                if (!date.isValid()) {
                    return false;
                }

                // Проверяем минимальную дату
                if (minDate) {
                    var min = moment(minDate, 'YYYY-MM-DD');
                    if (date.isBefore(min)) {
                        return false;
                    }
                }

                // Проверяем максимальную дату
                if (maxDate) {
                    var max = moment(maxDate, 'YYYY-MM-DD').endOf('day');
                    if (date.isAfter(max)) {
                        return false;
                    }
                }

                // Если запись попадает в диапазон, отображаем её
                return true;
            }
        );

        // Обработчики событий для полей ввода дат
        $('#min-date, #max-date').on('change', function () {
            table.draw();
        });

        

        // Обработчик экспорта в Excel с использованием ExcelJS
        $('#exportToExcel').on('click', async function () {
            // Создаём новую книгу
            var workbook = new ExcelJS.Workbook();
            var worksheet = workbook.addWorksheet('Sheet1');

            // Получаем данные из таблицы
            var tableElement = document.getElementById('journal_table');
            var headers = [];
            tableElement.querySelectorAll('thead th').forEach(function (th) {
                headers.push(th.innerText.trim());
            });
            worksheet.addRow(headers);

            // Функция для нормализации переносов строк
            function normalizeLineBreaks(text) {
                if (!text) return '';
                return text.replace(/<br\s*\/?>/gi, '\n') // Заменяем <br> на \n
                    .replace(/\n{2,}/g, '\n');    // Удаляем лишние \n
            }

            // Добавляем данные с нормализацией переносов строк
            tableElement.querySelectorAll('tbody tr').forEach(function (tr) {
                var row = [];
                tr.querySelectorAll('td').forEach(function (td) {
                    row.push(normalizeLineBreaks(td.innerText.trim()));
                });
                worksheet.addRow(row);
            });

            // Установка ширины столбцов
            worksheet.columns = [
                { header: 'Дата', key: 'date', width: 10 },
                { header: 'Смена', key: 'shift', width: 8 },
                { header: '431', key: 'reporter', width: 13 },
                { header: 'VSAT', key: 'vsat', width: 8 },
                { header: 'Скважина', key: 'well', width: 25 },
                { header: 'Рейс', key: 'run', width: 7 },
                { header: 'Сохр. НПВ', key: 'savedNPT', width: 11 },
                { header: 'Тип', key: 'problemType', width: 15 },
                { header: 'Статус', key: 'status', width: 10 },
                { header: 'Описание/Решение', key: 'solution', width: 130 },
                { header: 'highLight', key: 'highLight', width: 5 }
            ];

            // Применение стилей к заголовкам
            worksheet.getRow(1).eachCell(function (cell, colNumber) {
                cell.font = {
                    name: 'Arial',       // Устанавливаем шрифт Arial
                    size: 9,             // Устанавливаем размер шрифта 9
                    bold: true,
                    color: { argb: 'FFFFFFFF' } // Белый цвет текста
                };
                cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
                cell.fill = {
                    type: 'pattern',
                    pattern: 'solid',
                    fgColor: { argb: 'FF006666' } // Фон шапки цвета RGB(0, 102, 102)
                };
                cell.border = {
                    top: { style: 'thin' },
                    left: { style: 'thin' },
                    bottom: { style: 'thin' },
                    right: { style: 'thin' }
                };
            });

            // Применение стилей к данным
            worksheet.eachRow({ includeEmpty: false }, function (row, rowNumber) {
                row.eachCell({ includeEmpty: false }, function (cell, colNumber) {
                    // Перенос текста и центрирование
                    cell.alignment = { wrapText: true, horizontal: 'center', vertical: 'middle' };

                    // Применение границ ко всем ячейкам данных
                    cell.border = {
                        top: { style: 'thin' },
                        left: { style: 'thin' },
                        bottom: { style: 'thin' },
                        right: { style: 'thin' }
                    };

                    // Применение цвета фона для выделенных строк
                    if (cell.value && typeof cell.value === 'string' && cell.value.includes('🚩')) {
                        cell.fill = {
                            type: 'pattern',
                            pattern: 'solid',
                            fgColor: { argb: 'FFFEE888' } // Цвет фона (например, желтовато-оранжевый)
                        };
                    }

                    // Дополнительные стили по необходимости
                    cell.font = {
                        name: 'Arial',
                        size: 9
                    };
                });

                // Удалите или закомментируйте эту строку, чтобы позволить Excel автоматически подстраивать высоту строк
                // row.height = 60; // Устанавливаем достаточную высоту для переноса текста
            });

            // Пример объединения ячеек в заголовке (опционально)
            /*
            worksheet.mergeCells('A1:B1');
            var mergedCell = worksheet.getCell('A1');
            mergedCell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
            mergedCell.value = 'Объединённый Заголовок';
            */

            // Генерация буфера
            var buffer = await workbook.xlsx.writeBuffer();

            // Формирование имени файла
            var today = new Date();
            var dd = String(today.getDate()).padStart(2, '0');
            var mm = String(today.getMonth() + 1).padStart(2, '0'); // Январь — это 0!
            var yyyy = today.getFullYear();
            var formattedDate = dd + '-' + mm + '-' + yyyy;
            var fileName = 'TrackingSheet_' + formattedDate + '.xlsx';

            // Сохранение файла
            saveAs(new Blob([buffer], { type: "application/octet-stream" }), fileName);
        });


        // Обработчик кнопки "Загрузить Excel"
        $('#importExcelBtn').on('click', function () {
            $('#importExcelFile').click();
        });

        let importedData = []; // Массив для хранения данных из Excel
        
        // Обработчик выбора файла
        $('#importExcelFile').on('change', function (e) {
            var file = e.target.files[0];
            if (!file) {
                alert('Файл не выбран.');
                return;
            }

            // Показываем индикатор загрузки при выборе файла
            $('#loadingIndicator').show();

            // Читаем файл с помощью FileReader
            var reader = new FileReader();

            reader.onload = function (e) {
                var data = new Uint8Array(e.target.result);
                var workbook = new ExcelJS.Workbook();
                workbook.xlsx.load(data).then(function () {
                    var worksheet = workbook.worksheets[0]; // Предполагаем, что данные на первом листе

                    importedData = []; // Очищаем массив перед загрузкой новых данных

                    // Получаем индекс строки заголовка (предполагаем, что это первая строка)
                    var headerRow = worksheet.getRow(1);
                    var headers = [];
                    headerRow.eachCell(function (cell, colNumber) {
                        var headerValue = cell.value ? cell.value.toString().trim().toLowerCase() : '';
                        headers.push(headerValue);
                    });

                    console.log('Заголовки столбцов:', headers);

                    // Преобразуем данные из Excel в массив объектов
                    worksheet.eachRow({ includeEmpty: false }, function (row, rowNumber) {
                        // Пропускаем строку заголовка
                        if (rowNumber === 1) {
                            return;
                        }

                        var rowData = {};
                        row.eachCell({ includeEmpty: true }, function (cell, colNumber) {
                            var header = headers[colNumber - 1];
                            // Преобразуем все значения в строки
                            var cellValue = (cell.value !== null && cell.value !== undefined) ? cell.value.toString().trim() : '';
                            rowData[header] = cellValue;
                        });

                        importedData.push(rowData);
                        console.log('Обрабатываемая строка:', rowData);
                    });

                    console.log('Загруженные данные из Excel после чтения файла:', importedData);

                    // Скрываем индикатор загрузки после чтения файла
                    $('#loadingIndicator').hide();

                    // Показываем контейнер и иконку импорта данных
                    $('.export__file-import').removeClass('hidden').addClass('visible');
                    $('#importDataLabel').removeClass('hidden').addClass('visible');
                }).catch(function (error) {
                    console.error('Ошибка при чтении файла:', error);
                    alert('Ошибка при чтении файла. Проверьте формат и содержимое.');
                    $('#loadingIndicator').hide(); // Скрываем индикатор загрузки при ошибке
                });
            };

            reader.readAsArrayBuffer(file);
        });

        // Обработчик иконки "Импортировать данные"
        $('#importDataLabel').on('click', function () {
            if (importedData.length === 0) {
                alert('Нет данных для импорта.');
                return;
            }

            // Преобразуем данные в формат, ожидаемый сервером
            var incidents = importedData.map(function (item) {
                return {
                    Date: formatDate(item['дата']),
                    Shift: item['смена'],
                    Reporter: item['431'],
                    VSAT: item['vsat'],
                    Well: item['скважина'],
                    Run: item['рейс'],
                    SavedNPT: (item['сохр. нпв'] !== undefined && item['сохр. нпв'].trim() !== '') ? item['сохр. нпв'].trim() : '0',
                    ProblemType: item['тип'],
                    Status: item['статус'],
                    Solution: item['описание/решение'],
                    HighLight: item['highlight'] || ''
                };
            });

            console.log('Данные после форматирования:', JSON.stringify(incidents, null, 2));
            // Показываем индикатор загрузки
            $('#loadingIndicator').show();

            // Отправляем данные на сервер
            $.ajax({
                url: '/Incidents/ImportExcel',
                type: 'POST',
                contentType: 'application/json',
                headers: {
                    'RequestVerificationToken': $('input[name="__RequestVerificationToken"]').val()
                },
                data: JSON.stringify(incidents),
                success: function (response) {
                    $('#loadingIndicator').hide();
                    if (response.success) {
                        let message = 'Данные успешно импортированы: ' + response.importedCount + ' записей.';
                        if (response.errors && response.errors.length > 0) {
                            message += '\n\nСледующие записи не были импортированы из-за ошибок:\n' + response.errors.join('\n');
                        }
                        alert(message);
                        // Перезагружаем таблицу
                        $('#journal_table').DataTable().ajax.reload(null, false);
                        // Скрываем иконку импорта данных
                        $('.export__file-import').removeClass('visible').addClass('hidden');
                        $('#importDataLabel').removeClass('visible').addClass('hidden');
                        // Перезагружаем страницу после успешного импорта
                        location.reload(); // Добавляем перезагрузку страницы
                    } else {
                        alert('Ошибка при импорте данных: ' + response.message);
                    }
                },
                error: function (xhr, status, error) {
                    $('#loadingIndicator').hide();
                    console.error('Ошибка при отправке данных на сервер:', error);
                    alert('Ошибка при отправке данных на сервер.');
                }
            });
        });


        
        // Обработчик события 'draw' таблицы
        table.on('draw', function () {
            if (isEditMode) {
                makeCellsEditable();
            }
            // Вызываем функцию подсветки после перерисовки таблицы
            highlightSearchTerms();
        });

       

        // Обработчики событий для поиска по столбцам
        $('#journal_table thead th').each(function (index) {
            var input = $(this).find('input, select');
            input.on('keyup change', function () {
                highlightSearchTerms();
            });
        });

        // Переключение в режим редактирования
        $('#toggle-edit').on('click', function () {
            // Показать столбец удаления
            var deleteColumn = table.column('Удалить:name');
            if (deleteColumn.length) {
                deleteColumn.visible(true);
            }

            // Скрыть столбец "Вложения"
            var attachmentsColumn = table.column('attachments:name');
            if (attachmentsColumn.length) {
                attachmentsColumn.visible(false);
            }

            // Изменяем видимость кнопок
            $(this).hide();
            $('#save-edit').show();
            $('#cancel-edit').show();

            isEditMode = true;

            // Делаем ячейки редактируемыми
            makeCellsEditable();

            // Блокируем кликабельность строк
            $('#journal_table tbody').addClass('no-click');
        });



        // Отмена редактирования
        $('#cancel-edit').on('click', function () {

            // Скрываем столбец удаления
            var deleteColumn = table.column('Удалить:name');
            if (deleteColumn.length) {
                deleteColumn.visible(false);
            }

            // Показываем столбец "Вложения"
            var attachmentsColumn = table.column('attachments:name');
            if (attachmentsColumn.length) {
                attachmentsColumn.visible(true);
            }

            // Изменяем видимость кнопок
            $('#toggle-edit').show();
            $('#save-edit').hide();
            $('#cancel-edit').hide();

            isEditMode = false;

            // Перезагружаем таблицу с исходными данными
            table.ajax.reload(null, false); // Перезагружаем данные без сброса текущей страницы

            // Удаляем классы и атрибуты
            $('#journal_table tbody tr').each(function () {
                $(this).find('td').each(function () {
                    $(this).removeAttr('contenteditable').removeClass('editable');
                });
            });

            // Разрешаем кликабельность строк
            $('#journal_table tbody').removeClass('no-click');

            // Очищаем массив изменённых записей
            modifiedRecords = [];
        });


        // Обработчик изменения ячеек
        $('#journal_table tbody').on('input change', 'td[contenteditable="true"], select', function () {
            var $cellElement = $(this).closest('td');
            var row = $(this).closest('tr');
            var rowData = table.row(row).data();

            // Находим ячейку DataTable
            var cell = table.cell($cellElement);
            if (!cell || !cell.node()) {
                console.error('Не удалось найти ячейку DataTable для этого элемента:', this);
                return;
            }

            var cellIndex = cell.index();
            if (!cellIndex) {
                console.error('Не удалось получить индекс ячейки:', cell);
                return;
            }

            var colIdx = cellIndex.column;
            var columnName = table.column(colIdx).dataSrc();

            var newValue;

            if ($(this).is('select')) {
                newValue = $(this).val();
            } else {
                newValue = $(this).text().trim();
            }

            // Проверка и ограничение ввода для числовых полей
            if (['vsat', 'run'].includes(columnName)) {
                // Ограничиваем ввод только цифрами
                newValue = newValue.replace(/\D/g, '');
            }

            if (columnName === 'savedNPT') {
                // Для savedNPT используем значение из select, уже числовое
                newValue = newValue ? parseInt(newValue, 10) : 0;
            }

            // Проверяем, есть ли уже запись с этим ID в массиве
            var existingRecord = modifiedRecords.find(record => record.id === rowData.id);

            if (existingRecord) {
                // Обновляем соответствующее поле
                if (columnName === 'date') {
                    const [day, month, year] = newValue.split(' ')[0].split('/');
                    const [hours, minutes] = newValue.split(' ')[1].split(':');
                    const localDate = new Date(year, month - 1, day, hours, minutes);
                    existingRecord[columnName] = moment(localDate).format('YYYY-MM-DD HH:mm:ss');
                } else if (['vsat', 'run'].includes(columnName)) {
                    existingRecord[columnName] = parseInt(newValue, 10) || 0;
                } else if (columnName === 'savedNPT') {
                    existingRecord[columnName] = newValue;
                } else {
                    existingRecord[columnName] = newValue;
                }
            } else {
                // Клонируем данные строки и добавляем в массив
                var updatedData = { ...rowData };
                if (columnName === 'date') {
                    const [day, month, year] = newValue.split(' ')[0].split('/');
                    const [hours, minutes] = newValue.split(' ')[1].split(':');
                    const localDate = new Date(year, month - 1, day, hours, minutes);
                    updatedData[columnName] = moment(localDate).format('YYYY-MM-DD HH:mm:ss');
                } else if (['vsat', 'run'].includes(columnName)) {
                    updatedData[columnName] = parseInt(newValue, 10) || 0;
                } else if (columnName === 'savedNPT') {
                    updatedData[columnName] = newValue;
                } else {
                    updatedData[columnName] = newValue;
                }
                modifiedRecords.push(updatedData);
            }
        });

        // Обработчик клика по строке для открытия детального просмотра
        $('#journal_table tbody').on('dblclick', 'tr', function () {
            // Проверяем, не находится ли таблица в режиме редактирования и не заблокированы ли строки
            if (isEditMode || $(this).hasClass('no-click')) {
                return; // Если в режиме редактирования, ничего не делаем
            }

            var rowData = table.row(this).data();
            if (rowData && rowData.id) {
                // Используем window.location.href для открытия в этой же вкладке
                window.location.href = `/Incidents/View/${rowData.id}`;
            }
        });

        // Сохранение изменений
        $('#save-edit').on('click', async function () {
            if (modifiedRecords.length === 0) {
                alert('Нет изменений для сохранения.');
                return;
            }

            // Деактивируем кнопку и показываем индикатор загрузки (если используете)
            $('#save-edit').prop('disabled', true).addClass('loading');

            // Разделение измененных и новых записей
            let updatedRecords = modifiedRecords.filter(record => record.id && record.id !== null);
            let newRecords = modifiedRecords.filter(record => !record.id || record.id === null);

            try {
                // Отправка обновленных записей
                if (updatedRecords.length > 0) {
                    let response = await fetch('/Home/UpdateIncidents', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'RequestVerificationToken': getAntiForgeryToken()
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
                        let response = await fetch('/Home/AddIncident', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                                'RequestVerificationToken': getAntiForgeryToken()
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
                table.ajax.reload(null, false);

                // Выходим из режима редактирования
                isEditMode = false;
                $('#save-edit').hide();
                $('#cancel-edit').hide();
                $('#toggle-edit').show();

                // Показываем столбец "Вложения"
                var attachmentsColumn = table.column('attachments:name');
                if (attachmentsColumn.length) {
                    attachmentsColumn.visible(true);
                }

                // Скрываем столбец удаления
                var deleteColumn = table.column('Удалить:name');
                if (deleteColumn.length) {
                    deleteColumn.visible(false);
                }

                // Удаляем классы и атрибуты
                $('#journal_table tbody tr').each(function () {
                    $(this).find('td').each(function () {
                        $(this).removeAttr('contenteditable').removeClass('editable');
                    });
                });

                // Разрешаем кликабельность строк
                $('#journal_table tbody').removeClass('no-click');

                // Очищаем массив изменённых записей
                modifiedRecords = [];

                // Сброс состояния кнопки сохранения
                $('#save-edit').prop('disabled', false).removeClass('loading');

                alert('Изменения успешно сохранены.');
            } catch (error) {
                console.error('Ошибка при сохранении данных:', error);
                alert('Произошла ошибка при сохранении данных.');

                // Сброс состояния кнопки сохранения
                $('#save-edit').prop('disabled', false).removeClass('loading');
            }
        });



        // Обработчик клика по кнопке удаления
        $('#journal_table tbody').on('click', '.delete-btn-edit', function (e) {
            e.stopPropagation(); // Предотвращаем открытие детального просмотра при клике на кнопку

            // Получаем данные строки, в которой была нажата кнопка
            var row = $(this).closest('tr');
            var rowData = table.row(row).data();
            var incidentId = rowData.id || rowData.ID || rowData.Id; // Убедитесь, что используете правильное поле ID

            // Логирование для отладки
            console.log('Удаление инцидента с ID:', incidentId);

            // Проверка корректности GUID
            if (!incidentId || !isValidGuid(incidentId)) {
                alert('Некорректный идентификатор инцидента.');
                return;
            }

            // Спрашиваем подтверждение у пользователя
            if (confirm('Вы уверены, что хотите удалить этот инцидент?')) {
                // Получаем анти-форжери токен
                var token = getAntiForgeryToken();
                console.log('Анти-форжери токен:', token);

                // Отправляем AJAX-запрос на сервер для удаления инцидента
                $.ajax({
                    url: '/Incidents/DeleteIncident',
                    type: 'POST',
                    contentType: 'application/json',
                    data: JSON.stringify({ Id: incidentId }), // Используем заглавную "Id"
                    headers: {
                        'RequestVerificationToken': token
                    },
                    success: function (response) {
                        console.log('Ответ сервера:', response);
                        //alert(response.message || 'Инцидент успешно удалён.');
                        // Обновляем таблицу без перезагрузки страницы
                        table.ajax.reload(null, false);
                    },
                    error: function (xhr, status, error) {
                        console.error('Ошибка при удалении инцидента:', xhr.responseText);
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
    

    } catch (error) {
        console.error('Ошибка при загрузке данных:', error);
    }


    // Функция форматирования даты
    function formatDate(inputDate) {
        var date = new Date(inputDate);
        if (isNaN(date)) {
            return ''; // Возвращаем пустую строку, если дата некорректна
        }
        var day = String(date.getDate()).padStart(2, '0');
        var month = String(date.getMonth() + 1).padStart(2, '0'); // Январь — это 0!
        var year = date.getFullYear();
        var hours = String(date.getHours()).padStart(2, '0');
        var minutes = String(date.getMinutes()).padStart(2, '0');
        return `${day}/${month}/${year} ${hours}:${minutes}`;
    }

$(document).on('change', '.js-select', function () {
    var newVal = $(this).val();
    applyStatusColor($(this), newVal);
});

});
