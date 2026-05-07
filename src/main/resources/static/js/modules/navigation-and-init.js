// Navigation
function showAdminStats() {
    if (!adminLoggedIn) {
        alert('Admin access required.');
        return;
    }
    showSection('adminStatsSection');
    renderAdminIssueReviewList();
    renderAdminHighPriorityIssues();
}

const homeLink = document.getElementById('homeLink');
const scootersLink = document.getElementById('scootersLink');
const scooterListViewBtn = document.getElementById('scooterListViewBtn');
const scooterMapViewBtn = document.getElementById('scooterMapViewBtn');
const rentLink = document.getElementById('rentLink');
const myBookingsLink = document.getElementById('myBookingsLink');
const feedbackLink = document.getElementById('feedbackLink');
const analyticsLink = document.getElementById('analyticsLink');
const returnLink = document.getElementById('returnLink');
const adminLink = document.getElementById('adminLink');
const loginLink = document.getElementById('loginLink');
const logoutLink = document.getElementById('logoutLink');
const backToHomeBtn = document.getElementById('backToHome');

if (scooterListViewBtn) {
    scooterListViewBtn.addEventListener('click', () => {
        setScooterViewMode('list');
    });
}

if (scooterMapViewBtn) {
    scooterMapViewBtn.addEventListener('click', () => {
        setScooterViewMode('map');
    });
}

if (homeLink) {
    homeLink.addEventListener('click', event => {
        event.preventDefault();
        showSection('homeSection');
    });
}

if (scootersLink) {
    scootersLink.addEventListener('click', event => {
        event.preventDefault();
        showSection('scootersSection');
    });
}

if (rentLink) {
    rentLink.addEventListener('click', event => {
        event.preventDefault();
        showSection('rentSection');
    });
}

if (myBookingsLink) {
    myBookingsLink.addEventListener('click', event => {
        event.preventDefault();
        if (!currentUser) {
            alert('Please login first!');
            showSection('authSection');
            showAuthMode('login');
            return;
        }
        showSection('myBookingsSection');
    });
}

if (feedbackLink) {
    feedbackLink.addEventListener('click', event => {
        event.preventDefault();
        showSection('feedbackSection');
    });
}

if (analyticsLink) {
    analyticsLink.addEventListener('click', event => {
        event.preventDefault();
        showSection('analyticsSection');
    });
}

if (returnLink) {
    returnLink.addEventListener('click', event => {
        event.preventDefault();
        if (!currentUser) {
            alert('Please login first!');
            showSection('authSection');
            showAuthMode('login');
            return;
        }
        showSection('returnSection');
    });
}

if (adminLink) {
    adminLink.addEventListener('click', event => {
        event.preventDefault();
        if (adminLoggedIn) {
            showSection('adminConfigSection');
            populateAdminProxyBookingOptions();
        } else {
            // No dedicated admin login endpoint in controller layer.
            // Use /api/users/login and access admin pages only when returned role is admin.
            alert('Please login with an admin account first.');
            showSection('authSection');
            showAuthMode('login');
        }
    });
}

if (loginLink) {
    loginLink.addEventListener('click', event => {
        event.preventDefault();
        showSection('authSection');
        showAuthMode('login');
    });
}

const showLoginBtn = document.getElementById('showLoginBtn');
const showRegisterBtn = document.getElementById('showRegisterBtn');
const toRegisterLink = document.getElementById('toRegisterLink');
const toLoginLink = document.getElementById('toLoginLink');

if (showLoginBtn) {
    showLoginBtn.addEventListener('click', () => showAuthMode('login'));
}
if (showRegisterBtn) {
    showRegisterBtn.addEventListener('click', () => showAuthMode('register'));
}
if (toRegisterLink) {
    toRegisterLink.addEventListener('click', event => {
        event.preventDefault();
        showAuthMode('register');
    });
}
if (toLoginLink) {
    toLoginLink.addEventListener('click', event => {
        event.preventDefault();
        showAuthMode('login');
    });
}

if (logoutLink) {
    logoutLink.addEventListener('click', event => {
        event.preventDefault();
        currentUser = null;
        adminLoggedIn = false;
        if (inactivityTimer) {
            clearTimeout(inactivityTimer);
            inactivityTimer = null;
        }
        localStorage.removeItem('currentUser');
        localStorage.removeItem('adminLoggedIn');
        updateNav();
        showSection('authSection');
        showAuthMode('login');
    });
}

if (backToHomeBtn) {
    backToHomeBtn.addEventListener('click', event => {
        event.preventDefault();
        showSection('homeSection');
    });
}

// Populate package select
function populatePackageSelect() {
    const select = document.getElementById('packageSelect');
    select.innerHTML = '';
    packages.forEach(pkg => {
        const type = (pkg.packageType || '').toLowerCase();
        const name = type === '1h' ? '1 Hour' : type === '4h' ? '4 Hours' : type === '1d' ? '1 Day' : type === '1w' ? '1 Week' : (pkg.packageType || `Package #${pkg.id}`);
        const option = document.createElement('option');
        option.value = String(pkg.id);
        option.dataset.price = String(pkg.price);
        option.textContent = `${name} - $${pkg.price}`;
        select.appendChild(option);
    });
}

// Initialize
window.addEventListener('load', async function() {
    document.body.style.opacity = 0;
    setTimeout(async () => {
        document.body.style.opacity = 1;
        updateNav();
        await loadPackages();
        populatePackageSelect();
        fillPricingFormFromPackages();
        await loadScooters();
        await loadScooterLocations();
        await loadIssues();
        await loadAdminUsers();
        populateAdminProxyBookingOptions();
        setupAccessibilityTools();
        setupInactivityTracking();
        refreshSavedCardOptions();
        renderRevenueCharts();
        startMultiClientSync();
        updateSyncStatus();
        if (currentUser || adminLoggedIn) {
            resetSessionTimer();
            showSection('homeSection');
        } else {
            showSection('authSection');
            showAuthMode('login');
        }
    }, 200);
});

window.addEventListener('storage', handleCrossTabSync);
