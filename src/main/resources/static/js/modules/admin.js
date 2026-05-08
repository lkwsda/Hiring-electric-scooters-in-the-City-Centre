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
        const batteryLevel = Number(document.getElementById('scooterBattery').value);
        const imageUrl = (document.getElementById('scooterImageUrl').value || '').trim();

        if (!Number.isInteger(newScooterId) || newScooterId <= 0) {
            alert('Please enter a valid scooter ID.');
            return;
        }
        if (!scooterStatus) {
            alert('Please enter scooter status.');
            return;
        }
        if (!Number.isFinite(batteryLevel) || batteryLevel < 0 || batteryLevel > 100) {
            alert('Please enter a valid battery level (0-100).');
            return;
        }

        try {
            const response = await apiFetch('/api/scooters/add', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: newScooterId,
                    model: 'EcoRide X1',
                    batteryLevel,
                    latitude: 53.8008,
                    longitude: -1.5491,
                    status: scooterStatus,
                    imageUrl: imageUrl || null
                })
            });
            const text = await response.text();
            if (!response.ok) {
                throw new Error(getTextError(text, 'Failed to add scooter.'));
            }
            alert(text || 'Scooter added successfully.');
            this.reset();
            // Reset custom select UI
            const placeholder = document.querySelector('#scooterStatusTrigger .custom-select-placeholder');
            if (placeholder) {
                placeholder.textContent = '-- Select Status --';
                placeholder.classList.remove('is-selected');
            }
            document.querySelectorAll('.custom-select-option').forEach(o => o.classList.remove('is-selected'));
            await loadScooters();
            renderScooters();
            updateHomeStats();
        } catch (error) {
            console.error('Add scooter error:', error);
            alert(error.message || 'Failed to add scooter.');
        }
    });
}

// Custom select helper
function initCustomSelect(wrapperId, triggerId, hiddenId) {
    const wrapper = document.getElementById(wrapperId);
    const trigger = document.getElementById(triggerId);
    if (!wrapper || !trigger) return;

    trigger.addEventListener('click', (e) => {
        e.stopPropagation();
        // Close other open custom selects
        document.querySelectorAll('.custom-select.is-open').forEach(el => {
            if (el !== wrapper) el.classList.remove('is-open');
        });
        wrapper.classList.toggle('is-open');
    });

    document.addEventListener('click', () => {
        wrapper.classList.remove('is-open');
    });
}

function selectCustomOption(wrapperId, hiddenId, value, text) {
    const wrapper = document.getElementById(wrapperId);
    const hidden = document.getElementById(hiddenId);
    if (!wrapper || !hidden) return;
    hidden.value = value;
    const placeholder = wrapper.querySelector('.custom-select-placeholder');
    if (placeholder) {
        placeholder.textContent = text;
        placeholder.classList.add('is-selected');
    }
    wrapper.querySelectorAll('.custom-select-option').forEach(o => o.classList.remove('is-selected'));
    const matching = wrapper.querySelector(`.custom-select-option[data-value="${value}"]`);
    if (matching) matching.classList.add('is-selected');
    wrapper.classList.remove('is-open');
}

// Init Status custom select
initCustomSelect('scooterStatusWrapper', 'scooterStatusTrigger', 'scooterStatus');
(function bindStatusOptions() {
    const wrapper = document.getElementById('scooterStatusWrapper');
    if (!wrapper) return;
    wrapper.querySelectorAll('.custom-select-option').forEach(opt => {
        opt.addEventListener('click', () => {
            selectCustomOption('scooterStatusWrapper', 'scooterStatus', opt.dataset.value, opt.textContent);
        });
    });
})();

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
            const response = await apiFetch(`/api/scooters/${scooterId}`);
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
            const response = await apiFetch(`/api/scooters/${scooterId}`, {
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
    const scooterDropdown = document.getElementById('adminProxyScooterDropdown');
    const packageDropdown = document.getElementById('adminProxyPackageDropdown');
    if (!scooterDropdown || !packageDropdown) return;

    scooterDropdown.innerHTML = '';
    scooters
        .filter(scooter => normalizeScooterStatus(scooter.status) === 'available')
        .forEach(scooter => {
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'custom-select-option';
            btn.dataset.value = String(scooter.id);
            btn.textContent = `${scooter.id} - ${scooter.model || 'Scooter'} (${scooter.location || 'N/A'})`;
            btn.addEventListener('click', () => {
                selectCustomOption('adminProxyScooterWrapper', 'adminProxyScooterId', btn.dataset.value, btn.textContent);
            });
            scooterDropdown.appendChild(btn);
        });

    packageDropdown.innerHTML = '';
    packages.forEach(pkg => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'custom-select-option';
        btn.dataset.value = String(pkg.id);
        btn.textContent = `${pkg.id} - ${pkg.packageType || 'Package'} ($${Number(pkg.price || 0).toFixed(2)})`;
        btn.addEventListener('click', () => {
            selectCustomOption('adminProxyPackageWrapper', 'adminProxyPackageId', btn.dataset.value, btn.textContent);
        });
        packageDropdown.appendChild(btn);
    });
}

// Init admin proxy custom selects
initCustomSelect('adminProxyScooterWrapper', 'adminProxyScooterTrigger', 'adminProxyScooterId');
initCustomSelect('adminProxyPackageWrapper', 'adminProxyPackageTrigger', 'adminProxyPackageId');

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
            const response = await apiFetch('/api/bookings/admin/place', {
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
            // Reset custom select UIs
            const scooterPh = document.querySelector('#adminProxyScooterWrapper .custom-select-placeholder');
            if (scooterPh) { scooterPh.textContent = 'Select available scooter'; scooterPh.classList.remove('is-selected'); }
            const pkgPh = document.querySelector('#adminProxyPackageWrapper .custom-select-placeholder');
            if (pkgPh) { pkgPh.textContent = 'Select package'; pkgPh.classList.remove('is-selected'); }
            await loadScooters();
            updateScooterPageStats();
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
                const response = await apiFetch(`/api/packages/update/${update.id}?price=${encodeURIComponent(update.price)}`, {
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

