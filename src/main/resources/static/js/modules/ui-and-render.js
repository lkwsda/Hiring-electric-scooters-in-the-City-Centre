// Sections
const sections = ['authSection', 'homeSection', 'scootersSection', 'rentSection', 'paymentSection', 'successSection', 'myBookingsSection', 'feedbackSection', 'analyticsSection', 'scooterDetailSection', 'returnSection', 'adminLoginSection', 'adminConfigSection', 'adminStatsSection'];
let activeAdminPanelId = 'adminPanelOverview';
let homeSpotlightTimer = null;
let homeSpotlightIndex = 0;
let homeSpotlightPrevIndex = 0;

function setupHomeSpotlightCarousel() {
    const root = document.getElementById('homeSpotlight');
    if (!root) return;

    const tabs = Array.from(root.querySelectorAll('.spotlight-tab'));
    const panels = Array.from(root.querySelectorAll('.home-spotlight-panel'));
    if (!tabs.length || !panels.length) return;

    const activatePanel = index => {
        const safeIndex = ((index % panels.length) + panels.length) % panels.length;
        const direction = safeIndex >= homeSpotlightIndex ? 'forward' : 'backward';
        panels.forEach((panel, i) => {
            panel.classList.toggle('is-active', i === safeIndex);
            panel.classList.remove('slide-forward', 'slide-backward');
            if (i === safeIndex) {
                panel.classList.add(direction === 'forward' ? 'slide-forward' : 'slide-backward');
            }
        });
        tabs.forEach((tab, i) => {
            const isActive = i === safeIndex;
            tab.classList.toggle('is-active', isActive);
            tab.setAttribute('aria-selected', isActive ? 'true' : 'false');
        });
        homeSpotlightPrevIndex = homeSpotlightIndex;
        homeSpotlightIndex = safeIndex;
    };

    const startTimer = () => {
        if (homeSpotlightTimer) clearInterval(homeSpotlightTimer);
        homeSpotlightTimer = setInterval(() => {
            activatePanel(homeSpotlightIndex + 1);
        }, 3500);
    };

    if (root.dataset.boundSpotlight !== 'true') {
        tabs.forEach((tab, index) => {
            tab.addEventListener('click', () => {
                activatePanel(index);
                startTimer();
            });
        });

        root.addEventListener('mouseenter', () => {
            if (homeSpotlightTimer) {
                clearInterval(homeSpotlightTimer);
                homeSpotlightTimer = null;
            }
        });

        root.addEventListener('mouseleave', () => {
            startTimer();
        });

        root.dataset.boundSpotlight = 'true';
    }

    activatePanel(homeSpotlightIndex);
    startTimer();
}

function measurePanelNaturalHeight(panel) {
    if (!panel) return 0;
    const wasActive = panel.classList.contains('is-active');
    let measured = 0;
    if (wasActive) {
        measured = panel.scrollHeight || panel.offsetHeight || 0;
        return measured;
    }

    panel.classList.add('is-active');
    panel.style.visibility = 'hidden';
    panel.style.position = 'absolute';
    panel.style.left = '-9999px';
    panel.style.top = '0';
    panel.style.pointerEvents = 'none';
    panel.style.display = 'block';

    measured = panel.scrollHeight || panel.offsetHeight || 0;

    panel.style.visibility = '';
    panel.style.position = '';
    panel.style.left = '';
    panel.style.top = '';
    panel.style.pointerEvents = '';
    panel.style.display = '';
    panel.classList.remove('is-active');
    return measured;
}

function syncAdminPanelFixedHeight() {
    const adminSection = document.getElementById('adminConfigSection');
    const pricingPanel = document.getElementById('adminPanelPricing');
    if (!adminSection || !pricingPanel) return;

    const measuredHeight = measurePanelNaturalHeight(pricingPanel);
    const fixedHeight = Math.max(520, measuredHeight + 8);
    adminSection.style.setProperty('--admin-fixed-panel-height', `${fixedHeight}px`);
}

function renderAdminOverview() {
    const available = scooters.filter(item => normalizeScooterStatus(item.status) === 'available').length;
    const maintenance = scooters.filter(item => normalizeScooterStatus(item.status) === 'maintenance').length;
    const openIssues = issues.filter(item => String(item.status || 'pending').toLowerCase() !== 'resolved').length;
    const highIssues = issues.filter(item => String(item.priority || '').toLowerCase() === 'high').length;
    const totalScooters = Math.max(1, scooters.length);

    const availableNode = document.getElementById('adminKpiAvailable');
    const maintenanceNode = document.getElementById('adminKpiMaintenance');
    const openIssueNode = document.getElementById('adminKpiIssues');
    const highIssueNode = document.getElementById('adminKpiHigh');
    const availabilityMeter = document.getElementById('adminMeterAvailability');
    const availabilityText = document.getElementById('adminMeterAvailabilityText');
    const issueMeter = document.getElementById('adminMeterIssue');
    const issueText = document.getElementById('adminMeterIssueText');
    const feedSync = document.getElementById('adminFeedSync');
    const feedIssue = document.getElementById('adminFeedIssue');
    const feedFleet = document.getElementById('adminFeedFleet');

    const availabilityRate = Math.min(100, Math.round((available / totalScooters) * 100));
    const issueRate = Math.min(100, Math.round((openIssues / totalScooters) * 100));

    if (availableNode) availableNode.textContent = String(available);
    if (maintenanceNode) maintenanceNode.textContent = String(maintenance);
    if (openIssueNode) openIssueNode.textContent = String(openIssues);
    if (highIssueNode) highIssueNode.textContent = String(highIssues);
    if (availabilityMeter) availabilityMeter.style.width = `${availabilityRate}%`;
    if (availabilityText) availabilityText.textContent = `${availabilityRate}%`;
    if (issueMeter) issueMeter.style.width = `${issueRate}%`;
    if (issueText) issueText.textContent = `${issueRate}%`;
    if (feedSync) feedSync.textContent = `Last refresh ${new Date().toLocaleTimeString()}`;
    if (feedIssue) feedIssue.textContent = `${openIssues} items pending (${highIssues} high)`;
    if (feedFleet) feedFleet.textContent = `${available} available / ${maintenance} maintenance`;
}

function showAdminPanel(panelId) {
    const fallbackPanel = 'adminPanelOverview';
    const targetPanelId = panelId || activeAdminPanelId || fallbackPanel;
    const panels = Array.from(document.querySelectorAll('#adminConfigSection .admin-panel'));
    const sidebarButtons = Array.from(document.querySelectorAll('#adminConfigSection .admin-sidebar-btn'));
    const targetPanel = document.getElementById(targetPanelId);
    if (!panels.length || !targetPanel) return;

    panels.forEach(panel => {
        panel.classList.remove('is-active');
    });
    targetPanel.classList.add('is-active');

    sidebarButtons.forEach(button => {
        button.classList.toggle('is-active', button.dataset.adminPanel === targetPanelId);
    });

    activeAdminPanelId = targetPanelId;
    syncAdminPanelFixedHeight();

    if (targetPanelId === 'adminPanelUsers') {
        renderAdminUsers();
    } else if (targetPanelId === 'adminPanelAnalytics') {
        renderRevenueCharts();
    } else if (targetPanelId === 'adminPanelIssues') {
        renderAdminIssueReviewList();
            } else if (targetPanelId === 'adminPanelOverview') {
        renderAdminOverview();
    }
}

function showSection(sectionId) {
    let pendingAdminPanel = '';
    if (sectionId === 'authSection' && (currentUser || adminLoggedIn)) {
        sectionId = 'homeSection';
    }
    if (sectionId === 'analyticsSection' && adminLoggedIn) {
        sectionId = 'adminConfigSection';
        pendingAdminPanel = 'adminPanelAnalytics';
    }
    sections.forEach(id => {
        const sectionElement = document.getElementById(id);
        if (sectionElement) {
            sectionElement.style.display = id === sectionId ? 'block' : 'none';
        }
    });
    if (sectionId === 'homeSection') {
        setupHomeSpotlightCarousel();
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
        // Analytics module has been moved into admin dashboard.
    } else if (sectionId === 'adminConfigSection') {
        renderAdminUsers();
        renderAdminOverview();
        syncAdminPanelFixedHeight();
        showAdminPanel(pendingAdminPanel || activeAdminPanelId);
    } else if (sectionId === 'adminStatsSection') {
        renderAdminIssueReviewList();
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
    const spentNode = document.getElementById('totalSpent');
    if (activeNode) activeNode.textContent = String(activeCount);
    if (totalNode) totalNode.textContent = String(totalCount);
    if (spentNode) spentNode.textContent = formatCurrency(totalSpent);
}

// Render scooters
const SCOOTERS_PER_PAGE = 6;
let scooterCurrentPage = 1;

function renderScooters() {
    const grid = document.getElementById('scooterGrid');
    if (!grid) return;
    grid.innerHTML = '';

    const totalPages = Math.max(1, Math.ceil(scooters.length / SCOOTERS_PER_PAGE));
    if (scooterCurrentPage > totalPages) scooterCurrentPage = totalPages;
    const start = (scooterCurrentPage - 1) * SCOOTERS_PER_PAGE;
    const pageScooters = scooters.slice(start, start + SCOOTERS_PER_PAGE);

    pageScooters.forEach(scooter => {
        const card = document.createElement('div');
        const isAvailable = scooter.status === 'available';
        card.className = `scooter-card ${isAvailable ? '' : 'scooter-card-unavailable'}`;

        const batteryClass = scooter.battery < 15 ? 'battery-low' : scooter.battery < 30 ? 'battery-medium' : 'battery-good';
        const batteryText = `<span class="battery-level battery-text ${batteryClass}">Battery: ${scooter.battery}%</span>`;
        const statusClass = isAvailable ? 'status-available' : scooter.status === 'maintenance' ? 'status-maintenance' : 'status-rented';
        const statusText = isAvailable ? 'Available' : scooter.status === 'maintenance' ? 'Maintenance' : 'Rented';
        const rentDisabled = isAvailable ? '' : 'disabled';
        const rentButtonClass = isAvailable ? 'rent-btn' : 'rent-btn disabled';
        const scooterImage = scooter.image || DEFAULT_SCOOTER_IMAGE;

        card.innerHTML = `
            <div class="scooter-media">
                <img src="${scooterImage}" alt="${scooter.model}" onerror="this.onerror=null;this.src='${DEFAULT_SCOOTER_IMAGE}';" />
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

    renderScooterPagination();
}

function goToScooterPage(page) {
    const totalPages = Math.max(1, Math.ceil(scooters.length / SCOOTERS_PER_PAGE));
    scooterCurrentPage = Math.max(1, Math.min(page, totalPages));
    renderScooters();
}

function renderScooterPagination() {
    const container = document.getElementById('scooterPagination');
    if (!container) return;
    const totalPages = Math.max(1, Math.ceil(scooters.length / SCOOTERS_PER_PAGE));
    if (totalPages <= 1) {
        container.innerHTML = '';
        return;
    }
    let html = `<span class="page-info">Page ${scooterCurrentPage} of ${totalPages}</span>`;
    html += `<button onclick="goToScooterPage(${scooterCurrentPage - 1})" ${scooterCurrentPage === 1 ? 'disabled' : ''}>&laquo; Prev</button>`;
    for (let p = 1; p <= totalPages; p++) {
        html += `<button onclick="goToScooterPage(${p})" class="${p === scooterCurrentPage ? 'page-active' : ''}">${p}</button>`;
    }
    html += `<button onclick="goToScooterPage(${scooterCurrentPage + 1})" ${scooterCurrentPage === totalPages ? 'disabled' : ''}>Next &raquo;</button>`;
    container.innerHTML = html;
}

// Render bookings
const BOOKINGS_PER_PAGE = 5;
let bookingsCurrentPage = 1;

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
        const response = await apiFetch(`/api/bookings/user/${userId}`);
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(getTextError(errorText, 'Failed to load bookings'));
        }
        const userBookings = await response.json();
        bookings = userBookings;
        updateBookingSummary(userBookings);
        userBookings.sort((a, b) => new Date(b.startTime) - new Date(a.startTime));
        renderBookingsPage(userBookings, list);
    } catch (error) {
        console.error('Failed to load bookings:', error);
        list.innerHTML = '<p>Failed to load bookings.</p>';
        updateBookingSummary([]);
    }
}

function renderBookingsPage(userBookings, list) {
    list.innerHTML = '';
    const totalPages = Math.max(1, Math.ceil(userBookings.length / BOOKINGS_PER_PAGE));
    if (bookingsCurrentPage > totalPages) bookingsCurrentPage = totalPages;
    const start = (bookingsCurrentPage - 1) * BOOKINGS_PER_PAGE;
    const pageItems = userBookings.slice(start, start + BOOKINGS_PER_PAGE);

    pageItems.forEach(booking => {
        const item = document.createElement('div');
        item.className = 'booking-item';
        const startTime = new Date(booking.startTime).toLocaleString();
        const status = String(booking.status || 'unknown');
        const statusLower = status.toLowerCase();
        const endTime = booking.endTime
            ? new Date(booking.endTime).toLocaleString()
            : (statusLower === 'canceled' || statusLower === 'cancelled')
                ? '<span class="booking-status-badge badge-canceled">Canceled</span>'
                : '<span class="booking-status-badge badge-active">Ongoing</span>';
        const cost = booking.totalCost != null ? `$${Number(booking.totalCost).toFixed(2)}` : '--';
        let statusBadgeClass = 'badge-pending';
        if (statusLower === 'paid') statusBadgeClass = 'badge-active';
        else if (statusLower === 'finished' || statusLower === 'completed') statusBadgeClass = 'badge-done';
        else if (statusLower === 'canceled' || statusLower === 'cancelled') statusBadgeClass = 'badge-canceled';

        let buttonHtml = '';
        if (statusLower === 'paid') {
            buttonHtml = `
                <button onclick="extendRental(${booking.id})" class="extend-rental-btn"><i class="fa-solid fa-clock"></i> Extend</button>
                <button onclick="endRental(${booking.id})" class="end-rental-btn"><i class="fa-solid fa-stop-circle"></i> End Rental</button>
            `;
        } else {
            const canCancel = ['pending', 'unpaid', 'placed', 'booked', 'created'].includes(statusLower);
            if (canCancel) {
                buttonHtml = `<button onclick="cancelBooking(${booking.id})" class="cancel-booking-btn"><i class="fa-solid fa-xmark"></i> Cancel</button>`;
            }
        }

        item.innerHTML = `
            <div class="booking-card-header">
                <div class="booking-scooter-info">
                    <i class="fa-solid fa-scooter"></i>
                    <span class="booking-scooter-id">Scooter #${booking.scooterId}</span>
                </div>
                <span class="booking-status-badge ${statusBadgeClass}">${status}</span>
            </div>
            <div class="booking-card-body">
                <div class="booking-time-row">
                    <div class="booking-time-item">
                        <i class="fa-solid fa-play"></i>
                        <div><span class="booking-time-label">Start</span><span>${startTime}</span></div>
                    </div>
                    <div class="booking-time-item">
                        <i class="fa-solid fa-flag-checkered"></i>
                        <div><span class="booking-time-label">End</span>${endTime}</div>
                    </div>
                </div>
                <div class="booking-cost-row">
                    <i class="fa-solid fa-coins"></i>
                    <span class="booking-cost-value">${cost}</span>
                </div>
            </div>
            ${buttonHtml ? `<div class="booking-card-actions">${buttonHtml}</div>` : ''}
        `;
        list.appendChild(item);
    });

    // Pagination controls
    if (totalPages > 1) {
        const pager = document.createElement('div');
        pager.className = 'booking-pagination';
        let pageButtons = '';
        for (let p = 1; p <= totalPages; p++) {
            pageButtons += `<button onclick="changeBookingsPage(${p - bookingsCurrentPage})" class="${p === bookingsCurrentPage ? 'page-active' : ''}">${p}</button>`;
        }
        pager.innerHTML = `
            <span class="page-info">Page ${bookingsCurrentPage} of ${totalPages}</span>
            <button onclick="changeBookingsPage(-1)" ${bookingsCurrentPage <= 1 ? 'disabled' : ''}>&laquo; Prev</button>
            ${pageButtons}
            <button onclick="changeBookingsPage(1)" ${bookingsCurrentPage >= totalPages ? 'disabled' : ''}>Next &raquo;</button>
        `;
        list.appendChild(pager);
    }
}

function changeBookingsPage(delta) {
    const totalPages = Math.max(1, Math.ceil(bookings.length / BOOKINGS_PER_PAGE));
    bookingsCurrentPage = Math.max(1, Math.min(totalPages, bookingsCurrentPage + delta));
    const list = document.getElementById('bookingList');
    if (list) renderBookingsPage(bookings, list);
}

let pendingDiscountRate = 0;

async function getAutoDiscountRate() {
    if (!currentUser || !currentUser.id) return 0;
    try {
        const response = await apiFetch(`/api/users/${currentUser.id}/discount-rate`);
        if (!response.ok) return 0;
        const data = await response.json();
        pendingDiscountRate = data.rate || 0;
        return pendingDiscountRate;
    } catch (e) {
        console.warn('Failed to fetch discount rate:', e);
        return 0;
    }
}

async function updatePaymentBreakdown(packagePrice) {
    const rentalCostNode = document.getElementById('rentalCost');
    const totalAmountNode = document.getElementById('totalAmount');
    const discountRow = document.getElementById('discountRow');
    const discountLabel = document.getElementById('discountLabel');
    const discountAmountNode = document.getElementById('discountAmount');
    const rentalCost = Number(packagePrice || 0);
    const discountRate = await getAutoDiscountRate();
    const discountAmt = rentalCost * discountRate;
    const totalAmount = rentalCost - discountAmt + serviceFee;
    if (rentalCostNode) rentalCostNode.textContent = formatCurrency(rentalCost);
    if (discountRow) {
        if (discountRate > 0) {
            discountRow.style.display = '';
            if (discountLabel) discountLabel.textContent = `Discount (${(discountRate * 100).toFixed(0)}%)`;
            if (discountAmountNode) discountAmountNode.textContent = `-${formatCurrency(discountAmt)}`;
        } else {
            discountRow.style.display = 'none';
        }
    }
    if (totalAmountNode) totalAmountNode.textContent = formatCurrency(totalAmount);
}

function refreshSavedCardOptions() {
    const select = document.getElementById('savedCardSelect');
    const useSavedBtn = document.getElementById('useSavedCardBtn');
    if (!select) return;
    select.innerHTML = '';

    const userCard = getSavedUserCard();
    const hasSavedCard = !!userCard;

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

    if (useSavedBtn) {
        useSavedBtn.disabled = !hasSavedCard;
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
    const notice = document.getElementById('paymentEmailNotice');
    if (notice) {
        notice.innerHTML = `
            <div class="issue-item issue-high">
                <p><strong>Payment Notification:</strong> email confirmation simulated.</p>
                <p><strong>Booking ID:</strong> ${bookingId}</p>
                <p><strong>Recipient:</strong> ${username}</p>
                <p><strong>Time:</strong> ${new Date().toLocaleString()}</p>
            </div>
        `;
    }
    announce(emailText);
    console.log(emailText);
}

// Render stats
async function renderStats() {
    const table = document.getElementById('statsTable');
    table.innerHTML = '';
    try {
        const response = await apiFetch('/api/bookings/admin/revenue');
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
    const html = high.length
        ? high.slice(0, 8).map(issue => {
            return `<div class="issue-item issue-high">
                <p><strong>ID:</strong> #${issue.id || 'N/A'} | <strong>Scooter:</strong> ${issue.scooterId}</p>
                <p><strong>Priority:</strong> ${issue.priority}</p>
                <p>${issue.description}</p>
            </div>`;
        }).join('')
        : '<p>No high priority issues yet.</p>';

    container.innerHTML = html;
}

const ISSUE_HISTORY_PER_PAGE = 5;
let issueHistoryPage = 1;

function renderIssueHistory() {
    const list = document.getElementById('issueHistoryList');
    const pager = document.getElementById('issueHistoryPagination');
    if (!list) return;

    if (!issues.length) {
        list.innerHTML = '<p>No submissions yet.</p>';
        if (pager) pager.innerHTML = '';
        return;
    }

    const sorted = [...issues].sort((a, b) => {
        const idA = Number(a.id || 0);
        const idB = Number(b.id || 0);
        return idB - idA;
    });

    const totalPages = Math.max(1, Math.ceil(sorted.length / ISSUE_HISTORY_PER_PAGE));
    if (issueHistoryPage > totalPages) issueHistoryPage = totalPages;
    const start = (issueHistoryPage - 1) * ISSUE_HISTORY_PER_PAGE;
    const pageItems = sorted.slice(start, start + ISSUE_HISTORY_PER_PAGE);

    list.innerHTML = pageItems.map(issue => {
        const priorityBadge = issue.priority
            ? `<span class="booking-status-badge ${issue.priority.toLowerCase() === 'high' ? 'badge-canceled' : issue.priority.toLowerCase() === 'medium' ? 'badge-pending' : 'badge-done'}">${issue.priority}</span>`
            : '';
        return `<div class="issue-item">
            <div class="issue-history-header">
                <span><strong>#${issue.id || 'N/A'}</strong> — Scooter ${issue.scooterId}</span>
                ${priorityBadge}
            </div>
            <p class="issue-history-desc">${issue.description || 'No description.'}</p>
        </div>`;
    }).join('');

    if (pager) {
        if (totalPages > 1) {
            let btns = '';
            for (let p = 1; p <= totalPages; p++) {
                btns += `<button onclick="goIssueHistoryPage(${p})" class="${p === issueHistoryPage ? 'page-active' : ''}">${p}</button>`;
            }
            pager.innerHTML = `
                <button onclick="goIssueHistoryPage(${issueHistoryPage - 1})" ${issueHistoryPage <= 1 ? 'disabled' : ''}>&laquo; Prev</button>
                ${btns}
                <button onclick="goIssueHistoryPage(${issueHistoryPage + 1})" ${issueHistoryPage >= totalPages ? 'disabled' : ''}>Next &raquo;</button>
            `;
        } else {
            pager.innerHTML = '';
        }
    }
}

function goIssueHistoryPage(page) {
    const totalPages = Math.max(1, Math.ceil(issues.length / ISSUE_HISTORY_PER_PAGE));
    issueHistoryPage = Math.max(1, Math.min(totalPages, page));
    renderIssueHistory();
}

const ISSUE_REVIEW_PER_PAGE = 5;
let issueReviewPage = 1;

function renderAdminIssueReviewList() {
    const container = document.getElementById('adminIssueReviewList');
    const pager = document.getElementById('issueReviewPagination');
    if (!container) return;

    if (!issues.length) {
        container.innerHTML = '<p>No issues to review.</p>';
        if (pager) pager.innerHTML = '';
        return;
    }

    const sorted = [...issues].sort((a, b) => Number(b.id || 0) - Number(a.id || 0));
    const totalPages = Math.max(1, Math.ceil(sorted.length / ISSUE_REVIEW_PER_PAGE));
    if (issueReviewPage > totalPages) issueReviewPage = totalPages;
    const start = (issueReviewPage - 1) * ISSUE_REVIEW_PER_PAGE;
    const pageItems = sorted.slice(start, start + ISSUE_REVIEW_PER_PAGE);

    container.innerHTML = pageItems.map(issue => {
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

    if (pager) {
        if (totalPages > 1) {
            let btns = '';
            for (let p = 1; p <= totalPages; p++) {
                btns += `<button onclick="goIssueReviewPage(${p})" class="${p === issueReviewPage ? 'page-active' : ''}">${p}</button>`;
            }
            pager.innerHTML = `
                <button onclick="goIssueReviewPage(${issueReviewPage - 1})" ${issueReviewPage <= 1 ? 'disabled' : ''}>&laquo; Prev</button>
                ${btns}
                <button onclick="goIssueReviewPage(${issueReviewPage + 1})" ${issueReviewPage >= totalPages ? 'disabled' : ''}>Next &raquo;</button>
            `;
        } else {
            pager.innerHTML = '';
        }
    }
}

function goIssueReviewPage(page) {
    const totalPages = Math.max(1, Math.ceil(issues.length / ISSUE_REVIEW_PER_PAGE));
    issueReviewPage = Math.max(1, Math.min(totalPages, page));
    renderAdminIssueReviewList();
}

async function setIssuePriority(issueId, priority) {
    if (!issueId || !priority) return;
    try {
        const response = await apiFetch(`/api/issues/${issueId}/priority?priority=${encodeURIComponent(priority)}`, {
            method: 'PUT'
        });
        const text = await response.text();
        if (!response.ok) {
            throw new Error(getTextError(text, 'Failed to update priority.'));
        }
        announce(`Issue ${issueId} priority set to ${priority}.`);
        await loadIssues();
        renderAdminIssueReviewList();
                renderHighPriorityIssues();
    } catch (error) {
        console.error('Set priority error:', error);
        alert(error.message || 'Failed to update priority.');
    }
}

async function loadIssues() {
    try {
        const response = await apiFetch('/api/issues');
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(getTextError(errorText, 'Failed to load issues'));
        }
        const data = await response.json();
        issues = Array.isArray(data) ? data : [];
        renderIssueHistory();
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
        ctx.fillStyle = '#94a3b8';
        ctx.font = '600 14px "Segoe UI", system-ui, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('No data available.', w / 2, h / 2);
        return;
    }

    const max = Math.max(...values, 1);
    const top = 38;
    const bottom = h - 40;
    const left = 60;
    const right = w - 24;
    const chartH = bottom - top;
    const chartW = right - left;

    // Grid lines — subtle
    const gridLines = 5;
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.05)';
    ctx.lineWidth = 1;
    for (let g = 0; g <= gridLines; g++) {
        const gy = top + (chartH / gridLines) * g;
        ctx.beginPath();
        ctx.setLineDash(g === 0 ? [] : [3, 5]);
        ctx.moveTo(left, gy);
        ctx.lineTo(right, gy);
        ctx.stroke();
    }
    ctx.setLineDash([]);

    // Y-axis label
    ctx.save();
    ctx.fillStyle = '#94a3b8';
    ctx.font = '500 11px "Segoe UI", system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.translate(12, top + chartH / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText('Revenue ($)', 0, 0);
    ctx.restore();

    // Bar layout
    const barCount = labels.length;
    const maxBarWidth = 72;
    const minBarWidth = 44;
    const barWidth = Math.max(minBarWidth, Math.min(maxBarWidth, Math.floor((chartW - (barCount - 1) * 20) / barCount)));
    const totalBarW = barWidth * barCount;
    const spacing = barCount > 1 ? (chartW - totalBarW) / (barCount - 1) : 0;
    const startX = left + (chartW - (totalBarW + spacing * (barCount - 1))) / 2;

    // Find peak and trough
    let peakIdx = 0, troughIdx = 0;
    for (let i = 1; i < values.length; i++) {
        if (values[i] > values[peakIdx]) peakIdx = i;
        if (values[i] < values[troughIdx]) troughIdx = i;
    }

    // Blue gradient palette — one per bar
    const barGradients = [
        ['#93c5fd', '#60a5fa'],
        ['#60a5fa', '#42A5F5'],
        ['#42A5F5', '#1E88E5'],
        ['#1E88E5', '#1976D2']
    ];

    labels.forEach((label, i) => {
        const x = barCount === 1 ? left + (chartW - barWidth) / 2 : startX + i * (barWidth + spacing);
        const barH = Math.max(2, (values[i] / max) * chartH);
        const y = bottom - barH;
        const radius = Math.min(4, barWidth / 6);
        const isPeak = i === peakIdx && values[i] > 0;
        const isTrough = i === troughIdx && values[i] < values[peakIdx];

        // Bar gradient — brand blue family
        const [topColor, bottomColor] = barGradients[i % barGradients.length];
        const grad = ctx.createLinearGradient(x, y, x, bottom);
        grad.addColorStop(0, topColor);
        grad.addColorStop(1, bottomColor);
        ctx.fillStyle = grad;
        roundRect(ctx, x, y, barWidth, barH, radius, true, false);

        // Subtle peak highlight
        if (isPeak) {
            ctx.fillStyle = 'rgba(66, 165, 245, 0.14)';
            roundRect(ctx, x, y, barWidth, barH, radius, true, false);
        }

        // Value label
        ctx.fillStyle = isPeak ? '#1976D2' : '#475569';
        ctx.font = isPeak
            ? 'bold 12px "Segoe UI", system-ui, sans-serif'
            : '600 11px "Segoe UI", system-ui, sans-serif';
        ctx.textAlign = 'center';
        const displayVal = values[i] === 0 ? '$0' : '$' + values[i];
        ctx.fillText(displayVal, x + barWidth / 2, y - 10);

        // X-axis label
        ctx.fillStyle = '#94a3b8';
        ctx.font = '500 10px "Segoe UI", system-ui, sans-serif';
        ctx.fillText(label, x + barWidth / 2, bottom + 16);
    });
}

function roundRect(ctx, x, y, w, h, r, fill, stroke) {
    const radius = Math.min(r, h / 2, w / 2);
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + w - radius, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + radius);
    ctx.lineTo(x + w, y + h);
    ctx.lineTo(x, y + h);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
    if (fill) ctx.fill();
    if (stroke) ctx.stroke();
}

function drawLineChart(canvasId, labels, values) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);

    if (!labels.length) {
        ctx.fillStyle = '#94a3b8';
        ctx.font = '600 14px "Segoe UI", system-ui, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('No data available.', w / 2, h / 2);
        return;
    }

    const max = Math.max(...values, 1);
    const top = 38;
    const bottom = h - 40;
    const left = 60;
    const right = w - 24;
    const chartH = bottom - top;
    const chartW = right - left;
    const stepX = labels.length > 1 ? chartW / (labels.length - 1) : 0;

    // Grid lines — subtle
    const gridLines = 5;
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.05)';
    ctx.lineWidth = 1;
    for (let g = 0; g <= gridLines; g++) {
        const gy = top + (chartH / gridLines) * g;
        ctx.beginPath();
        ctx.setLineDash(g === 0 ? [] : [3, 5]);
        ctx.moveTo(left, gy);
        ctx.lineTo(right, gy);
        ctx.stroke();
    }
    ctx.setLineDash([]);

    // Y-axis label
    ctx.save();
    ctx.fillStyle = '#94a3b8';
    ctx.font = '500 11px "Segoe UI", system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.translate(12, top + chartH / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText('Daily Revenue ($)', 0, 0);
    ctx.restore();

    // Data points
    const points = values.map((value, i) => ({
        x: left + i * stepX,
        y: bottom - ((value / max) * chartH),
        value
    }));

    // Subtle gradient fill under the line
    const areaGrad = ctx.createLinearGradient(0, top, 0, bottom);
    areaGrad.addColorStop(0, 'rgba(66, 165, 245, 0.10)');
    areaGrad.addColorStop(0.6, 'rgba(66, 165, 245, 0.03)');
    areaGrad.addColorStop(1, 'rgba(66, 165, 245, 0.00)');
    ctx.fillStyle = areaGrad;
    ctx.beginPath();
    points.forEach((p, i) => {
        if (i === 0) ctx.moveTo(p.x, p.y);
        else ctx.lineTo(p.x, p.y);
    });
    ctx.lineTo(points[points.length - 1].x, bottom);
    ctx.lineTo(points[0].x, bottom);
    ctx.closePath();
    ctx.fill();

    // Smooth line — soft blue
    ctx.strokeStyle = '#60a5fa';
    ctx.lineWidth = 2;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.beginPath();
    points.forEach((p, i) => {
        if (i === 0) ctx.moveTo(p.x, p.y);
        else {
            const prev = points[i - 1];
            const cpx = (prev.x + p.x) / 2;
            ctx.bezierCurveTo(cpx, prev.y, cpx, p.y, p.x, p.y);
        }
    });
    ctx.stroke();

    // Find peak
    let peakIndex = 0;
    for (let i = 1; i < points.length; i++) {
        if (points[i].value > points[peakIndex].value) peakIndex = i;
    }
    const hasPeak = points[peakIndex].value > 0;

    // Data dots — minimal, only visible points
    points.forEach((p, i) => {
        const isPeak = i === peakIndex && hasPeak;

        // Dot fill
        ctx.fillStyle = isPeak ? '#42A5F5' : '#fff';
        ctx.beginPath();
        ctx.arc(p.x, p.y, isPeak ? 5 : 3.5, 0, Math.PI * 2);
        ctx.fill();

        // Dot border
        ctx.strokeStyle = isPeak ? '#42A5F5' : '#93c5fd';
        ctx.lineWidth = isPeak ? 2 : 1.5;
        ctx.stroke();

        // Peak annotation line
        if (isPeak && points.length > 1) {
            ctx.strokeStyle = 'rgba(66, 165, 245, 0.18)';
            ctx.lineWidth = 1;
            ctx.setLineDash([2, 3]);
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p.x, top);
            ctx.stroke();
            ctx.setLineDash([]);
        }

        // Value label — only peak + first + last
        const isFirstOrLast = i === 0 || i === points.length - 1;
        if (isPeak || (isFirstOrLast && points.length <= 7) || (isFirstOrLast && points.length > 7 && p.value > 0)) {
            ctx.fillStyle = isPeak ? '#1976D2' : '#334155';
            ctx.font = isPeak ? 'bold 12px "Segoe UI", system-ui, sans-serif' : '600 11px "Segoe UI", system-ui, sans-serif';
            ctx.textAlign = 'center';
            const displayVal = p.value === 0 ? '$0' : '$' + p.value;
            const labelY = isPeak ? p.y - 18 : p.y - 14;
            ctx.fillText(displayVal, p.x, labelY);
        }

        // Date label
        ctx.fillStyle = '#94a3b8';
        ctx.font = '500 10px "Segoe UI", system-ui, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(labels[i], p.x, bottom + 16);
    });
}

async function renderRevenueCharts() {
    try {
        const [weeklyRes, dailyRes] = await Promise.all([
            apiFetch('/api/bookings/admin/revenue'),
            apiFetch('/api/bookings/admin/revenue/daily')
        ]);

        const weekly = weeklyRes.ok ? await weeklyRes.json() : [];
        const daily = dailyRes.ok ? await dailyRes.json() : [];

        const weeklyLabels = (Array.isArray(weekly) ? weekly : []).map(item => item.packageType || 'N/A');
        const weeklyValues = (Array.isArray(weekly) ? weekly : []).map(item => Number(item.totalRevenue || 0));

        // Ensure all four package types appear, even with 0 revenue
        const typeOrder = ['1h', '4h', '1d', '1w'];
        const weeklyMap = {};
        weeklyLabels.forEach((label, i) => {
            const norm = normalizePackageTypeText(label);
            const key = typeOrder.find(t => norm === t || (t === '1h' && norm === '1hour') || (t === '4h' && norm === '4hours') || (t === '1d' && norm === '1day') || (t === '1w' && norm === '1week'));
            if (key) {
                weeklyMap[key] = (weeklyMap[key] || 0) + weeklyValues[i];
            }
        });
        const filledLabels = typeOrder;
        const filledValues = typeOrder.map(t => weeklyMap[t] || 0);

        const dailyLabels = (Array.isArray(daily) ? daily : []).map(item => item.date || 'N/A');
        const dailyValues = (Array.isArray(daily) ? daily : []).map(item => Number(item.dailyTotal || 0));

        const weeklyTotal = filledValues.reduce((sum, value) => sum + value, 0);
        const dailyAvg = dailyValues.length ? (dailyValues.reduce((sum, value) => sum + value, 0) / dailyValues.length) : 0;
        const maxWeeklyValue = Math.max(...filledValues);
        const bestPackage = maxWeeklyValue > 0 ? filledLabels[filledValues.indexOf(maxWeeklyValue)] : 'N/A';

        const weeklyTotalNode = document.getElementById('adminRevenueWeeklyTotal');
        const dailyAvgNode = document.getElementById('adminRevenueDailyAvg');
        const bestPackageNode = document.getElementById('adminRevenueBestPackage');
        if (weeklyTotalNode) weeklyTotalNode.textContent = `$${weeklyTotal.toFixed(2)}`;
        if (dailyAvgNode) dailyAvgNode.textContent = `$${dailyAvg.toFixed(2)}`;
        if (bestPackageNode) bestPackageNode.textContent = bestPackage;

        drawBarChart('weeklyRevenueChart', filledLabels, filledValues);
        drawLineChart('dailyRevenueChart', dailyLabels.reverse(), dailyValues.reverse());
    } catch (error) {
        console.error('Chart render error:', error);
        const weeklyTotalNode = document.getElementById('adminRevenueWeeklyTotal');
        const dailyAvgNode = document.getElementById('adminRevenueDailyAvg');
        const bestPackageNode = document.getElementById('adminRevenueBestPackage');
        if (weeklyTotalNode) weeklyTotalNode.textContent = '$0.00';
        if (dailyAvgNode) dailyAvgNode.textContent = '$0.00';
        if (bestPackageNode) bestPackageNode.textContent = 'N/A';
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
        output.classList.add('is-ready');
        output.innerHTML = `
            <div class="discount-row">
                <span>Base Price</span>
                <strong>$${basePrice.toFixed(2)}</strong>
            </div>
            <div class="discount-row">
                <span>Discount (${(rate * 100).toFixed(0)}%)</span>
                <strong>-$${discountAmount.toFixed(2)}</strong>
            </div>
            <div class="discount-row total">
                <span>Final Price</span>
                <strong>$${finalPrice.toFixed(2)}</strong>
            </div>
        `;
        announce('Discount calculated successfully.');
    });
}

function setupAccessibilityTools() {
    const root = document.documentElement;
    const increaseBtn = document.getElementById('fontIncreaseBtn');
    const decreaseBtn = document.getElementById('fontDecreaseBtn');
    const contrastBtn = document.getElementById('highContrastBtn');

    // MAX_FONT_SCALE: 1.10 keeps the navigation bar in one line without wrapping
    const MAX_FONT_SCALE = 1.10;
    const MIN_FONT_SCALE = 0.90;

    let fontScale = Number(localStorage.getItem('fontScale') || 1);
    const applyScale = () => {
        fontScale = Math.max(MIN_FONT_SCALE, Math.min(MAX_FONT_SCALE, fontScale));
        root.style.fontSize = `${fontScale * 100}%`;
        localStorage.setItem('fontScale', String(fontScale));
    };
    applyScale();

    if (increaseBtn) {
        increaseBtn.addEventListener('click', () => {
            if (fontScale >= MAX_FONT_SCALE) {
                alert('已达到最大字体大小（导航栏保持一行的最大值）。');
                return;
            }
            fontScale += 0.05;
            applyScale();
        });
    }
    if (decreaseBtn) {
        decreaseBtn.addEventListener('click', () => {
            if (fontScale <= MIN_FONT_SCALE) {
                alert('已达到最小字体大小。');
                return;
            }
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

function updateScooterPageStats() {
    const available = scooters.filter(s => normalizeScooterStatus(s.status) === 'available').length;
    const maintenance = scooters.filter(s => normalizeScooterStatus(s.status) === 'maintenance').length;
    const rented = scooters.filter(s => normalizeScooterStatus(s.status) === 'rented').length;
    const totalNode = document.getElementById('totalScooters');
    const availNode = document.getElementById('availableCount');
    const maintNode = document.getElementById('maintenanceCount');
    if (totalNode) totalNode.textContent = scooters.length;
    if (availNode) availNode.textContent = available;
    if (maintNode) maintNode.textContent = maintenance;
}

