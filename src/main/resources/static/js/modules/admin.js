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
const adminProxyBookingResult = document.getElementById('adminProxyBookingResult');

function populateAdminProxyBookingOptions() {
    const scooterSelect = document.getElementById('adminProxyScooterId');
    const packageSelect = document.getElementById('adminProxyPackageId');
    if (!scooterSelect || !packageSelect) return;

    scooterSelect.innerHTML = '<option value="">Select available scooter</option>';
    scooters
        .filter(scooter => normalizeScooterStatus(scooter.status) === 'available')
        .forEach(scooter => {
            const option = document.createElement('option');
            option.value = String(scooter.id);
            option.textContent = `${scooter.id} - ${scooter.model || 'Scooter'} (${scooter.location || 'N/A'})`;
            scooterSelect.appendChild(option);
        });

    packageSelect.innerHTML = '<option value="">Select package</option>';
    packages.forEach(pkg => {
        const option = document.createElement('option');
        option.value = String(pkg.id);
        option.textContent = `${pkg.id} - ${pkg.packageType || 'Package'} ($${Number(pkg.price || 0).toFixed(2)})`;
        packageSelect.appendChild(option);
    });
}

if (adminPlaceBookingForm) {
    adminPlaceBookingForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        if (!adminLoggedIn) {
            alert('Admin account required.');
            return;
        }
        const userId = getCurrentUserId();
        const scooterId = Number(document.getElementById('adminProxyScooterId').value);
        const packageId = Number(document.getElementById('adminProxyPackageId').value);
        const guestName = (document.getElementById('adminProxyGuestName').value || '').trim();
        const guestPhone = (document.getElementById('adminProxyGuestPhone').value || '').trim();
        if (!Number.isInteger(userId)) {
            alert('Unable to identify current admin user. Please login again.');
            return;
        }
        if (!Number.isInteger(scooterId) || !Number.isInteger(packageId)) {
            alert('Please select valid scooter and package.');
            return;
        }
        if (!guestName) {
            alert('Guest name is required.');
            return;
        }
        if (!guestPhone) {
            alert('Guest phone is required.');
            return;
        }

        try {
            const response = await fetch('/api/bookings/admin/place', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId,
                    scooterId,
                    packageId,
                    guestName,
                    guestPhone
                })
            });
            const text = await response.text();
            if (!response.ok) {
                throw new Error(getTextError(text, 'Admin proxy booking failed.'));
            }
            alert('Admin proxy booking created successfully.');
            if (adminProxyBookingResult) {
                adminProxyBookingResult.innerHTML = `
                    <div class="issue-item">
                        <p><strong>Proxy booking submitted successfully.</strong></p>
                        <p><strong>Scooter ID:</strong> ${scooterId} | <strong>Package ID:</strong> ${packageId}</p>
                        <p><strong>Guest:</strong> ${guestName} | <strong>Phone:</strong> ${guestPhone}</p>
                        <p><strong>Server response:</strong> ${text || 'Booking created.'}</p>
                    </div>
                `;
            }
            this.reset();
            await loadScooters();
            await loadScooterLocations();
            renderScooters();
            renderScooterLocations();
            await renderBookings();
            populateAdminProxyBookingOptions();
        } catch (error) {
            console.error('Admin proxy booking error:', error);
            if (adminProxyBookingResult) {
                adminProxyBookingResult.innerHTML = `<p>${error.message || 'Admin proxy booking failed.'}</p>`;
            }
            alert(error.message || 'Admin proxy booking failed.');
        }
    });
}

const refreshUsersBtn = document.getElementById('refreshUsersBtn');
if (refreshUsersBtn) {
    refreshUsersBtn.addEventListener('click', async () => {
        await loadAdminUsers();
        renderAdminUsers();
        populateAdminProxyBookingOptions();
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

