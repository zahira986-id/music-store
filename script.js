document.addEventListener('DOMContentLoaded', () => {
    // User state
    let currentUser = null;
    let userFavorites = [];

    // Check if user is logged in
    async function checkAuth() {
        try {
            const response = await fetch('/api/user');
            if (response.ok) {
                currentUser = await response.json();
                await loadFavorites();
                updateAuthUI();
            } else {
                updateAuthUI();
            }
        } catch (error) {
            console.log('User not logged in');
            updateAuthUI();
        }
    }

    // Navigation Elements
    const showHomeBtn = document.getElementById('show-home');
    const showScraperBtn = document.getElementById('show-scraper');
    const showContactBtn = document.getElementById('show-contact');

    const heroSection = document.getElementById('hero-section');
    const instrumentsSection = document.getElementById('instruments-section');
    const scraperSection = document.getElementById('scraper-section');
    const contactSection = document.getElementById('contact-section');

    // Navigation Logic
    function setActiveSection(sectionName) {
        // Toggle visibility directly
        if (heroSection) heroSection.classList.toggle('hidden', sectionName !== 'home');
        if (instrumentsSection) instrumentsSection.classList.toggle('hidden', sectionName !== 'home');
        if (scraperSection) scraperSection.classList.toggle('hidden', sectionName !== 'scraper');
        if (contactSection) contactSection.classList.toggle('hidden', sectionName !== 'contact');

        // Reset nav links
        document.querySelectorAll('.nav-links a').forEach(a => a.style.color = '#4b5563');

        // Highlight active link
        if (sectionName === 'home' && showHomeBtn) showHomeBtn.style.color = 'var(--primary-color)';
        if (sectionName === 'scraper' && showScraperBtn) showScraperBtn.style.color = 'var(--primary-color)';
        if (sectionName === 'contact' && showContactBtn) showContactBtn.style.color = 'var(--primary-color)';
    }

    if (showHomeBtn) showHomeBtn.addEventListener('click', (e) => { e.preventDefault(); setActiveSection('home'); });

    if (showScraperBtn) showScraperBtn.addEventListener('click', (e) => {
        e.preventDefault();
        if (!currentUser) {
            showNotification('Please login to use the Scraper tools', 'error');
            showModal('login');
            return;
        }
        setActiveSection('scraper');
    });

    if (showContactBtn) showContactBtn.addEventListener('click', (e) => { e.preventDefault(); setActiveSection('contact'); });

    // Allow scraper.js to just handle scraping, we handle nav here.
    // Ensure we start at home
    setActiveSection('home');

    // Load favorites from database
    async function loadFavorites() {
        if (!currentUser) return;

        try {
            const response = await fetch('/api/favorites');
            if (response.ok) {
                userFavorites = await response.json();
                updateFavoritesCount();
            }
        } catch (error) {
            console.error('Error loading favorites:', error);
        }
    }

    // Update favorites count in UI
    function updateFavoritesCount() {
        const countEl = document.getElementById('favorites-count');
        const myFavBtn = document.getElementById('my-favorites-btn');

        if (currentUser && userFavorites.length > 0) {
            countEl.textContent = userFavorites.length;
            myFavBtn.style.display = 'inline-block';
        } else if (currentUser) {
            countEl.textContent = '0';
            myFavBtn.style.display = 'inline-block';
        } else {
            myFavBtn.style.display = 'none';
        }
    }

    // Update UI based on auth state
    function updateAuthUI() {
        const showLoginBtn = document.getElementById('show-login');
        const showSignupBtn = document.getElementById('show-signup');
        const logoutBtn = document.getElementById('logout-btn');
        const userGreeting = document.getElementById('user-greeting');
        const userName = document.getElementById('user-name');
        const addInstrBtn = document.getElementById('show-add-instr-btn');

        if (currentUser) {
            // User is logged in
            showLoginBtn.style.display = 'none';
            showSignupBtn.style.display = 'none';
            logoutBtn.style.display = 'inline-block';
            userGreeting.style.display = 'inline-block';
            userName.textContent = currentUser.nom;
            if (addInstrBtn) addInstrBtn.style.display = 'inline-block';
            updateFavoritesCount();
        } else {
            // User is not logged in
            showLoginBtn.style.display = 'inline-block';
            showSignupBtn.style.display = 'inline-block';
            logoutBtn.style.display = 'none';
            userGreeting.style.display = 'none';
            userName.textContent = '';
            if (addInstrBtn) addInstrBtn.style.display = 'none';
            document.getElementById('my-favorites-btn').style.display = 'none';
        }
    }

    // Toggle favorite (add/remove)
    async function toggleFavorite(id, name) {
        if (!currentUser) {
            showNotification('Please login to add favorites', 'error');
            return;
        }

        const isFav = isFavorite(id);

        try {
            if (isFav) {
                // Remove from favorites
                const response = await fetch(`/api/favorites/${id}`, {
                    method: 'DELETE'
                });

                if (!response.ok) throw new Error('Failed to remove favorite');

                userFavorites = userFavorites.filter(fId => fId !== id);
                showNotification(`"${name}" removed from favorites`, 'success');
            } else {
                // Add to favorites
                const response = await fetch('/api/favorites', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ instrument_id: id })
                });

                if (!response.ok) throw new Error('Failed to add favorite');

                userFavorites.push(id);
                showNotification(`"${name}" added to favorites ❤️`, 'success');
            }

            updateFavoritesCount();
            renderPage(currentPage); // Re-render to update heart icons
        } catch (error) {
            showNotification(error.message, 'error');
        }
    }

    function isFavorite(id) {
        return userFavorites.includes(id);
    }

    // Show favorites modal
    async function showFavoritesModal() {
        if (!currentUser) {
            showNotification('Please login to view favorites', 'error');
            return;
        }

        const modal = document.getElementById('favorites-modal');
        const favoritesList = document.getElementById('favorites-list');

        modal.classList.remove('hidden');
        favoritesList.innerHTML = '<div class="loading">Loading your favorites...</div>';

        // Load full instrument details for favorites
        try {
            const response = await fetch('/api/instruments');
            if (!response.ok) throw new Error('Failed to load instruments');

            const allInstruments = await response.json();
            const favoriteInstruments = allInstruments.filter(inst => userFavorites.includes(inst.id));

            if (favoriteInstruments.length === 0) {
                favoritesList.innerHTML = '<div class="loading">You have no favorite instruments yet. Click the ❤️ button on instruments to add them!</div>';
                return;
            }

            favoritesList.innerHTML = '';
            favoriteInstruments.forEach(inst => {
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
                favoritesList.appendChild(card);
            });
        } catch (error) {
            favoritesList.innerHTML = '<div class="loading">Error loading favorites.</div>';
            showNotification('Failed to load favorites', 'error');
        }
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

    // Logout button
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', async (e) => {
            e.preventDefault();
            try {
                const response = await fetch('/logout', {
                    method: 'POST'
                });

                if (response.ok) {
                    currentUser = null;
                    userFavorites = [];
                    updateAuthUI();
                    renderPage(currentPage); // Refresh to hide favorite hearts
                    showNotification('Logged out successfully', 'success');
                } else {
                    throw new Error('Logout failed');
                }
            } catch (error) {
                showNotification('Failed to logout', 'error');
            }
        });
    }

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
            currentUser = result.user;
            await loadFavorites();
            updateFavoritesCount();
            updateAuthUI();
            hideModal();
            showNotification(`Welcome back, ${currentUser.nom}!`, 'success');
            renderPage(currentPage); // Refresh to show favorites
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

    // --- My Favorites Modal Logic ---
    const favoritesModal = document.getElementById('favorites-modal');
    const closeFavoritesModal = document.querySelector('.close-favorites-modal');
    const myFavoritesBtn = document.getElementById('my-favorites-btn');

    if (myFavoritesBtn) {
        myFavoritesBtn.addEventListener('click', showFavoritesModal);
    }

    if (closeFavoritesModal) {
        closeFavoritesModal.addEventListener('click', () => {
            favoritesModal.classList.add('hidden');
        });
    }

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
        if (e.target === favoritesModal) {
            favoritesModal.classList.add('hidden');
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

            // Only show action buttons if user is logged in
            const actionButtons = currentUser ? `
                <div class="card-actions">
                    <button class="btn-update" data-id="${inst.id}">Update</button>
                    <button class="btn-delete" data-id="${inst.id}" data-name="${inst.nom}">Delete</button>
                </div>
            ` : '';

            // Only show favorite button if user is logged in
            const favoriteButton = currentUser ? `
                <button class="favorite-btn ${favoriteClass}" data-id="${inst.id}" data-name="${inst.nom}" title="Add to favorites">
                    <span class="heart-icon">${heartIcon}</span>
                </button>
            ` : '';

            card.innerHTML = `
                <div class="card-header">
                    ${favoriteButton}
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
                    ${actionButtons}
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

    // Initialize app
    checkAuth().then(() => {
        loadBrands();
        loadInstruments();
    });
});
