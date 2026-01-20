// Modal Utility
export function openModal(modalId) {
    const overlay = document.getElementById('modal-overlay');
    const modal = document.getElementById(modalId);
    if (overlay && modal) {
        // Hide all other modals first
        document.querySelectorAll('.modal').forEach(m => m.style.display = 'none');
        overlay.classList.add('active');
        modal.style.display = 'block';
    }
}

export function closeModal(modalId) {
    const overlay = document.getElementById('modal-overlay');
    const modal = document.getElementById(modalId);
    if (overlay && modal) {
        overlay.classList.remove('active');
        modal.style.display = 'none';
    }
}

export function initModals() {
    const overlay = document.getElementById('modal-overlay');

    // Close on overlay click
    overlay?.addEventListener('click', (e) => {
        if (e.target === overlay) {
            overlay.classList.remove('active');
            document.querySelectorAll('.modal').forEach(m => m.style.display = 'none');
        }
    });

    // Close buttons
    document.querySelectorAll('.modal-close, [data-modal]').forEach(btn => {
        btn.addEventListener('click', () => {
            const modalId = btn.dataset.modal;
            if (modalId) closeModal(modalId);
        });
    });
}
