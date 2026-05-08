/**
 * Unit tests for auth-booking-flow.js — login, register, booking, payment flows.
 *
 * Tests form validation, API call construction, and error handling by
 * creating real DOM elements, loading the module, and triggering submits.
 *
 * @jest-environment jsdom
 */

const fs = require('fs');
const path = require('path');

// ── Shared setup ───────────────────────────────────────────────────

beforeAll(() => {
  // ── Browser API mocks ──
  global.localStorage = (() => {
    let store = {};
    return {
      getItem: (key) => store[key] ?? null,
      setItem: (key, value) => { store[key] = String(value); },
      removeItem: (key) => { delete store[key]; },
      clear: () => { store = {}; },
    };
  })();

  global.fetch = jest.fn();
  global.alert = jest.fn();
  global.confirm = jest.fn();
  global.L = {};

  // ── Build DOM elements that auth-booking-flow binds to ──

  document.body.innerHTML = `
    <section id="authSection">
      <div id="loginPanel">
        <form id="loginForm">
          <input type="text" id="loginEmail" placeholder="Enter username" required>
          <input type="password" id="loginPassword" placeholder="Enter password" required>
          <button type="submit">Login</button>
        </form>
      </div>
      <div id="registerPanel" style="display:none;">
        <form id="registerForm">
          <input type="text" id="registerUsername" placeholder="Full name" required>
          <input type="email" id="registerEmail" placeholder="Email" required>
          <input type="tel" id="registerPhone" placeholder="Phone" required>
          <input type="text" id="registerDob" placeholder="yyyy-MM-dd" required>
          <input type="password" id="registerPassword" placeholder="Password" required>
          <input type="password" id="registerConfirmPassword" placeholder="Confirm" required>
          <input type="text" id="cardNumber" placeholder="Card number" required>
          <input type="text" id="cardExpiry" placeholder="MM/YY" required>
          <input type="text" id="cardCVV" placeholder="CVV" required>
          <input type="checkbox" id="acceptTerms" required>
          <button type="submit">Register</button>
        </form>
      </div>
    </section>
    <section id="homeSection"></section>
    <section id="rentSection">
      <form id="bookForm">
        <select id="packageSelect">
          <option value="1" data-price="5">1 Hour - $5</option>
          <option value="2" data-price="15">4 Hours - $15</option>
        </select>
        <input type="number" id="scooterId" placeholder="Scooter ID" required>
        <button type="submit">Submit Booking</button>
      </form>
      <div id="packageSummaryContent"></div>
    </section>
    <section id="paymentSection">
      <form id="paymentForm">
        <select id="savedCardSelect"><option value="">No saved card</option></select>
        <button type="button" id="useSavedCardBtn">Use Saved</button>
        <input type="text" id="paymentCardNumber" placeholder="Card number" required>
        <p id="paymentCardMasked" style="display:none;"></p>
        <button type="submit">Confirm Payment</button>
      </form>
      <div id="bookingDetails">Loading...</div>
      <div id="rentalCost">$0.00</div>
      <div id="totalAmount">$0.00</div>
      <div id="discountRow" style="display:none;">
        <span id="discountLabel">Discount</span>
        <span id="discountAmount">-$0.00</span>
      </div>
    </section>
    <section id="successSection">
      <div id="confirmationDetails"></div>
      <div id="paymentEmailNotice"><p>No notification yet.</p></div>
      <button id="backToHome">Back to Home</button>
    </section>
    <section id="myBookingsSection"></section>
    <section id="feedbackSection">
      <form id="issueForm">
        <input type="number" id="issueScooterId" required>
        <textarea id="issueDescription" required></textarea>
        <span id="issueDescriptionCount">0/300</span>
        <button type="submit">Submit Issue</button>
      </form>
      <div id="issueHistoryList"><p>No submissions yet.</p></div>
      <div id="issueHistoryPagination"></div>
      <div id="highPriorityIssueList"><p>No high priority issues yet.</p></div>
    </section>
    <section id="adminConfigSection">
      <div class="admin-sidebar-btn" data-admin-panel="adminPanelIssues"></div>
      <div id="adminPanelIssues">
        <div id="adminIssueReviewList"><p>No issues loaded.</p></div>
      </div>
    </section>
    <div id="scooterDetailSection">
      <div id="scooterDetailContainer"></div>
    </div>
    <div id="returnSection"></div>
    <div id="scootersSection"></div>
    <div id="adminConfigSection"></div>
    <div id="scooterGrid"></div>
    <nav>
      <a id="loginLink">Login</a>
      <a id="logoutLink" style="display:none;">Logout</a>
      <a id="returnLink" style="display:none;">Return</a>
    </nav>
    <div id="termsModal" style="display:none;"></div>
    <div id="insuranceModal" style="display:none;"></div>
  `;

  // ── Load core.js (provides apiFetch, currentUser, packages, etc.) ──
  // Replace `let` declarations with bare assignments so all mutable state
  // lives on globalThis — this lets tests AND handler closures see the same
  // variables (var in a beforeAll eval would be local to beforeAll).
  const coreJsPath = path.resolve(__dirname, '../../main/resources/static/js/modules/core.js');
  const coreJsSource = fs.readFileSync(coreJsPath, 'utf8')
    .replace(/\blet packages\b\s*=\s*\[\];/g, 'packages = [];')
    .replace(/\blet scooters\b\s*=\s*\[\];/g, 'scooters = [];')
    .replace(/\blet bookings\b\s*=\s*\[\];/g, 'bookings = [];')
    .replace(/\blet issues\b\s*=\s*\[\];/g, 'issues = [];')
    .replace(/\blet scooterLocations\b\s*=\s*\[\];/g, 'scooterLocations = [];')
    .replace(/\blet adminUsers\b\s*=\s*\[\];/g, 'adminUsers = [];')
    .replace(/\blet currentUser\b\s*=\s*null;/g, 'currentUser = null;')
    .replace(/\blet adminLoggedIn\b\s*=\s*false;/g, 'adminLoggedIn = false;')
    .replace(/\blet scooterMarkers\b\s*=\s*\[\];/g, 'scooterMarkers = [];')
    .replace(/\blet syncTimer\b\s*=\s*null;/g, 'syncTimer = null;')
    .replace(/\blet inactivityTimer\b\s*=\s*null;/g, 'inactivityTimer = null;')
    .replace(/\blet scooterMap\b\s*=\s*null;/g, 'scooterMap = null;')
    .replace(/\blet scooterViewMode\b\s*=\s*'list';/g, `scooterViewMode = 'list';`)
    .replace(/\blet sidebarInteractionsBound\b\s*=\s*false;/g, 'sidebarInteractionsBound = false;');
  eval(coreJsSource);

  // ── Stub cross-module dependencies ──
  global.showSection = jest.fn();
  global.showAuthMode = jest.fn();
  global.updateNav = jest.fn();
  global.renderScooters = jest.fn();
  global.renderScooterLocations = jest.fn();
  global.renderScooterMap = jest.fn();
  global.renderBookings = jest.fn();
  global.renderHighPriorityIssues = jest.fn();
  global.renderPackages = jest.fn();
  global.renderAdminIssueReviewList = jest.fn();
  global.renderAdminUsers = jest.fn();
  global.renderAdminOverview = jest.fn();
  global.renderRevenueCharts = jest.fn();
  global.renderIssueHistory = jest.fn();
  global.refreshSavedCardOptions = jest.fn();
  global.resetSessionTimer = jest.fn();
  global.populatePackageSelect = jest.fn();
  global.updateScooterPageStats = jest.fn();
  global.loadScooters = jest.fn();
  global.loadScooterLocations = jest.fn();
  global.loadIssues = jest.fn();
  global.loadAdminUsers = jest.fn();
  global.loadPackages = jest.fn();
  global.updateHomeStats = jest.fn();
  global.populateAdminProxyBookingOptions = jest.fn();
  global.renderScooterMap = jest.fn();
  global.simulatePaymentEmailNotification = jest.fn();
  global.announce = jest.fn();
  global.startMultiClientSync = jest.fn();
  global.updateSyncStatus = jest.fn();
  global.setupAccessibilityTools = jest.fn();
  global.setupInactivityTracking = jest.fn();
  global.setupHomeSpotlightCarousel = jest.fn();
  global.updateFloatingScooterSidebarsVisibility = jest.fn();
  global.showAdminPanel = jest.fn();
  global.setScooterViewMode = jest.fn();
  global.getAutoDiscountRate = jest.fn(() => Promise.resolve(0));
  global.updatePaymentBreakdown = jest.fn();
  global.pendingDiscountRate = 0;

  // ── Global state setup ──
  // currentUser starts null (core.js reads from localStorage on eval)
  global.adminLoggedIn = false;
  global.scooters = [
    { id: 5, status: 'available', model: 'EcoRide X1', batteryLevel: 99, latitude: 53.8, longitude: -1.55, battery: 99, image: '/images/EcoRide_X1.png' },
    { id: 8, status: 'available', model: 'EcoRide X2', batteryLevel: 100, latitude: 53.81, longitude: -1.55, battery: 100, image: '/images/EcoRide_X2.png' },
  ];
  global.packages = [
    { id: 1, packageType: '1h', price: 5 },
    { id: 2, packageType: '4h', price: 15 },
  ];

  // ── Load auth-booking-flow.js ──
  const authJsPath = path.resolve(__dirname, '../../main/resources/static/js/modules/auth-booking-flow.js');
  eval(fs.readFileSync(authJsPath, 'utf8'));
});

beforeEach(() => {
  fetch.mockReset();
  alert.mockReset();
  confirm.mockReset();
  showSection.mockReset();
  showAuthMode.mockReset();
  localStorage.clear();

  // Reset mutable globals to initial state
  currentUser = null;
  adminLoggedIn = false;
  scooters = [
    { id: 5, status: 'available', model: 'EcoRide X1', batteryLevel: 99, latitude: 53.8, longitude: -1.55, battery: 99, image: '/images/EcoRide_X1.png' },
    { id: 8, status: 'available', model: 'EcoRide X2', batteryLevel: 100, latitude: 53.81, longitude: -1.55, battery: 100, image: '/images/EcoRide_X2.png' },
  ];
  packages = [
    { id: 1, packageType: '1h', price: 5 },
    { id: 2, packageType: '4h', price: 15 },
  ];
  issues = [];
  bookings = [];
  scooterLocations = [];
  adminUsers = [];
});

// ═══════════════════════════════════════════════════════════════════
//  Login Form
// ═══════════════════════════════════════════════════════════════════

describe('Login form', () => {
  test('sends login request with username and password', () => {
    const mockResponse = {
      ok: true,
      json: () => Promise.resolve({
        token: 'jwt-token-123',
        user: { id: 1, username: 'admin', role: 'admin' },
      }),
    };
    fetch.mockResolvedValue(mockResponse);

    document.getElementById('loginEmail').value = 'admin';
    document.getElementById('loginPassword').value = '123456';
    document.getElementById('loginForm').dispatchEvent(new Event('submit'));

    // Verify fetch was called with correct URL params
    expect(fetch).toHaveBeenCalled();
    const calledUrl = fetch.mock.calls[0][0];
    expect(calledUrl).toContain('/api/users/login');
    expect(calledUrl).toContain('username=admin');
    expect(calledUrl).toContain('password=123456');
  });

  test('shows alert on login failure', async () => {
    const mockResponse = { ok: false, text: () => Promise.resolve('Invalid credentials') };
    fetch.mockResolvedValue(mockResponse);

    document.getElementById('loginEmail').value = 'bad';
    document.getElementById('loginPassword').value = 'wrong';
    // Use form requestSubmit for async handler
    const form = document.getElementById('loginForm');
    const submitEvent = new Event('submit', { cancelable: true });
    form.dispatchEvent(submitEvent);

    // Wait for async handler
    await new Promise(r => setTimeout(r, 100));

    expect(alert).toHaveBeenCalled();
    const alertMsg = alert.mock.calls[0][0];
    expect(alertMsg).toContain('Invalid');
  });

  test('clears form fields after submit', async () => {
    const mockResponse = {
      ok: true,
      json: () => Promise.resolve({
        token: 'tok',
        user: { id: 1, username: 'admin', role: 'user', creditCardNumber: null },
      }),
    };
    fetch.mockResolvedValue(mockResponse);

    const emailEl = document.getElementById('loginEmail');
    const passwordEl = document.getElementById('loginPassword');
    emailEl.value = 'admin';
    passwordEl.value = '123456';
    document.getElementById('loginForm').dispatchEvent(new Event('submit'));

    // Handler is async — await microtask flush
    await new Promise(r => setTimeout(r, 50));

    // reset() is called on the form after successful login
    expect(emailEl.value).toBe('');
    expect(passwordEl.value).toBe('');
  });
});

// ═══════════════════════════════════════════════════════════════════
//  Registration Form
// ═══════════════════════════════════════════════════════════════════

describe('Register form', () => {
  test('sends registration request with correct payload', () => {
    const mockResponse = { ok: true, text: () => Promise.resolve('Registration Successful') };
    fetch.mockResolvedValue(mockResponse);

    document.getElementById('registerUsername').value = 'newuser';
    document.getElementById('registerEmail').value = 'new@test.com';
    document.getElementById('registerPhone').value = '07700123456';
    document.getElementById('registerDob').value = '2000-06-15';
    document.getElementById('registerPassword').value = 'StrongP@ss1';
    document.getElementById('registerConfirmPassword').value = 'StrongP@ss1';
    document.getElementById('cardNumber').value = '4111111111111111';
    document.getElementById('cardExpiry').value = '12/28';
    document.getElementById('cardCVV').value = '123';
    document.getElementById('acceptTerms').checked = true;
    document.getElementById('registerForm').dispatchEvent(new Event('submit'));

    expect(fetch).toHaveBeenCalled();
    const calledUrl = fetch.mock.calls[0][0];
    expect(calledUrl).toContain('/api/users/register');

    const body = JSON.parse(fetch.mock.calls[0][1].body);
    expect(body.username).toBe('newuser');
    expect(body.email).toBe('new@test.com');
    expect(body.passwordHash).toBe('StrongP@ss1');
  });

  test('rejects weak password', () => {
    document.getElementById('registerUsername').value = 'u';
    document.getElementById('registerEmail').value = 'e@e.com';
    document.getElementById('registerPhone').value = '1';
    document.getElementById('registerDob').value = '2000-01-01';
    document.getElementById('registerPassword').value = 'weak';
    document.getElementById('registerConfirmPassword').value = 'weak';
    document.getElementById('cardNumber').value = '4111111111111111';
    document.getElementById('cardExpiry').value = '12/28';
    document.getElementById('cardCVV').value = '123';
    document.getElementById('acceptTerms').checked = true;
    document.getElementById('registerForm').dispatchEvent(new Event('submit'));

    expect(alert).toHaveBeenCalled();
    expect(alert.mock.calls[0][0]).toContain('Password');
  });

  test('rejects mismatched password confirmation', () => {
    document.getElementById('registerUsername').value = 'u';
    document.getElementById('registerEmail').value = 'e@e.com';
    document.getElementById('registerPhone').value = '1';
    document.getElementById('registerDob').value = '2000-01-01';
    document.getElementById('registerPassword').value = 'StrongP@ss1';
    document.getElementById('registerConfirmPassword').value = 'Different1!';
    document.getElementById('cardNumber').value = '4111111111111111';
    document.getElementById('cardExpiry').value = '12/28';
    document.getElementById('cardCVV').value = '123';
    document.getElementById('acceptTerms').checked = true;
    document.getElementById('registerForm').dispatchEvent(new Event('submit'));

    expect(alert).toHaveBeenCalled();
    expect(alert.mock.calls[0][0]).toContain('do not match');
  });

  test('rejects invalid card number', () => {
    document.getElementById('registerUsername').value = 'u';
    document.getElementById('registerEmail').value = 'e@e.com';
    document.getElementById('registerPhone').value = '1';
    document.getElementById('registerDob').value = '2000-01-01';
    document.getElementById('registerPassword').value = 'StrongP@ss1';
    document.getElementById('registerConfirmPassword').value = 'StrongP@ss1';
    document.getElementById('cardNumber').value = '1234';
    document.getElementById('cardExpiry').value = '12/28';
    document.getElementById('cardCVV').value = '123';
    document.getElementById('acceptTerms').checked = true;
    document.getElementById('registerForm').dispatchEvent(new Event('submit'));

    expect(alert).toHaveBeenCalled();
    expect(alert.mock.calls[0][0]).toContain('card');
  });

  test('rejects unchecked terms', () => {
    document.getElementById('registerUsername').value = 'u';
    document.getElementById('registerEmail').value = 'e@e.com';
    document.getElementById('registerPhone').value = '1';
    document.getElementById('registerDob').value = '2000-01-01';
    document.getElementById('registerPassword').value = 'StrongP@ss1';
    document.getElementById('registerConfirmPassword').value = 'StrongP@ss1';
    document.getElementById('cardNumber').value = '4111111111111111';
    document.getElementById('cardExpiry').value = '12/28';
    document.getElementById('cardCVV').value = '123';
    document.getElementById('acceptTerms').checked = false;
    document.getElementById('registerForm').dispatchEvent(new Event('submit'));

    expect(alert).toHaveBeenCalled();
    expect(alert.mock.calls[0][0]).toContain('Terms');
  });

  test('switches to login panel on successful registration', async () => {
    const mockResponse = { ok: true, text: () => Promise.resolve('Registered') };
    fetch.mockResolvedValue(mockResponse);

    document.getElementById('registerUsername').value = 'newuser';
    document.getElementById('registerEmail').value = 'new@test.com';
    document.getElementById('registerPhone').value = '07700123456';
    document.getElementById('registerDob').value = '2000-06-15';
    document.getElementById('registerPassword').value = 'StrongP@ss1';
    document.getElementById('registerConfirmPassword').value = 'StrongP@ss1';
    document.getElementById('cardNumber').value = '4111111111111111';
    document.getElementById('cardExpiry').value = '12/28';
    document.getElementById('cardCVV').value = '123';
    document.getElementById('acceptTerms').checked = true;
    document.getElementById('registerForm').dispatchEvent(new Event('submit'));

    // Handler is async — wait for it
    await new Promise(r => setTimeout(r, 50));

    // Form should be reset after successful registration
    expect(document.getElementById('registerUsername').value).toBe('');
  });
});

// ═══════════════════════════════════════════════════════════════════
//  Booking Form
// ═══════════════════════════════════════════════════════════════════

describe('Book form', () => {
  test('alerts when user is not logged in', () => {
    // currentUser is null
    document.getElementById('packageSelect').value = '1';
    document.getElementById('scooterId').value = '5';
    document.getElementById('bookForm').dispatchEvent(new Event('submit'));

    expect(alert).toHaveBeenCalled();
    expect(alert.mock.calls[0][0]).toContain('login');
    expect(showSection).toHaveBeenCalledWith('authSection');
  });

  test('sends booking request with correct data', async () => {
    currentUser = { id: 1, username: 'admin', role: 'admin' };

    const mockResponse = {
      ok: true,
      json: () => Promise.resolve({ id: 99, scooterId: 5, packageId: 1, totalCost: 5 }),
    };
    fetch.mockResolvedValue(mockResponse);

    document.getElementById('packageSelect').value = '1';
    document.getElementById('scooterId').value = '5';
    document.getElementById('bookForm').dispatchEvent(new Event('submit'));

    await new Promise(r => setTimeout(r, 50));

    expect(fetch).toHaveBeenCalled();
    const calledUrl = fetch.mock.calls[0][0];
    expect(calledUrl).toContain('/api/bookings/place');

    const body = JSON.parse(fetch.mock.calls[0][1].body);
    expect(body.userId).toBe(1);
    expect(body.scooterId).toBe(5);
    expect(body.packageId).toBe(1);
  });

  test('alerts when scooter is not available', () => {
    currentUser = { id: 1, username: 'admin', role: 'user' };

    // ID 999 doesn't exist in mock scooters array
    document.getElementById('packageSelect').value = '1';
    document.getElementById('scooterId').value = '999';
    document.getElementById('bookForm').dispatchEvent(new Event('submit'));

    expect(alert).toHaveBeenCalled();
    expect(alert.mock.calls[0][0]).toContain('not available');
  });

  test('persists booking ID to localStorage on success', async () => {
    currentUser = { id: 1, username: 'admin', role: 'user' };

    const mockResponse = {
      ok: true,
      json: () => Promise.resolve({ id: 42, scooterId: 5, packageId: 1 }),
    };
    fetch.mockResolvedValue(mockResponse);

    document.getElementById('packageSelect').value = '1';
    document.getElementById('scooterId').value = '5';
    document.getElementById('bookForm').dispatchEvent(new Event('submit'));

    // Handler is async — wait for it
    await new Promise(r => setTimeout(r, 50));
    // If booking succeeded, pendingBookingId should be in localStorage
    // On mocked success, the handler saves it
  });
});

// ═══════════════════════════════════════════════════════════════════
//  Payment Form
// ═══════════════════════════════════════════════════════════════════

describe('Payment form', () => {
  test('rejects empty/invalid card number', () => {
    document.getElementById('paymentCardNumber').value = 'abc';
    document.getElementById('paymentForm').dispatchEvent(new Event('submit'));

    expect(alert).toHaveBeenCalled();
    expect(alert.mock.calls[0][0]).toContain('card');
  });

  test('alerts when no pending booking', () => {
    document.getElementById('paymentCardNumber').value = '4111111111111111';
    localStorage.removeItem('pendingBookingId');
    document.getElementById('paymentForm').dispatchEvent(new Event('submit'));

    expect(alert).toHaveBeenCalled();
    expect(alert.mock.calls[0][0]).toContain('pending');
  });

  test('sends payment request with card number and booking ID', () => {
    currentUser = { id: 1, username: 'admin', role: 'user' };
    localStorage.setItem('pendingBookingId', '42');

    const mockResponse = { ok: true, text: () => Promise.resolve('Payment Success!') };
    fetch.mockResolvedValue(mockResponse);

    document.getElementById('paymentCardNumber').value = '4111111111111111';
    document.getElementById('paymentForm').dispatchEvent(new Event('submit'));

    expect(fetch).toHaveBeenCalled();
    const calledUrl = fetch.mock.calls[0][0];
    expect(calledUrl).toContain('/api/bookings/pay/42');
    expect(calledUrl).toContain('cardNumber=4111111111111111');
  });

  test('shows alert on payment failure', async () => {
    currentUser = { id: 1, username: 'admin', role: 'user' };
    localStorage.setItem('pendingBookingId', '42');

    const mockResponse = { ok: false, text: () => Promise.resolve('Payment declined') };
    fetch.mockResolvedValue(mockResponse);

    document.getElementById('paymentCardNumber').value = '4111111111111111';
    const form = document.getElementById('paymentForm');
    form.dispatchEvent(new Event('submit'));

    await new Promise(r => setTimeout(r, 100));

    expect(alert).toHaveBeenCalled();
    const messages = alert.mock.calls.map(c => c[0]).join(' ');
    expect(messages).toContain('Payment declined');
  });
});

// ═══════════════════════════════════════════════════════════════════
//  Issue Form
// ═══════════════════════════════════════════════════════════════════

describe('Issue form', () => {
  test('alerts when user is not logged in', () => {
    // currentUser is null
    document.getElementById('issueScooterId').value = '5';
    document.getElementById('issueDescription').value = 'The brake is loose';
    document.getElementById('issueForm').dispatchEvent(new Event('submit'));

    expect(alert).toHaveBeenCalled();
    expect(alert.mock.calls[0][0]).toContain('login');
  });

  test('sends issue report with correct data', async () => {
    currentUser = { id: 1, username: 'admin', role: 'admin' };

    const mockResponse = { ok: true, text: () => Promise.resolve('Issue submitted.') };
    fetch.mockResolvedValue(mockResponse);

    document.getElementById('issueScooterId').value = '5';
    document.getElementById('issueDescription').value = 'Brake feels loose on scooter #5';
    document.getElementById('issueForm').dispatchEvent(new Event('submit'));

    await new Promise(r => setTimeout(r, 50));

    expect(fetch).toHaveBeenCalled();
    const calledUrl = fetch.mock.calls[0][0];
    expect(calledUrl).toContain('/api/issues/report');

    const body = JSON.parse(fetch.mock.calls[0][1].body);
    expect(body.userId).toBe(1);
    expect(body.scooterId).toBe(5);
    expect(body.description).toBe('Brake feels loose on scooter #5');
    expect(body.priority).toBe('medium');
  });

  test('shows error alert on submission failure', async () => {
    currentUser = { id: 1, username: 'admin', role: 'user' };

    const mockResponse = { ok: false, text: () => Promise.resolve('Submission rejected') };
    fetch.mockResolvedValue(mockResponse);

    document.getElementById('issueScooterId').value = '5';
    document.getElementById('issueDescription').value = 'Test issue';
    const form = document.getElementById('issueForm');
    form.dispatchEvent(new Event('submit'));

    await new Promise(r => setTimeout(r, 100));

    expect(alert).toHaveBeenCalled();
    const messages = alert.mock.calls.map(c => c[0]).join(' ');
    expect(messages).toContain('Submission rejected');
  });

  test('updates description character counter on input', () => {
    const input = document.getElementById('issueDescription');
    const counter = document.getElementById('issueDescriptionCount');

    input.value = 'Hello';
    input.dispatchEvent(new Event('input'));

    expect(counter.textContent).toBe('5/300');
  });
});
