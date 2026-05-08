/**
 * Unit tests for core.js business logic functions.
 *
 * These functions handle data transformation, scooter normalization,
 * map coordinate generation, and API request wrapping.
 *
 * @jest-environment jsdom
 */

const fs = require('fs');
const path = require('path');

// ── Global mocks for browser APIs ──────────────────────────────────

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
global.L = {}; // Leaflet mock

// Load core.js into global scope.
// `let`/`const` are block-scoped inside eval; `var` and `function` become global.
// Replace key `let` declarations with `var` so tests can access them.
const coreJsPath = path.resolve(__dirname, '../../main/resources/static/js/modules/core.js');
const coreJsSource = fs.readFileSync(coreJsPath, 'utf8')
  .replace(/\blet scooters\b/g, 'var scooters')
  .replace(/\blet packages\b/g, 'var packages')
  .replace(/\blet scooterLocations\b/g, 'var scooterLocations')
  .replace(/\blet issues\b/g, 'var issues')
  .replace(/\blet bookings\b/g, 'var bookings')
  .replace(/\blet adminUsers\b/g, 'var adminUsers')
  .replace(/\bconst serviceFee\b/g, 'var serviceFee');
eval(coreJsSource);

// ── Helpers ────────────────────────────────────────────────────────

function resetGlobals() {
  localStorage.clear();
  fetch.mockReset();
  alert.mockReset();
  confirm.mockReset();
  // Reset module-level globals that core.js defines as let/const
  // (they don't reset automatically between tests since eval runs once)
}

// ── normalizeScooter ───────────────────────────────────────────────

describe('normalizeScooter', () => {
  beforeEach(() => {
    resetGlobals();
  });

  test('maps status "normal" to "available"', () => {
    const result = normalizeScooter({ id: 1, status: 'normal', batteryLevel: 85, latitude: 51.5, longitude: -0.12 });
    expect(result.status).toBe('available');
  });

  test('preserves explicit "maintenance" status', () => {
    const result = normalizeScooter({ id: 2, status: 'maintenance', batteryLevel: 50, latitude: 0, longitude: 0 });
    expect(result.status).toBe('maintenance');
  });

  test('uses batteryLevel as battery', () => {
    const result = normalizeScooter({ id: 3, status: 'available', batteryLevel: 72, latitude: 1, longitude: 2 });
    expect(result.battery).toBe(72);
  });

  test('falls back to battery field when batteryLevel is missing', () => {
    const result = normalizeScooter({ id: 4, status: 'available', battery: 55, latitude: 0, longitude: 0 });
    expect(result.battery).toBe(55);
  });

  test('defaults battery to 0 when both batteryLevel and battery are missing', () => {
    const result = normalizeScooter({ id: 5, status: 'available', latitude: 0, longitude: 0 });
    expect(result.battery).toBe(0);
  });

  test('generates gps object from latitude/longitude', () => {
    const result = normalizeScooter({ id: 6, status: 'available', batteryLevel: 90, latitude: 53.8008, longitude: -1.5491 });
    expect(result.gps.lat).toBe(53.8008);
    expect(result.gps.lng).toBe(-1.5491);
  });

  test('computes synthetic mileage when missing', () => {
    const result = normalizeScooter({ id: 10, status: 'available', batteryLevel: 80, latitude: 0, longitude: 0 });
    expect(result.gps.mileage).toBeGreaterThan(100);
    expect(typeof result.gps.mileage).toBe('number');
  });

  test('preserves gps.mileage from existing gps object', () => {
    const result = normalizeScooter({
      id: 7, status: 'available', batteryLevel: 80, latitude: 0, longitude: 0,
      gps: { lat: 50, lng: -1, mileage: 432.1 }
    });
    expect(result.gps.mileage).toBe(432.1);
  });

  test('derives location string when field is missing but lat/lng exist', () => {
    const result = normalizeScooter({ id: 8, status: 'available', batteryLevel: 75, latitude: 51.5074, longitude: -0.1278 });
    expect(result.location).toContain('51.5074');
    expect(result.location).toContain('-0.1278');
  });

  test('resolves image from imageUrl field', () => {
    const result = normalizeScooter({ id: 9, status: 'available', batteryLevel: 60, latitude: 0, longitude: 0, imageUrl: '/images/EcoRide_X2.png' });
    expect(result.image).toBe('/images/EcoRide_X2.png');
  });
});

// ── getScooterSpecs ────────────────────────────────────────────────

describe('getScooterSpecs', () => {
  test('returns X1 specs for model containing x1', () => {
    const result = getScooterSpecs({ model: 'EcoRide X1', battery: 85 });
    expect(result.maxSpeed).toBe('15 mph');
    expect(result.range).toBe('25 miles');
    expect(result.motor).toBe('250W Hub');
  });

  test('returns X3 specs for model containing x3', () => {
    const result = getScooterSpecs({ model: 'EcoRide X3', battery: 60 });
    expect(result.maxSpeed).toBe('22 mph');
    expect(result.range).toBe('35 miles');
    expect(result.motor).toBe('500W Hub');
  });

  test('returns X4 specs for model containing x4', () => {
    const result = getScooterSpecs({ model: 'EcoRide X4', battery: 70 });
    expect(result.range).toBe('40 miles');
    expect(result.motor).toBe('750W Hub');
  });

  test('returns X1 specs as default for unknown model', () => {
    const result = getScooterSpecs({ model: 'UnknownBrand Z99', battery: 50 });
    expect(result.maxSpeed).toBe('15 mph');
    expect(result.range).toBe('25 miles');
  });

  test('matches by image path fallback', () => {
    // Should match x2 from image containing 'X2'
    const result = getScooterSpecs({ model: 'Generic', imageUrl: '/images/EcoRide_X2.png', battery: 42 });
    expect(result.maxSpeed).toBe('18 mph');
  });

  test('returns existing specs if they have real values', () => {
    const custom = { maxSpeed: '99 mph', range: '99 miles', weight: '1kg', motor: 'Turbo' };
    const result = getScooterSpecs({ model: 'x1', specs: custom, battery: 100 });
    expect(result.maxSpeed).toBe('99 mph');
    expect(result.motor).toBe('Turbo');
  });
});

// ── resolveScooterImage ────────────────────────────────────────────

describe('resolveScooterImage', () => {
  test('returns imageUrl if it starts with /images/', () => {
    expect(resolveScooterImage('EcoRide X1', '/images/custom.png')).toBe('/images/custom.png');
    expect(resolveScooterImage('EcoRide X1', 'images/custom.png')).toBe('images/custom.png');
  });

  test('maps x1 model to EcoRide_X1.png', () => {
    const result = resolveScooterImage('EcoRide X1', null);
    expect(result).toContain('EcoRide_X1.png');
  });

  test('maps x3 model to EcoRide_X3.png', () => {
    const result = resolveScooterImage('EcoRide X3 Max', null);
    expect(result).toContain('EcoRide_X3.png');
  });

  test('generates image path from model name for unknown model', () => {
    const result = resolveScooterImage('Unknown', null);
    // Falls through to getModelImage which spaces→underscores
    expect(result).toBe('images/Unknown.png');
  });

  test('is case-insensitive for model matching', () => {
    const result = resolveScooterImage('ecoride x2', null);
    expect(result).toContain('EcoRide_X2.png');
  });
});

// ── buildMapPointsFromScooters ─────────────────────────────────────

describe('buildMapPointsFromScooters', () => {
  test('generates valid lat/lng from scooter data', () => {
    const scooters = [
      { id: 1, gps: { lat: 53.8008, lng: -1.5491 } },
      { id: 2, latitude: 53.81, longitude: -1.55 },
    ];
    const points = buildMapPointsFromScooters(scooters);
    expect(points).toHaveLength(2);
    expect(points[0].latitude).toBe(53.8008);
    expect(points[0].longitude).toBe(-1.5491);
    expect(points[1].latitude).toBe(53.81);
  });

  test('generates fallback coordinates when all lat/lng are zero', () => {
    const scooters = [
      { id: 1, latitude: 0, longitude: 0 },
      { id: 2, latitude: 0, longitude: 0 },
    ];
    const points = buildMapPointsFromScooters(scooters);
    expect(points).toHaveLength(2);
    // Should spread points around 53.8008, -1.5491
    expect(points[0].latitude).not.toBe(0);
    expect(points[0].longitude).not.toBe(0);
  });

  test('caps at 20 points', () => {
    const scooters = Array.from({ length: 30 }, (_, i) => ({
      id: i + 1,
      gps: { lat: 50 + i * 0.1, lng: -1 },
    }));
    const points = buildMapPointsFromScooters(scooters);
    expect(points).toHaveLength(20);
  });

  test('returns empty array for empty input', () => {
    expect(buildMapPointsFromScooters([])).toEqual([]);
    expect(buildMapPointsFromScooters(null)).toEqual([]);
  });
});

// ── ensureMinimumMapPoints ─────────────────────────────────────────

describe('ensureMinimumMapPoints', () => {
  test('returns points as-is when count meets minimum', () => {
    const points = [
      { id: 1, latitude: 51, longitude: -1 },
      { id: 2, latitude: 52, longitude: -2 },
      { id: 3, latitude: 53, longitude: -3 },
      { id: 4, latitude: 54, longitude: -4 },
      { id: 5, latitude: 55, longitude: -5 },
    ];
    const result = ensureMinimumMapPoints(points, 5);
    expect(result).toHaveLength(5);
  });

  test('fills in missing points from scooters global when below minimum', () => {
    // Populate the scooters global (empty by default; defaults only used on API failure)
    const mockScooters = Array.from({ length: 6 }, (_, i) => ({
      id: i + 1,
      gps: { lat: 50 + i, lng: -1 },
      latitude: 50 + i,
      longitude: -1,
    }));
    // Replace scooters array with mock data
    scooters.splice(0, scooters.length, ...mockScooters);

    const points = [{ id: 99, latitude: 51, longitude: -1 }];
    const result = ensureMinimumMapPoints(points, 5);
    expect(result.length).toBeGreaterThanOrEqual(5);
  });

  test('filters out invalid lat/lng', () => {
    const points = [
      { id: 1, latitude: 51, longitude: -1 },
      { id: 2, latitude: 'bad', longitude: null },
      { id: 3, latitude: undefined, longitude: undefined },
    ];
    const result = ensureMinimumMapPoints(points, 3);
    // Only the first point is valid; fallback fills the rest
    const validFromInput = result.filter(p => p.id === 1);
    expect(validFromInput).toHaveLength(1);
  });

  test('defaults minCount to 5', () => {
    // Populate scooters global for fallback generation
    const mockScooters = Array.from({ length: 6 }, (_, i) => ({
      id: i + 1,
      gps: { lat: 50 + i, lng: -1 },
      latitude: 50 + i,
      longitude: -1,
    }));
    scooters.splice(0, scooters.length, ...mockScooters);

    const result = ensureMinimumMapPoints([]);
    expect(result.length).toBeGreaterThanOrEqual(5);
  });
});

// ── apiFetch ───────────────────────────────────────────────────────

describe('apiFetch', () => {
  beforeEach(() => {
    resetGlobals();
  });

  test('adds Authorization header when token is present', async () => {
    localStorage.setItem('authToken', 'test-jwt-token');
    fetch.mockResolvedValue({ ok: true, json: () => Promise.resolve({}) });

    await apiFetch('/api/test');

    expect(fetch).toHaveBeenCalledWith('/api/test', expect.objectContaining({
      headers: expect.objectContaining({
        Authorization: 'Bearer test-jwt-token',
      }),
    }));
  });

  test('sends request without Authorization when no token', async () => {
    fetch.mockResolvedValue({ ok: true, json: () => Promise.resolve({}) });

    await apiFetch('/api/public');

    const callArgs = fetch.mock.calls[0][1];
    expect(callArgs.headers.Authorization).toBeUndefined();
  });

  test('adds Content-Type: application/json by default', async () => {
    fetch.mockResolvedValue({ ok: true, json: () => Promise.resolve({}) });

    await apiFetch('/api/test');

    expect(fetch).toHaveBeenCalledWith('/api/test', expect.objectContaining({
      headers: expect.objectContaining({
        'Content-Type': 'application/json',
      }),
    }));
  });

  test('merges custom headers', async () => {
    localStorage.setItem('authToken', 'tok');
    fetch.mockResolvedValue({ ok: true, json: () => Promise.resolve({}) });

    await apiFetch('/api/test', {
      headers: { 'X-Custom': 'value' },
    });

    const headers = fetch.mock.calls[0][1].headers;
    expect(headers['X-Custom']).toBe('value');
    expect(headers.Authorization).toBe('Bearer tok');
  });

  test('returns fetch response directly', async () => {
    const mockResponse = { ok: false, status: 404 };
    fetch.mockResolvedValue(mockResponse);

    const result = await apiFetch('/api/missing');
    expect(result).toBe(mockResponse);
  });
});

// ── getModelImage ──────────────────────────────────────────────────

describe('getModelImage', () => {
  test('replaces spaces with underscores', () => {
    const result = getModelImage('EcoRide X2');
    expect(result).toBe('images/EcoRide_X2.png');
  });

  test('handles multi-word model names', () => {
    const result = getModelImage('Eco Ride Pro Max');
    expect(result).toBe('images/Eco_Ride_Pro_Max.png');
  });
});

// ── getCurrentUserId / getCurrentUsername ──────────────────────────

describe('getCurrentUserId and getCurrentUsername', () => {
  beforeEach(() => {
    resetGlobals();
    // currentUser is a let defined by core.js, we set it via the global
  });

  test('getCurrentUserId returns null when no user', () => {
    // Reload core.js vars — currentUser starts as null from eval
    expect(getCurrentUserId()).toBeNull();
  });

  test('getCurrentUsername returns empty string when no user', () => {
    expect(getCurrentUsername()).toBe('');
  });
});

// ── formatCurrency ─────────────────────────────────────────────────

describe('formatCurrency', () => {
  test('formats integer to $XX.00', () => {
    expect(formatCurrency(15)).toBe('$15.00');
  });

  test('formats decimal', () => {
    expect(formatCurrency(9.99)).toBe('$9.99');
  });

  test('returns $0.00 for null/undefined', () => {
    expect(formatCurrency(null)).toBe('$0.00');
    expect(formatCurrency(undefined)).toBe('$0.00');
  });

  test('returns $NaN for non-numeric string (JS Number coercion)', () => {
    // Number('abc') is NaN, NaN.toFixed(2) is 'NaN'
    expect(formatCurrency('abc')).toBe('$NaN');
  });
});

// ── isValidCardNumber ──────────────────────────────────────────────

describe('isValidCardNumber', () => {
  test('accepts valid 16-digit number', () => {
    // 4111111111111111 passes Luhn
    expect(isValidCardNumber('4111111111111111')).toBe(true);
  });

  test('accepts 16-digit number even if Luhn fails (first check)', () => {
    // Any 16 digits pass the first regex check
    expect(isValidCardNumber('1000000000000000')).toBe(true);
  });

  test('validates shorter numbers with Luhn', () => {
    // 79927398713 is Luhn-valid
    expect(isValidCardNumber('79927398713')).toBe(true);
  });

  test('rejects Luhn-invalid short number', () => {
    expect(isValidCardNumber('79927398714')).toBe(false);
  });

  test('rejects non-numeric', () => {
    expect(isValidCardNumber('abcd')).toBe(false);
  });
});

// ── isStrongPassword ───────────────────────────────────────────────

describe('isStrongPassword', () => {
  test('accepts strong password', () => {
    expect(isStrongPassword('Abcdef1!')).toBe(true);
  });

  test('rejects too short', () => {
    expect(isStrongPassword('Abc1!')).toBe(false);
  });

  test('rejects missing uppercase', () => {
    expect(isStrongPassword('abcdef1!')).toBe(false);
  });

  test('rejects missing digit', () => {
    expect(isStrongPassword('Abcdefg!')).toBe(false);
  });

  test('rejects missing special char', () => {
    expect(isStrongPassword('Abcdef12')).toBe(false);
  });

  test('rejects null/undefined', () => {
    expect(isStrongPassword(null)).toBe(false);
    expect(isStrongPassword(undefined)).toBe(false);
  });
});

// ── normalizeScooterStatus ─────────────────────────────────────────

describe('normalizeScooterStatus', () => {
  test('maps "normal" to "available"', () => {
    expect(normalizeScooterStatus('normal')).toBe('available');
  });

  test('returns "available" for falsy', () => {
    expect(normalizeScooterStatus(null)).toBe('available');
    expect(normalizeScooterStatus('')).toBe('available');
  });

  test('preserves known statuses', () => {
    expect(normalizeScooterStatus('rented')).toBe('rented');
    expect(normalizeScooterStatus('maintenance')).toBe('maintenance');
  });
});
