let packages = [];
let scooters = [];
let bookings = [];
let currentUser = null;
let adminLoggedIn = false; // Remove hardcoded admin

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

// Sections
const sections = ['authSection', 'homeSection', 'scootersSection', 'rentSection', 'paymentSection', 'successSection', 'myBookingsSection', 'scooterDetailSection', 'returnSection', 'adminLoginSection', 'adminConfigSection', 'adminStatsSection'];

function showSection(sectionId) {
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
    } else if (sectionId === 'myBookingsSection') {
        renderBookings();
    } else if (sectionId === 'adminStatsSection') {
        renderStats();
    }
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
    }
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

// Login form
document.getElementById('loginForm').addEventListener('submit', async function(e) {
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
        updateNav();
        showSection('homeSection');
        alert(`Login successful! Welcome ${user.username}.`);
    } catch (error) {
        console.error('Login error:', error);
        alert(error.message || 'Login failed!');
    }
    this.reset();
});

// Register form
document.getElementById('registerForm').addEventListener('submit', async function(e) {
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
    
    // Sprint 2: Password validation
    if (password.length < 6) {
        alert('Password must be at least 6 characters long!');
        return;
    }
    
    if (password !== confirmPassword) {
        alert('Passwords do not match!');
        return;
    }
    
    // Credit card validation
    if (!/^\d{4}\s\d{4}\s\d{4}\s\d{4}$/.test(cardNumber)) {
        alert('Please enter a valid card number (format: 1234 5678 9012 3456)');
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
        showAuthMode('login');
    } catch (error) {
        console.error('Registration error:', error);
        alert(error.message || 'Registration failed!');
    }
    this.reset();
});

// Book form
document.getElementById('bookForm').addEventListener('submit', async function(e) {
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
                totalCost: packagePrice
                // BookingController has no packageType field in Booking model.
            })
        });
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(getTextError(errorText, 'Booking failed!'));
        }
        const booking = await response.json();
        localStorage.setItem('pendingBookingId', String(booking.id));
        document.getElementById('bookingDetails').textContent = `Scooter ${scooterId}, Package ID ${packageId}`;
        showSection('paymentSection');
    } catch (error) {
        console.error('Booking error:', error);
        alert(error.message || 'Booking failed!');
    }
    this.reset();
});

// Payment form
document.getElementById('paymentForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    const cardNumber = document.getElementById('paymentCardNumber').value.trim();
    if (!cardNumber) {
        alert('Please enter bank card number!');
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
        localStorage.removeItem('pendingBookingId');
        await loadScooters();
        renderScooters();
        document.getElementById('confirmationDetails').innerHTML = `
            <p>User: ${getCurrentUsername()}</p>
            <p>Booking ID: ${bookingId}</p>
            <p>Status: paid</p>
        `;
        alert(text || 'Payment successful!');
        updateNav();
        showSection('successSection');
    } catch (error) {
        console.error('Payment error:', error);
        alert(error.message || 'Payment failed!');
    }
    this.reset();
});

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
        renderScooters();
        await renderBookings();
        updateNav();
    } catch (error) {
        console.error('End rental error:', error);
        alert(error.message || 'Failed to end rental!');
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

// Scooter config removed - managed by backend

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
const rentLink = document.getElementById('rentLink');
const myBookingsLink = document.getElementById('myBookingsLink');
const returnLink = document.getElementById('returnLink');
const adminLink = document.getElementById('adminLink');
const loginLink = document.getElementById('loginLink');
const logoutLink = document.getElementById('logoutLink');
const backToHomeBtn = document.getElementById('backToHome');

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
        await loadScooters();
        if (currentUser || adminLoggedIn) {
            showSection('homeSection');
        } else {
            showSection('authSection');
            showAuthMode('login');
        }
    }, 200);
});