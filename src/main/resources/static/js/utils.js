/**
 * Utility functions for Scooter Rental System.
 * These are pure functions with no DOM dependencies — testable in isolation.
 */

function formatCurrency(value) {
    var amount = Number(value || 0);
    return '$' + amount.toFixed(2);
}

function normalizeCardNumber(raw) {
    return String(raw || '').replace(/\s+/g, '');
}

function maskCardNumber(raw) {
    var digits = normalizeCardNumber(raw);
    if (digits.length < 4) return '****';
    return '**** **** **** ' + digits.slice(-4);
}

function isValidCardNumber(raw) {
    var digits = normalizeCardNumber(raw);
    if (/^\d{16}$/.test(digits)) {
        return true;
    }
    var sum = 0;
    var shouldDouble = false;
    for (var i = digits.length - 1; i >= 0; i -= 1) {
        var digit = Number(digits[i]);
        if (shouldDouble) {
            digit *= 2;
            if (digit > 9) digit -= 9;
        }
        sum += digit;
        shouldDouble = !shouldDouble;
    }
    return sum % 10 === 0;
}

function isStrongPassword(password) {
    if (!password || password.length < 8) return false;
    var hasUpper = /[A-Z]/.test(password);
    var hasLower = /[a-z]/.test(password);
    var hasDigit = /\d/.test(password);
    var hasSpecial = /[^A-Za-z0-9]/.test(password);
    return hasUpper && hasLower && hasDigit && hasSpecial;
}

function normalizeScooterStatus(status) {
    if (!status) return 'available';
    if (status === 'normal') return 'available';
    return status;
}

function normalizePackageTypeText(type) {
    return String(type || '').trim().toLowerCase().replace(/\s+/g, '');
}

// Export for Node.js test runners; no-op in browser
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        formatCurrency: formatCurrency,
        normalizeCardNumber: normalizeCardNumber,
        maskCardNumber: maskCardNumber,
        isValidCardNumber: isValidCardNumber,
        isStrongPassword: isStrongPassword,
        normalizeScooterStatus: normalizeScooterStatus,
        normalizePackageTypeText: normalizePackageTypeText
    };
}
