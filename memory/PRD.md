# Smart Canteen Management System - PRD

## Original Problem Statement
Smart Canteen Management System with pre-ordering and time-slot booking to streamline food ordering operations. Improved order processing efficiency by approximately 50% through real-time tracking and automated workflow management. Reduced student waiting time by around 60% and minimized crowd congestion and order errors by nearly 65% using structured pickup scheduling.

## User Personas
1. **Students** - Browse menu, pre-order food, select pickup time slots, pay online, track order status
2. **Canteen Staff** - Manage incoming orders, update order status, create/manage time slots
3. **Admin** - Full access, user management, analytics dashboard, role assignment

## Core Requirements (Static)
- 3 User Roles: Student, Staff, Admin
- Static menu with pre-defined items
- Stripe payment integration
- Custom time slots (staff-defined)
- Dual authentication (JWT + Google OAuth)

## Tech Stack
- **Frontend:** React 19, Tailwind CSS, Radix UI components
- **Backend:** FastAPI (Python)
- **Database:** MongoDB
- **Payment:** Stripe Checkout
- **Auth:** JWT + Emergent Google OAuth

## What's Been Implemented (Jan 7, 2026)

### Phase 1 - MVP (Completed)
- [x] Landing page with hero section and features
- [x] User authentication (JWT + Google OAuth)
- [x] Role-based routing and dashboards
- [x] Menu browsing with category filters
- [x] Shopping cart with quantity management
- [x] Time slot selection for pickup
- [x] Stripe payment checkout integration
- [x] Order tracking (status updates)
- [x] Staff dashboard for order management
- [x] Staff time slot management (CRUD)
- [x] Admin analytics dashboard
- [x] Admin user management (role updates)
- [x] Seed data (10 menu items, 24 time slots, admin/staff users)

### API Endpoints
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login with email/password
- `POST /api/auth/session` - Exchange Google OAuth session
- `GET /api/auth/me` - Get current user
- `POST /api/auth/logout` - Logout user
- `GET /api/menu` - Get available menu items
- `GET /api/slots` - Get available time slots
- `POST /api/orders` - Create order + Stripe checkout
- `GET /api/orders/my` - Get user's orders
- `GET /api/orders/pending` - Get pending orders (staff)
- `PUT /api/orders/{id}/status` - Update order status
- `POST /api/slots` - Create time slot (staff)
- `DELETE /api/slots/{id}` - Delete time slot (staff)
- `GET /api/admin/users` - Get all users (admin)
- `PUT /api/admin/users/{id}/role` - Update user role (admin)
- `GET /api/admin/analytics` - Get analytics data (admin)

## Prioritized Backlog

### P0 - Critical (Next Sprint)
- [ ] Email notifications for order status changes
- [ ] Push notifications for "order ready" alerts

### P1 - High Priority
- [ ] Order history search/filter
- [ ] Menu item favorites
- [ ] Popular items section
- [ ] Staff shift management

### P2 - Medium Priority
- [ ] Loyalty points/rewards system
- [ ] Bulk order discounts
- [ ] Menu item reviews/ratings
- [ ] Daily specials feature

## Next Tasks
1. Add email notifications via SendGrid/Resend
2. Implement real-time order updates with WebSockets
3. Add order history filters (date range, status)
4. Create popular/trending items algorithm
