let accounts = JSON.parse(localStorage.getItem('accounts')) || [];
let packages = JSON.parse(localStorage.getItem('packages')) || { '1h': 5, '4h': 15, '1d': 25, '1w': 100 };
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

let storedScooters = JSON.parse(localStorage.getItem('scooters'));
let scooters = Array.isArray(storedScooters) && storedScooters.length >= 9 ? storedScooters : defaultScooters;

// Normalize image paths for stored data and any rewritten filenames
if (Array.isArray(scooters)) {
    scooters = scooters.map(s => ({
        ...s,
        image: getModelImage(s.model || s.image || ''),
    }));
}

if (!Array.isArray(storedScooters) || storedScooters.length < 9) {
    localStorage.setItem('scooters', JSON.stringify(scooters));
} else {
    localStorage.setItem('scooters', JSON.stringify(scooters));
}
let bookings = JSON.parse(localStorage.getItem('bookings')) || [];
let currentUser = localStorage.getItem('currentUser') || null;
let adminLoggedIn = localStorage.getItem('adminLoggedIn') === 'true';

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

function updateNav() {
    const loginLink = document.getElementById('loginLink');
    const logoutLink = document.getElementById('logoutLink');
    const returnLink = document.getElementById('returnLink');
    
    if (currentUser || adminLoggedIn) {
        loginLink.style.display = 'none';
        logoutLink.style.display = 'inline';
        
        // Show return link if user has active booking
        const hasActiveBooking = bookings.some(b => b.user === currentUser && b.status === 'active');
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
    Object.keys(packages).forEach(key => {
        const card = document.createElement('div');
        card.className = 'package-card';
        const name = key === '1h' ? '1 Hour' : key === '4h' ? '4 Hours' : key === '1d' ? '1 Day' : '1 Week';
        card.innerHTML = `
            <h3>${name}</h3>
            <p>Price: $${packages[key]}</p>
        `;
        grid.appendChild(card);
    });
}

// Update home statistics
function updateHomeStats() {
    // Available scooters count
    const availableScooters = scooters.filter(s => s.status === 'normal').length;
    document.getElementById('availableScooters').textContent = availableScooters;

    // Active users count (users with active bookings)
    const activeUsers = new Set(bookings.filter(b => b.status === 'active').map(b => b.user)).size;
    document.getElementById('activeUsers').textContent = activeUsers;

    // Total rides count (completed bookings)
    const totalRides = bookings.filter(b => b.status === 'completed').length;
    document.getElementById('totalRides').textContent = totalRides;
}

// Render scooters
function renderScooters() {
    const grid = document.getElementById('scooterGrid');
    grid.innerHTML = '';
    if (scooters.length === 0) {
        grid.innerHTML = `
            <div class="no-scooters-message">
                <p>No scooters are currently available. Please check back later or browse another section.</p>
            </div>
        `;
        return;
    }

    scooters.forEach(scooter => {
        const card = document.createElement('div');
        const isAvailable = scooter.status === 'normal';
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
function renderBookings() {
    const list = document.getElementById('bookingList');
    list.innerHTML = '';
    const userBookings = bookings.filter(b => b.user === currentUser).sort((a, b) => new Date(b.startTime) - new Date(a.startTime));
    userBookings.forEach(booking => {
        const item = document.createElement('div');
        item.className = 'booking-item';
        const startTime = new Date(booking.startTime).toLocaleString();
        const endTime = booking.endTime ? new Date(booking.endTime).toLocaleString() : 'Ongoing';
        const cost = booking.cost ? `$${booking.cost.toFixed(2)}` : 'Calculating...';
        let buttonHtml = '';
        if (booking.status === 'active') {
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
}

// Render stats
function renderStats() {
    const table = document.getElementById('statsTable');
    table.innerHTML = '';
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const weekBookings = bookings.filter(b => new Date(b.time) >= weekAgo && b.paymentStatus === 'paid');
    const stats = {};
    ['1h', '4h', '1d', '1w'].forEach(p => {
        const count = weekBookings.filter(b => b.package === p).length;
        const revenue = count * packages[p];
        stats[p] = { count, revenue };
    });
    let html = '<table><tr><th>Package</th><th>Orders</th><th>Revenue</th></tr>';
    Object.keys(stats).forEach(p => {
        const name = p === '1h' ? '1 Hour' : p === '4h' ? '4 Hours' : p === '1d' ? '1 Day' : '1 Week';
        html += `<tr><td>${name}</td><td>${stats[p].count}</td><td>$${stats[p].revenue}</td></tr>`;
    });
    html += '</table>';
    table.innerHTML = html;
}

// Login form
document.getElementById('loginForm').addEventListener('submit', function(e) {
    e.preventDefault();
    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value.trim();
    const user = accounts.find(a => a.email === email && a.password === password);
    if (user) {
        currentUser = email;
        localStorage.setItem('currentUser', currentUser);
        updateNav();
        showSection('homeSection');
        alert('Login successful!');
    } else {
        alert('Invalid email or password!');
    }
    this.reset();
});

// Register form
document.getElementById('registerForm').addEventListener('submit', function(e) {
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
    
    if (accounts.find(a => a.email === email)) {
        alert('Email already exists!');
        return;
    }
    
    accounts.push({ 
        username, 
        email, 
        phone, 
        password,
        creditCard: {
            number: cardNumber,
            expiry: cardExpiry,
            cvv: cardCVV
        },
        acceptedTerms: true
    });
    localStorage.setItem('accounts', JSON.stringify(accounts));
    alert('Registration successful! Your credit card has been securely stored.');
    this.reset();
});

// Book form
document.getElementById('bookForm').addEventListener('submit', function(e) {
    e.preventDefault();
    if (!currentUser) {
        alert('Please login first!');
        showSection('authSection');
        return;
    }
    const packageType = document.getElementById('packageSelect').value;
    const scooterId = parseInt(document.getElementById('scooterId').value);
    const scooter = scooters.find(s => s.id === scooterId && s.status === 'normal');
    if (!scooter) {
        alert('Scooter not available!');
        return;
    }
    // Store booking details for payment
    localStorage.setItem('pendingBooking', JSON.stringify({ user: currentUser, scooterId, package: packageType }));
    document.getElementById('bookingDetails').textContent = `Scooter ${scooterId}, Package ${packageType}`;
    showSection('paymentSection');
    this.reset();
});

// Payment form
document.getElementById('paymentForm').addEventListener('submit', function(e) {
    e.preventDefault();
    const cardNumber = document.getElementById('paymentCardNumber').value.trim();
    if (!cardNumber) {
        alert('Please enter bank card number!');
        return;
    }
    const pending = JSON.parse(localStorage.getItem('pendingBooking'));
    const booking = {
        id: Date.now(),
        user: pending.user,
        scooterId: pending.scooterId,
        package: pending.package,
        time: new Date().toISOString(),
        startTime: new Date().toISOString(),
        status: 'active',
        paymentStatus: 'paid'
    };
    bookings.push(booking);
    localStorage.setItem('bookings', JSON.stringify(bookings));
    localStorage.removeItem('pendingBooking');

    const scooter = scooters.find(s => s.id === booking.scooterId);
    if (scooter) {
        scooter.status = 'rented';
        localStorage.setItem('scooters', JSON.stringify(scooters));
    }

    document.getElementById('confirmationDetails').innerHTML = `
        <p>User: ${booking.user}</p>
        <p>Scooter ID: ${booking.scooterId}</p>
        <p>Package: ${booking.package}</p>
        <p>Start Time: ${new Date(booking.startTime).toLocaleString()}</p>
        <p>Status: Active</p>
    `;
    
    setTimeout(() => {
        alert(`📧 Email notification sent to ${booking.user}!\nPayment confirmation for Scooter ${booking.scooterId} has been sent.`);
    }, 1000);

    renderScooters();
    updateNav();
    showSection('successSection');
    this.reset();
});

// End rental
function endRental(bookingId) {
    const booking = bookings.find(b => b.id === bookingId);
    if (!booking || booking.status !== 'active') {
        alert('Rental not found or already ended!');
        return;
    }
    const endTime = new Date();
    const startTime = new Date(booking.startTime);
    const durationHours = (endTime - startTime) / (1000 * 60 * 60);
    const cost = Math.ceil(durationHours) * 5; // Fixed rate of $5 per hour
    booking.endTime = endTime.toISOString();
    booking.status = 'completed';
    booking.cost = cost;
    localStorage.setItem('bookings', JSON.stringify(bookings));
    // Update scooter status
    const scooter = scooters.find(s => s.id === booking.scooterId);
    if (scooter) {
        scooter.status = 'normal';
        localStorage.setItem('scooters', JSON.stringify(scooters));
    }
    alert(`Rental ended! Total cost: $${cost.toFixed(2)}`);
    renderBookings();
    renderScooters();
    updateNav();
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
    
    // Complete return
    const activeBooking = bookings.find(b => b.user === currentUser && b.status === 'active');
    if (activeBooking) {
        endRental(activeBooking.id);
        alert('Scooter returned successfully!');
        showSection('homeSection');
    }
}

// View scooter detail
function viewScooterDetail(scooterId) {
    const scooter = scooters.find(s => s.id === scooterId);
    if (!scooter) return;
    
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
                <span class="spec-value ${scooter.status === 'normal' ? 'status-available' : 'status-rented'}">${scooter.status}</span>
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
                <span class="spec-value">${scooter.specs.maxSpeed}</span>
            </div>
            <div class="spec-item">
                <span class="spec-label">Range:</span>
                <span class="spec-value">${scooter.specs.range}</span>
            </div>
            <div class="spec-item">
                <span class="spec-label">Weight:</span>
                <span class="spec-value">${scooter.specs.weight}</span>
            </div>
            <div class="spec-item">
                <span class="spec-label">Motor:</span>
                <span class="spec-value">${scooter.specs.motor}</span>
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
    const scooter = scooters.find(s => s.id === scooterId && s.status === 'normal');
    if (!scooter) {
        alert('Scooter unavailable or not found.');
        return;
    }
    if (!currentUser) {
        alert('Please login first to rent a scooter.');
        showSection('authSection');
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
        return;
    }
    alert('Unlocking scooter... Please scan the QR code on the app to start your ride.');
}

// Rent from detail page
function rentFromDetail() {
    const scooterId = parseInt(document.querySelector('.scooter-specs h3').textContent.split('ID: ')[1]);
    rentScooter(scooterId);
}

// Admin login
document.getElementById('adminLoginForm').addEventListener('submit', function(e) {
    e.preventDefault();
    const username = document.getElementById('adminUsername').value.trim();
    const password = document.getElementById('adminPassword').value.trim();
    if (username === 'admin' && password === '123456') {
        adminLoggedIn = true;
        localStorage.setItem('adminLoggedIn', 'true');
        updateNav();
        showSection('adminConfigSection');
        alert('Admin login successful!');
    } else {
        alert('Invalid admin credentials!');
    }
    this.reset();
});

// Scooter config
document.getElementById('scooterConfigForm').addEventListener('submit', function(e) {
    e.preventDefault();
    const id = parseInt(document.getElementById('newScooterId').value);
    const status = document.getElementById('scooterStatus').value.trim();
    if (scooters.find(s => s.id === id)) {
        alert('Scooter ID already exists!');
        return;
    }
    scooters.push({ id, status });
    localStorage.setItem('scooters', JSON.stringify(scooters));
    alert('Scooter added!');
    this.reset();
});

// Pricing config
document.getElementById('pricingConfigForm').addEventListener('submit', function(e) {
    e.preventDefault();
    packages['1h'] = parseFloat(document.getElementById('price1h').value);
    packages['4h'] = parseFloat(document.getElementById('price4h').value);
    packages['1d'] = parseFloat(document.getElementById('price1d').value);
    packages['1w'] = parseFloat(document.getElementById('price1w').value);
    localStorage.setItem('packages', JSON.stringify(packages));
    alert('Pricing saved and synced!');
    this.reset();
});

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
            showSection('adminLoginSection');
        }
    });
}

if (loginLink) {
    loginLink.addEventListener('click', event => {
        event.preventDefault();
        showSection('authSection');
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
    Object.keys(packages).forEach(key => {
        const name = key === '1h' ? '1 Hour' : key === '4h' ? '4 Hours' : key === '1d' ? '1 Day' : '1 Week';
        const option = document.createElement('option');
        option.value = key;
        option.textContent = `${name} - $${packages[key]}`;
        select.appendChild(option);
    });
}

// Initialize
window.addEventListener('load', function() {
    document.body.style.opacity = 0;
    setTimeout(() => {
        document.body.style.opacity = 1;
        updateNav();
        populatePackageSelect();
        if (currentUser || adminLoggedIn) {
            showSection('homeSection');
        } else {
            showSection('authSection');
        }
    }, 200);
});