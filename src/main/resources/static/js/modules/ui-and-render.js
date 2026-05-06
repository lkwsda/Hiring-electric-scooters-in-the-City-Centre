// Sections
const sections = ['authSection', 'homeSection', 'scootersSection', 'rentSection', 'paymentSection', 'successSection', 'myBookingsSection', 'feedbackSection', 'analyticsSection', 'scooterDetailSection', 'returnSection', 'adminLoginSection', 'adminConfigSection', 'adminStatsSection'];

function showSection(sectionId) {
    if (sectionId === 'authSection' && (currentUser || adminLoggedIn)) {
        sectionId = 'homeSection';
    }
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
        renderScooterLocations();
        setScooterViewMode(scooterViewMode);
    } else if (sectionId === 'myBookingsSection') {
        renderBookings();
    } else if (sectionId === 'feedbackSection') {
        renderHighPriorityIssues();
    } else if (sectionId === 'analyticsSection') {
        renderRevenueCharts();
    } else if (sectionId === 'adminConfigSection') {
        renderAdminUsers();
    } else if (sectionId === 'adminStatsSection') {
        renderStats();
        renderAdminIssueReviewList();
        renderAdminHighPriorityIssues();
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

    // Admin-only UI elements
    const adminHighPriorityBox = document.getElementById('adminOnlyHighPriorityBox');
    const adminRevenueSection = document.getElementById('adminOnlyRevenueSection');
    const analyticsRevenueNotice = document.getElementById('analyticsRevenueNotice');

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

    // Show admin-only sections only when admin is logged in
    if (adminHighPriorityBox) adminHighPriorityBox.style.display = adminLoggedIn ? '' : 'none';
    if (adminRevenueSection) adminRevenueSection.style.display = adminLoggedIn ? '' : 'none';
    if (analyticsRevenueNotice) analyticsRevenueNotice.style.display = adminLoggedIn ? 'none' : '';
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
    const spentNode = document.querySelector('#myBookingsSection .summary-card:nth-child(3) .summary-number');
    if (activeNode) activeNode.textContent = String(activeCount);
    if (totalNode) totalNode.textContent = String(totalCount);
    if (spentNode) spentNode.textContent = formatCurrency(totalSpent);
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
        const response = await fetch(`/api/bookings/user/${userId}`);
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
        const endTime = booking.endTime ? new Date(booking.endTime).toLocaleString() : 'Ongoing';
        const cost = booking.totalCost ? `$${booking.totalCost}` : 'Calculating...';
        let buttonHtml = '';
        if (booking.status === 'paid') {
            buttonHtml = `
                <button onclick="extendRental(${booking.id})" class="extend-rental-btn"><i class="fa-solid fa-clock"></i> Extend</button>
                <button onclick="endRental(${booking.id})" class="end-rental-btn"><i class="fa-solid fa-stop"></i> End Rental</button>
            `;
        } else {
            const statusText = String(booking.status || '').toLowerCase();
            const canCancel = ['pending', 'unpaid', 'placed', 'booked', 'created'].includes(statusText);
            if (canCancel) {
                buttonHtml = `<button onclick="cancelBooking(${booking.id})" class="end-rental-btn"><i class="fa-solid fa-xmark"></i> Cancel</button>`;
            }
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

    // Pagination controls
    if (totalPages > 1) {
        const pager = document.createElement('div');
        pager.className = 'booking-pagination';
        pager.style.cssText = 'display:flex;gap:10px;align-items:center;margin-top:12px;';
        pager.innerHTML = `
            <button onclick="changeBookingsPage(-1)" ${bookingsCurrentPage <= 1 ? 'disabled' : ''}
                style="padding:6px 14px;border-radius:6px;border:1px solid #ccc;cursor:pointer;">
                <i class="fa-solid fa-chevron-left"></i> Prev
            </button>
            <span>Page ${bookingsCurrentPage} / ${totalPages}</span>
            <button onclick="changeBookingsPage(1)" ${bookingsCurrentPage >= totalPages ? 'disabled' : ''}
                style="padding:6px 14px;border-radius:6px;border:1px solid #ccc;cursor:pointer;">
                Next <i class="fa-solid fa-chevron-right"></i>
            </button>
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

function getAutoDiscountRate() {
    if (!currentUser) return 0;
    const role = (currentUser.role || '').toLowerCase();
    if (role === 'student') return 0.10;
    if (role === 'senior') return 0.15;
    if (role === 'high-frequency' || role === 'highfrequency') return 0.20;
    return 0;
}

function updatePaymentBreakdown(packagePrice) {
    const rentalCostNode = document.getElementById('rentalCost');
    const totalAmountNode = document.getElementById('totalAmount');
    const discountRow = document.getElementById('discountRow');
    const discountLabel = document.getElementById('discountLabel');
    const discountAmountNode = document.getElementById('discountAmount');
    const rentalCost = Number(packagePrice || 0);
    const discountRate = getAutoDiscountRate();
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
    if (!select) return;
    select.innerHTML = '';

    const userCard = getSavedUserCard();
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

function renderHighPriorityIssues() {
    const container = document.getElementById('highPriorityIssueList');
    if (!container) return;

    const high = issues.filter(issue => (issue.priority || '').toLowerCase() === 'high');
    if (!high.length) {
        container.innerHTML = '<p>No high priority issues yet.</p>';
        return;
    }

    container.innerHTML = high.slice(0, 8).map(issue => {
        return `<div class="issue-item issue-high">
            <p><strong>ID:</strong> #${issue.id || 'N/A'} | <strong>Scooter:</strong> ${issue.scooterId}</p>
            <p><strong>Priority:</strong> ${issue.priority}</p>
            <p>${issue.description}</p>
        </div>`;
    }).join('');
}

function renderAdminHighPriorityIssues() {
    const container = document.getElementById('adminHighPriorityIssues');
    if (!container) return;

    const high = issues.filter(issue => (issue.priority || '').toLowerCase() === 'high');
    if (!high.length) {
        container.innerHTML = '<p>No high priority issues found.</p>';
        return;
    }
    container.innerHTML = high.map(issue => `
        <div class="issue-item issue-high">
            <p><strong>ID:</strong> ${issue.id || 'N/A'}</p>
            <p><strong>User:</strong> ${issue.userId || 'N/A'} | <strong>Scooter:</strong> ${issue.scooterId}</p>
            <p><strong>Status:</strong> ${issue.status || 'pending'} | <strong>Priority:</strong> ${issue.priority}</p>
            <p>${issue.description}</p>
            ${(issue.id && String(issue.status || '').toLowerCase() !== 'resolved') ? `<button onclick="resolveIssue(${issue.id})" class="btn-primary" type="button">Resolve</button>` : ''}
        </div>
    `).join('');
}

function renderAdminIssueReviewList() {
    const container = document.getElementById('adminIssueReviewList');
    if (!container) return;

    if (!issues.length) {
        container.innerHTML = '<p>No issues to review.</p>';
        return;
    }

    container.innerHTML = issues.map(issue => {
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
}

async function setIssuePriority(issueId, priority) {
    if (!issueId || !priority) return;
    try {
        const response = await fetch(`/api/issues/${issueId}/priority?priority=${encodeURIComponent(priority)}`, {
            method: 'PUT'
        });
        const text = await response.text();
        if (!response.ok) {
            throw new Error(getTextError(text, 'Failed to update priority.'));
        }
        announce(`Issue ${issueId} priority set to ${priority}.`);
        await loadIssues();
        renderAdminIssueReviewList();
        renderAdminHighPriorityIssues();
        renderHighPriorityIssues();
    } catch (error) {
        console.error('Set priority error:', error);
        alert('Priority update endpoint is not available yet. Please ask backend to provide PUT /api/issues/{id}/priority.');
    }
}

async function loadIssues() {
    try {
        const response = await fetch('/api/issues');
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(getTextError(errorText, 'Failed to load issues'));
        }
        const data = await response.json();
        issues = Array.isArray(data) ? data : [];
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
        ctx.fillStyle = '#666';
        ctx.font = '14px Segoe UI';
        ctx.fillText('No data available.', 16, 30);
        return;
    }

    const max = Math.max(...values, 1);
    const chartTop = 20;
    const chartBottom = h - 40;
    const chartHeight = chartBottom - chartTop;
    const barWidth = Math.max(24, Math.floor((w - 40) / labels.length) - 16);

    labels.forEach((label, i) => {
        const x = 20 + i * (barWidth + 16);
        const barH = (values[i] / max) * chartHeight;
        const y = chartBottom - barH;
        ctx.fillStyle = '#2f80ed';
        ctx.fillRect(x, y, barWidth, barH);

        ctx.fillStyle = '#1f2937';
        ctx.font = '12px Segoe UI';
        ctx.fillText(String(values[i]), x, y - 6);
        ctx.fillText(label, x, chartBottom + 16);
    });
}

function drawLineChart(canvasId, labels, values) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);

    if (!labels.length) {
        ctx.fillStyle = '#666';
        ctx.font = '14px Segoe UI';
        ctx.fillText('No data available.', 16, 30);
        return;
    }

    const max = Math.max(...values, 1);
    const left = 30;
    const right = w - 20;
    const top = 20;
    const bottom = h - 40;
    const stepX = labels.length > 1 ? (right - left) / (labels.length - 1) : 0;

    ctx.strokeStyle = '#2f80ed';
    ctx.lineWidth = 2;
    ctx.beginPath();

    values.forEach((value, i) => {
        const x = left + i * stepX;
        const y = bottom - ((value / max) * (bottom - top));
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
    });
    ctx.stroke();

    values.forEach((value, i) => {
        const x = left + i * stepX;
        const y = bottom - ((value / max) * (bottom - top));
        ctx.fillStyle = '#2f80ed';
        ctx.beginPath();
        ctx.arc(x, y, 3, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#1f2937';
        ctx.font = '12px Segoe UI';
        ctx.fillText(String(value), x - 8, y - 8);
        ctx.fillText(labels[i], x - 16, bottom + 16);
    });
}

async function renderRevenueCharts() {
    try {
        const [weeklyRes, dailyRes] = await Promise.all([
            fetch('/api/bookings/admin/revenue'),
            fetch('/api/bookings/admin/revenue/daily')
        ]);

        const weekly = weeklyRes.ok ? await weeklyRes.json() : [];
        const daily = dailyRes.ok ? await dailyRes.json() : [];

        const weeklyLabels = (Array.isArray(weekly) ? weekly : []).map(item => item.packageType || 'N/A');
        const weeklyValues = (Array.isArray(weekly) ? weekly : []).map(item => Number(item.totalRevenue || 0));

        const dailyLabels = (Array.isArray(daily) ? daily : []).map(item => item.date || 'N/A');
        const dailyValues = (Array.isArray(daily) ? daily : []).map(item => Number(item.dailyTotal || 0));

        drawBarChart('weeklyRevenueChart', weeklyLabels, weeklyValues);
        drawLineChart('dailyRevenueChart', dailyLabels.reverse(), dailyValues.reverse());
    } catch (error) {
        console.error('Chart render error:', error);
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

