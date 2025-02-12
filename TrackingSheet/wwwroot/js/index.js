document.addEventListener('DOMContentLoaded', () => {
    const menuItems = document.querySelectorAll('#menuList li');
    const menuList = document.getElementById('menuList');
    const mainContainer = document.querySelector('main');

    // Функция для добавления анимации
    function fadeInMain() {
        // Добавляем класс с небольшой задержкой, чтобы анимация началась плавно
        setTimeout(() => {
            mainContainer.classList.add('show');
        }, 400); // Задержка для запуска анимации
    }

    // Запуск анимации для main при загрузке страницы
    fadeInMain();

});
