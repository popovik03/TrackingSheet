am5.ready(function () {

    if (typeof chartData === 'undefined' || chartData.length === 0) {
        console.warn('Нет данных для отображения графиков.');
        return;
    }

    console.log(chartData); // Для отладки

    // Создаем элемент root
    var root = am5.Root.new("pie_chart");

    // Устанавливаем темы (если нужно)
    root.setThemes([
        am5themes_Animated.new(root),
        am5themes_Frozen.new(root)
    ]);

    // Создаем диаграмму
    var chart = root.container.children.push(am5percent.PieChart.new(root, {
        innerRadius: 100,
        layout: root.verticalLayout
    }));

    // Создаем серию
    var series = chart.series.push(am5percent.PieSeries.new(root, {
        valueField: "count",        // Поле с количеством из модели
        categoryField: "problemType" // Поле с типом проблемы из модели
    }));

    // Устанавливаем ваши цвета для сегментов диаграммы
    series.get("colors").set("colors", [
        am5.color(0x07302D),
        am5.color(0x038073),
        am5.color(0x03BE93),
        am5.color(0x969696),
        am5.color(0xD9D9D9),
    ]);

    // Передаем данные в диаграмму
    series.data.setAll(chartData);  // chartData передается из C#

    // Анимация появления
    series.appear(1000, 100);

    // Если используете метку в центре диаграммы, оставьте этот код
    var label = root.tooltipContainer.children.push(am5.Label.new(root, {
        x: am5.p50,
        y: am5.p50,
        centerX: am5.p50,
        centerY: am5.p50,
        fill: am5.color(0x000000),
        fontSize: 50
    }));
});
