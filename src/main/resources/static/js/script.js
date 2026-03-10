// Simulated scooter data (replace with backend API later)
let scooters = [
    { id: 1, model: 'Xiaomi Pro', status: 'available', location: 'Downtown Plaza Area A' },
    { id: 2, model: 'Ninebot MAX', status: 'available', location: 'Subway Station Exit' },
    { id: 3, model: 'Niu Electric', status: 'rented', location: 'Commercial Street North' },
    { id: 4, model: 'Yadea Scooter', status: 'available', location: 'Park East Gate' }
];

// Render scooter list dynamically
function renderScooters() {
    const grid = document.getElementById('scooterGrid');
    grid.innerHTML = '';
    scooters.forEach(scooter => {
        const card = document.createElement('div');
        card.className = 'scooter-card';
        card.innerHTML = `
            <h3>Scooter ID: ${scooter.id}</h3>
            <p>Model: ${scooter.model}</p>
            <p>Location: ${scooter.location}</p>
            <p>Status: <span class="${scooter.status === 'available' ? 'status-available' : 'status-rented'}">${scooter.status === 'available' ? 'Available' : 'Rented'}</span></p>
        `;
        grid.appendChild(card);
    });
}

// Rental form submission
document.getElementById('rentForm').addEventListener('submit', function(e) {
    e.preventDefault();
    const userName = document.getElementById('userName').value.trim();
    const scooterId = parseInt(document.getElementById('scooterId').value);

    // Basic validation
    if (!userName) {
        alert('Please enter your full name!');
        return;
    }

    const scooter = scooters.find(s => s.id === scooterId);
    if (scooter && scooter.status === 'available') {
        scooter.status = 'rented';
        // Enhanced alert with better UX
        alert(`✅ Hello ${userName}! You have successfully rented Scooter #${scooterId}.\nEnjoy your ride!`);
        renderScooters();
        this.reset();
    } else {
        alert('❌ Error: Scooter not found or already rented!');
    }
});

// Return form submission
document.getElementById('returnForm').addEventListener('submit', function(e) {
    e.preventDefault();
    const scooterId = parseInt(document.getElementById('returnScooterId').value);

    const scooter = scooters.find(s => s.id === scooterId);
    if (scooter && scooter.status === 'rented') {
        scooter.status = 'available';
        alert(`✅ Scooter #${scooterId} has been returned successfully!\nThank you for using our service.`);
        renderScooters();
        this.reset();
    } else {
        alert('❌ Error: Scooter not found or not rented!');
    }
});

// Initialize page with smooth transition
window.addEventListener('load', function() {
    // Add fade-in effect for better UX
    document.body.style.opacity = 0;
    setTimeout(() => {
        document.body.style.opacity = 1;
        renderScooters();
    }, 200);
});