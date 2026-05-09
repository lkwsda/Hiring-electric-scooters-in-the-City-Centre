# Software Requirements Specification (SRS)

## 1. Introduction

### 1.1 Project Background

This project is part of XJCO2913 Software Engineering Project, developing an **Electric Scooter Hiring System for the City Centre**. Users can register accounts via a web interface, browse scooter locations, book and pay for rentals. Administrators can configure pricing, manage scooters, view revenue reports, and handle user feedback.

### 1.2 Scope

This document describes the complete functional and non-functional requirements for the electric scooter rental system, based on the 25 items defined in the Product Backlog.

---

## 2. Functional Requirements

### 2.1 User Account Module

**FR-01: User Registration**

- Priority: P1 (2 marks)
- Users create accounts by providing username, email, and password
- Password strength validation enforced (minimum 6 characters)
- Passwords stored using BCrypt hashing
- Optional date of birth for discount calculation

**FR-02: User Login**

- Priority: P1 (2 marks)
- Supports username + password authentication
- Returns JWT Token on successful login (30-minute expiry)
- Token required for all subsequent API requests

**FR-03: Store Card Details**

- Priority: P2 (1 mark)
- Users may optionally save credit card numbers for faster bookings
- Card numbers encrypted with AES-128 before storage
- Frontend validates card format using Luhn algorithm

**FR-04: Account Security**

- Priority: P2 (1 mark)
- Dependent on FR-03
- BCrypt password hashing, AES card encryption
- JWT filter protects all `/api/*` endpoints
- 30-minute inactivity auto-logout

---

### 2.2 Scooter Browsing Module

**FR-05: View Hire Options and Costs**

- Priority: P1 (2 marks)
- Displays 4 rental packages: 1 Hour ($5), 4 Hours ($15), 1 Day ($30), 1 Week ($120)
- Users can view all package pricing before booking

**FR-06: View Scooter Availability List**

- Priority: P2 (1 mark)
- Displays all scooters with status (available/rented/maintenance)
- Shows scooter ID, model, battery level, and location
- Supports paginated browsing

**FR-07: Map Display of Scooter Locations**

- Priority: P2 (1 mark)
- Uses Leaflet.js + OpenStreetMap to display 5 rental points
- Marks available vs unavailable scooters

---

### 2.3 Booking & Payment Module

**FR-08: Book a Scooter**

- Priority: P1 (2 marks)
- User selects scooter ID + rental package → creates booking
- Backend validates scooter availability and user identity
- Scooter status changes to "rented" on successful booking

**FR-09: Simulated Card Payment**

- Priority: P1 (2 marks)
- Payment form supports saved card / new card entry
- Frontend validates card number (Luhn), expiry, and CVV
- Booking status changes to "paid" on successful payment

**FR-10: Store and Display Booking Confirmation**

- Priority: P1 (2 marks)
- Shows confirmation details after payment
- "My Rentals" page displays all historical bookings
- Sorted by time in descending order

**FR-11: Cancel Booking**

- Priority: P1 (2 marks)
- Users can cancel bookings in pending/paid status
- Scooter restored to "available" on cancellation

---

### 2.4 Booking Management Module

**FR-12: Update Scooter Status**

- Priority: P2 (1 mark)
- Automatically sets scooter to "rented" on booking
- Restores to "available" on end/cancellation

**FR-13: Extend Booking**

- Priority: P2 (1 mark)
- Paid bookings can be extended for additional duration
- Extra cost calculated and displayed for user confirmation

**FR-14: End Rental**

- Built-in feature
- Ends the active booking and calculates total cost
- Scooter restored to available

---

### 2.5 Admin Module

**FR-15: Configure Scooters and Pricing**

- Priority: P1 (2 marks)
- Admin can add/delete scooters
- Can update package prices (negative prices rejected)
- New scooters must have 100% battery

**FR-16: View Weekly Income by Package**

- Priority: P1 (2 marks)
- Groups weekly revenue by package type (1h/4h/1d/1w)
- Tracks popular rental durations

**FR-17: View Daily Revenue**

- Priority: P2 (1 mark)
- Calculates combined daily revenue over a week
- Includes all package types and discounts

**FR-18: Graphical Revenue Visualization**

- Priority: P2 (1 mark)
- Uses Chart.js to visualize FR-16/FR-17 data
- Bar charts and line charts

**FR-19: Proxy Booking**

- Priority: P2 (1 mark)
- Admin can create bookings for unregistered users
- Requires guest_name and guest_phone fields

---

### 2.6 Feedback & Issues Module

**FR-20: Submit Issue Feedback**

- Priority: P2 (1 mark)
- Users can submit fault descriptions for scooters
- Linked to specific scooter ID

**FR-21: Feedback Prioritization**

- Priority: P3 (0.5 marks)
- Admin can set priority: low / medium / high
- High-priority issues require escalation

**FR-22: View High-Priority Issues**

- Priority: P3 (0.5 marks)
- Admin can filter and view all high-priority feedback
- Supports marking as resolved

---

### 2.7 Notification & Discount Module

**FR-23: Email Booking Confirmation**

- Priority: P2 (1 mark)
- Sends confirmation emails via Spring Mail
- Uses MailDev for development simulation

**FR-24: Discount System**

- Priority: P2 (1 mark)
- Frequent user: >480 minutes in past week → 20% off
- Student: age < 22 → 10% off
- Senior: age ≥ 60 → 15% off
- High-frequency: 20+ cumulative bookings → 20% off
- Best applicable discount applied

---

### 2.8 System Characteristics

**FR-25: Multi-Client Concurrency**

- Priority: P2 (1 mark)
- Web application supports multiple simultaneous users
- Cross-tab login state synchronization

---

## 3. Non-Functional Requirements

### NFR-01: Responsive UI (P2, 1 mark)

- Adapts to desktop and mobile devices
- CSS media queries for responsive layout

### NFR-02: Accessibility (P2, 1 mark)

- Font size adjustment (large/medium/small)
- High contrast mode toggle
- Skip-to-content navigation link
- aria-live announcements for dynamic content

### NFR-03: Security

- BCrypt password hashing
- JWT token authentication
- AES-128 credit card encryption
- Frontend input validation (Luhn algorithm, password strength)

### NFR-04: Usability

- 30-minute session timeout
- Intuitive navigation structure
- Confirmation modals for critical actions

### NFR-05: Maintainability

- Layered architecture (Controller-Service-DAO)
- Frontend/backend separation
- Docker containerized deployment

---

## 4. User Roles

| Role              | Permissions                                                                                                     |
| ----------------- | --------------------------------------------------------------------------------------------------------------- |
| **Regular User**  | Register/login, browse scooters, book/pay, view orders, submit feedback                                         |
| **Administrator** | All user permissions + manage scooters, configure pricing, view revenue reports, handle feedback, proxy booking |

---

## 5. Backlog Implementation Summary

| Priority  | Items  | Implemented                     |
| --------- | ------ | ------------------------------- |
| P1        | 8      | 8/8                             |
| P2        | 15     | 15/15                           |
| P3        | 2      | 2/2 |
| **Total** | **25** | **25/25**                       |
