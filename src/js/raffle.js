document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const appContainer = document.getElementById('app');
    const saveContainer = document.getElementById('save-container');
    const buyerNameInput = document.getElementById('buyer-name');
    const saveButton = document.getElementById('save-button');
    const cancelButton = document.getElementById('cancel-button');
    const modalOverlay = document.getElementById('custom-modal-overlay');
    const modalMessage = document.getElementById('modal-message');
    const modalButtons = document.getElementById('modal-buttons');

    // App State
    let selectedNumbers = [];

    // Theme Management
    const themeToggle = document.getElementById('theme-toggle');
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

    // --- Modal Logic ---
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

    // --- Core App Logic ---
    const getRifaIdFromUrl = () => {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get('id') || '1'; // Default to 1 if no id
    };

    const isEditMode = () => {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get('edit') === '1';
    };

    const fetchData = async () => {
        try {
            appContainer.style.opacity = '0.5';
            const rifaId = getRifaIdFromUrl();
            const response = await fetch(`config/api/get_data.php?rifa_id=${rifaId}`);
            if (!response.ok) throw new Error('Network response was not ok');
            const data = await response.json();
            if (data.rifas.length === 0) {
                showModal('Rifa no encontrada.');
                return;
            }
            renderRifa(data);
            clearSelection();
        } catch (error) {
            showModal(`Error al cargar los datos: ${error.message}`);
        } finally {
            appContainer.style.opacity = '1';
        }
    };

    const renderRifa = (data) => {
        const rifa = data.rifas[0];
        if (!rifa) {
            appContainer.innerHTML = '<h1>No hay rifas disponibles.</h1>';
            return;
        }

        if (isEditMode()) {
            renderEditForm(rifa);
            return;
        }

        let ticketsHTML = '';
        for (const ticket of rifa.boletos) {
            let content;
            let title = `Boleto #${ticket.number}`;
            if (ticket.status === 'sold') {
                content = '🎄';
                title += ` (Vendido a: ${ticket.owner})`;
            } else {
                content = `<span class="ticket-number">${String(ticket.number).padStart(2, '0')}</span>`;
            }
            
            ticketsHTML += `<div class="ticket ${ticket.status}" data-number="${ticket.number}" title="${title}">
                ${content}
            </div>`;
        }

        // Calculate counters
        const availableCount = rifa.boletos.filter(ticket => ticket.status === 'available').length;
        const soldCount = rifa.boletos.filter(ticket => ticket.status === 'sold').length;

        let participantsHTML = '';
        if (data.participants && data.participants.length > 0) {
            participantsHTML = '<h2>Participantes</h2><ul class="participants-list">';
            data.participants.forEach(p => {
                participantsHTML += `<li>${p.owner}: ${p.numbers}</li>`;
            });
            participantsHTML += '</ul>';
        }

        appContainer.innerHTML = `
            <div id="theme-toggle">${themeToggle.textContent}</div>
            <a href="index.html" id="back-link">← Volver al Inicio</a>
            <h1>${rifa.name}</h1>
            <h2>Premio: ${rifa.prize}</h2>
            ${rifa.description ? `<p><strong>Descripción:</strong> ${rifa.description.replace(/\n/g, '<br>')}</p>` : ''}
            <div class="counters">
                <div class="counter available">
                    <span class="count">${availableCount}</span>
                    <span class="label">Disponibles</span>
                </div>
                <div class="counter sold">
                    <span class="count">${soldCount}</span>
                    <span class="label">Vendidos</span>
                </div>
            </div>
            <div class="ticket-grid">
                ${ticketsHTML}
            </div>
            <div class="export-buttons">
                <button id="export-full" style="display: none;">Exportar Rifa</button>
                <button id="export-grid">Exportar Grilla</button>
            </div>
            ${participantsHTML}
        `;

        document.getElementById('theme-toggle').addEventListener('click', toggleTheme);
        document.getElementById('export-full').addEventListener('click', () => exportGrid(false));
        document.getElementById('export-grid').addEventListener('click', () => exportGrid(true));
    };

    const renderEditForm = (rifa) => {
        appContainer.innerHTML = `
            <div id="theme-toggle">${themeToggle.textContent}</div>
            <a href="raffle.html?id=${rifa.id}" id="back-link">← Volver a la Rifa</a>
            <h1>Editar Rifa</h1>
            <form id="edit-form">
                <label for="raffle-name">Nombre de la Rifa:</label>
                <input type="text" id="raffle-name" name="raffle-name" value="${rifa.name}" required>

                <label for="raffle-description">Descripción:</label>
                <textarea id="raffle-description" name="raffle-description">${rifa.description || ''}</textarea>

                <label for="raffle-prize">Premio:</label>
                <input type="text" id="raffle-prize" name="raffle-prize" value="${rifa.prize}" required>

                <label for="ticket-price">Precio por Boleto:</label>
                <input type="number" id="ticket-price" name="ticket-price" value="${rifa.ticket_price}" step="0.01" required>

                <button type="submit">Guardar Cambios</button>
                <a href="raffle.html?id=${rifa.id}"><button type="button">Cancelar</button></a>
            </form>
        `;

        document.getElementById('theme-toggle').addEventListener('click', toggleTheme);
        document.getElementById('edit-form').addEventListener('submit', (e) => updateRifa(e, rifa.id));
    };

    const updateRifa = async (e, rifaId) => {
        e.preventDefault();

        const formData = new FormData(e.target);
        const data = {
            id: rifaId,
            name: formData.get('raffle-name'),
            description: formData.get('raffle-description'),
            prize: formData.get('raffle-prize'),
            ticket_price: parseFloat(formData.get('ticket-price'))
        };

        try {
            const response = await fetch('config/api/update_rifa.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });

            const result = await response.json();
            if (result.success) {
                showModal('Rifa actualizada exitosamente.', [
                    { text: 'Ver Rifa', class: 'primary', onClick: () => window.location.href = `raffle.html?id=${rifaId}` }
                ]);
            } else {
                showModal('Error: ' + result.message);
            }
        } catch (error) {
            showModal('Error de conexión: ' + error.message);
        }
    };

    const handleTicketClick = (e) => {
        const ticketEl = e.target.closest('.ticket');
        if (!ticketEl) return;

        const ticketNumber = parseInt(ticketEl.dataset.number);
        const status = ticketEl.classList.contains('sold') ? 'sold' : 'available';

        if (status === 'available') {
            if (selectedNumbers.includes(ticketNumber)) {
                selectedNumbers = selectedNumbers.filter(n => n !== ticketNumber);
            } else {
                selectedNumbers.push(ticketNumber);
            }
            updateSelectionState();
        } else { // 'sold'
            if (selectedNumbers.length > 0) {
                showModal("Termina o cancela la selección actual antes de liberar un boleto.");
                return;
            }

            const ownerMatch = ticketEl.title.match(/\(Vendido a: (.*)\)/);
            const owner = ownerMatch ? ownerMatch[1] : 'desconocido';
            
            showModal(`¿Deseas liberar el boleto #${ticketNumber} que pertenece a ${owner}?`, [
                { text: 'Sí, Liberar', class: 'danger', onClick: () => {
                    liberarBoleto(ticketNumber);
                    closeModal();
                }},
                { text: 'No, Cancelar', class: 'secondary', onClick: closeModal }
            ]);
        }
    };

    const liberarBoleto = async (number) => {
        try {
            const response = await fetch('config/api/liberar_boleto.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ number: number, rifa_id: getRifaIdFromUrl() }),
            });
            const result = await response.json();
            showModal(result.message);
            if (result.success) {
                fetchData();
            }
        } catch (error) {
            showModal('Ocurrió un error de conexión al intentar liberar el boleto.');
        }
    };

    // --- Selection & Saving Logic ---
    const updateSelectionState = () => {
        document.querySelectorAll('.ticket.selected').forEach(t => t.classList.remove('selected'));
        selectedNumbers.forEach(num => {
            const ticketEl = document.querySelector(`.ticket[data-number="${num}"]`);
            if (ticketEl) ticketEl.classList.add('selected');
        });
        saveContainer.classList.toggle('hidden', selectedNumbers.length === 0);
    };

    const clearSelection = () => {
        selectedNumbers = [];
        buyerNameInput.value = '';
        updateSelectionState();
    };

    const saveData = async () => {
        const name = buyerNameInput.value.trim();
        if (!name) {
            showModal('Por favor, ingresa el nombre del comprador.');
            buyerNameInput.focus();
            return;
        }

        try {
            const response = await fetch('config/api/guardar_boletos.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: name, numbers: selectedNumbers, rifa_id: getRifaIdFromUrl() }),
            });

            const result = await response.json();
            showModal(result.message);

            if (result.success) {
                clearSelection();
                fetchData();
            }
        } catch (error) {
            showModal('Ocurrió un error de conexión al intentar guardar.');
        }
    };

    // --- Export Logic ---
    const exportGrid = (gridOnly = false) => {
        const app = document.getElementById('app');
        if (!app) return;

        showModal("Generando imagen... El proceso puede tardar unos segundos.");

        // Calculate grid dimensions
        const totalTickets = document.querySelectorAll('.ticket').length;
        const columns = 10;
        const rows = Math.ceil(totalTickets / columns);
        const cellSize = 40; // px
        const gridWidth = columns * cellSize;
        const gridHeight = rows * cellSize;

        // Create export container
        const exportContainer = document.createElement('div');
        exportContainer.style.width = gridOnly ? `${gridWidth + 40}px` : `${gridWidth + 80}px`; // Less padding for grid only
        exportContainer.style.padding = gridOnly ? '20px 20px 30px 20px' : '40px 50px 20px 50px'; // 20px bottom margin for grid
        exportContainer.style.height = gridOnly ? `${gridHeight + 150}px` : 'auto'; // Extra height for grid only
        exportContainer.style.backgroundColor = 'white';
        exportContainer.style.fontFamily = 'Arial, sans-serif';
        exportContainer.style.color = '#333'; // Dark text for visibility

        if (!gridOnly) {
            // Add title
            const title = document.querySelector('h1');
            if (title) {
                const titleClone = title.cloneNode(true);
                titleClone.style.margin = '0 0 10px 0';
                titleClone.style.fontSize = '24px';
                exportContainer.appendChild(titleClone);
            }

            // Add prize
            const prize = document.querySelector('h2');
            if (prize) {
                const prizeClone = prize.cloneNode(true);
                prizeClone.style.margin = '0 0 10px 0';
                prizeClone.style.fontSize = '18px';
                prizeClone.style.textAlign = 'left';
                exportContainer.appendChild(prizeClone);
            }

            // Add description
            const desc = document.querySelector('p strong');
            if (desc && desc.textContent.includes('Descripción:')) {
                const descPara = desc.parentNode.cloneNode(true);
                descPara.style.margin = '0 0 20px 0';
                descPara.style.fontSize = '14px';
                descPara.style.textAlign = 'left';
                exportContainer.appendChild(descPara);
            }
        } else {
            // Add counters for grid only
            const availableCount = document.querySelectorAll('.ticket.available').length;
            const soldCount = document.querySelectorAll('.ticket.sold').length;

            const countersDiv = document.createElement('div');
            countersDiv.style.textAlign = 'center';
            countersDiv.style.marginBottom = '20px';
            countersDiv.style.fontSize = '18px';
            countersDiv.innerHTML = `Disponibles: ${availableCount} | Vendidos: ${soldCount}`;
            exportContainer.appendChild(countersDiv);
        }

        // Clone and style the grid
        const grid = document.querySelector('.ticket-grid');
        if (grid) {
            const gridClone = grid.cloneNode(true);
            gridClone.style.width = `${gridWidth}px`;
            gridClone.style.height = `${gridHeight}px`;
            gridClone.style.display = 'grid';
            gridClone.style.gridTemplateColumns = `repeat(${columns}, ${cellSize}px)`;
            gridClone.style.gap = '5px';
            gridClone.style.margin = '0 auto';

            // Style tickets for export
            const tickets = gridClone.querySelectorAll('.ticket');
            tickets.forEach(ticket => {
                ticket.style.width = `${cellSize}px`;
                ticket.style.height = `${cellSize}px`;
                ticket.style.border = '1px solid #ccc';
                ticket.style.display = 'flex';
                ticket.style.alignItems = 'center';
                ticket.style.justifyContent = 'center';
                ticket.style.fontSize = '12px';
                ticket.style.fontWeight = 'bold';
                ticket.style.backgroundColor = ticket.classList.contains('sold') ? '#e8f5e9' : '#f9f9f9';
                ticket.style.color = ticket.classList.contains('sold') ? '#388e3c' : '#333';
            });

            exportContainer.appendChild(gridClone);
        }

        // Temporarily add to DOM for capture
        document.body.appendChild(exportContainer);

        html2canvas(exportContainer, {
            backgroundColor: '#ffffff',
            scale: 2,
            scrollX: 0,
            scrollY: 0,
        }).then(canvas => {
            const link = document.createElement('a');
            link.download = 'rifa.jpg';
            link.href = canvas.toDataURL('image/jpeg', 0.9);
            link.click();
            document.body.removeChild(exportContainer);
            closeModal();
        });
    };

    // --- Initial Setup ---
    appContainer.addEventListener('click', handleTicketClick);
    saveButton.addEventListener('click', saveData);
    cancelButton.addEventListener('click', clearSelection);
    fetchData();
});
