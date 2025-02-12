document.addEventListener('DOMContentLoaded', () => {
    const menuItems = document.querySelectorAll('#menuList li');
    const mainContainer = document.querySelector('.main-container');
    const menuList = document.getElementById('menuList');

    const contentMap = {
        main: '/Home/Index',
        journal: '/Incidents/Index',
        newIncident: '/Incidents/Add',
        vsatBHA: '/VsatInfo/SelectIpAddress',
        statistics: '/IncidentsStatistics/SelectPeriod',
        about: '/Home/Privacy'
    };

    menuList.addEventListener('click', async (e) => {
        const target = e.target.closest('li');
        if (target) {
            const selectedId = target.id;
            const url = contentMap[selectedId];

            if (url) {
                try {
                    // Удаляем предыдущий контент
                    mainContainer.innerHTML = '';

                    // Загружаем новый контент
                    const response = await fetch(url);
                    if (!response.ok) {
                        throw new Error(`HTTP error! status: ${response.status}`);
                    }
                    const data = await response.text();

                    // Создаем временный контейнер для содержимого
                    const tempContainer = document.createElement('div');
                    tempContainer.innerHTML = data;

                    // Перемещаем содержимое из временного контейнера в основной
                    mainContainer.appendChild(tempContainer);

                    // Убираем класс active со всех элементов и добавляем к текущему
                    menuItems.forEach(item => item.classList.remove('active'));
                    target.classList.add('active');

                    // Обрабатываем скрипты
                    const scripts = mainContainer.querySelectorAll('script');
                    scripts.forEach(script => {
                        if (script.src) {
                            const newScript = document.createElement('script');
                            newScript.src = script.src;
                            document.body.appendChild(newScript);
                        } else {
                            const newScript = document.createElement('script');
                            newScript.textContent = script.textContent;
                            document.body.appendChild(newScript);
                        }
                    });

                    // Запускаем анимацию появления контента
                    setTimeout(() => {
                        const elements = mainContainer.querySelectorAll('*');
                        elements.forEach((element, index) => {
                            element.classList.add('hidden-element');
                            element.style.animationDelay = `${index * 0.1}s`;
                        });

                        // Используем `setTimeout` для начала анимации
                        setTimeout(() => {
                            elements.forEach(element => {
                                element.classList.remove('hidden-element');
                                element.classList.add('fade-in-element');
                            });
                        }, 200); // Небольшая задержка для обеспечения отрисовки
                    }, 0);
                } catch (error) {
                    console.error('Error loading content:', error);
                }
            }
        }
    });
});
