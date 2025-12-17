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
    const fetchData = async () => {
        try {
            appContainer.style.opacity = '0.5';
            const response = await fetch('api/get_data.php');
            if (!response.ok) throw new Error('Network response was not ok');
            const data = await response.json();
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

        appContainer.innerHTML = `
            <h1>${rifa.name}</h1>
            <h2>Premio: ${rifa.prize}</h2>
            <div class="ticket-grid">
                ${ticketsHTML}
            </div>
            <button id="export-button">Exportar a JPG</button>
        `;

        document.getElementById('export-button').addEventListener('click', exportGrid);
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
            const response = await fetch('api/liberar_boleto.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ number: number }),
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
            const response = await fetch('api/guardar_boletos.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: name, numbers: selectedNumbers }),
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
    const exportGrid = () => {
        const grid = document.querySelector('.ticket-grid');
        if (!grid) return;

        showModal("Generando imagen... El proceso puede tardar unos segundos.");

        grid.style.width = '800px';
        grid.style.height = '800px';

        html2canvas(grid, {
            backgroundColor: '#ffffff',
            scale: 2,
        }).then(canvas => {
            const link = document.createElement('a');
            link.download = 'rifa-navidena.jpg';
            link.href = canvas.toDataURL('image/jpeg', 0.9);
            link.click();
            grid.style.width = '';
            grid.style.height = '';
            closeModal();
        });
    };

    // --- Initial Setup ---
    appContainer.addEventListener('click', handleTicketClick);
    saveButton.addEventListener('click', saveData);
    cancelButton.addEventListener('click', clearSelection);
    fetchData();
});
