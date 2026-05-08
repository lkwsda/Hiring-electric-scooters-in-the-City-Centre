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
const DEFAULT_SCOOTER_IMAGE = 'images/EcoRide_X1.png';

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

function resolveScooterImage(model, rawImage) {
    if (rawImage && /^\/?images\//i.test(rawImage)) {
        return rawImage;
    }
    const fallbackByModel = {
        x1: 'images/EcoRide_X1.png',
        x2: 'images/EcoRide_X2.png',
        x3: 'images/EcoRide_X3.png',
        x4: 'images/EcoRide_X4.png'
    };
    const normalizedModel = String(model || '').toLowerCase();
    const matchedKey = Object.keys(fallbackByModel).find(key => normalizedModel.includes(key));
    if (matchedKey) {
        return fallbackByModel[matchedKey];
    }
    const guessed = getModelImage(model || 'EcoRide X1');
    return guessed || DEFAULT_SCOOTER_IMAGE;
}

function getAuthToken() {
    return localStorage.getItem('authToken') || '';
}

async function apiFetch(url, options = {}) {
    const token = getAuthToken();
    const headers = { ...(options.headers || {}) };
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }
    if (!headers['Content-Type'] && !headers['content-type'] && !(options.body instanceof FormData)) {
        headers['Content-Type'] = 'application/json';
    }
    return fetch(url, { ...options, headers });
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
    localStorage.removeItem('authToken');
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

const MODEL_SPECS = {
    x1: { maxSpeed: '15 mph', range: '25 miles', weight: '12.5 kg', motor: '250W Hub' },
    x2: { maxSpeed: '18 mph', range: '30 miles', weight: '13.8 kg', motor: '350W Hub' },
    x3: { maxSpeed: '22 mph', range: '35 miles', weight: '14.2 kg', motor: '500W Hub' },
    x4: { maxSpeed: '25 mph', range: '40 miles', weight: '15.0 kg', motor: '750W Hub' }
};

function getScooterSpecs(scooter) {
    if (scooter.specs && scooter.specs.maxSpeed !== 'N/A') return scooter.specs;
    const model = String(scooter.model || '').toLowerCase();
    const image = String(scooter.imageUrl || scooter.image || '').toLowerCase();
    for (const [key, spec] of Object.entries(MODEL_SPECS)) {
        if (model.includes(key) || image.includes(key)) return spec;
    }
    return MODEL_SPECS.x1;
}

function normalizeScooter(scooter) {
    const battery = Number.isFinite(scooter.batteryLevel) ? scooter.batteryLevel : (Number.isFinite(scooter.battery) ? scooter.battery : 0);
    const latitude = Number(scooter.latitude);
    const longitude = Number(scooter.longitude);
    const specs = getScooterSpecs(scooter);
    const mileage = scooter.gps && scooter.gps.mileage ? scooter.gps.mileage : (Math.round((scooter.id * 37 + 120) * 10) / 10);
    return {
        ...scooter,
        status: normalizeScooterStatus(scooter.status),
        battery,
        location: scooter.location || ((Number.isFinite(latitude) && Number.isFinite(longitude)) ? `${latitude.toFixed(4)}, ${longitude.toFixed(4)}` : 'N/A'),
        gps: {
            lat: Number.isFinite(latitude) ? latitude : 0,
            lng: Number.isFinite(longitude) ? longitude : 0,
            mileage
        },
        specs,
        image: resolveScooterImage(scooter.model, scooter.imageUrl || scooter.image)
    };
}

async function loadPackages() {
    try {
        const response = await apiFetch('/api/packages');
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
        const response = await apiFetch('/api/scooters');
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
        const response = await apiFetch('/api/scooters/locations');
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

function buildMapPointsFromScooters(sourceScooters) {
    const fallbackCenter = { lat: 53.8008, lng: -1.5491 };
    const spacing = 0.0042;
    return (Array.isArray(sourceScooters) ? sourceScooters : []).slice(0, 20).map((item, index) => {
        const rawLat = Number(item.gps && item.gps.lat ? item.gps.lat : item.latitude);
        const rawLng = Number(item.gps && item.gps.lng ? item.gps.lng : item.longitude);
        const lat = Number.isFinite(rawLat) && Math.abs(rawLat) > 0.000001
            ? rawLat
            : fallbackCenter.lat + ((index % 3) - 1) * spacing;
        const lng = Number.isFinite(rawLng) && Math.abs(rawLng) > 0.000001
            ? rawLng
            : fallbackCenter.lng + (Math.floor(index / 3) - 1) * spacing;
        return {
            id: item.id,
            latitude: lat,
            longitude: lng
        };
    });
}

function ensureMinimumMapPoints(points, minCount = 5) {
    const normalized = (Array.isArray(points) ? points : []).filter(item => Number.isFinite(Number(item.latitude)) && Number.isFinite(Number(item.longitude)));
    if (normalized.length >= minCount) {
        return normalized;
    }
    const scooterFallback = buildMapPointsFromScooters(scooters).filter(item => Number.isFinite(Number(item.latitude)) && Number.isFinite(Number(item.longitude)));
    const merged = [...normalized];
    scooterFallback.forEach(item => {
        if (!merged.some(existing => Number(existing.id) === Number(item.id))) {
            merged.push(item);
        }
    });
    return merged.slice(0, Math.max(minCount, merged.length));
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

    const mapPoints = ensureMinimumMapPoints(scooterLocations, 5);

    const validPoints = mapPoints
        .map(item => ({
            id: item.id,
            lat: Number(item.latitude),
            lng: Number(item.longitude)
        }))
        .filter(point => Number.isFinite(point.lat) && Number.isFinite(point.lng));

    if (!scooterMap) {
        scooterMap = L.map('scooterMap').setView([53.8008, -1.5491], 15);
        L.tileLayer('https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', {
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
        const response = await apiFetch('/api/users');
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

const USERS_PER_PAGE = 5;
let usersPage = 1;

function renderAdminUsers() {
    const container = document.getElementById('adminUsersList');
    const pager = document.getElementById('usersPagination');
    if (!container) return;
    if (!adminUsers.length) {
        container.innerHTML = '<p>No user data loaded.</p>';
        if (pager) pager.innerHTML = '';
        return;
    }
    const totalPages = Math.max(1, Math.ceil(adminUsers.length / USERS_PER_PAGE));
    if (usersPage > totalPages) usersPage = totalPages;
    const start = (usersPage - 1) * USERS_PER_PAGE;
    const pageItems = adminUsers.slice(start, start + USERS_PER_PAGE);

    container.innerHTML = pageItems.map(user => `
        <div class="issue-item">
            <p><strong>ID:</strong> ${user.id} | <strong>Name:</strong> ${user.username || 'N/A'} | <strong>Role:</strong> ${user.role || 'user'}</p>
            <p><strong>Email:</strong> ${user.email || 'N/A'}</p>
        </div>
    `).join('');

    if (pager) {
        if (totalPages > 1) {
            let btns = '';
            for (let p = 1; p <= totalPages; p++) {
                btns += `<button onclick="goUsersPage(${p})" class="${p === usersPage ? 'page-active' : ''}">${p}</button>`;
            }
            pager.innerHTML = `
                <button onclick="goUsersPage(${usersPage - 1})" ${usersPage <= 1 ? 'disabled' : ''}>&laquo; Prev</button>
                ${btns}
                <button onclick="goUsersPage(${usersPage + 1})" ${usersPage >= totalPages ? 'disabled' : ''}>Next &raquo;</button>
            `;
        } else {
            pager.innerHTML = '';
        }
    }
}

function goUsersPage(page) {
    const totalPages = Math.max(1, Math.ceil(adminUsers.length / USERS_PER_PAGE));
    usersPage = Math.max(1, Math.min(totalPages, page));
    renderAdminUsers();
}

