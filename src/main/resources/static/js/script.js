let packages = [];
let scooters = [];
let bookings = [];
let issues = [];
let scooterLocations = [];
let adminUsers = [];
let currentUser = null;
let adminLoggedIn = false; // Remove hardcoded admin
let syncTimer = null;
let inactivityTimer = null;
let scooterMap = null;
let scooterMarkers = [];
let scooterViewMode = 'list';
let sidebarInteractionsBound = false;
const serviceFee = 0.5;
const SESSION_TIMEOUT_MS = 30 * 60 * 1000;

const storedCurrentUser = localStorage.getItem('currentUser');
if (storedCurrentUser) {
    try {
        const parsed = JSON.parse(storedCurrentUser);
        if (parsed && typeof parsed === 'object' && parsed.id) {
            currentUser = parsed;
            adminLoggedIn = (parsed.role || '').toLowerCase() === 'admin';
        }
    } catch (error) {
        // Backward compatibility: old storage format was plain string (email)
        currentUser = null;
        localStorage.removeItem('currentUser');
    }
}

const defaultScooters = [
    { 
        id: 1666, 
        status: 'normal', 
        model: 'EcoRide X1', 
        battery: 85, 
        location: 'Downtown Plaza',
        gps: { lat: 51.5074, lng: -0.1278, mileage: 245.3 },
        image: 'images/EcoRide_X1.png',
        specs: { maxSpeed: '15 mph', range: '25 miles', weight: '25kg', motor: '250W' }
    },
    { 
        id: 1888, 
        status: 'normal', 
        model: 'EcoRide X2', 
        battery: 92, 
        location: 'Central Park',
        gps: { lat: 51.5074, lng: -0.1278, mileage: 189.7 },
        image: 'images/EcoRide_X2.png',
        specs: { maxSpeed: '20 mph', range: '30 miles', weight: '22kg', motor: '350W' }
    },
    { 
        id: 1999, 
        status: 'normal', 
        model: 'EcoRide X1', 
        battery: 28, 
        location: 'Main Street',
        gps: { lat: 51.5074, lng: -0.1278, mileage: 312.8 },
        image: 'images/EcoRide_X1.png',
        specs: { maxSpeed: '15 mph', range: '25 miles', weight: '25kg', motor: '250W' }
    },
    { 
        id: 1010, 
        status: 'normal', 
        model: 'EcoRide X3', 
        battery: 12, 
        location: 'City Hall',
        gps: { lat: 51.5074, lng: -0.1278, mileage: 156.2 },
        image: 'images/EcoRide_X3.png',
        specs: { maxSpeed: '25 mph', range: '35 miles', weight: '20kg', motor: '500W' }
    },
    { 
        id: 2666, 
        status: 'normal', 
        model: 'EcoRide X2', 
        battery: 88, 
        location: 'Shopping Mall',
        gps: { lat: 51.5074, lng: -0.1278, mileage: 98.4 },
        image: 'images/EcoRide_X2.png',
        specs: { maxSpeed: '20 mph', range: '30 miles', weight: '22kg', motor: '350W' }
    },
    { 
        id: 2888, 
        status: 'normal', 
        model: 'EcoRide X1', 
        battery: 8, 
        location: 'Train Station',
        gps: { lat: 51.5074, lng: -0.1278, mileage: 278.9 },
        image: 'images/EcoRide_X1.png',
        specs: { maxSpeed: '15 mph', range: '25 miles', weight: '25kg', motor: '250W' }
    },
    { 
        id: 2999, 
        status: 'normal', 
        model: 'EcoRide X3', 
        battery: 67, 
        location: 'University',
        gps: { lat: 51.5074, lng: -0.1278, mileage: 203.1 },
        image: 'images/EcoRide_X3.png',
        specs: { maxSpeed: '25 mph', range: '35 miles', weight: '20kg', motor: '500W' }
    },
    { 
        id: 3666, 
        status: 'normal', 
        model: 'EcoRide X2', 
        battery: 73,
        location: 'Hospital',
        gps: { lat: 51.5074, lng: -0.1278, mileage: 145.6 },
        image: 'images/EcoRide_X2.png',
        specs: { maxSpeed: '20 mph', range: '30 miles', weight: '22kg', motor: '350W' }
    },
    {
        id: 3777,
        status: 'normal',
        model: 'EcoRide X4',
        battery: 56,
        location: 'Riverside',
        gps: { lat: 51.5074, lng: -0.1278, mileage: 134.2 },
        image: 'images/EcoRide_X4.png',
        specs: { maxSpeed: '22 mph', range: '28 miles', weight: '23kg', motor: '400W' }
    }
];

function getModelImage(model) {
    return `images/${model.replace(/\s+/g, '_')}.png`;
}

function getCurrentUserId() {
    return currentUser && Number.isInteger(currentUser.id) ? currentUser.id : null;
}

function getCurrentUsername() {
    return currentUser ? currentUser.username : '';
}

function getTextError(responseText, fallback) {
    return responseText && responseText.trim() ? responseText : fallback;
}

function formatCurrency(value) {
    const amount = Number(value || 0);
    return `$${amount.toFixed(2)}`;
}

function announce(message) {
    const live = document.getElementById('liveStatus');
    if (live) {
        live.textContent = message;
    }
}

function normalizeCardNumber(raw) {
    return String(raw || '').replace(/\s+/g, '');
}

function maskCardNumber(raw) {
    const digits = normalizeCardNumber(raw);
    if (digits.length < 4) return '****';
    return `**** **** **** ${digits.slice(-4)}`;
}

function isValidCardNumber(raw) {
    const digits = normalizeCardNumber(raw);
    if (/^\d{16}$/.test(digits)) {
        return true;
    } 
    let sum = 0;
    let shouldDouble = false;
    for (let i = digits.length - 1; i >= 0; i -= 1) {
        let digit = Number(digits[i]);
        if (shouldDouble) {
            digit *= 2;
            if (digit > 9) digit -= 9;
        }
        sum += digit;
        shouldDouble = !shouldDouble;
    }
    return sum % 10 === 0;
}

function isStrongPassword(password) {
    if (!password || password.length < 8) return false;
    const hasUpper = /[A-Z]/.test(password);
    const hasLower = /[a-z]/.test(password);
    const hasDigit = /\d/.test(password);
    const hasSpecial = /[^A-Za-z0-9]/.test(password);
    return hasUpper && hasLower && hasDigit && hasSpecial;
}

function saveUserCard(rawCardNumber) {
    const userId = getCurrentUserId();
    if (!userId) return;
    const digits = normalizeCardNumber(rawCardNumber);
    if (!/^\d{16}$/.test(digits)) return;
    localStorage.setItem(`savedCard:${userId}`, digits);
}

function getSavedUserCard() {
    const userId = getCurrentUserId();
    if (!userId) return '';
    return localStorage.getItem(`savedCard:${userId}`) || '';
}

function savePendingCardForUsername(username, rawCardNumber) {
    const normalizedUsername = String(username || '').trim().toLowerCase();
    const digits = normalizeCardNumber(rawCardNumber);
    if (!normalizedUsername || !/^\d{16}$/.test(digits)) return;
    localStorage.setItem(`savedCardByUsername:${normalizedUsername}`, digits);
}

function getPendingCardForUsername(username) {
    const normalizedUsername = String(username || '').trim().toLowerCase();
    if (!normalizedUsername) return '';
    return localStorage.getItem(`savedCardByUsername:${normalizedUsername}`) || '';
}

function logoutByTimeout() {
    currentUser = null;
    adminLoggedIn = false;
    localStorage.removeItem('currentUser');
    localStorage.removeItem('adminLoggedIn');
    updateNav();
    showSection('authSection');
    showAuthMode('login');
    alert('You were logged out due to 30 minutes of inactivity.');
}

function resetSessionTimer() {
    if (!currentUser && !adminLoggedIn) return;
    if (inactivityTimer) {
        clearTimeout(inactivityTimer);
    }
    inactivityTimer = setTimeout(() => {
        logoutByTimeout();
    }, SESSION_TIMEOUT_MS);
}

function setupInactivityTracking() {
    ['click', 'keydown', 'mousemove', 'touchstart', 'scroll'].forEach(eventName => {
        window.addEventListener(eventName, resetSessionTimer, { passive: true });
    });
}

function normalizePackageTypeText(type) {
    return String(type || '').trim().toLowerCase().replace(/\s+/g, '');
}

function normalizeScooterStatus(status) {
    if (!status) return 'available';
    if (status === 'normal') return 'available';
    return status;
}

function normalizeScooter(scooter) {
    const battery = Number.isFinite(scooter.batteryLevel) ? scooter.batteryLevel : (Number.isFinite(scooter.battery) ? scooter.battery : 0);
    const latitude = Number(scooter.latitude);
    const longitude = Number(scooter.longitude);
    return {
        ...scooter,
        status: normalizeScooterStatus(scooter.status),
        battery,
        location: scooter.location || ((Number.isFinite(latitude) && Number.isFinite(longitude)) ? `${latitude.toFixed(4)}, ${longitude.toFixed(4)}` : 'N/A'),
        gps: {
            lat: Number.isFinite(latitude) ? latitude : 0,
            lng: Number.isFinite(longitude) ? longitude : 0,
            // No mileage API in ScooterController currently.
            mileage: scooter.gps && scooter.gps.mileage ? scooter.gps.mileage : 'N/A'
        },
        image: getModelImage(scooter.model || scooter.image || 'EcoRide_X1')
    };
}

async function loadPackages() {
    try {
        const response = await fetch('/api/packages');
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(getTextError(errorText, 'Failed to load packages'));
        }
        const packageList = await response.json();
        packages = Array.isArray(packageList) ? packageList : [];
    } catch (error) {
        console.error('Failed to load packages:', error);
        packages = [
            { id: 1, packageType: '1h', price: 5, description: 'Fallback package' },
            { id: 2, packageType: '4h', price: 15, description: 'Fallback package' },
            { id: 3, packageType: '1d', price: 25, description: 'Fallback package' },
            { id: 4, packageType: '1w', price: 100, description: 'Fallback package' }
        ];
    }
}

async function loadScooters() {
    try {
        const response = await fetch('/api/scooters');
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(getTextError(errorText, 'Failed to load scooters'));
        }
        const responseScooters = await response.json();
        scooters = (Array.isArray(responseScooters) ? responseScooters : []).map(normalizeScooter);
    } catch (error) {
        console.error('Failed to load scooters:', error);
        // Fallback to default scooters
        scooters = defaultScooters.map(normalizeScooter);
    }
}

async function loadScooterLocations() {
    try {
        const response = await fetch('/api/scooters/locations');
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(getTextError(errorText, 'Failed to load scooter locations'));
        }
        const data = await response.json();
        scooterLocations = Array.isArray(data) ? data : [];
        if (!scooterLocations.length && Array.isArray(scooters) && scooters.length) {
            scooterLocations = scooters.slice(0, 20).map(item => ({
                id: item.id,
                latitude: Number(item.gps && item.gps.lat ? item.gps.lat : item.latitude),
                longitude: Number(item.gps && item.gps.lng ? item.gps.lng : item.longitude)
            })).filter(point => Number.isFinite(point.latitude) && Number.isFinite(point.longitude));
        }
    } catch (error) {
        console.error('Failed to load scooter locations:', error);
        scooterLocations = Array.isArray(scooters)
            ? scooters.slice(0, 20).map(item => ({
                id: item.id,
                latitude: Number(item.gps && item.gps.lat ? item.gps.lat : item.latitude),
                longitude: Number(item.gps && item.gps.lng ? item.gps.lng : item.longitude)
            })).filter(point => Number.isFinite(point.latitude) && Number.isFinite(point.longitude))
            : [];
    }
}

function renderScooterLocations() {
    const leftContainer = document.getElementById('mapScooterSidebarLeft');
    const rightContainer = document.getElementById('mapScooterSidebarRight');
    if (!leftContainer || !rightContainer) return;
    if (!scooters.length) {
        leftContainer.innerHTML = '<p>No scooter status data available.</p>';
        rightContainer.innerHTML = '<p>No scooter status data available.</p>';
        return;
    }
    const locationMap = new Map(scooterLocations.map(item => [Number(item.id), item]));
    const sidebarItems = scooters.map(item => {
        const status = normalizeScooterStatus(item.status);
        return `<button type="button" class="scooter-mini-card status-${status}" data-scooter-id="${item.id}">#${item.id}</button>`;
    });

    const midpoint = Math.ceil(sidebarItems.length / 2);
    leftContainer.innerHTML = sidebarItems.slice(0, midpoint).join('') || '<p>No scooter status data available.</p>';
    rightContainer.innerHTML = sidebarItems.slice(midpoint).join('') || '<p>No scooter status data available.</p>';

    bindSidebarMiniCardInteractions();
}

function getScooterDetailById(scooterId) {
    const idNum = Number(scooterId);
    const scooter = scooters.find(item => Number(item.id) === idNum);
    if (!scooter) return null;
    const location = scooterLocations.find(item => Number(item.id) === idNum);
    const lat = location ? Number(location.latitude || 0).toFixed(4) : Number(scooter.gps && scooter.gps.lat ? scooter.gps.lat : 0).toFixed(4);
    const lng = location ? Number(location.longitude || 0).toFixed(4) : Number(scooter.gps && scooter.gps.lng ? scooter.gps.lng : 0).toFixed(4);
    return {
        id: scooter.id,
        status: normalizeScooterStatus(scooter.status),
        battery: scooter.battery,
        model: scooter.model || 'N/A',
        lat,
        lng
    };
}

function hideScooterInfoPopup() {
    const popup = document.getElementById('scooterInfoPopup');
    if (!popup) return;
    popup.classList.add('is-hidden');
    popup.classList.remove('status-available', 'status-rented', 'status-maintenance');
    popup.innerHTML = '';
}

function showScooterInfoPopup(scooterId, anchorElement) {
    const popup = document.getElementById('scooterInfoPopup');
    if (!popup || !anchorElement) return;
    const detail = getScooterDetailById(scooterId);
    if (!detail) {
        hideScooterInfoPopup();
        return;
    }

    popup.classList.remove('is-hidden', 'status-available', 'status-rented', 'status-maintenance');
    popup.classList.add(`status-${detail.status}`);
    popup.innerHTML = `
        <p><strong>Scooter #${detail.id}</strong></p>
        <p><strong>Status:</strong> <span class="status-${detail.status}">${detail.status}</span></p>
        <p><strong>Model:</strong> ${detail.model}</p>
        <p><strong>Battery:</strong> ${detail.battery}%</p>
        <p><strong>GPS:</strong> ${detail.lat}, ${detail.lng}</p>
    `;

    const rect = anchorElement.getBoundingClientRect();
    const popupWidth = popup.offsetWidth || 280;
    const margin = 12;
    const isLeftSide = rect.left < window.innerWidth / 2;
    let left = isLeftSide ? rect.right + margin : rect.left - popupWidth - margin;
    const minLeft = 8;
    const maxLeft = window.innerWidth - popupWidth - 8;
    left = Math.max(minLeft, Math.min(maxLeft, left));
    let top = rect.top;
    const maxTop = window.innerHeight - popup.offsetHeight - 8;
    top = Math.max(8, Math.min(maxTop, top));

    popup.style.left = `${left}px`;
    popup.style.top = `${top}px`;
}

function bindSidebarMiniCardInteractions() {
    if (sidebarInteractionsBound) return;
    sidebarInteractionsBound = true;

    document.addEventListener('click', event => {
        const miniCard = event.target.closest('.scooter-mini-card');
        const popup = document.getElementById('scooterInfoPopup');
        if (miniCard) {
            event.stopPropagation();
            const scooterId = miniCard.getAttribute('data-scooter-id');
            showScooterInfoPopup(scooterId, miniCard);
            return;
        }

        if (popup && !popup.classList.contains('is-hidden') && !event.target.closest('#scooterInfoPopup')) {
            hideScooterInfoPopup();
        }
    });
}

function updateFloatingScooterSidebarsVisibility() {
    const scootersSection = document.getElementById('scootersSection');
    const leftSidebar = document.getElementById('floatingScooterSidebarLeft');
    const rightSidebar = document.getElementById('floatingScooterSidebarRight');
    if (!leftSidebar || !rightSidebar) return;

    const isScootersVisible = !!(scootersSection && scootersSection.style.display === 'block');
    const shouldShow = isScootersVisible && scooterViewMode === 'map';

    setFloatingSidebarVisibility(leftSidebar, shouldShow);
    setFloatingSidebarVisibility(rightSidebar, shouldShow);

    if (!shouldShow) {
        hideScooterInfoPopup();
    }

    if (shouldShow) {
        syncFloatingScooterSidebarsPosition();
    }
}

function setFloatingSidebarVisibility(sidebar, shouldShow) {
    if (!sidebar) return;

    const existingTimer = Number(sidebar.dataset.hideTimer || 0);
    if (existingTimer) {
        clearTimeout(existingTimer);
        sidebar.dataset.hideTimer = '';
    }

    if (shouldShow) {
        sidebar.classList.remove('is-hidden');
        requestAnimationFrame(() => {
            sidebar.classList.add('is-visible');
        });
        return;
    }

    sidebar.classList.remove('is-visible');
    const timer = setTimeout(() => {
        sidebar.classList.add('is-hidden');
        sidebar.dataset.hideTimer = '';
    }, 360);
    sidebar.dataset.hideTimer = String(timer);
}

function syncFloatingScooterSidebarsPosition() {
    const mapNode = document.getElementById('scooterMap');
    const leftSidebar = document.getElementById('floatingScooterSidebarLeft');
    const rightSidebar = document.getElementById('floatingScooterSidebarRight');
    if (!mapNode || !leftSidebar || !rightSidebar) return;

    const mapRect = mapNode.getBoundingClientRect();
    const docX = window.scrollX || window.pageXOffset || 0;
    const docY = window.scrollY || window.pageYOffset || 0;
    const top = Math.max(0, mapRect.top + docY);
    const maxHeight = Math.max(140, mapRect.height);
    const gap = 98;

    const sidebarWidth = leftSidebar.offsetWidth || 88;
    const absoluteMapLeft = mapRect.left + docX;
    const absoluteMapRight = mapRect.right + docX;
    const minLeft = docX + 8;
    const maxLeft = docX + window.innerWidth - sidebarWidth - 8;

    const leftX = Math.max(minLeft, Math.min(maxLeft, absoluteMapLeft - sidebarWidth - gap));
    const rightX = Math.max(minLeft, Math.min(maxLeft, absoluteMapRight + gap));

    leftSidebar.style.left = `${leftX}px`;
    rightSidebar.style.left = `${rightX}px`;
    leftSidebar.style.right = 'auto';
    rightSidebar.style.right = 'auto';
    leftSidebar.style.top = `${top}px`;
    rightSidebar.style.top = `${top}px`;
    leftSidebar.style.maxHeight = `${maxHeight}px`;
    rightSidebar.style.maxHeight = `${maxHeight}px`;
}

function renderScooterMap() {
    const mapNode = document.getElementById('scooterMap');
    const hintNode = document.getElementById('scooterMapHint');
    if (!mapNode || typeof L === 'undefined') {
        if (hintNode) {
            hintNode.textContent = 'Map library unavailable. Showing coordinates list only.';
        }
        return;
    }

    const validPoints = scooterLocations
        .map(item => ({
            id: item.id,
            lat: Number(item.latitude),
            lng: Number(item.longitude)
        }))
        .filter(point => Number.isFinite(point.lat) && Number.isFinite(point.lng));

    if (!scooterMap) {
        scooterMap = L.map('scooterMap').setView([51.5074, -0.1278], 13);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 19,
            attribution: '&copy; OpenStreetMap contributors'
        }).addTo(scooterMap);
    }

    scooterMarkers.forEach(marker => marker.remove());
    scooterMarkers = [];

    validPoints.forEach(point => {
        const scooter = scooters.find(item => Number(item.id) === Number(point.id));
        const scooterStatus = scooter ? normalizeScooterStatus(scooter.status) : 'unknown';
        const scooterBattery = scooter && Number.isFinite(Number(scooter.battery)) ? Number(scooter.battery) : 'N/A';
        const marker = L.marker([point.lat, point.lng]).addTo(scooterMap);
        marker.bindPopup(`Scooter #${point.id}<br>Status: ${scooterStatus}<br>Battery: ${scooterBattery}%`);
        scooterMarkers.push(marker);
    });

    if (validPoints.length) {
        const bounds = L.latLngBounds(validPoints.map(point => [point.lat, point.lng]));
        scooterMap.fitBounds(bounds.pad(0.2));
    }

    if (hintNode) {
        hintNode.textContent = validPoints.length >= 5
            ? `Map loaded with ${validPoints.length} scooter points.`
            : `Map loaded with ${validPoints.length} scooter points (need at least 5 for F18).`;
    }
}

function setScooterViewMode(mode) {
    const nextMode = mode === 'map' ? 'map' : 'list';
    scooterViewMode = nextMode;

    const listModule = document.getElementById('scooterListModule');
    const mapModule = document.getElementById('scooterMapModule');
    const listBtn = document.getElementById('scooterListViewBtn');
    const mapBtn = document.getElementById('scooterMapViewBtn');

    if (listModule) {
        listModule.classList.toggle('is-active', nextMode === 'list');
    }
    if (mapModule) {
        mapModule.classList.toggle('is-active', nextMode === 'map');
    }

    if (listBtn) {
        listBtn.className = nextMode === 'list' ? 'btn-primary' : 'btn-secondary';
    }
    if (mapBtn) {
        mapBtn.className = nextMode === 'map' ? 'btn-primary' : 'btn-secondary';
    }

    if (nextMode === 'map') {
        renderScooterLocations();
        renderScooterMap();
        setTimeout(() => {
            if (scooterMap) {
                scooterMap.invalidateSize();
            }
            syncFloatingScooterSidebarsPosition();
        }, 60);
    }

    updateFloatingScooterSidebarsVisibility();
}

window.addEventListener('scroll', () => {
    updateFloatingScooterSidebarsVisibility();
}, { passive: true });

window.addEventListener('resize', () => {
    updateFloatingScooterSidebarsVisibility();
}, { passive: true });

async function loadAdminUsers() {
    try {
        const response = await fetch('/api/users');
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(getTextError(errorText, 'Failed to load users'));
        }
        const data = await response.json();
        adminUsers = Array.isArray(data) ? data : [];
    } catch (error) {
        console.error('Failed to load users:', error);
        adminUsers = [];
    }
}

function renderAdminUsers() {
    const container = document.getElementById('adminUsersList');
    if (!container) return;
    if (!adminUsers.length) {
        container.innerHTML = '<p>No user data loaded.</p>';
        return;
    }
    container.innerHTML = adminUsers.map(user => `
        <div class="issue-item">
            <p><strong>ID:</strong> ${user.id} | <strong>Name:</strong> ${user.username || 'N/A'} | <strong>Role:</strong> ${user.role || 'user'}</p>
            <p><strong>Email:</strong> ${user.email || 'N/A'}</p>
        </div>
    `).join('');
}

// Sections
const sections = ['authSection', 'homeSection', 'scootersSection', 'rentSection', 'paymentSection', 'successSection', 'myBookingsSection', 'feedbackSection', 'analyticsSection', 'scooterDetailSection', 'returnSection', 'adminLoginSection', 'adminConfigSection', 'adminStatsSection'];

function showSection(sectionId) {
    if (sectionId === 'authSection' && (currentUser || adminLoggedIn)) {
        sectionId = 'homeSection';
    }
    sections.forEach(id => {
        const sectionElement = document.getElementById(id);
        if (sectionElement) {
            sectionElement.style.display = id === sectionId ? 'block' : 'none';
        }
    });
    if (sectionId === 'homeSection') {
        renderPackages();
        updateHomeStats();
    } else if (sectionId === 'scootersSection') {
        renderScooters();
        renderScooterLocations();
        setScooterViewMode(scooterViewMode);
    } else if (sectionId === 'myBookingsSection') {
        renderBookings();
    } else if (sectionId === 'feedbackSection') {
        renderHighPriorityIssues();
    } else if (sectionId === 'analyticsSection') {
        renderRevenueCharts();
    } else if (sectionId === 'adminConfigSection') {
        renderAdminUsers();
    } else if (sectionId === 'adminStatsSection') {
        renderStats();
        renderAdminIssueReviewList();
        renderAdminHighPriorityIssues();
    }

    updateFloatingScooterSidebarsVisibility();
}

function showAuthMode(mode) {
    const loginPanel = document.getElementById('loginPanel');
    const registerPanel = document.getElementById('registerPanel');
    const showLoginBtn = document.getElementById('showLoginBtn');
    const showRegisterBtn = document.getElementById('showRegisterBtn');

    if (!loginPanel || !registerPanel || !showLoginBtn || !showRegisterBtn) {
        return;
    }

    if (mode === 'register') {
        loginPanel.style.display = 'none';
        registerPanel.style.display = 'block';
        showLoginBtn.classList.remove('active');
        showRegisterBtn.classList.add('active');
    } else {
        loginPanel.style.display = 'block';
        registerPanel.style.display = 'none';
        showLoginBtn.classList.add('active');
        showRegisterBtn.classList.remove('active');
    }
}

function updateNav() {
    const loginLink = document.getElementById('loginLink');
    const logoutLink = document.getElementById('logoutLink');
    const returnLink = document.getElementById('returnLink');
    
    if (currentUser || adminLoggedIn) {
        loginLink.style.display = 'none';
        logoutLink.style.display = 'inline';
        
        const hasActiveBooking = bookings.some(b => b.status === 'paid');
        returnLink.style.display = hasActiveBooking ? 'inline' : 'none';
    } else {
        loginLink.style.display = 'inline';
        logoutLink.style.display = 'none';
        returnLink.style.display = 'none';
    }
}

// Render packages
function renderPackages() {
    const grid = document.getElementById('packageGrid');
    grid.innerHTML = '';
    packages.forEach(pkg => {
        const card = document.createElement('div');
        card.className = 'package-card';
        const type = (pkg.packageType || '').toLowerCase();
        const name = type === '1h' ? '1 Hour' : type === '4h' ? '4 Hours' : type === '1d' ? '1 Day' : type === '1w' ? '1 Week' : (pkg.packageType || `Package #${pkg.id}`);
        card.innerHTML = `
            <h3>${name}</h3>
            <p>Price: $${pkg.price}</p>
            <p>${pkg.description || ''}</p>
        `;
        grid.appendChild(card);
    });
}

// Update home statistics
function updateHomeStats() {
    // Available scooters count
    const availableScooters = scooters.filter(s => s.status === 'available').length;
    document.getElementById('availableScooters').textContent = availableScooters;

    // Active users count - no dedicated backend endpoint currently.
    document.getElementById('activeUsers').textContent = 0;

    // Total rides count - no dedicated backend endpoint currently.
    document.getElementById('totalRides').textContent = 0;
}

function updateBookingSummary(bookingList) {
    const source = Array.isArray(bookingList) ? bookingList : [];
    const activeCount = source.filter(item => item.status === 'paid').length;
    const totalCount = source.length;
    const totalSpent = source.reduce((sum, item) => sum + Number(item.totalCost || 0), 0);

    const activeNode = document.getElementById('activeBookings');
    const totalNode = document.getElementById('totalBookings');
    const spentNode = document.querySelector('#myBookingsSection .summary-card:nth-child(3) .summary-number');
    if (activeNode) activeNode.textContent = String(activeCount);
    if (totalNode) totalNode.textContent = String(totalCount);
    if (spentNode) spentNode.textContent = formatCurrency(totalSpent);
}

// Render scooters
function renderScooters() {
    const grid = document.getElementById('scooterGrid');
    grid.innerHTML = '';

    scooters.forEach(scooter => {
        const card = document.createElement('div');
        const isAvailable = scooter.status === 'available';
        card.className = `scooter-card ${isAvailable ? '' : 'scooter-card-unavailable'}`;
        
        const batteryClass = scooter.battery < 15 ? 'battery-low' : scooter.battery < 30 ? 'battery-medium' : 'battery-good';
        const batteryText = `<span class="battery-level battery-text ${batteryClass}">Battery: ${scooter.battery}%</span>`;
        const statusClass = isAvailable ? 'status-available' : scooter.status === 'maintenance' ? 'status-maintenance' : 'status-rented';
        const statusText = isAvailable ? 'Available' : scooter.status === 'maintenance' ? 'Maintenance' : 'Rented';
        const rentDisabled = isAvailable ? '' : 'disabled';
        const rentButtonClass = isAvailable ? 'rent-btn' : 'rent-btn disabled';
        
        card.innerHTML = `
            <div class="scooter-media">
                <img src="${scooter.image}" alt="${scooter.model}" />
            </div>
            <div>
                <h3>Scooter ID: ${scooter.id}</h3>
                <p><strong>Model:</strong> ${scooter.model}</p>
                <p><strong>Location:</strong> ${scooter.location}</p>
                <p>Status: <span class="${statusClass}">${statusText}</span></p>
                <p class="battery-label">${batteryText}</p>
                <div class="battery-bar"><div class="battery-fill ${batteryClass}" style="width:${Math.max(6, scooter.battery)}%"></div></div>
            </div>
            <div class="card-actions">
                <button onclick="viewScooterDetail(${scooter.id})" class="view-detail-btn"><i class="fa-solid fa-info-circle"></i> Details</button>
                <button onclick="rentScooter(${scooter.id})" class="${rentButtonClass}" ${rentDisabled}><i class="fa-solid fa-handshake"></i> Rent</button>
            </div>
        `;
        grid.appendChild(card);
    });
}

// Render bookings
async function renderBookings() {
    const list = document.getElementById('bookingList');
    list.innerHTML = '';
    const userId = getCurrentUserId();
    if (!userId) {
        list.innerHTML = '<p>Please login first.</p>';
        updateBookingSummary([]);
        return;
    }
    try {
        const response = await fetch(`/api/bookings/user/${userId}`);
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(getTextError(errorText, 'Failed to load bookings'));
        }
        const userBookings = await response.json();
        bookings = userBookings;
        updateBookingSummary(userBookings);
        userBookings.sort((a, b) => new Date(b.startTime) - new Date(a.startTime));
        userBookings.forEach(booking => {
            const item = document.createElement('div');
            item.className = 'booking-item';
            const startTime = new Date(booking.startTime).toLocaleString();
            const endTime = booking.endTime ? new Date(booking.endTime).toLocaleString() : 'Ongoing';
            const cost = booking.totalCost ? `$${booking.totalCost}` : 'Calculating...';
            let buttonHtml = '';
            if (booking.status === 'paid') {
                buttonHtml = `
                    <button onclick="extendRental(${booking.id})" class="extend-rental-btn"><i class="fa-solid fa-clock"></i> Extend</button>
                    <button onclick="endRental(${booking.id})" class="end-rental-btn"><i class="fa-solid fa-stop"></i> End Rental</button>
                `;
            } else {
                const statusText = String(booking.status || '').toLowerCase();
                const canCancel = ['pending', 'unpaid', 'placed', 'booked', 'created'].includes(statusText);
                if (canCancel) {
                    buttonHtml = `<button onclick="cancelBooking(${booking.id})" class="end-rental-btn"><i class="fa-solid fa-xmark"></i> Cancel</button>`;
                }
            }
            item.innerHTML = `
                <p>Scooter ID: ${booking.scooterId}</p>
                <p>Start Time: ${startTime}</p>
                <p>End Time: ${endTime}</p>
                <p>Cost: ${cost}</p>
                <p>Status: ${booking.status}</p>
                ${buttonHtml}
            `;
            list.appendChild(item);
        });
    } catch (error) {
        console.error('Failed to load bookings:', error);
        list.innerHTML = '<p>Failed to load bookings.</p>';
        updateBookingSummary([]);
    }
}

function updatePaymentBreakdown(packagePrice) {
    const rentalCostNode = document.getElementById('rentalCost');
    const totalAmountNode = document.getElementById('totalAmount');
    const rentalCost = Number(packagePrice || 0);
    const totalAmount = rentalCost + serviceFee;
    if (rentalCostNode) rentalCostNode.textContent = formatCurrency(rentalCost);
    if (totalAmountNode) totalAmountNode.textContent = formatCurrency(totalAmount);
}

function refreshSavedCardOptions() {
    const select = document.getElementById('savedCardSelect');
    if (!select) return;
    select.innerHTML = '';

    const userCard = getSavedUserCard();
    if (userCard) {
        const option = document.createElement('option');
        option.value = userCard;
        option.textContent = `Saved: ${maskCardNumber(userCard)}`;
        select.appendChild(option);
    }

    if (!select.options.length) {
        const option = document.createElement('option');
        option.value = '';
        option.textContent = 'No saved card available';
        select.appendChild(option);
    }

    const cardInput = document.getElementById('paymentCardNumber');
    if (cardInput && !cardInput.value.trim() && select.value) {
        cardInput.value = select.value;
    }
}

function useSavedCardInPayment() {
    const select = document.getElementById('savedCardSelect');
    const cardInput = document.getElementById('paymentCardNumber');
    if (!select || !cardInput) return;
    if (!select.value) {
        alert('No saved card available for this account.');
        return;
    }
    cardInput.value = select.value;
    announce('Saved card has been filled into payment form.');
}

function simulatePaymentEmailNotification(bookingId) {
    const username = getCurrentUsername() || 'user';
    const emailText = `Email notification simulated: Booking #${bookingId} payment confirmation sent to ${username}.`;
    announce(emailText);
    console.log(emailText);
}

// Render stats
async function renderStats() {
    const table = document.getElementById('statsTable');
    table.innerHTML = '';
    try {
        const response = await fetch('/api/bookings/admin/revenue');
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(getTextError(errorText, 'Failed to load stats'));
        }
        const stats = await response.json();
        let html = '<table><tr><th>Package</th><th>Orders</th><th>Revenue</th></tr>';
        (Array.isArray(stats) ? stats : []).forEach(report => {
            html += `<tr><td>${report.packageType}</td><td>${report.totalOrders}</td><td>$${report.totalRevenue || 0}</td></tr>`;
        });
        html += '</table>';
        table.innerHTML = html;
    } catch (error) {
        console.error('Failed to load stats:', error);
        table.innerHTML = '<p>Failed to load stats.</p>';
    }
}

function renderHighPriorityIssues() {
    const container = document.getElementById('highPriorityIssueList');
    if (!container) return;

    const high = issues.filter(issue => (issue.priority || '').toLowerCase() === 'high');
    if (!high.length) {
        container.innerHTML = '<p>No high priority issues yet.</p>';
        return;
    }

    container.innerHTML = high.slice(0, 8).map(issue => {
        return `<div class="issue-item issue-high">
            <p><strong>ID:</strong> #${issue.id || 'N/A'} | <strong>Scooter:</strong> ${issue.scooterId}</p>
            <p><strong>Priority:</strong> ${issue.priority}</p>
            <p>${issue.description}</p>
        </div>`;
    }).join('');
}

function renderAdminHighPriorityIssues() {
    const container = document.getElementById('adminHighPriorityIssues');
    if (!container) return;

    const high = issues.filter(issue => (issue.priority || '').toLowerCase() === 'high');
    if (!high.length) {
        container.innerHTML = '<p>No high priority issues found.</p>';
        return;
    }
    container.innerHTML = high.map(issue => `
        <div class="issue-item issue-high">
            <p><strong>ID:</strong> ${issue.id || 'N/A'}</p>
            <p><strong>User:</strong> ${issue.userId || 'N/A'} | <strong>Scooter:</strong> ${issue.scooterId}</p>
            <p><strong>Status:</strong> ${issue.status || 'pending'} | <strong>Priority:</strong> ${issue.priority}</p>
            <p>${issue.description}</p>
            ${(issue.id && String(issue.status || '').toLowerCase() !== 'resolved') ? `<button onclick="resolveIssue(${issue.id})" class="btn-primary" type="button">Resolve</button>` : ''}
        </div>
    `).join('');
}

function renderAdminIssueReviewList() {
    const container = document.getElementById('adminIssueReviewList');
    if (!container) return;

    if (!issues.length) {
        container.innerHTML = '<p>No issues to review.</p>';
        return;
    }

    container.innerHTML = issues.map(issue => {
        const currentPriority = (issue.priority || 'medium').toLowerCase();
        return `
            <div class="issue-item">
                <p><strong>ID:</strong> #${issue.id || 'N/A'} | <strong>User:</strong> ${issue.userId || 'N/A'} | <strong>Scooter:</strong> ${issue.scooterId}</p>
                <p><strong>Status:</strong> ${issue.status || 'pending'} | <strong>Current Priority:</strong> ${currentPriority}</p>
                <p>${issue.description}</p>
                <div class="issue-action-row">
                    <button type="button" class="priority-btn" onclick="setIssuePriority(${issue.id}, 'high')">Set High</button>
                    <button type="button" class="priority-btn" onclick="setIssuePriority(${issue.id}, 'medium')">Set Medium</button>
                    <button type="button" class="priority-btn" onclick="setIssuePriority(${issue.id}, 'low')">Set Low</button>
                </div>
            </div>
        `;
    }).join('');
}

async function setIssuePriority(issueId, priority) {
    if (!issueId || !priority) return;
    try {
        const response = await fetch(`/api/issues/${issueId}/priority?priority=${encodeURIComponent(priority)}`, {
            method: 'PUT'
        });
        const text = await response.text();
        if (!response.ok) {
            throw new Error(getTextError(text, 'Failed to update priority.'));
        }
        announce(`Issue ${issueId} priority set to ${priority}.`);
        await loadIssues();
        renderAdminIssueReviewList();
        renderAdminHighPriorityIssues();
        renderHighPriorityIssues();
    } catch (error) {
        console.error('Set priority error:', error);
        alert('Priority update endpoint is not available yet. Please ask backend to provide PUT /api/issues/{id}/priority.');
    }
}

async function loadIssues() {
    try {
        const response = await fetch('/api/issues');
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(getTextError(errorText, 'Failed to load issues'));
        }
        const data = await response.json();
        issues = Array.isArray(data) ? data : [];
    } catch (error) {
        console.error('Failed to load issues:', error);
        // Backend required for persistent issue list.
        issues = [];
    }
}

function drawBarChart(canvasId, labels, values) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);

    if (!labels.length) {
        ctx.fillStyle = '#666';
        ctx.font = '14px Segoe UI';
        ctx.fillText('No data available.', 16, 30);
        return;
    }

    const max = Math.max(...values, 1);
    const chartTop = 20;
    const chartBottom = h - 40;
    const chartHeight = chartBottom - chartTop;
    const barWidth = Math.max(24, Math.floor((w - 40) / labels.length) - 16);

    labels.forEach((label, i) => {
        const x = 20 + i * (barWidth + 16);
        const barH = (values[i] / max) * chartHeight;
        const y = chartBottom - barH;
        ctx.fillStyle = '#2f80ed';
        ctx.fillRect(x, y, barWidth, barH);

        ctx.fillStyle = '#1f2937';
        ctx.font = '12px Segoe UI';
        ctx.fillText(String(values[i]), x, y - 6);
        ctx.fillText(label, x, chartBottom + 16);
    });
}

function drawLineChart(canvasId, labels, values) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);

    if (!labels.length) {
        ctx.fillStyle = '#666';
        ctx.font = '14px Segoe UI';
        ctx.fillText('No data available.', 16, 30);
        return;
    }

    const max = Math.max(...values, 1);
    const left = 30;
    const right = w - 20;
    const top = 20;
    const bottom = h - 40;
    const stepX = labels.length > 1 ? (right - left) / (labels.length - 1) : 0;

    ctx.strokeStyle = '#2f80ed';
    ctx.lineWidth = 2;
    ctx.beginPath();

    values.forEach((value, i) => {
        const x = left + i * stepX;
        const y = bottom - ((value / max) * (bottom - top));
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
    });
    ctx.stroke();

    values.forEach((value, i) => {
        const x = left + i * stepX;
        const y = bottom - ((value / max) * (bottom - top));
        ctx.fillStyle = '#2f80ed';
        ctx.beginPath();
        ctx.arc(x, y, 3, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#1f2937';
        ctx.font = '12px Segoe UI';
        ctx.fillText(String(value), x - 8, y - 8);
        ctx.fillText(labels[i], x - 16, bottom + 16);
    });
}

async function renderRevenueCharts() {
    try {
        const [weeklyRes, dailyRes] = await Promise.all([
            fetch('/api/bookings/admin/revenue'),
            fetch('/api/bookings/admin/revenue/daily')
        ]);

        const weekly = weeklyRes.ok ? await weeklyRes.json() : [];
        const daily = dailyRes.ok ? await dailyRes.json() : [];

        const weeklyLabels = (Array.isArray(weekly) ? weekly : []).map(item => item.packageType || 'N/A');
        const weeklyValues = (Array.isArray(weekly) ? weekly : []).map(item => Number(item.totalRevenue || 0));

        const dailyLabels = (Array.isArray(daily) ? daily : []).map(item => item.date || 'N/A');
        const dailyValues = (Array.isArray(daily) ? daily : []).map(item => Number(item.dailyTotal || 0));

        drawBarChart('weeklyRevenueChart', weeklyLabels, weeklyValues);
        drawLineChart('dailyRevenueChart', dailyLabels.reverse(), dailyValues.reverse());
    } catch (error) {
        console.error('Chart render error:', error);
        drawBarChart('weeklyRevenueChart', [], []);
        drawLineChart('dailyRevenueChart', [], []);
    }
}

function setupDiscountCalculator() {
    const form = document.getElementById('discountForm');
    if (!form) return;

    form.addEventListener('submit', event => {
        event.preventDefault();
        const basePrice = Number(document.getElementById('discountBasePrice').value || 0);
        const userType = document.getElementById('discountUserType').value;
        const rideCount = Number(document.getElementById('discountRideCount').value || 0);
        const output = document.getElementById('discountResult');

        let rate = 0;
        if (userType === 'student') rate = 0.1;
        if (userType === 'senior') rate = 0.15;
        if (userType === 'high-frequency') rate = rideCount >= 20 ? 0.2 : 0.1;

        const discountAmount = basePrice * rate;
        const finalPrice = Math.max(0, basePrice - discountAmount);
        output.innerHTML = `Base: $${basePrice.toFixed(2)} | Discount: ${(rate * 100).toFixed(0)}% ($${discountAmount.toFixed(2)}) | Final: $${finalPrice.toFixed(2)}`;
        announce('Discount calculated successfully.');
    });
}

function setupAccessibilityTools() {
    const root = document.documentElement;
    const increaseBtn = document.getElementById('fontIncreaseBtn');
    const decreaseBtn = document.getElementById('fontDecreaseBtn');
    const contrastBtn = document.getElementById('highContrastBtn');

    let fontScale = Number(localStorage.getItem('fontScale') || 1);
    const applyScale = () => {
        root.style.fontSize = `${Math.max(0.9, Math.min(1.25, fontScale)) * 100}%`;
        localStorage.setItem('fontScale', String(fontScale));
    };
    applyScale();

    if (increaseBtn) {
        increaseBtn.addEventListener('click', () => {
            fontScale += 0.05;
            applyScale();
        });
    }
    if (decreaseBtn) {
        decreaseBtn.addEventListener('click', () => {
            fontScale -= 0.05;
            applyScale();
        });
    }
    if (contrastBtn) {
        const saved = localStorage.getItem('highContrast') === 'true';
        document.body.classList.toggle('high-contrast', saved);
        contrastBtn.setAttribute('aria-pressed', saved ? 'true' : 'false');
        contrastBtn.addEventListener('click', () => {
            const next = !document.body.classList.contains('high-contrast');
            document.body.classList.toggle('high-contrast', next);
            contrastBtn.setAttribute('aria-pressed', next ? 'true' : 'false');
            localStorage.setItem('highContrast', String(next));
        });
    }
}

function updateSyncStatus() {
    const text = document.getElementById('syncStatusText');
    if (text) {
        text.textContent = `Multi-client sync active. Last sync: ${new Date().toLocaleTimeString()}`;
    }
}

async function startMultiClientSync() {
    if (syncTimer) return;
    // F23: frontend periodic sync; full real-time collaboration would need backend websocket support.
    syncTimer = setInterval(async () => {
        await loadScooters();
        await loadScooterLocations();
        await loadPackages();
        await loadIssues();
        if (getCurrentUserId()) {
            await renderBookings();
        }
        const scootersSection = document.getElementById('scootersSection');
        if (scootersSection && scootersSection.style.display === 'block') {
            if (scooterViewMode === 'map') {
                renderScooterLocations();
                renderScooterMap();
            }
        }
        updateSyncStatus();
    }, 10000);
}

function handleCrossTabSync(event) {
    if (event.key === 'currentUser') {
        try {
            const nextUser = event.newValue ? JSON.parse(event.newValue) : null;
            currentUser = nextUser && nextUser.id ? nextUser : null;
            adminLoggedIn = !!(currentUser && String(currentUser.role || '').toLowerCase() === 'admin');
        } catch (error) {
            currentUser = null;
            adminLoggedIn = false;
        }
        updateNav();
        if (currentUser || adminLoggedIn) {
            resetSessionTimer();
            showSection('homeSection');
        } else {
            showSection('authSection');
            showAuthMode('login');
        }
    }
}

// Login form
const loginForm = document.getElementById('loginForm');
if (loginForm) {
    loginForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        const username = document.getElementById('loginEmail').value.trim();
        const password = document.getElementById('loginPassword').value.trim();
        try {
            const response = await fetch(`/api/users/login?username=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}`, {
                method: 'POST',
                headers: { 'Accept': 'application/json' }
            });
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(getTextError(errorText, 'Invalid username or password'));
            }
            const user = await response.json();
            currentUser = user;
            adminLoggedIn = (user.role || '').toLowerCase() === 'admin';
            localStorage.setItem('currentUser', JSON.stringify(user));
            const backendCard = normalizeCardNumber(user.creditCardNumber || '');
            if (/^\d{16}$/.test(backendCard)) {
                saveUserCard(backendCard);
            }
            const pendingCard = getPendingCardForUsername(user.username);
            if (/^\d{16}$/.test(pendingCard)) {
                saveUserCard(pendingCard);
            }
            updateNav();
            refreshSavedCardOptions();
            resetSessionTimer();
            showSection('homeSection');
            alert(`Login successful! Welcome ${user.username}.`);
        } catch (error) {
            console.error('Login error:', error);
            alert(error.message || 'Login failed!');
        }
        this.reset();
    });
}

// Register form
const registerForm = document.getElementById('registerForm');
if (registerForm) {
    registerForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        const username = document.getElementById('registerUsername').value.trim();
        const email = document.getElementById('registerEmail').value.trim();
        const phone = document.getElementById('registerPhone').value.trim();
        const password = document.getElementById('registerPassword').value.trim();
        const confirmPassword = document.getElementById('registerConfirmPassword').value.trim();
        const cardNumber = document.getElementById('cardNumber').value.trim();
        const cardExpiry = document.getElementById('cardExpiry').value.trim();
        const cardCVV = document.getElementById('cardCVV').value.trim();
        const acceptTerms = document.getElementById('acceptTerms').checked;
        
        if (!isStrongPassword(password)) {
            alert('Password must be at least 8 chars and include upper, lower, number and special character.');
            return;
        }
        
        if (password !== confirmPassword) {
            alert('Passwords do not match!');
            return;
        }
        
        if (!isValidCardNumber(cardNumber)) {
            alert('Please enter a valid 16-digit card number.');
            return;
        }
        
        if (!/^\d{2}\/\d{2}$/.test(cardExpiry)) {
            alert('Please enter a valid expiry date (format: MM/YY)');
            return;
        }
        
        if (!/^\d{3}$/.test(cardCVV)) {
            alert('Please enter a valid CVV (3 digits)');
            return;
        }
        
        if (!acceptTerms) {
            alert('Please accept the Terms & Conditions and Insurance Policy');
            return;
        }
        
        try {
            const response = await fetch(`/api/users/register?confirmPassword=${encodeURIComponent(confirmPassword)}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    username,
                    email,
                    passwordHash: password
                    // Backend UserController has no phone/credit-card fields currently.
                })
            });
            const text = await response.text();
            if (!response.ok) {
                throw new Error(getTextError(text, 'Registration failed!'));
            }
            alert(text || 'Registration successful!');
            // Backend has no card binding endpoint yet, so card data is only front-end validated for now.
            savePendingCardForUsername(username, cardNumber);
            showAuthMode('login');
        } catch (error) {
            console.error('Registration error:', error);
            alert(error.message || 'Registration failed!');
        }
        this.reset();
    });
}

const issueForm = document.getElementById('issueForm');
if (issueForm) {
    issueForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        const userId = getCurrentUserId();
        if (!userId) {
            alert('Please login first to submit feedback.');
            showSection('authSection');
            showAuthMode('login');
            return;
        }

        const scooterId = Number(document.getElementById('issueScooterId').value);
        const description = document.getElementById('issueDescription').value.trim();

        try {
            const response = await fetch('/api/issues/report', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId,
                    scooterId,
                    description,
                    // User submits issue only; admin decides priority later.
                    priority: 'medium'
                })
            });
            const text = await response.text();
            if (!response.ok) {
                throw new Error(getTextError(text, 'Issue submission failed'));
            }
            alert(text || 'Issue submitted.');
            announce('Issue submitted successfully.');
            this.reset();
            await loadIssues();
            renderHighPriorityIssues();
            renderAdminHighPriorityIssues();
        } catch (error) {
            console.error('Issue submit error:', error);
            alert(error.message || 'Issue submission failed.');
        }
    });
}

// Book form
const bookForm = document.getElementById('bookForm');
if (bookForm) {
    bookForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        const userId = getCurrentUserId();
        if (!userId) {
            alert('Please login first!');
            showSection('authSection');
            showAuthMode('login');
            return;
        }
        const packageId = document.getElementById('packageSelect').value;
        const selectedOption = document.getElementById('packageSelect').selectedOptions[0];
        const packagePrice = selectedOption ? Number(selectedOption.dataset.price || 0) : 0;
        const scooterId = parseInt(document.getElementById('scooterId').value);
        const scooter = scooters.find(s => s.id === scooterId && s.status === 'available');
        if (!scooter) {
            alert('Scooter not available!');
            return;
        }
        try {
            const response = await fetch('/api/bookings/place', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId,
                    scooterId,
                    packageId: Number(packageId),
                    // Keep totalCost for backward compatibility; backend recalculates from packageId.
                    totalCost: packagePrice
                })
            });
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(getTextError(errorText, 'Booking failed!'));
            }
            const booking = await response.json();
            localStorage.setItem('pendingBookingId', String(booking.id));
            document.getElementById('bookingDetails').textContent = `Scooter ${scooterId}, Package ID ${packageId}`;
            updatePaymentBreakdown(packagePrice);
            refreshSavedCardOptions();
            showSection('paymentSection');
        } catch (error) {
            console.error('Booking error:', error);
            alert(error.message || 'Booking failed!');
        }
        this.reset();
    });
}

// Payment form
const paymentForm = document.getElementById('paymentForm');
const useSavedCardBtn = document.getElementById('useSavedCardBtn');
if (useSavedCardBtn) {
    useSavedCardBtn.addEventListener('click', () => {
        useSavedCardInPayment();
    });
}
if (paymentForm) {
    paymentForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        const cardNumber = document.getElementById('paymentCardNumber').value.trim();
        if (!isValidCardNumber(cardNumber)) {
            alert('Please enter a valid 16-digit card number.');
            return;
        }
        const bookingId = localStorage.getItem('pendingBookingId');
        if (!bookingId) {
            alert('No pending booking!');
            return;
        }
        try {
            const response = await fetch(`/api/bookings/pay/${bookingId}?cardNumber=${encodeURIComponent(cardNumber)}`, {
                method: 'POST',
                headers: { 'Accept': 'text/plain' }
            });
            const text = await response.text();
            if (!response.ok) {
                throw new Error(getTextError(text, 'Payment failed!'));
            }
            saveUserCard(cardNumber);
            localStorage.removeItem('pendingBookingId');
            await loadScooters();
            await loadScooterLocations();
            renderScooters();
            renderScooterLocations();
            renderScooterMap();
            document.getElementById('confirmationDetails').innerHTML = `
                <p>User: ${getCurrentUsername()}</p>
                <p>Booking ID: ${bookingId}</p>
                <p>Status: paid</p>
                <p>Email notification: queued (simulated)</p>
            `;
            simulatePaymentEmailNotification(bookingId);
            alert(text || 'Payment successful!');
            updateNav();
            showSection('successSection');
        } catch (error) {
            console.error('Payment error:', error);
            alert(error.message || 'Payment failed!');
        }
        this.reset();
    });
}

// End rental
async function endRental(bookingId) {
    try {
        const response = await fetch(`/api/bookings/end/${bookingId}`, {
            method: 'POST'
        });
        const text = await response.text();
        if (!response.ok) {
            throw new Error(getTextError(text, 'Failed to end rental!'));
        }
        alert(text || 'Rental ended!');
        await loadScooters();
        await loadScooterLocations();
        renderScooters();
        renderScooterLocations();
        renderScooterMap();
        await renderBookings();
        updateNav();
        showSection('homeSection');
    } catch (error) {
        console.error('End rental error:', error);
        alert(error.message || 'Failed to end rental!');
    }
}

async function cancelBooking(bookingId) {
    const confirmed = confirm(`Cancel booking #${bookingId}?`);
    if (!confirmed) return;
    try {
        const response = await fetch(`/api/bookings/cancel/${bookingId}`, {
            method: 'POST'
        });
        const text = await response.text();
        if (!response.ok) {
            throw new Error(getTextError(text, 'Failed to cancel booking!'));
        }
        alert(text || 'Booking cancelled.');
        await loadScooters();
        await loadScooterLocations();
        renderScooters();
        renderScooterLocations();
        await renderBookings();
        updateNav();
    } catch (error) {
        console.error('Cancel booking error:', error);
        alert(error.message || 'Failed to cancel booking.');
    }
}

async function extendRental(bookingId) {
    const extraCostText = prompt('Enter extra cost for extension:');
    if (!extraCostText) {
        return;
    }
    const extraCost = Number(extraCostText);
    if (!Number.isFinite(extraCost) || extraCost <= 0) {
        alert('Please enter a valid positive number.');
        return;
    }
    try {
        const response = await fetch(`/api/bookings/extend/${bookingId}?extraCost=${encodeURIComponent(extraCost)}`, {
            method: 'POST'
        });
        const text = await response.text();
        if (!response.ok) {
            throw new Error(getTextError(text, 'Failed to extend booking!'));
        }
        alert(text || 'Booking extended successfully!');
        await renderBookings();
    } catch (error) {
        console.error('Extend rental error:', error);
        alert(error.message || 'Failed to extend booking!');
    }
}

// Show terms modal
function showTerms() {
    document.getElementById('termsModal').style.display = 'block';
}

// Show insurance modal
function showInsurance() {
    document.getElementById('insuranceModal').style.display = 'block';
}

// Close modal
function closeModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
}

// Complete return
function completeReturn() {
    const locationStatus = document.getElementById('locationStatus');
    const completeBtn = document.getElementById('completeReturnBtn');
    
    // Check location
    const allowedZones = ['Downtown Plaza', 'Central Park', 'City Hall'];
    const currentLocation = 'Downtown Plaza'; // Simulated GPS
    document.getElementById('currentLocation').textContent = currentLocation;
    
    if (allowedZones.includes(currentLocation)) {
        locationStatus.className = 'location-status location-valid';
        locationStatus.textContent = '✓ Valid return location';
        completeBtn.disabled = false;
    } else {
        locationStatus.className = 'location-status location-invalid';
        locationStatus.textContent = '✗ Invalid return location. Please move to an allowed zone.';
        completeBtn.disabled = true;
        return;
    }
    
    // Check damage
    const damageChecked = Array.from(document.querySelectorAll('.damage-options input:checked')).length > 0;
    const damageDesc = document.getElementById('damageDescription').value.trim();
    
    if (damageChecked || damageDesc) {
        alert('Damage reported. Additional charges may apply. Please contact support.');
    }
    
    // No backend endpoint currently for location validation or damage report submission.
    // We only call the existing end-trip endpoint as the final return action.
    const activeBooking = bookings.find(b => b.status === 'paid');
    if (activeBooking) {
        endRental(activeBooking.id);
        alert('Scooter returned successfully!');
        showSection('homeSection');
        return;
    }
    alert('No active paid booking found to return.');
}

// View scooter detail
function viewScooterDetail(scooterId) {
    const scooter = scooters.find(s => s.id === scooterId);
    if (!scooter) return;

    const specs = scooter.specs || {
        maxSpeed: 'N/A',
        range: 'N/A',
        weight: 'N/A',
        motor: 'N/A'
    };
    const statusValue = normalizeScooterStatus(scooter.status);
    
    const container = document.getElementById('scooterDetailContainer');
    container.innerHTML = `
        <div class="scooter-image">
            <img src="${scooter.image}" alt="${scooter.model}" onclick="enlargeImage('${scooter.image}')">
            <p>Click image to enlarge</p>
        </div>
        <div class="scooter-specs">
            <h3>${scooter.model} - ID: ${scooter.id}</h3>
            <div class="spec-item">
                <span class="spec-label">Status:</span>
                <span class="spec-value ${statusValue === 'available' ? 'status-available' : 'status-rented'}">${statusValue}</span>
            </div>
            <div class="spec-item">
                <span class="spec-label">Battery:</span>
                <span class="spec-value battery-level ${scooter.battery < 15 ? 'battery-low' : scooter.battery < 30 ? 'battery-medium' : 'battery-good'}">${scooter.battery}%</span>
            </div>
            <div class="spec-item">
                <span class="spec-label">Location:</span>
                <span class="spec-value">${scooter.location}</span>
            </div>
            <div class="spec-item">
                <span class="spec-label">GPS:</span>
                <span class="spec-value">${scooter.gps.lat.toFixed(4)}, ${scooter.gps.lng.toFixed(4)}</span>
            </div>
            <div class="spec-item">
                <span class="spec-label">Mileage:</span>
                <span class="spec-value">${scooter.gps.mileage} miles</span>
            </div>
            <div class="spec-item">
                <span class="spec-label">Max Speed:</span>
                <span class="spec-value">${specs.maxSpeed}</span>
            </div>
            <div class="spec-item">
                <span class="spec-label">Range:</span>
                <span class="spec-value">${specs.range}</span>
            </div>
            <div class="spec-item">
                <span class="spec-label">Weight:</span>
                <span class="spec-value">${specs.weight}</span>
            </div>
            <div class="spec-item">
                <span class="spec-label">Motor:</span>
                <span class="spec-value">${specs.motor}</span>
            </div>
        </div>
    `;
    
    // Update action buttons
    const unlockBtn = document.getElementById('unlockBtn');
    const rentDetailBtn = document.getElementById('rentDetailBtn');
    
    if (currentUser) {
        unlockBtn.style.display = 'inline-block';
        rentDetailBtn.style.display = 'inline-block';
    } else {
        unlockBtn.style.display = 'none';
        rentDetailBtn.style.display = 'inline-block';
    }
    
    showSection('scooterDetailSection');
}

// Enlarge image
function enlargeImage(src) {
    const modal = document.createElement('div');
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0,0,0,0.8);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 2000;
        cursor: pointer;
    `;
    modal.innerHTML = `<img src="${src}" style="max-width: 90%; max-height: 90%; object-fit: contain;">`;
    modal.onclick = () => document.body.removeChild(modal);
    document.body.appendChild(modal);
}

function rentScooter(scooterId) {
    const scooter = scooters.find(s => s.id === scooterId && s.status === 'available');
    if (!scooter) {
        alert('Scooter unavailable or not found.');
        return;
    }
    if (!currentUser) {
        alert('Please login first to rent a scooter.');
        showSection('authSection');
        showAuthMode('login');
        return;
    }
    document.getElementById('scooterId').value = scooterId;
    populatePackageSelect();
    showSection('rentSection');
}

function unlockScooter() {
    if (!currentUser) {
        alert('Please login first to unlock the scooter.');
        showSection('authSection');
        showAuthMode('login');
        return;
    }
    alert('Unlocking scooter... Please scan the QR code on the app to start your ride.');
}

// Rent from detail page
function rentFromDetail() {
    const scooterId = parseInt(document.querySelector('.scooter-specs h3').textContent.split('ID: ')[1]);
    rentScooter(scooterId);
}

// Admin login removed - use user login for admin

const scooterConfigForm = document.getElementById('scooterConfigForm');
if (scooterConfigForm) {
    scooterConfigForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        if (!adminLoggedIn) {
            alert('Admin account required. Please login as admin first.');
            showSection('authSection');
            showAuthMode('login');
            return;
        }

        const newScooterId = Number(document.getElementById('newScooterId').value);
        const scooterStatus = document.getElementById('scooterStatus').value.trim().toLowerCase();

        if (!Number.isInteger(newScooterId) || newScooterId <= 0) {
            alert('Please enter a valid scooter ID.');
            return;
        }
        if (!scooterStatus) {
            alert('Please enter scooter status.');
            return;
        }

        try {
            const response = await fetch('/api/scooters/add', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: newScooterId,
                    model: 'EcoRide X1',
                    batteryLevel: 100,
                    latitude: 51.5074,
                    longitude: -0.1278,
                    status: scooterStatus
                })
            });
            const text = await response.text();
            if (!response.ok) {
                throw new Error(getTextError(text, 'Failed to add scooter.'));
            }
            alert(text || 'Scooter added successfully.');
            this.reset();
            await loadScooters();
            renderScooters();
            updateHomeStats();
        } catch (error) {
            console.error('Add scooter error:', error);
            alert(error.message || 'Failed to add scooter.');
        }
    });
}

const adminScooterOpsId = document.getElementById('adminScooterOpsId');
const adminGetScooterBtn = document.getElementById('adminGetScooterBtn');
const adminDeleteScooterBtn = document.getElementById('adminDeleteScooterBtn');
const adminScooterOpsResult = document.getElementById('adminScooterOpsResult');

if (adminGetScooterBtn) {
    adminGetScooterBtn.addEventListener('click', async () => {
        const scooterId = Number(adminScooterOpsId ? adminScooterOpsId.value : 0);
        if (!Number.isInteger(scooterId) || scooterId <= 0) {
            alert('Please enter a valid scooter ID.');
            return;
        }
        try {
            const response = await fetch(`/api/scooters/${scooterId}`);
            const text = await response.text();
            if (!response.ok) {
                throw new Error(getTextError(text, 'Failed to query scooter.'));
            }
            const data = text ? JSON.parse(text) : null;
            if (!adminScooterOpsResult) return;
            adminScooterOpsResult.innerHTML = data ? `
                <div class="issue-item">
                    <p><strong>ID:</strong> ${data.id}</p>
                    <p><strong>Model:</strong> ${data.model || 'N/A'} | <strong>Status:</strong> ${data.status || 'N/A'}</p>
                    <p><strong>Battery:</strong> ${data.batteryLevel ?? 'N/A'}%</p>
                </div>
            ` : '<p>No scooter data returned.</p>';
        } catch (error) {
            console.error('Query scooter error:', error);
            if (adminScooterOpsResult) {
                adminScooterOpsResult.innerHTML = `<p>${error.message || 'Failed to query scooter.'}</p>`;
            }
        }
    });
}

if (adminDeleteScooterBtn) {
    adminDeleteScooterBtn.addEventListener('click', async () => {
        const scooterId = Number(adminScooterOpsId ? adminScooterOpsId.value : 0);
        if (!Number.isInteger(scooterId) || scooterId <= 0) {
            alert('Please enter a valid scooter ID.');
            return;
        }
        const confirmed = confirm(`Delete scooter #${scooterId}? This cannot be undone.`);
        if (!confirmed) return;
        try {
            const response = await fetch(`/api/scooters/${scooterId}`, {
                method: 'DELETE'
            });
            const text = await response.text();
            if (!response.ok) {
                throw new Error(getTextError(text, 'Failed to delete scooter.'));
            }
            alert(text || `Scooter #${scooterId} deleted.`);
            await loadScooters();
            await loadScooterLocations();
            renderScooters();
            renderScooterLocations();
            if (adminScooterOpsResult) {
                adminScooterOpsResult.innerHTML = `<p>Scooter #${scooterId} deleted.</p>`;
            }
        } catch (error) {
            console.error('Delete scooter error:', error);
            if (adminScooterOpsResult) {
                adminScooterOpsResult.innerHTML = `<p>${error.message || 'Failed to delete scooter.'}</p>`;
            }
        }
    });
}

const adminPlaceBookingForm = document.getElementById('adminPlaceBookingForm');
if (adminPlaceBookingForm) {
    adminPlaceBookingForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        if (!adminLoggedIn) {
            alert('Admin account required.');
            return;
        }
        const userId = Number(document.getElementById('adminProxyUserId').value);
        const scooterId = Number(document.getElementById('adminProxyScooterId').value);
        const packageId = Number(document.getElementById('adminProxyPackageId').value);
        if (!Number.isInteger(userId) || !Number.isInteger(scooterId) || !Number.isInteger(packageId)) {
            alert('Please enter valid IDs.');
            return;
        }

        try {
            const response = await fetch('/api/bookings/admin/place', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId,
                    scooterId,
                    packageId
                })
            });
            const text = await response.text();
            if (!response.ok) {
                throw new Error(getTextError(text, 'Admin proxy booking failed.'));
            }
            alert('Admin proxy booking created successfully.');
            this.reset();
            await loadScooters();
            await loadScooterLocations();
            renderScooters();
            renderScooterLocations();
        } catch (error) {
            console.error('Admin proxy booking error:', error);
            alert(error.message || 'Admin proxy booking failed.');
        }
    });
}

const refreshUsersBtn = document.getElementById('refreshUsersBtn');
if (refreshUsersBtn) {
    refreshUsersBtn.addEventListener('click', async () => {
        await loadAdminUsers();
        renderAdminUsers();
    });
}

const adminResolveIssueForm = document.getElementById('adminResolveIssueForm');
if (adminResolveIssueForm) {
    adminResolveIssueForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        const issueId = Number(document.getElementById('resolveIssueId').value);
        if (!Number.isInteger(issueId) || issueId <= 0) {
            alert('Please enter a valid issue ID.');
            return;
        }
        await resolveIssue(issueId);
        this.reset();
    });
}

function fillPricingFormFromPackages() {
    const map = {
        price1h: ['1h', '1hour'],
        price4h: ['4h', '4hours'],
        price1d: ['1d', '1day'],
        price1w: ['1w', '1week']
    };

    Object.keys(map).forEach(fieldId => {
        const input = document.getElementById(fieldId);
        if (!input) return;
        const matched = packages.find(item => map[fieldId].includes(normalizePackageTypeText(item.packageType)));
        input.value = matched ? Number(matched.price || 0) : '';
    });
}

// Pricing config
const pricingConfigForm = document.getElementById('pricingConfigForm');
if (pricingConfigForm) {
    pricingConfigForm.addEventListener('submit', async function(e) {
        e.preventDefault();

        const resolvePackageId = type => {
            const normalizedType = normalizePackageTypeText(type);
            const hit = packages.find(p => {
                const packageType = normalizePackageTypeText(p.packageType);
                if (normalizedType === '1h') return packageType === '1h' || packageType === '1hour';
                if (normalizedType === '4h') return packageType === '4h' || packageType === '4hours';
                if (normalizedType === '1d') return packageType === '1d' || packageType === '1day';
                if (normalizedType === '1w') return packageType === '1w' || packageType === '1week';
                return packageType === normalizedType;
            });
            return hit ? hit.id : null;
        };

        const updates = [
            { id: resolvePackageId('1h'), price: parseFloat(document.getElementById('price1h').value) },
            { id: resolvePackageId('4h'), price: parseFloat(document.getElementById('price4h').value) },
            { id: resolvePackageId('1d'), price: parseFloat(document.getElementById('price1d').value) },
            { id: resolvePackageId('1w'), price: parseFloat(document.getElementById('price1w').value) }
        ].filter(item => item.id !== null);

        try {
            for (const update of updates) {
                const response = await fetch(`/api/packages/update/${update.id}?price=${encodeURIComponent(update.price)}`, {
                    method: 'PUT'
                });
                if (!response.ok) {
                    const errorText = await response.text();
                    throw new Error(getTextError(errorText, 'Failed to update pricing!'));
                }
            }
            // If some package types are not present in backend data, they are skipped intentionally.
            await loadPackages();
            populatePackageSelect();
            fillPricingFormFromPackages();
            alert('Pricing saved and synced!');
        } catch (error) {
            console.error('Pricing update error:', error);
            alert(error.message || 'Failed to update pricing!');
        }
        this.reset();
    });
}

// Navigation
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
        setupDiscountCalculator();
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