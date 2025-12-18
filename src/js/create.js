document.addEventListener('DOMContentLoaded', () => {
    const themeToggle = document.getElementById('theme-toggle');
    const createForm = document.getElementById('create-form');
    const modalOverlay = document.getElementById('custom-modal-overlay');
    const modalMessage = document.getElementById('modal-message');
    const modalButtons = document.getElementById('modal-buttons');

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

    // Modal Logic
    const showModal = (message, buttons = []) => {
        modalMessage.textContent = message;
        modalButtons.innerHTML = '';
        if (buttons.length === 0) {
            buttons.push({ text: 'OK', class: 'primary', onClick: closeModal });
        }
        buttons.forEach(btnInfo => {
            const button = document.createElement('button');
            button.textContent = btnInfo.text;
            button.className = btnInfo.class || 'primary';
            button.addEventListener('click', btnInfo.onClick);
            modalButtons.appendChild(button);
        });
        modalOverlay.classList.remove('hidden');
    };

    const closeModal = () => {
        modalOverlay.classList.add('hidden');
    };

    // Form submission
    createForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const formData = new FormData(createForm);
        const data = {
            name: formData.get('raffle-name'),
            description: formData.get('raffle-description'),
            prize: formData.get('raffle-prize'),
            ticket_price: parseFloat(formData.get('ticket-price')),
            total_tickets: parseInt(formData.get('total-tickets'))
        };

        try {
            const response = await fetch('config/api/create_rifa.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });

            const result = await response.json();
            if (result.success) {
                showModal('Rifa creada exitosamente.', [
                    { text: 'Ver Rifa', class: 'primary', onClick: () => window.location.href = `raffle.html?id=${result.rifa_id}` }
                ]);
            } else {
                showModal('Error: ' + result.message);
            }
        } catch (error) {
            showModal('Error de conexión: ' + error.message);
        }
    });
});