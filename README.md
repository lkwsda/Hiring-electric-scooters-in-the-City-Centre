# E-Scooter Rental System

Software Engineering Project for hiring electric scooters in the City Centre — XJCO2913, University of Leeds.

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
| Build | Maven |
| Frontend | HTML5, CSS3, JavaScript (ES6+), Leaflet, Chart.js |
| Testing | JUnit 5, Pytest, Jest |
| CI/CD | GitHub Actions |

## Prerequisites

- JDK 21
- Maven 3.9+
- MySQL 8.0
- Python 3.12+ (for API tests)
- Node.js (for JS tests)

## Quick Start

### 1. Initialize Database

```bash
mysql -u root -p < sql/init_db.sql
```

The script creates the `scooter_sharing` database, all tables, and seeds initial data
(test users, admin account, scooters, and rental packages).

### 2. Configure Database Connection

Edit `src/main/resources/application.properties`:

```properties
spring.datasource.url=jdbc:mysql://localhost:3306/scooter_sharing?serverTimezone=UTC
spring.datasource.username=root
spring.datasource.password=123123
```

### 3. Build & Run

```bash
mvn clean package -DskipTests
java -jar target/ScooterRentalSystem-1.0-SNAPSHOT.jar
```

Or run directly with Maven:

```bash
mvn spring-boot:run
```

### 4. Open in Browser

```
http://localhost:8080
```

### Test Accounts

| Role | Username | Password |
|------|----------|----------|
| Admin | admin | 123456 |
| User | student | 12345678 |
| User | grandpa | 87654321 |

## Running Tests

### Java Unit Tests

```bash
mvn test
```

### Python API Tests

```bash
pip install pytest requests
python test/test_run_all_api.py
```

### JavaScript Tests

```bash
npm install
npm test
```

## Project Structure

```
src/
├── main/
│   ├── java/org/example/
│   │   ├── controller/    # REST API controllers
│   │   ├── service/       # Business logic
│   │   ├── dao/           # Data access layer
│   │   ├── model/         # Domain models
│   │   └── exception/     # Global exception handling
│   └── resources/
│       ├── application.properties
│       └── static/        # Frontend (HTML/CSS/JS)
├── test/
│   ├── java/              # JUnit tests
│   └── js/                # Jest tests
sql/
├── init_db.sql            # Database schema & seed data
test/
├── cases/API/             # Python API test scripts
└── test_run_all_api.py    # API test runner
docs/                      # Supplementary documentation
```

## CI/CD

GitHub Actions workflow (`.github/workflows/maven.yml`) runs on every push to `main`:

1. Build with Maven (JDK 21)
2. Initialize MySQL database
3. Start Spring Boot application
4. Run Python API tests
5. Upload test reports and JAR artifacts
