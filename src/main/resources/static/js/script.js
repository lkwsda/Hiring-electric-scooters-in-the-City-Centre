// Simulated data
let accounts = JSON.parse(localStorage.getItem('accounts')) || [];
let packages = JSON.parse(localStorage.getItem('packages')) || { '1h': 5, '4h': 15, '1d': 25, '1w': 100 };
let scooters = JSON.parse(localStorage.getItem('scooters')) || [
    { id: 1666, status: 'normal' },
    { id: 1888, status: 'normal' },
    { id: 1999, status: 'maintenance' },
    { id: 1010, status: 'normal' },
    { id: 2666, status: 'normal' },
    { id: 2888, status: 'normal' },
    { id: 2999, status: 'normal' },
    { id: 3666, status: 'normal' }
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

// Render scooters
function renderScooters() {
    const grid = document.getElementById('scooterGrid');
    grid.innerHTML = '';
    scooters.forEach(scooter => {
        const card = document.createElement('div');
        card.className = 'scooter-card';
        card.innerHTML = `
            <h3>Scooter ID: ${scooter.id}</h3>
            <p>Status: <span class="${scooter.status === 'normal' ? 'status-available' : 'status-rented'}">${scooter.status}</span></p>
        `;
        grid.appendChild(card);
    });
}

// Render bookings
function renderBookings() {
    const list = document.getElementById('bookingList');
    list.innerHTML = '';
    const userBookings = bookings.filter(b => b.user === currentUser && b.status !== 'cancelled');
    userBookings.forEach(booking => {
        const item = document.createElement('div');
        item.className = 'booking-item';
        item.innerHTML = `
            <p>User: ${booking.user}</p>
            <p>Scooter ID: ${booking.scooterId}</p>
            <p>Package: ${booking.package}</p>
            <p>Time: ${booking.time}</p>
            <p>Status: ${booking.status}</p>
            <button onclick="cancelBooking(${booking.id})">Cancel Booking</button>
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
    const account = document.getElementById('loginAccount').value.trim();
    const password = document.getElementById('loginPassword').value.trim();
    const user = accounts.find(a => a.account === account && a.password === password);
    if (user) {
        currentUser = account;
        localStorage.setItem('currentUser', currentUser);
        updateNav();
        showSection('homeSection');
        alert('Login successful!');
    } else {
        alert('Invalid account or password!');
    }
    this.reset();
});

// Register form
document.getElementById('registerForm').addEventListener('submit', function(e) {
    e.preventDefault();
    const account = document.getElementById('registerAccount').value.trim();
    const password = document.getElementById('registerPassword').value.trim();
    if (accounts.find(a => a.account === account)) {
        alert('Account already exists!');
        return;
    }
    accounts.push({ account, password });
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

// Cancel booking
function cancelBooking(id) {
    if (confirm('Are you sure to cancel this booking?')) {
        const booking = bookings.find(b => b.id === id);
        booking.status = 'cancelled';
        localStorage.setItem('bookings', JSON.stringify(bookings));
        renderBookings();
    }
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