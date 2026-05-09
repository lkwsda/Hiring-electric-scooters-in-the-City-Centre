# System Design Report

## 1. Architecture Overview

The system adopts a **monolithic architecture with frontend-backend separation**: Spring Boot REST API on the backend, Vanilla JavaScript SPA on the frontend.

```
┌─────────────────────────────────────────────────────────────┐
│                      Client (Browser)                        │
│  ┌──────────┐ ┌──────────┐ ┌────────┐ ┌──────────────────┐ │
│  │ index.html│ │   CSS   │ │   JS   │ │ Leaflet/Chart.js │ │
│  │  (SPA)   │ │ (7 files)│ │(6 files)│ │   (Libraries)   │ │
│  └──────────┘ └──────────┘ └────────┘ └──────────────────┘ │
└─────────────────────┬───────────────────────────────────────┘
                      │ HTTP/REST (JSON) + JWT Bearer Token
┌─────────────────────▼───────────────────────────────────────┐
│                   Spring Boot Server                          │
│  ┌──────────────────────────────────────────────────────┐   │
│  │                  JwtFilter (/api/*)                    │   │
│  └──────────────────────┬───────────────────────────────┘   │
│  ┌──────────────────────▼───────────────────────────────┐   │
│  │              Controller Layer (5 controllers)          │   │
│  │   UserController │ ScooterController │ BookingController│   │
│  │        IssueController │ PackageController             │   │
│  └──────────────────────┬───────────────────────────────┘   │
│  ┌──────────────────────▼───────────────────────────────┐   │
│  │               Service Layer (6 services)               │   │
│  │   UserService │ ScooterService │ BookingService        │   │
│  │   IssueService │ PackageService │ NotificationService  │   │
│  └──────────────────────┬───────────────────────────────┘   │
│  ┌──────────────────────▼───────────────────────────────┐   │
│  │                DAO Layer (5 DAOs)                      │   │
│  │   UserDAO │ ScooterDAO │ BookingDAO                    │   │
│  │        IssueDAO │ PackageDAO                           │   │
│  └──────────────────────┬───────────────────────────────┘   │
└─────────────────────────┬────────────────────────────────────┘
                          │ JDBC (JdbcTemplate)
┌─────────────────────────▼────────────────────────────────────┐
│                    MySQL 8.0 Database                         │
│   users │ scooters │ packages │ bookings │ issues              │
└──────────────────────────────────────────────────────────────┘
```

## 2. Technology Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Backend Framework | Spring Boot | 3.2.2 |
| Build Tool | Maven | 3.9 |
| Database | MySQL | 8.0 |
| Data Access | Spring JDBC (JdbcTemplate) | - |
| Authentication | JWT (jjwt) + BCrypt | 0.12.5 |
| Encryption | AES-128 (custom CryptoUtil) | - |
| Email | Spring Boot Mail (MailDev) | - |
| API Documentation | SpringDoc OpenAPI (Swagger) | 2.3.0 |
| Frontend | HTML5 + CSS3 + Vanilla JS | ES6+ |
| Maps | Leaflet.js | 1.9.4 |
| Charts | Chart.js | - |
| Testing | JUnit 5 / Jest / Pytest / Selenium | - |
| Container | Docker + Docker Compose | - |
| CI/CD | GitHub Actions | - |

## 3. Database Design

### 3.1 Entity-Relationship Diagram

```
┌──────────┐       ┌──────────────┐       ┌──────────┐
│  users   │───<   │   bookings    │   >───│ scooters │
│──────────│       │──────────────│       │──────────│
│ id (PK)  │       │ id (PK)      │       │ id (PK)  │
│ username │       │ user_id (FK)  │       │ model    │
│ email    │       │ scooter_id(FK)│       │ battery  │
│ password │       │ package_id(FK)│       │ lat/lng  │
│ role     │       │ start_time    │       │ status   │
│ dob      │       │ end_time      │       └──────────┘
│ card_num │       │ total_cost    │
└──────────┘       │ status        │       ┌──────────┐
      │            │ guest_name    │       │ packages │
      │            │ guest_phone   │       │──────────│
      │            └───────────────┘       │ id (PK)  │
      │                    │               │ type     │
      │            ┌───────┘               │ price    │
      ▼            ▼                       │ discount │
┌──────────┐  FK: package_id              └──────────┘
│  issues  │
│──────────│
│ id (PK)  │
│ user_id (FK)
│ scooter_id(FK)
│ description
│ status   │
│ priority │
└──────────┘
```

### 3.2 Table Schemas

**users** — User accounts
| Column | Type | Constraints |
|--------|------|-------------|
| id | INT | PK, AUTO_INCREMENT |
| username | VARCHAR(50) | NOT NULL, UNIQUE |
| email | VARCHAR(100) | NOT NULL, UNIQUE |
| password_hash | VARCHAR(255) | NOT NULL (BCrypt) |
| role | ENUM('user','admin') | DEFAULT 'user' |
| date_of_birth | DATE | NULLABLE |
| credit_card_number | VARCHAR(255) | NULLABLE (AES encrypted) |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP |

**scooters** — Scooter fleet
| Column | Type | Constraints |
|--------|------|-------------|
| id | INT | PK, AUTO_INCREMENT |
| model | VARCHAR(50) | NOT NULL |
| image_url | VARCHAR(255) | NULLABLE |
| battery_level | INT | DEFAULT 100 |
| latitude | DECIMAL(10,8) | GPS latitude |
| longitude | DECIMAL(11,8) | GPS longitude |
| status | ENUM('available','rented','maintenance') | DEFAULT 'available' |

**packages** — Rental packages
| Column | Type | Constraints |
|--------|------|-------------|
| id | INT | PK, AUTO_INCREMENT |
| package_type | VARCHAR(50) | NOT NULL |
| price | DECIMAL(10,2) | NOT NULL |
| description | VARCHAR(255) | NULLABLE |
| discount_percent | INT | DEFAULT 0 |

**bookings** — Rental orders
| Column | Type | Constraints |
|--------|------|-------------|
| id | INT | PK, AUTO_INCREMENT |
| user_id | INT | FK → users(id), NULLABLE |
| package_id | INT | FK → packages(id) |
| scooter_id | INT | FK → scooters(id), NOT NULL |
| start_time | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP |
| end_time | TIMESTAMP | NULLABLE |
| total_cost | DECIMAL(10,2) | DEFAULT 0.00 |
| status | ENUM('pending','paid','canceled','finished') | DEFAULT 'pending' |
| guest_name | VARCHAR(50) | For proxy bookings |
| guest_phone | VARCHAR(20) | For proxy bookings |

**issues** — Fault reports
| Column | Type | Constraints |
|--------|------|-------------|
| id | INT | PK, AUTO_INCREMENT |
| user_id | INT | FK → users(id), NOT NULL |
| scooter_id | INT | FK → scooters(id), NOT NULL |
| description | TEXT | NOT NULL |
| status | ENUM('pending','in_progress','resolved') | DEFAULT 'pending' |
| priority | ENUM('low','medium','high') | DEFAULT 'medium' |
| reported_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP |

## 4. Module Design

### 4.1 Backend Modules

```
src/main/java/org/example/
├── ScooterApplication.java          # Spring Boot entry point, auto-creates admin on startup
├── config/
│   ├── CryptoConfig.java            # AES key loading
│   └── JwtFilter.java               # JWT authentication filter
├── controller/                       # REST controllers (5)
│   ├── UserController.java          #   /api/users/*
│   ├── ScooterController.java       #   /api/scooters/*
│   ├── BookingController.java       #   /api/bookings/*
│   ├── IssueController.java         #   /api/issues/*
│   └── PackageController.java       #   /api/packages/*
├── service/                          # Business logic layer (6 interfaces + 6 implementations)
│   ├── UserService/Impl             #   Registration, login, discount calculation
│   ├── ScooterService/Impl          #   Scooter CRUD, validation
│   ├── BookingService/Impl          #   Booking, payment, cancellation, extension, revenue reports
│   ├── IssueService/Impl            #   Feedback management
│   ├── PackageService/Impl          #   Package price management
│   └── NotificationService/Impl     #   Email notifications
├── dao/                              # Data access layer (5 interfaces + 5 implementations)
│   ├── UserDAO/Impl                 #   User CRUD + card number decryption
│   ├── ScooterDAO/Impl              #   Scooter CRUD + FOR UPDATE locking
│   ├── BookingDAO/Impl              #   Order CRUD + revenue statistics
│   ├── IssueDAO/Impl                #   Feedback CRUD
│   └── PackageDAO/Impl              #   Package query/update
├── model/                            # Data models / DTOs (8)
├── exception/
│   └── GlobalExceptionHandler.java  # Global exception → HTTP 400
└── util/
    ├── CryptoUtil.java              # AES-128 encryption/decryption
    └── JwtUtil.java                 # JWT generation/validation
```

### 4.2 Frontend Modules

```
src/main/resources/static/
├── index.html                        # Single-page application entry point
├── css/
│   ├── base.css                      # Reset, typography, color scheme, layout
│   ├── header.css                    # Navigation bar
│   ├── components.css                # Cards, buttons, badges, modals
│   ├── forms.css                     # Form elements
│   ├── pages.css                     # Page-specific styles
│   ├── animations.css                # Transitions, slide effects
│   └── responsive.css                # Media queries for mobile/tablet
└── js/
    ├── utils.js                      # Utility functions (formatting, validation)
    └── modules/
        ├── core.js                   # Global state, API layer, map rendering
        ├── ui-and-render.js          # UI rendering, carousel, charts
        ├── auth-booking-flow.js      # Login, register, book, pay flows
        ├── booking-actions-and-detail.js  # Order operations
        ├── admin.js                  # Admin dashboard
        └── navigation-and-init.js    # Navigation wiring, initialization
```

## 5. API Design

### 5.1 User Module (`/api/users`)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/users/register` | No | Register new user |
| POST | `/api/users/login` | No | Login, returns JWT |
| GET | `/api/users` | Yes (admin) | Get all users |
| GET | `/api/users/discount-rate` | Yes | Get current user's discount rate |

### 5.2 Scooter Module (`/api/scooters`)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/scooters` | List all scooters |
| GET | `/api/scooters/{id}` | Get single scooter |
| POST | `/api/scooters` | Add scooter (admin) |
| DELETE | `/api/scooters/{id}` | Delete scooter (admin) |
| GET | `/api/scooters/locations` | Get map location data |

### 5.3 Booking Module (`/api/bookings`)

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/bookings/place` | Create booking |
| GET | `/api/bookings/user` | Get user's bookings |
| POST | `/api/bookings/{id}/pay` | Pay for booking |
| POST | `/api/bookings/{id}/cancel` | Cancel booking |
| POST | `/api/bookings/{id}/end` | End rental |
| POST | `/api/bookings/{id}/extend` | Extend booking |
| POST | `/api/bookings/admin/place` | Proxy booking (admin) |
| GET | `/api/bookings/admin/revenue` | Weekly revenue by package |
| GET | `/api/bookings/admin/revenue/daily` | Daily revenue |

### 5.4 Issue Module (`/api/issues`)

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/issues` | Submit feedback |
| GET | `/api/issues` | View all feedback |
| PUT | `/api/issues/{id}/resolve` | Resolve feedback (admin) |

### 5.5 Package Module (`/api/packages`)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/packages` | Get all packages |
| PUT | `/api/packages/{id}/price` | Update price (admin) |

## 6. Security Design

```
┌────────────┐     ┌──────────┐     ┌──────────┐
│   Client   │────>│ JwtFilter│────>│Controller│
│  (Browser) │     │ /api/*   │     │          │
└────────────┘     └──────────┘     └──────────┘
     │                   │
     │  JWT Bearer Token │  BCrypt password hashing
     │  30-min expiry     │  AES-128 card encryption
     ▼                   ▼
  Login/Register     All /api/* endpoints
  No auth required   Require valid JWT
```

- **Authentication**: JWT (HMAC-SHA), 30-minute expiry
- **Passwords**: BCrypt hashing
- **Credit Cards**: AES-128 encrypted at rest, decrypted on read
- **Public Paths**: `/api/users/login`, `/api/users/register`, and static resources
- **Concurrency Control**: `SELECT ... FOR UPDATE` pessimistic locking to prevent double-booking

## 7. Deployment Architecture

```
┌──────────────────────────────────────────────┐
│           Docker Compose                      │
│  ┌─────────────────┐  ┌─────────────────┐    │
│  │  app (Spring)   │  │  mysql:8.0      │    │
│  │  port 8080       │  │  port 3306      │    │
│  │  health: curl    │  │  health: ping   │    │
│  └────────┬────────┘  └────────┬────────┘    │
│           │                    │              │
│           └──────────┬─────────┘              │
│                      │ JDBC                   │
│                      ▼                        │
│           scooter_sharing DB                  │
└──────────────────────────────────────────────┘
```

Dockerfile uses multi-stage build:
- **Stage 1 (Build)**: `maven:3.9-eclipse-temurin-21-alpine` → `mvn clean package -DskipTests`
- **Stage 2 (Runtime)**: `eclipse-temurin:21-jre-jammy` → `java -jar app.jar`
