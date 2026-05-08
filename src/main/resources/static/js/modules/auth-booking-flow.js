// Login form
const loginForm = document.getElementById('loginForm');
if (loginForm) {
    loginForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        const username = document.getElementById('loginEmail').value.trim();
        const password = document.getElementById('loginPassword').value.trim();
        try {
            const response = await apiFetch(`/api/users/login?username=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}`, {
                method: 'POST',
                headers: { 'Accept': 'application/json' }
            });
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(getTextError(errorText, 'Invalid username or password'));
            }
            const data = await response.json();
            const user = data.user;
            const token = data.token;
            currentUser = user;
            adminLoggedIn = (user.role || '').toLowerCase() === 'admin';
            localStorage.setItem('authToken', token);
            localStorage.setItem('currentUser', JSON.stringify(user));
            const backendCard = normalizeCardNumber(user.creditCardNumber || '');
            if (/^\d{16}$/.test(backendCard)) {
                saveUserCard(backendCard);
            }
            const pendingCard = getPendingCardForUsername(user.username);
            if (/^\d{16}$/.test(pendingCard)) {
                saveUserCard(pendingCard);
            }
            updateNav();
            refreshSavedCardOptions();
            resetSessionTimer();
            showSection('homeSection');
            alert(`Login successful! Welcome ${user.username}.`);
        } catch (error) {
            console.error('Login error:', error);
            alert(error.message || 'Login failed!');
        }
        this.reset();
    });
}

// Register form
const registerForm = document.getElementById('registerForm');
if (registerForm) {
    registerForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        const username = document.getElementById('registerUsername').value.trim();
        const email = document.getElementById('registerEmail').value.trim();
        const phone = document.getElementById('registerPhone').value.trim();
        const dob = document.getElementById('registerDob').value;
        const password = document.getElementById('registerPassword').value.trim();
        const confirmPassword = document.getElementById('registerConfirmPassword').value.trim();
        const cardNumber = document.getElementById('cardNumber').value.trim();
        const cardExpiry = document.getElementById('cardExpiry').value.trim();
        const cardCVV = document.getElementById('cardCVV').value.trim();
        const acceptTerms = document.getElementById('acceptTerms').checked;
        
        if (!isStrongPassword(password)) {
            alert('Password must be at least 8 chars and include upper, lower, number and special character.');
            return;
        }
        
        if (password !== confirmPassword) {
            alert('Passwords do not match!');
            return;
        }
        
        if (!isValidCardNumber(cardNumber)) {
            alert('Please enter a valid 16-digit card number.');
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
        
        try {
            const response = await apiFetch(`/api/users/register?confirmPassword=${encodeURIComponent(confirmPassword)}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    username,
                    email,
                    dateOfBirth: dob || null,
                    passwordHash: password
                })
            });
            const text = await response.text();
            if (!response.ok) {
                throw new Error(getTextError(text, 'Registration failed!'));
            }
            alert(text || 'Registration successful!');
            // Backend has no card binding endpoint yet, so card data is only front-end validated for now.
            savePendingCardForUsername(username, cardNumber);
            showAuthMode('login');
        } catch (error) {
            console.error('Registration error:', error);
            alert(error.message || 'Registration failed!');
        }
        this.reset();
    });
}

const issueForm = document.getElementById('issueForm');
if (issueForm) {
    const issueDescriptionInput = document.getElementById('issueDescription');
    const issueDescriptionCount = document.getElementById('issueDescriptionCount');
    if (issueDescriptionInput && issueDescriptionCount) {
        const syncIssueDescCount = () => {
            issueDescriptionCount.textContent = `${issueDescriptionInput.value.length}/300`;
        };
        syncIssueDescCount();
        issueDescriptionInput.addEventListener('input', syncIssueDescCount);
    }

    issueForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        const userId = getCurrentUserId();
        if (!userId) {
            alert('Please login first to submit feedback.');
            showSection('authSection');
            showAuthMode('login');
            return;
        }

        const scooterId = Number(document.getElementById('issueScooterId').value);
        const description = document.getElementById('issueDescription').value.trim();

        try {
            const response = await apiFetch('/api/issues/report', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId,
                    scooterId,
                    description,
                    // User submits issue only; admin decides priority later.
                    priority: 'medium'
                })
            });
            const text = await response.text();
            if (!response.ok) {
                throw new Error(getTextError(text, 'Issue submission failed'));
            }
            alert(text || 'Issue submitted.');
            announce('Issue submitted successfully.');
            this.reset();
            await loadIssues();
            renderHighPriorityIssues();
        } catch (error) {
            console.error('Issue submit error:', error);
            alert(error.message || 'Issue submission failed.');
        }
    });
}

// Book form
const bookForm = document.getElementById('bookForm');
if (bookForm) {
    bookForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        const userId = getCurrentUserId();
        if (!userId) {
            alert('Please login first!');
            showSection('authSection');
            showAuthMode('login');
            return;
        }
        const packageId = document.getElementById('packageSelect').value;
        const selectedOption = document.getElementById('packageSelect').selectedOptions[0];
        const packagePrice = selectedOption ? Number(selectedOption.dataset.price || 0) : 0;
        const scooterId = parseInt(document.getElementById('scooterId').value);
        const scooter = scooters.find(s => s.id === scooterId && s.status === 'available');
        if (!scooter) {
            alert('Scooter not available!');
            return;
        }
        try {
            const response = await apiFetch('/api/bookings/place', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId,
                    scooterId,
                    packageId: Number(packageId),
                    // Keep totalCost for backward compatibility; backend recalculates from packageId.
                    totalCost: packagePrice
                })
            });
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(getTextError(errorText, 'Booking failed!'));
            }
            const booking = await response.json();
            localStorage.setItem('pendingBookingId', String(booking.id));
            document.getElementById('bookingDetails').textContent = `Scooter ${scooterId}, Package ID ${packageId}`;
            await updatePaymentBreakdown(packagePrice);
            refreshSavedCardOptions();
            showSection('paymentSection');
        } catch (error) {
            console.error('Booking error:', error);
            alert(error.message || 'Booking failed!');
        }
        this.reset();
    });
}

// Payment form
const paymentForm = document.getElementById('paymentForm');
const useSavedCardBtn = document.getElementById('useSavedCardBtn');

// Card number masking preview
const paymentCardInput = document.getElementById('paymentCardNumber');
const paymentCardMasked = document.getElementById('paymentCardMasked');
if (paymentCardInput && paymentCardMasked) {
    paymentCardInput.addEventListener('input', () => {
        const raw = paymentCardInput.value.replace(/\D/g, '');
        if (raw.length >= 8) {
            const first4 = raw.slice(0, 4);
            const last4 = raw.slice(-4);
            const masked = `${first4} **** **** ${last4}`;
            paymentCardMasked.textContent = `Display: ${masked}`;
            paymentCardMasked.style.display = '';
        } else {
            paymentCardMasked.style.display = 'none';
        }
    });
}

if (useSavedCardBtn) {
    useSavedCardBtn.addEventListener('click', () => {
        useSavedCardInPayment();
    });
}
if (paymentForm) {
    paymentForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        const cardNumber = document.getElementById('paymentCardNumber').value.trim();
        if (!isValidCardNumber(cardNumber)) {
            alert('Please enter a valid 16-digit card number.');
            return;
        }
        const bookingId = localStorage.getItem('pendingBookingId');
        if (!bookingId) {
            alert('No pending booking!');
            return;
        }
        try {
            const response = await apiFetch(`/api/bookings/pay/${bookingId}?cardNumber=${encodeURIComponent(cardNumber)}&discountRate=${pendingDiscountRate}`, {
                method: 'POST',
                headers: { 'Accept': 'text/plain' }
            });
            const text = await response.text();
            if (!response.ok) {
                throw new Error(getTextError(text, 'Payment failed!'));
            }
            saveUserCard(cardNumber);
            localStorage.removeItem('pendingBookingId');
            await loadScooters();
            updateScooterPageStats();
            await loadScooterLocations();
            renderScooters();
            renderScooterLocations();
            renderScooterMap();
            document.getElementById('confirmationDetails').innerHTML = `
                <p>User: ${getCurrentUsername()}</p>
                <p>Booking ID: ${bookingId}</p>
                <p>Status: paid</p>
                <p>Email notification: sent (simulated, visible below)</p>
            `;
            simulatePaymentEmailNotification(bookingId);
            alert(text || 'Payment successful!');
            updateNav();
            showSection('successSection');
        } catch (error) {
            console.error('Payment error:', error);
            alert(error.message || 'Payment failed!');
        }
        this.reset();
    });
}

