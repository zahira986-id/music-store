document.addEventListener('DOMContentLoaded', () => {
    // Notification System
    function showNotification(message, type = 'success') {
        const container = document.getElementById('notification-container');
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;

        const icon = type === 'success' ? '✓' : '✕';
        notification.innerHTML = `
            <span class="notification-icon">${icon}</span>
            <span class="notification-message">${message}</span>
        `;

        container.appendChild(notification);

        // Animate in
        setTimeout(() => notification.classList.add('show'), 10);

        // Auto remove after 3 seconds
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }

    // Modal Elements
    const authModal = document.getElementById('auth-modal');
    const closeModal = document.querySelector('.close-modal');
    const loginFormContainer = document.getElementById('login-form-container');
    const signupFormContainer = document.getElementById('signup-form-container');

    // Buttons
    const showLoginBtn = document.getElementById('show-login');
    const showSignupBtn = document.getElementById('show-signup');
    const switchToSignup = document.getElementById('switch-to-signup');
    const switchToLogin = document.getElementById('switch-to-login');

    // Forms
    const loginForm = document.getElementById('login-form');
    const signupForm = document.getElementById('signup-form');

    // Show Modal Functions
    function showModal(type) {
        authModal.classList.remove('hidden');
        if (type === 'login') {
            loginFormContainer.classList.remove('hidden');
            signupFormContainer.classList.add('hidden');
        } else {
            loginFormContainer.classList.add('hidden');
            signupFormContainer.classList.remove('hidden');
        }
    }

    function hideModal() {
        authModal.classList.add('hidden');
    }

    // Event Listeners
    showLoginBtn.addEventListener('click', (e) => {
        e.preventDefault();
        showModal('login');
    });

    showSignupBtn.addEventListener('click', (e) => {
        e.preventDefault();
        showModal('signup');
    });

    closeModal.addEventListener('click', hideModal);

    window.addEventListener('click', (e) => {
        if (e.target === authModal) {
            hideModal();
        }
    });

    switchToSignup.addEventListener('click', (e) => {
        e.preventDefault();
        showModal('signup');
    });

    switchToLogin.addEventListener('click', (e) => {
        e.preventDefault();
        showModal('login');
    });

    // API Handling
    async function handleAuth(url, data) {
        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || 'An error occurred');
            }

            return result;
        } catch (error) {
            throw error;
        }
    }

    // Sign Up Submission
    signupForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const nom = document.getElementById('signup-nom').value;
        const email = document.getElementById('signup-email').value;
        const password = document.getElementById('signup-password').value;

        try {
            const result = await handleAuth('/signup', { nom, email, password });
            showNotification('Account created successfully! Please sign in.', 'success');
            showModal('login');
        } catch (error) {
            showNotification(error.message, 'error');
        }
    });

    // Login Submission
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;

        try {
            const result = await handleAuth('/login', { email, password });
            // In a real app, update UI to show user is logged in
        } catch (error) {
            showNotification(error.message, 'error');
        }
    });

    // --- Add Instrument Logic ---
    const addInstrModal = document.getElementById('add-instr-modal');
    const showAddInstrBtn = document.getElementById('show-add-instr-btn');
    const closeInstrModal = document.querySelector('.close-instr-modal');
    const addInstrForm = document.getElementById('add-instr-form');

    function showInstrModal() {
        addInstrModal.classList.remove('hidden');
    }

    function hideInstrModal() {
        addInstrModal.classList.add('hidden');
    }

    if (showAddInstrBtn) {
        showAddInstrBtn.addEventListener('click', (e) => {
            e.preventDefault();
            showInstrModal();
        });
    }

    if (closeInstrModal) {
        closeInstrModal.addEventListener('click', hideInstrModal);
    }

    // Close on outside click (merged with existing listener or new one)
    window.addEventListener('click', (e) => {
        if (e.target === addInstrModal) {
            hideInstrModal();
        }
    });

    addInstrForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const nom = document.getElementById('instr-nom').value;
        const type = document.getElementById('instr-type').value;
        const marque = document.getElementById('instr-marque').value;
        const prix = document.getElementById('instr-prix').value;
        const etat = document.getElementById('instr-etat').value;
        const caracteristique = document.getElementById('instr-caracteristique').value;
        const image_url = document.getElementById('instr-image').value;

        try {
            const response = await fetch('/api/instruments', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ nom, type, marque, prix, etat, caracteristique, image_url })
            });

            const result = await response.json();
            if (!response.ok) throw new Error(result.error || 'Failed to add');

            showNotification('Instrument added successfully!', 'success');
            hideInstrModal();
            loadInstruments(); // Reload grid
            addInstrForm.reset();
        } catch (error) {
            showNotification(error.message, 'error');
        }
    });

    // --- Brand Filter Logic ---
    let selectedBrand = '';

    async function loadBrands() {
        try {
            const response = await fetch('/api/brands');
            if (!response.ok) throw new Error('Failed to fetch brands');

            const brands = await response.json();
            const brandFilter = document.getElementById('brand-filter');

            // Add brand options
            brands.forEach(brand => {
                const option = document.createElement('option');
                option.value = brand;
                option.textContent = brand;
                brandFilter.appendChild(option);
            });
        } catch (error) {
            console.error('Error loading brands:', error);
        }
    }

    document.getElementById('brand-filter').addEventListener('change', (e) => {
        selectedBrand = e.target.value;
        currentPage = 1; // Reset to first page
        renderPage(currentPage);
    });

    // Load Instruments with Pagination and Filtering
    let allInstruments = [];
    let currentPage = 1;
    const itemsPerPage = 6; // 2 rows of 3 cards

    async function loadInstruments() {
        const grid = document.getElementById('instruments-grid');
        try {
            const response = await fetch('/api/instruments');
            if (!response.ok) throw new Error('Failed to fetch instruments');

            allInstruments = await response.json();
            renderPage(currentPage);
        } catch (error) {
            console.error(error);
            grid.innerHTML = '<div class="loading">Error loading instruments.</div>';
        }
    }

    function renderPage(page) {
        const grid = document.getElementById('instruments-grid');
        const pageInfo = document.getElementById('page-info');
        const prevBtn = document.getElementById('prev-page');
        const nextBtn = document.getElementById('next-page');

        grid.innerHTML = ''; // Clear

        if (allInstruments.length === 0) {
            grid.innerHTML = '<div class="loading">No instruments found.</div>';
            return;
        }

        // Filter by brand if selected
        let filteredInstruments = allInstruments;
        if (selectedBrand) {
            filteredInstruments = allInstruments.filter(inst => inst.marque === selectedBrand);
        }

        if (filteredInstruments.length === 0) {
            grid.innerHTML = '<div class="loading">No instruments found for this brand.</div>';
            pageInfo.textContent = 'Page 0 of 0';
            prevBtn.disabled = true;
            nextBtn.disabled = true;
            return;
        }

        // Calculate pagination
        const totalPages = Math.ceil(filteredInstruments.length / itemsPerPage);
        const startIndex = (page - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        const pageInstruments = filteredInstruments.slice(startIndex, endIndex);

        // Render cards
        pageInstruments.forEach(inst => {
            const card = document.createElement('div');
            card.className = 'instrument-card';

            const imgSrc = inst.image_url || 'https://via.placeholder.com/400x250/2563eb/ffffff?text=Instrument';
            const statusClass = inst.status === 'disponible' ? 'status-disponible' : 'status-sold';

            card.innerHTML = `
                <img src="${imgSrc}" alt="${inst.nom}" class="card-image">
                <div class="card-content">
                    <div class="card-brand">${inst.marque || 'Brand N/A'}</div>
                    <h3 class="card-title">${inst.nom}</h3>
                    <div class="card-type">Type: ${inst.type}</div>
                    <div class="card-description">${inst.caracteristique || 'No description available.'}</div>
                    <div class="card-footer">
                        <span class="card-price">${inst.prix} €</span>
                        <span class="card-status ${statusClass}">${inst.status}</span>
                    </div>
                </div>
            `;
            grid.appendChild(card);
        });

        // Update pagination controls
        pageInfo.textContent = `Page ${page} of ${totalPages}`;
        prevBtn.disabled = page === 1;
        nextBtn.disabled = page === totalPages;
    }

    // Pagination event listeners
    document.getElementById('prev-page').addEventListener('click', () => {
        if (currentPage > 1) {
            currentPage--;
            renderPage(currentPage);
        }
    });

    document.getElementById('next-page').addEventListener('click', () => {
        let filteredInstruments = allInstruments;
        if (selectedBrand) {
            filteredInstruments = allInstruments.filter(inst => inst.marque === selectedBrand);
        }
        const totalPages = Math.ceil(filteredInstruments.length / itemsPerPage);
        if (currentPage < totalPages) {
            currentPage++;
            renderPage(currentPage);
        }
    });

    loadBrands();
    loadInstruments();
});
