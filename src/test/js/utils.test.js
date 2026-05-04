const {
  formatCurrency,
  normalizeCardNumber,
  maskCardNumber,
  isValidCardNumber,
  isStrongPassword,
  normalizeScooterStatus,
  normalizePackageTypeText,
} = require('../../main/resources/static/js/utils.js');

describe('formatCurrency', () => {
  test('formats integer as currency', () => {
    expect(formatCurrency(15)).toBe('$15.00');
  });

  test('formats decimal number', () => {
    expect(formatCurrency(9.99)).toBe('$9.99');
  });

  test('formats zero', () => {
    expect(formatCurrency(0)).toBe('$0.00');
  });

  test('handles null/undefined as zero', () => {
    expect(formatCurrency(null)).toBe('$0.00');
    expect(formatCurrency(undefined)).toBe('$0.00');
  });
});

describe('normalizeCardNumber', () => {
  test('removes spaces from card number', () => {
    expect(normalizeCardNumber('4111 1111 1111 1111')).toBe('4111111111111111');
  });

  test('returns empty string for null/undefined', () => {
    expect(normalizeCardNumber(null)).toBe('');
    expect(normalizeCardNumber(undefined)).toBe('');
  });
});

describe('maskCardNumber', () => {
  test('masks all but last 4 digits', () => {
    expect(maskCardNumber('4111111111111111')).toBe('**** **** **** 1111');
  });

  test('returns **** for short input', () => {
    expect(maskCardNumber('123')).toBe('****');
  });

  test('handles spaced input', () => {
    expect(maskCardNumber('4111 1111 1111 1234')).toBe('**** **** **** 1234');
  });
});

describe('isValidCardNumber', () => {
  test('validates 16-digit card with Luhn algorithm', () => {
    // 4111111111111111 is a valid test number (passes Luhn)
    expect(isValidCardNumber('4111111111111111')).toBe(true);
  });

  test('accepts any 16-digit card (Luhn fallback for other lengths)', () => {
    expect(isValidCardNumber('1000000000000000')).toBe(true);
  });

  test('accepts spaced valid card', () => {
    expect(isValidCardNumber('4111 1111 1111 1111')).toBe(true);
  });

  test('validates shorter numbers with Luhn algorithm', () => {
    // 79927398713 is a valid Luhn number (used in test cards)
    expect(isValidCardNumber('79927398713')).toBe(true);
  });

  test('rejects non-numeric input', () => {
    expect(isValidCardNumber('abcdefghijklmnop')).toBe(false);
  });
});

describe('isStrongPassword', () => {
  test('accepts strong password', () => {
    expect(isStrongPassword('Abcdef1!')).toBe(true);
  });

  test('rejects password shorter than 8 characters', () => {
    expect(isStrongPassword('Ab1!')).toBe(false);
  });

  test('rejects password without uppercase', () => {
    expect(isStrongPassword('abcdef1!')).toBe(false);
  });

  test('rejects password without lowercase', () => {
    expect(isStrongPassword('ABCDEF1!')).toBe(false);
  });

  test('rejects password without digit', () => {
    expect(isStrongPassword('Abcdefg!')).toBe(false);
  });

  test('rejects password without special character', () => {
    expect(isStrongPassword('Abcdef12')).toBe(false);
  });

  test('rejects null/undefined', () => {
    expect(isStrongPassword(null)).toBe(false);
    expect(isStrongPassword(undefined)).toBe(false);
  });
});

describe('normalizeScooterStatus', () => {
  test('maps "normal" to "available"', () => {
    expect(normalizeScooterStatus('normal')).toBe('available');
  });

  test('returns "available" for falsy input', () => {
    expect(normalizeScooterStatus(null)).toBe('available');
    expect(normalizeScooterStatus(undefined)).toBe('available');
    expect(normalizeScooterStatus('')).toBe('available');
  });

  test('passes through other statuses', () => {
    expect(normalizeScooterStatus('rented')).toBe('rented');
    expect(normalizeScooterStatus('maintenance')).toBe('maintenance');
  });
});

describe('normalizePackageTypeText', () => {
  test('lowercases and trims', () => {
    expect(normalizePackageTypeText(' 1H ')).toBe('1h');
  });

  test('removes whitespace', () => {
    expect(normalizePackageTypeText('1 hour')).toBe('1hour');
  });

  test('handles null/undefined', () => {
    expect(normalizePackageTypeText(null)).toBe('');
    expect(normalizePackageTypeText(undefined)).toBe('');
  });
});
