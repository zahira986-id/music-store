document.addEventListener('DOMContentLoaded', () => {
    // Favorites Management
    function getFavorites() {
        const favorites = localStorage.getItem('musicstore-favorites');
        return favorites ? JSON.parse(favorites) : [];
    }

    function saveFavorites(favorites) {
        localStorage.setItem('musicstore-favorites', JSON.stringify(favorites));
    }

    function toggleFavorite(id, name) {
        let favorites = getFavorites();
        const index = favorites.indexOf(id);

        if (index > -1) {
            // Remove from favorites
            favorites.splice(index, 1);
            showNotification(`"${name}" removed from favorites`, 'success');
        } else {
            // Add to favorites
            favorites.push(id);
            showNotification(`"${name}" added to favorites ❤️`, 'success');
        }

        saveFavorites(favorites);
        renderPage(currentPage); // Re-render to update heart icons
    }

    function isFavorite(id) {
        const favorites = getFavorites();
        return favorites.includes(id);
    }

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

    // --- Edit Instrument Logic ---
    const editInstrModal = document.getElementById('edit-instr-modal');
    const closeEditModal = document.querySelector('.close-edit-modal');
    const editInstrForm = document.getElementById('edit-instr-form');

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
        if (e.target === editInstrModal) {
            hideEditModal();
        }
    });

    function showEditModal(instrument) {
        editInstrModal.classList.remove('hidden');
        // Populate form with current values
        document.getElementById('edit-instr-id').value = instrument.id;
        document.getElementById('edit-instr-nom').value = instrument.nom;
        document.getElementById('edit-instr-type').value = instrument.type;
        document.getElementById('edit-instr-marque').value = instrument.marque || '';
        document.getElementById('edit-instr-prix').value = instrument.prix || '';
        document.getElementById('edit-instr-etat').value = instrument.etat || '';
        document.getElementById('edit-instr-caracteristique').value = instrument.caracteristique || '';
        document.getElementById('edit-instr-image').value = instrument.image_url || '';
    }

    function hideEditModal() {
        editInstrModal.classList.add('hidden');
    }

    if (closeEditModal) {
        closeEditModal.addEventListener('click', hideEditModal);
    }

    editInstrForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const id = document.getElementById('edit-instr-id').value;
        const nom = document.getElementById('edit-instr-nom').value;
        const type = document.getElementById('edit-instr-type').value;
        const marque = document.getElementById('edit-instr-marque').value;
        const prix = document.getElementById('edit-instr-prix').value;
        const etat = document.getElementById('edit-instr-etat').value;
        const caracteristique = document.getElementById('edit-instr-caracteristique').value;
        const image_url = document.getElementById('edit-instr-image').value;

        try {
            const response = await fetch(`/api/instruments/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ nom, type, marque, prix, etat, caracteristique, image_url })
            });

            const result = await response.json();
            if (!response.ok) throw new Error(result.error || 'Failed to update');

            showNotification('Instrument updated successfully!', 'success');
            hideEditModal();
            loadInstruments(); // Reload grid
        } catch (error) {
            showNotification(error.message, 'error');
        }
    });

    // Delete Instrument Function
    async function deleteInstrument(id, name) {
        try {
            const response = await fetch(`/api/instruments/${id}`, {
                method: 'DELETE'
            });

            const result = await response.json();
            if (!response.ok) throw new Error(result.error || 'Failed to delete');

            showNotification(`"${name}" deleted successfully!`, 'success');
            loadInstruments(); // Reload grid
        } catch (error) {
            showNotification(error.message, 'error');
        }
    }

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

    // --- Brand Filter and Search Logic ---
    let selectedBrand = '';
    let searchTerm = '';

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

    // Search input with debouncing
    let searchTimeout;
    document.getElementById('search-input').addEventListener('input', (e) => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
            searchTerm = e.target.value.toLowerCase().trim();
            currentPage = 1; // Reset to first page
            renderPage(currentPage);
        }, 300); // 300ms debounce
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

        // Filter by brand and search term
        let filteredInstruments = allInstruments;

        // Apply brand filter
        if (selectedBrand) {
            filteredInstruments = filteredInstruments.filter(inst => inst.marque === selectedBrand);
        }

        // Apply search filter
        if (searchTerm) {
            filteredInstruments = filteredInstruments.filter(inst => {
                return (
                    inst.nom?.toLowerCase().includes(searchTerm) ||
                    inst.type?.toLowerCase().includes(searchTerm) ||
                    inst.marque?.toLowerCase().includes(searchTerm) ||
                    inst.caracteristique?.toLowerCase().includes(searchTerm)
                );
            });
        }

        if (filteredInstruments.length === 0) {
            grid.innerHTML = '<div class="loading">No instruments found matching your criteria.</div>';
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
            const favoriteClass = isFavorite(inst.id) ? 'favorite-active' : '';
            const heartIcon = isFavorite(inst.id) ? '❤️' : '🤍';

            card.innerHTML = `
                <div class="card-header">
                    <button class="favorite-btn ${favoriteClass}" data-id="${inst.id}" data-name="${inst.nom}" title="Add to favorites">
                        <span class="heart-icon">${heartIcon}</span>
                    </button>
                </div>
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
                    <div class="card-actions">
                        <button class="btn-update" data-id="${inst.id}">Update</button>
                        <button class="btn-delete" data-id="${inst.id}" data-name="${inst.nom}">Delete</button>
                    </div>
                </div>
            `;
            grid.appendChild(card);
        });

        // Add event listeners to favorite buttons
        document.querySelectorAll('.favorite-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation(); // Prevent card click if any
                const id = e.currentTarget.dataset.id;
                const name = e.currentTarget.dataset.name;
                toggleFavorite(parseInt(id), name);
            });
        });

        // Add event listeners to update and delete buttons
        document.querySelectorAll('.btn-update').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = e.target.dataset.id;
                const instrument = filteredInstruments.find(inst => inst.id == id);
                if (instrument) {
                    showEditModal(instrument);
                }
            });
        });

        document.querySelectorAll('.btn-delete').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = e.target.dataset.id;
                const name = e.target.dataset.name;
                deleteInstrument(id, name);
            });
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
