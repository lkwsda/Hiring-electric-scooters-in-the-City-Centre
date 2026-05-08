// End rental
async function endRental(bookingId) {
    try {
        const response = await apiFetch(`/api/bookings/end/${bookingId}`, {
            method: 'POST'
        });
        const text = await response.text();
        if (!response.ok) {
            throw new Error(getTextError(text, 'Failed to end rental!'));
        }
        // Locally update booking status so UI reflects the change immediately
        const idx = bookings.findIndex(b => b.id === bookingId);
        if (idx !== -1) bookings[idx].status = 'finished';

        await loadScooters();
        updateScooterPageStats();
        await loadScooterLocations();
        renderScooters();
        renderScooterLocations();
        renderScooterMap();
        await renderBookings();
        updateNav();
        showSection('myBookingsSection');
        window.scrollTo({ top: 0, behavior: 'smooth' });

        // Show inline success banner instead of blocking alert
        const list = document.getElementById('bookingList');
        if (list) {
            const banner = document.createElement('div');
            banner.className = 'issue-item issue-high';
            banner.style.cssText = 'background:#e8f5e9;border-left:4px solid #27ae60;margin-bottom:12px;';
            banner.innerHTML = `<p><strong>✓ Rental #${bookingId} ended successfully.</strong> ${text || ''}</p>`;
            list.insertBefore(banner, list.firstChild);
            setTimeout(() => banner.remove(), 5000);
        }
        announce(`Booking #${bookingId} ended. Booking list has been refreshed.`);
    } catch (error) {
        console.error('End rental error:', error);
        alert(error.message || 'Failed to end rental!');
    }
}

async function cancelBooking(bookingId) {
    const confirmed = confirm(`Cancel booking #${bookingId}?`);
    if (!confirmed) return;
    try {
        const response = await apiFetch(`/api/bookings/cancel/${bookingId}`, {
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
        const response = await apiFetch(`/api/bookings/extend/${bookingId}?extraCost=${encodeURIComponent(extraCost)}`, {
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
        locationStatus.textContent = '鉁?Valid return location';
        completeBtn.disabled = false;
    } else {
        locationStatus.className = 'location-status location-invalid';
        locationStatus.textContent = '鉁?Invalid return location. Please move to an allowed zone.';
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

