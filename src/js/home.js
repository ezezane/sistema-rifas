document.addEventListener('DOMContentLoaded', () => {
    const themeToggle = document.getElementById('theme-toggle');
    const createButton = document.getElementById('create-raffle');
    const rafflesList = document.getElementById('raffles-list');

    // Theme Management
    const applyTheme = (isDark) => {
        document.body.classList.toggle('dark', isDark);
        themeToggle.textContent = isDark ? '☀️' : '🌙';
        localStorage.setItem('theme', isDark ? 'dark' : 'light');
    };

    const toggleTheme = () => {
        const isDark = !document.body.classList.contains('dark');
        applyTheme(isDark);
    };

    // Load saved theme
    const savedTheme = localStorage.getItem('theme');
    applyTheme(savedTheme === 'dark');

    themeToggle.addEventListener('click', toggleTheme);
    createButton.addEventListener('click', () => window.location.href = 'create.html');

    // Load raffles
    const loadRaffles = async () => {
        try {
            const response = await fetch('config/api/get_data.php');
            if (!response.ok) throw new Error('Network response was not ok');
            const data = await response.json();
            renderRaffles(data.rifas);
        } catch (error) {
            rafflesList.innerHTML = '<h2>Rifas Existentes</h2><p>Error al cargar rifas.</p>';
        }
    };

    const renderRaffles = (rifas) => {
        if (rifas.length === 0) {
            rafflesList.innerHTML = '<h2>Rifas Existentes</h2><p>No hay rifas creadas aún.</p>';
            return;
        }

        let html = '<h2>Rifas Existentes</h2><ul class="raffles-ul">';
        rifas.forEach(rifa => {
            html += `<li>
                <a href="raffle.html?id=${rifa.id}">${rifa.name}</a> - ${rifa.total_tickets} boletos
                <a href="raffle.html?id=${rifa.id}&edit=1" class="edit-link">Editar</a>
            </li>`;
        });
        html += '</ul>';
        rafflesList.innerHTML = html;
    };

    loadRaffles();
});