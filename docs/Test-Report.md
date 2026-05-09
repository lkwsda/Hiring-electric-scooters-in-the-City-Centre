# Software Test Report

## 1. Test Strategy

This system adopts a **multi-layer test pyramid** strategy, covering unit tests, integration tests, API tests, and end-to-end tests across four levels:

```
         ┌───────┐
         │  E2E  │  4 Selenium UI tests
        ┌┴───────┴┐
        │   API   │  10 Python API test scripts (34 cases)
       ┌┴─────────┴┐
       │ Integration│  5 DAO integration tests (H2 in-memory DB)
      ┌┴────────────┴┐
      │    Unit       │  11 Service tests + 5 Controller tests + 3 JS test files
      └───────────────┘
```

| Test Level | Technology | Count | Run Command |
|------------|-----------|-------|-------------|
| Java Unit | JUnit 5 + Mockito | ~17 classes | `mvn test` |
| Java DAO Integration | JUnit 5 + H2 | 5 classes | `mvn test` (auto) |
| JavaScript Unit | Jest + jsdom | 3 files (~86 cases) | `npm test` |
| Python API | requests + pytest | 10 scripts (34 cases) | `python test/test_run_all_api.py` |
| Python E2E | Selenium WebDriver | 4 scripts | `python test/test_run_all_e2e.py` |

---

## 2. Unit Tests

### 2.1 Java Service Layer Tests

Uses Mockito to isolate DAO dependencies and test business logic.

**BookingServiceImplTest** (most comprehensive):
| Test Method | Scenarios | Coverage |
|-------------|-----------|----------|
| placeBooking | 8 | Success, non-existent scooter, unavailable scooter, frequent-user discount (20%), student discount (10%), senior discount (10%), discount stacking (best rate), null dateOfBirth |
| endTrip | 2 | Success, booking not found |
| processPayment | 5 | Success, null card, empty card, non-pending booking, already-canceled booking |
| cancelBooking | 4 | Paid, pending, already canceled, not found |
| extendBooking | 3 | Success, not found, non-paid booking |
| adminProxyBooking | 4 | Success, null name, empty name, scooter unavailable |
| getWeeklyRevenue | 1 | Normal statistics |
| getDailyRevenue | 2 | Zero revenue, missing days filled |

**Other Service Tests**:
- UserServiceImplTest: Registration (duplicate username/email), login (success/failure), discount rate calculation
- ScooterServiceImplTest: Add scooter (rejects <100% battery)
- IssueServiceImplTest: Submit feedback, query, resolve
- PackageServiceImplTest: Query, price update (rejects negative prices)
- NotificationServiceImplTest: Email sending

### 2.2 Java Controller Layer Tests

Uses `@WebMvcTest` + MockMvc to test HTTP layer behavior.

| Controller | Scenarios | Verification |
|------------|-----------|-------------|
| BookingControllerTest | 11 | placeBooking, getUserBookings, processPayment, cancelBooking, endTrip, extendBooking, adminProxyBooking, getWeeklyRevenue, getDailyRevenue |
| UserControllerTest | 6 | register, login, getAllUsers, getDiscountRate |
| ScooterControllerTest | 5 | getAll, getById, add, delete, getLocations |
| IssueControllerTest | 4 | report, getAll, resolve |
| PackageControllerTest | 3 | getAll, updatePrice |

Error path verification: Service-layer `RuntimeException` correctly maps to HTTP 400.

### 2.3 Java DAO Integration Tests

Uses `@SpringBootTest` + H2 in-memory database + `@Transactional` rollback.

| DAO | Scenarios | Coverage |
|-----|-----------|----------|
| BookingDAOImplTest | 10 | create, getByUserId, getStatusById, updateStatus, updateEndTime, updateCost, getById (exists/not found), getWeeklyRevenue, getDailyRevenue, getTotalRentalMinutes |
| UserDAOImplTest | 5 | add, getByName, getAll, exists, update |
| ScooterDAOImplTest | 7 | getAll (verifies 6 seed scooters), getById, add, updateStatus (3 states), update, delete, findAvailable |

### 2.4 JavaScript Unit Tests (Jest)

- **utils.test.js**: 29 cases — formatCurrency(4), normalizeCardNumber(2), maskCardNumber(3), isValidCardNumber(6 including Luhn), isStrongPassword(8 including null/undefined), normalizeScooterStatus(3), normalizePackageTypeText(3)
- **core.test.js**: 57 cases — normalizeScooter(11), getScooterSpecs(6), resolveScooterImage(5), buildMapPoints(4), ensureMinimumMapPoints(4), apiFetch(5), getModelImage(2), auth helpers(2), utility functions(18)
- **auth-booking-flow.test.js**: Tests login/register form handling logic

---

## 3. API Tests

Python + requests library, 10 independent test scripts, 34 test cases total.

| Script | Cases | Test Content |
|--------|-------|-------------|
| test_user_register.py | 3 | Normal registration, duplicate username, missing fields |
| test_user_login.py | 3 | Normal login, wrong password, non-existent user |
| test_user_list.py | 3 | Get user list, authorization check |
| test_scooter_list.py | 3 | Get scooter list, field completeness verification |
| test_scooter_locations.py | 3 | Get location data, coordinate format validation |
| test_scooter_management.py | 3 | Add/delete scooter |
| test_package_api.py | 3 | Get packages, update price, reject negative price |
| test_booking_place.py | 3 | Create booking, pay, cancel |
| test_booking_extra_api.py | 7 | Extend, end, revenue reports |
| test_issue_api.py | 3 | Submit feedback, view, resolve |

**Latest Test Results** (2026-05-09):

```
✅ test_user_register.py      — PASS (3/3)
✅ test_user_login.py         — PASS (3/3)
✅ test_user_list.py          — PASS (3/3)
✅ test_scooter_list.py       — PASS (3/3)
✅ test_scooter_locations.py  — PASS (3/3)
✅ test_scooter_management.py — PASS (3/3)
✅ test_package_api.py        — PASS (3/3)
✅ test_booking_place.py      — PASS (3/3)
✅ test_booking_extra_api.py  — PASS (7/7)
✅ test_issue_api.py          — PASS (3/3)
────────────────────────────────────────
   Total: 10/10 scripts passed, 34/34 cases passed
```

---

## 4. End-to-End Tests

Selenium WebDriver + Chrome Headless, 4 test scenarios.

| Test | Flow |
|------|------|
| **test_selenium_auth_flow** | Register new user → Login → Verify login state → Logout |
| **test_selenium_main_flow** | Login → Browse scooters → Pagination → Click rent → Select package → Fill payment → Verify success page → Verify My Rentals |
| **test_selenium_admin_flow** | Admin login → View overview KPIs → Scooter management → Package pricing → User list → Revenue charts |
| **test_selenium_issue_flow** | Submit feedback → Admin view → Set priority → Resolve |

Configuration: Chrome `--headless`, 1920×1080, WebDriverWait 10s, screenshots on failure.

---

## 5. CI/CD Test Pipeline

```
Push/PR to main
      │
      ▼
┌─────────────┐     ┌─────────────┐
│ java-tests  │     │  js-tests   │  ← Run in parallel
│ mvn test    │     │  npm test   │
└──────┬──────┘     └──────┬──────┘
       │    ┌──────────────┘
       ▼    ▼
   ┌──────────────┐
   │    docker    │  ← Runs only if java+js tests pass
   │  build+push  │
   └──────┬───────┘
          ▼
   ┌──────────────────┐
   │ integration-tests│  ← Runs only if Docker build succeeds
   │ docker compose up │
   │ Python API tests  │
   │ Selenium E2E tests│
   │ docker compose down│
   └──────────────────┘
```

**Triggers**: Push to `main` branch or PR to `main` branch  
**Artifacts**: Test reports (Markdown) + application logs → uploaded as GitHub Artifacts  
**Caching**: Maven cache, npm cache, Docker GHA cache

---

## 6. Test Coverage Summary

| Level | Test Count | Pass Rate | Notes |
|-------|-----------|-----------|-------|
| Java Unit (Service) | ~40 scenarios | 100% | Core business logic covered |
| Java Unit (Controller) | ~29 scenarios | 100% | HTTP endpoints covered |
| Java Integration (DAO) | ~22 scenarios | 100% | H2 in-memory, SQL verified |
| JavaScript Unit | ~86 cases | 100% | Utility functions + core logic |
| Python API | 34 cases | 100% | Tested against real MySQL in Docker |
| Python E2E | 4 flows | 100% | Selenium UI automation |
| **Total** | **~215+** | **100%** | |

---

## 7. Improvement Recommendations

1. **Code Coverage**: Recommend adding JaCoCo for coverage reporting — currently no coverage metrics
2. **E2E Test Reports**: Currently only API tests generate Markdown reports; E2E should receive equal treatment
3. **Performance Testing**: Recommend adding JMeter or k6 load tests
4. **Security Testing**: Recommend adding OWASP ZAP or dependency vulnerability scanning
5. **Python Test Framework**: Recommend migrating API tests to pytest framework with fixtures and parameterization
