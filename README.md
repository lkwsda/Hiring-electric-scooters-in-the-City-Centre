# E-Scooter Rental System

Software Engineering Project for hiring electric scooters in the City Centre — XJCO2913, University of Leeds.

## 🚩Project Board
(https://github.com/users/Hal1wn/projects/1)
## Team

| Role | Member |
|------|--------|
| Scrum Master | Zhong Yuqi |
| Documentation Lead | Zheng Haowen |
| Backend Development | Wang Kongling |
| Frontend Development | Ma Changyuan |
| Testing / QA | Yang Juntao |

## Tech Stack

| Layer | Technology |
|-------|------------|
| Backend | Java 21, Spring Boot 3.2.2 |
| Database | MySQL 8.0 |
| Build | Maven 3.9 |
| Frontend | HTML5, CSS3, JavaScript (ES6+), Leaflet, Chart.js |
| Testing | JUnit 5, Jest, Pytest, Selenium |
| CI/CD | GitHub Actions |
| Container | Docker, Docker Compose |

## Prerequisites

- JDK 21
- Maven 3.9+
- MySQL 8.0 (or Docker)
- Python 3.12+ (for API / E2E tests)
- Node.js 20+ (for JS tests)

## Quick Start

### Option 1: Docker Compose (recommended)

```bash
docker compose up -d --wait
```

This starts MySQL 8.0 (auto-initializes the database from `sql/init_db.sql`) and the Spring Boot app on `http://localhost:8080`.

To stop and clean up:

```bash
docker compose down -v
```

### Option 2: Manual Setup

#### 1. Initialize Database

```bash
mysql -u root -p < sql/init_db.sql
```

The script creates the `scooter_sharing` database, all tables, and seeds initial data
(test users, admin account, scooters, and rental packages).

#### 2. Configure Database Connection

Edit `src/main/resources/application.properties`:

```properties
spring.datasource.url=jdbc:mysql://localhost:3306/scooter_sharing?serverTimezone=UTC
spring.datasource.username=root
spring.datasource.password=123123
```

#### 3. Build & Run

```bash
mvn clean package -DskipTests
java -jar target/ScooterRentalSystem-1.0-SNAPSHOT.jar
```

Or run directly with Maven:

```bash
mvn spring-boot:run
```

#### 4. Open in Browser

```
http://localhost:8080
```

API docs (Swagger UI):

```
http://localhost:8080/swagger-ui.html
```

## Running Tests

### Java Unit Tests

Uses H2 in-memory database (no MySQL required):

```bash
mvn test
```

### JavaScript Unit Tests

```bash
npm install
npm test
```

Test files:
- `src/test/js/utils.test.js` — utility functions (formatting, validation)
- `src/test/js/core.test.js` — data normalization, API wrapper, map points
- `src/test/js/auth-booking-flow.test.js` — login, register, booking, payment, issue forms

### Python API Tests

Requires the app running on `localhost:8080`:

```bash
pip install pytest requests
python test/test_run_all_api.py
```

Test files in `test/cases/API/` — user auth, scooter CRUD, booking, payment, issues, packages.

### E2E UI Tests (Selenium)

Requires the app running on `localhost:8080` and Chrome installed:

```bash
pip install selenium
python test/test_run_all_e2e.py
```

Test files in `test/cases/E2E/`:

| File | Flow |
|------|------|
| `test_selenium_auth_flow.py` | Registration → Login → Logout |
| `test_selenium_main_flow.py` | Browse → Rent → Pay → Success |
| `test_selenium_admin_flow.py` | Admin dashboard operations |
| `test_selenium_issue_flow.py` | Issue reporting → Admin review |

## Project Structure

```
src/
├── main/
│   ├── java/org/example/
│   │   ├── controller/      # REST API controllers
│   │   ├── service/         # Business logic
│   │   ├── dao/             # Data access layer
│   │   ├── model/           # Domain models
│   │   └── exception/       # Global exception handling
│   └── resources/
│       ├── application.properties
│       └── static/
│           ├── index.html
│           ├── css/
│           └── js/modules/  # Frontend modules (core, auth, admin, etc.)
├── test/
│   ├── java/                # JUnit tests
│   └── js/                  # Jest tests
sql/
└── init_db.sql              # Database schema & seed data
test/
├── cases/
│   ├── API/                 # Python API test scripts
│   └── E2E/                 # Selenium E2E test scripts
├── test_run_all_api.py      # API test runner
└── test_run_all_e2e.py      # E2E test runner
docs/                         # Supplementary documentation
```

## CI/CD

GitHub Actions workflow (`.github/workflows/maven.yml`) triggers on push / PR to `main`:

```
java-tests ──┐
              ├──> docker ──> integration-tests
js-tests ────┘
```

| Job | Description |
|-----|-------------|
| **java-tests** | JUnit 5 with H2 in-memory (Maven) |
| **js-tests** | Jest + jsdom (Node.js) |
| **docker** | Multi-stage Docker build, pushes to [ghcr.io](https://ghcr.io) on merge to main |
| **integration-tests** | Docker Compose starts MySQL + App, runs Python API tests and Selenium E2E tests |

## Docker Image

Pre-built images are published to GitHub Container Registry:

```bash
docker pull ghcr.io/xnjd666/Hiring-electric-scooters-in-the-City-Centre:latest
docker run -p 8080:8080 ghcr.io/xnjd666/Hiring-electric-scooters-in-the-City-Centre:latest
```

## API Endpoints

Full API documentation available at `http://localhost:8080/swagger-ui.html` when the app is running.

| Group | Endpoints |
|-------|-----------|
| Users | `POST /api/users/register`, `POST /api/users/login`, `GET /api/users` |
| Scooters | `GET /api/scooters`, `PUT /api/scooters/{id}/status` |
| Bookings | `POST /api/bookings/place`, `POST /api/bookings/pay/{id}` |
| Issues | `POST /api/issues/report`, `GET /api/issues` |
| Packages | `GET /api/packages`, `POST /api/packages` |

Authentication: JWT Bearer token (obtained via `/api/users/login`).
