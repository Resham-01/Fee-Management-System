# Fee Management System (MERN Stack)

A complete School & College Fee Management System with role-based access control, payment gateway integration, and data isolation per school.

## Features

### ✅ User Roles
- **Super Admin**: Approve/reject schools, manage subscription plans, view all system data
- **School Admin**: Manage students, create invoices, view reports (only their school's data)
- **Parent**: View invoices, link children via student code, pay fees online

### ✅ Key Features
- **No Student Login**: Students are managed by School Admins only
- **School Data Isolation**: Each school admin only sees/manages their own school's data
- **School Approval System**: Super Admin must approve schools before school admins can login
- **Student Management**: School admins can add, edit, delete students
- **Invoice Management**: Create invoices, track paid/pending status
- **Payment Gateways**: Integration-ready for eSewa, Khalti, FonePay
- **Change Password**: All users can change their password
- **Password Visibility Toggle**: Eye icon to show/hide passwords

## Tech Stack

### Backend
- Node.js + Express.js
- MongoDB (Mongoose)
- JWT Authentication
- bcrypt for password hashing
- Joi for validation
- Winston for logging

### Frontend
- React.js (Vite)
- TailwindCSS
- React Router
- Axios

## Setup Instructions

### 1. Backend Setup

```bash
cd backend
npm install
```

Create `backend/.env`:
```env
PORT=5000
MONGODB_URI=mongodb+srv://reshamkumar4533_db_user:Bzno2aXjsE03dcVl@cluster0.0qfhjrn.mongodb.net/?appName=Cluster0
JWT_SECRET=your_secret_key_here
JWT_EXPIRES_IN=7d
LOG_LEVEL=info
```

Run backend:
```bash
npm run dev
```

### 2. Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

### 3. Seed Sample Data

```bash
cd backend
node scripts/seedSampleData.js
```

This creates:
- Super Admin: `superadmin@gmail.com` / `SuperAdmin@123`
- School Admin: `schooladmin@gmail.com` / `SchoolAdmin@123`
- Parent: `parent@gmail.com` / `Parent@123`

## System Architecture

### Data Isolation
- **School Admins** can only access data for their own school
- All queries filter by `req.user.school` for school admins
- Parents can only see invoices for their linked children

### School Approval Flow
1. School registers via `/register-school`
2. School Admin account is created but **cannot login** until approved
3. Super Admin approves school via dashboard
4. School Admin can now login

### Student Management
- Students are **not users** - they are records managed by School Admins
- School Admins can:
  - Add new students
  - Edit student details
  - Delete students
  - Link students to parents (optional)

## API Endpoints

### Auth
- `POST /api/auth/login` - Login
- `POST /api/auth/register-school` - Register school (creates school + admin)
- `POST /api/auth/register-parent` - Register parent
- `POST /api/auth/change-password` - Change password (protected)

### Schools (Super Admin)
- `GET /api/schools` - Get all schools
- `PATCH /api/schools/:id/approve` - Approve school
- `PATCH /api/schools/:id/reject` - Reject school

### Students (School Admin)
- `GET /api/students` - Get all students (own school only)
- `POST /api/students` - Create student
- `PUT /api/students/:id` - Update student
- `DELETE /api/students/:id` - Delete student

### Invoices
- `GET /api/invoices/school` - Get invoices (School Admin)
- `GET /api/invoices/parent` - Get invoices (Parent)
- `POST /api/invoices` - Create invoice (School Admin)

### Payments
- `POST /api/payments/initiate` - Initiate payment (Parent)
- `POST /api/payments/webhook` - Payment webhook

### Parents
- `POST /api/parents/link-child` - Link child via student code

## Security Features

- JWT-based authentication
- Password hashing with bcrypt
- Role-based access control (RBAC)
- School-level data isolation
- Input validation with Joi
- CORS and Helmet security headers

## Deployment

### Backend
- Deploy to Render, Railway, or VPS
- Set environment variables
- MongoDB Atlas connection string already configured

### Frontend
- Deploy to Netlify, Vercel, or any static host
- Update API base URL in production

## Notes

- Student login/registration has been **removed** as requested
- Students are managed entirely by School Admins
- Each school's data is completely isolated
- School approval is required before school admins can login



