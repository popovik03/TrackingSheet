am5.ready(function () {

    if (typeof chartData === 'undefined' || chartData.length === 0) {
        console.warn('Нет данных для отображения графиков.');
        return;
    }

    console.log(chartData); // Для отладки

    // Создаем элемент root
    var root = am5.Root.new("bar_chart");

    // Устанавливаем темы (если нужно)
    root.setThemes([
        am5themes_Animated.new(root)
    ]);

    // Создаем диаграмму
    var chart = root.container.children.push(am5xy.XYChart.new(root, {
        panX: false,
        panY: false,
        wheelX: "panX",
        wheelY: "zoomX",
        paddingLeft: 0,
        layout: root.verticalLayout
    }));

    // Добавляем легенду
    var legend = chart.children.push(am5.Legend.new(root, {
        centerX: am5.p50,
        x: am5.p50
    }));

    // Создаем оси
    var xRenderer = am5xy.AxisRendererX.new(root, {
        cellStartLocation: 0.1,
        cellEndLocation: 0.9,
        minorGridEnabled: true
    });

    var xAxis = chart.xAxes.push(am5xy.CategoryAxis.new(root, {
        categoryField: "problemType",
        renderer: xRenderer,
        tooltip: am5.Tooltip.new(root, {})
    }));

    xRenderer.labels.template.setAll({
        rotation: -45,
        centerY: am5.p50,
        centerX: am5.p100,
        paddingRight: 15,
        minPosition: 0.01,
        maxPosition: 0.99,
        oversizedBehavior: "wrap", // Чтобы длинные метки переносились
        fontSize: 14, // Уменьшите размер шрифта при необходимости
        forceHidden: false
    });


    xRenderer.grid.template.setAll({
        location: 1
    });
    xRenderer.setAll({
        minGridDistance: 1,
        autoGridCount: false
    });


    var yAxis = chart.yAxes.push(am5xy.ValueAxis.new(root, {
        min: 0,
        renderer: am5xy.AxisRendererY.new(root, {
            strokeOpacity: 0.1
        })
    }));

    // Передаем данные в ось X
    xAxis.data.setAll(chartData);

    // Функция для добавления серий
    function makeSeries(name, fieldName, color) {
        var series = chart.series.push(am5xy.ColumnSeries.new(root, {
            name: name,
            xAxis: xAxis,
            yAxis: yAxis,
            valueYField: fieldName,
            categoryXField: "problemType",
            stacked: true
        }));

        series.columns.template.setAll({
            tooltipText: "{categoryX} (" + name + "): {valueY}",
            width: am5.percent(90),
            fill: am5.color(color),
            stroke: am5.color(color)
        });

        series.data.setAll(chartData);

        // Добавляем подписи к столбцам
        series.bullets.push(function () {
            return am5.Bullet.new(root, {
                locationY: 0.5,
                sprite: am5.Label.new(root, {
                    text: "{valueY}",
                    fill: root.interfaceColors.get("alternativeText"),
                    centerY: am5.percent(50),
                    centerX: am5.percent(50),
                    populateText: true
                })
            });
        });

        // Добавляем серию в легенду
        legend.data.push(series);
    }

    // Добавляем серию для успешных операций с указанным цветом
    makeSeries("Успешно", "successCount", 0x038073); // Цвет #038073

    // Добавляем серию для неуспешных операций с указанным цветом
    makeSeries("Неуспешно", "failCount", 0x0078BE); // Цвет #0078BE

    // Анимация появления
    chart.appear(1000, 100);

});
