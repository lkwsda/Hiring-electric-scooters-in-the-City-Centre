// Simulated data
let accounts = JSON.parse(localStorage.getItem('accounts')) || [];
let packages = JSON.parse(localStorage.getItem('packages')) || { '1h': 5, '4h': 15, '1d': 25, '1w': 100 };
let scooters = JSON.parse(localStorage.getItem('scooters')) || [
    { id: 1666, status: 'normal', model: 'EcoRide X1', battery: 85, location: 'Downtown Plaza' },
    { id: 1888, status: 'normal', model: 'EcoRide X2', battery: 92, location: 'Central Park' },
    { id: 1999, status: 'maintenance', model: 'EcoRide X1', battery: 45, location: 'Main Street' },
    { id: 1010, status: 'normal', model: 'EcoRide X3', battery: 78, location: 'City Hall' },
    { id: 2666, status: 'normal', model: 'EcoRide X2', battery: 88, location: 'Shopping Mall' },
    { id: 2888, status: 'normal', model: 'EcoRide X1', battery: 95, location: 'Train Station' },
    { id: 2999, status: 'normal', model: 'EcoRide X3', battery: 67, location: 'University' },
    { id: 3666, status: 'normal', model: 'EcoRide X2', battery: 73, location: 'Hospital' }
];
let bookings = JSON.parse(localStorage.getItem('bookings')) || [];
let currentUser = localStorage.getItem('currentUser') || null;
let adminLoggedIn = localStorage.getItem('adminLoggedIn') === 'true';

// Sections
const sections = ['authSection', 'homeSection', 'scootersSection', 'rentSection', 'paymentSection', 'successSection', 'myBookingsSection', 'adminLoginSection', 'adminConfigSection', 'adminStatsSection'];

function showSection(sectionId) {
    sections.forEach(id => {
        document.getElementById(id).style.display = id === sectionId ? 'block' : 'none';
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
    if (currentUser || adminLoggedIn) {
        loginLink.style.display = 'none';
        logoutLink.style.display = 'inline';
    } else {
        loginLink.style.display = 'inline';
        logoutLink.style.display = 'none';
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
    scooters.forEach(scooter => {
        if (scooter.status === 'normal') {
            const card = document.createElement('div');
            card.className = 'scooter-card';
            card.innerHTML = `
                <h3>Scooter ID: ${scooter.id}</h3>
                <p>Model: ${scooter.model || 'Standard Model'}</p>
                <p>Battery: ${scooter.battery || '80'}%</p>
                <p>Location: ${scooter.location || 'Downtown Plaza'}</p>
                <p>Status: <span class="status-available">Available</span></p>
                <button onclick="rentScooter(${scooter.id})" class="rent-btn"><i class="fa-solid fa-handshake"></i> Rent</button>
            `;
            grid.appendChild(card);
        }
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
            buttonHtml = `<button onclick="endRental(${booking.id})" class="end-rental-btn"><i class="fa-solid fa-stop"></i> End Rental</button>`;
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
    const weekBookings = bookings.filter(b => new Date(b.time) >= weekAgo && b.status === 'paid');
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
    const password = document.getElementById('registerPassword').value.trim();
    const confirmPassword = document.getElementById('registerConfirmPassword').value.trim();
    
    if (password !== confirmPassword) {
        alert('Passwords do not match!');
        return;
    }
    if (accounts.find(a => a.email === email)) {
        alert('Email already exists!');
        return;
    }
    accounts.push({ username, email, password });
    localStorage.setItem('accounts', JSON.stringify(accounts));
    alert('Registration successful! Please login.');
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
    const cardNumber = document.getElementById('cardNumber').value.trim();
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
        status: 'paid'
    };
    bookings.push(booking);
    localStorage.setItem('bookings', JSON.stringify(bookings));
    localStorage.removeItem('pendingBooking');
    // Show confirmation
    document.getElementById('confirmationDetails').innerHTML = `
        <p>User: ${booking.user}</p>
        <p>Scooter ID: ${booking.scooterId}</p>
        <p>Package: ${booking.package}</p>
        <p>Time: ${booking.time}</p>
        <p>Status: Paid</p>
    `;
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
document.getElementById('homeLink').addEventListener('click', () => showSection('homeSection'));
document.getElementById('scootersLink').addEventListener('click', () => showSection('scootersSection'));
document.getElementById('rentLink').addEventListener('click', () => showSection('rentSection'));
document.getElementById('myBookingsLink').addEventListener('click', () => {
    if (!currentUser) {
        alert('Please login first!');
        showSection('authSection');
        return;
    }
    showSection('myBookingsSection');
});
document.getElementById('adminLink').addEventListener('click', () => {
    if (adminLoggedIn) {
        showSection('adminConfigSection');
    } else {
        showSection('adminLoginSection');
    }
});
document.getElementById('loginLink').addEventListener('click', () => showSection('authSection'));
document.getElementById('logoutLink').addEventListener('click', () => {
    currentUser = null;
    adminLoggedIn = false;
    localStorage.removeItem('currentUser');
    localStorage.removeItem('adminLoggedIn');
    updateNav();
    showSection('authSection');
});
document.getElementById('backToHome').addEventListener('click', () => showSection('homeSection'));

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