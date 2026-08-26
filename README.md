# Coralgenz Payrole - Smart Payroll & Workforce Management

![Coralgenz Payrole](https://images.unsplash.com/photo-1572021335469-31706a17aaef?w=1200&auto=format&fit=crop&q=80)

**Coralgenz Payrole** is a production-ready, SaaS-style enterprise workforce and payroll management web application. Built with **Next.js (App Router)**, **TypeScript**, **Tailwind CSS**, and **Firebase**, it delivers multi-tenant role-based access control, biometric-style attendance tracking, multi-tier leave approval workflows, customizable salary structures, Indian statutory compliance (EPF, ESI, Professional Tax, TDS), a 6-step payroll execution wizard, automated PDF payslips, rich analytics, company calendar, announcements, immutable audit logs, and instant 1-click demo role switching.

---

## 🌟 Key Features & Modules

### 1. Role-Based Access Control (RBAC)
- **5 Distinct Roles**: Super Admin, HR Admin, Payroll Manager, Team Manager, Employee.
- **Granular Permissions Engine**: Module and route-level authorization guards preventing client-side tampering.
- **Role-Adaptive Dashboards**: Custom metrics, charts, and workflow actions tailored specifically for each role.

### 2. Employee Management
- Complete employee directory with search, department filtering, status filters (Active, Probation, On Leave, Resigned, Inactive), and CSV/Excel exports.
- Multi-step onboarding wizard for new hires with automatic Employee ID generation (`CGG-EMP-0001`).
- Tabbed employee profile view: Personal & Employment details, masked bank account details (`•••• •••• 1234`), document management with Firebase Storage, salary revision timeline with audit diffs, and offboarding/final settlement calculator.

### 3. Biometric & Daily Attendance
- Live biometric-style punch card with server timestamp logging, shift timer, and status tracking (Present, Absent, Half Day, Leave, Holiday, Week Off).
- Overtime calculation, late arrival, and early departure tracking.
- HR manual adjustment modal with mandatory audit reason logging.
- Monthly attendance grid and CSV export.

### 4. Leave Management & Annual Quotas
- Multi-category leave management: Casual (12d), Sick (10d), Annual (15d), Earned (10d), Maternity/Paternity, and Unpaid Leave (Loss of Pay).
- Live leave balance meter per employee.
- Multi-tier approval workflow with manager & HR sign-offs, rejections, and audit history.

### 5. Indian Statutory Payroll Engine
- Configurable Earnings: Basic Salary (50%), HRA (40%), Conveyance (₹1,600), Medical (₹1,250), Special Allowance, Performance Bonus, Overtime Pay.
- Statutory Deductions:
  - **Employee Provident Fund (EPF)**: 12% contribution with standard ₹15,000 statutory wage ceiling.
  - **Employees' State Insurance (ESI)**: 0.75% contribution (applicable if gross $\le ₹21,000$).
  - **Professional Tax (PT)**: State-specific slabs (e.g., Karnataka ₹200/mo).
  - **Tax Deducted at Source (TDS)**: Estimated monthly income tax deduction.
  - **Loss of Pay (LOP)**: Exact pro-rata deduction calculated from unapproved absence days.
- 6-Step Payroll Execution Wizard: Month select $\rightarrow$ Attendance verification $\rightarrow$ Calculation engine $\rightarrow$ Preview & edit table $\rightarrow$ Executive locking $\rightarrow$ Batch payslip generation.
- **Immutable Payroll Locking**: Freezes records permanently once approved.

### 6. Automated Payslips & PDF Export
- Corporate payslip layout with company header, logo, masked bank details, earnings/deductions breakdown, Indian numbering in words (*"Rupees Seventy-Five Thousand Only"*), and authorized signature.
- 1-Click PDF download and print-optimized stylesheets.
- Unique payslip serial ID generation (`CGG-PS-2026-08-0001`).

### 7. Reports, Calendar, Announcements & Audit Logs
- Consolidated reports: Payroll cost trends, department budget distribution, headcount, absenteeism, and leave utilization.
- Company calendar with gazetted public holidays and company foundation days.
- Real-time announcements noticeboard with priority pinning.
- Immutable security audit logs recording logins, salary revisions, leave approvals, and payroll locks.

---

## 🚀 Quick Start (Development / Demo Mode)

Coralgenz Payrole comes with a built-in interactive demo environment preloaded with realistic Indian enterprise data (Aarav Kumar, Diya Raj, Arjun Nair, etc.). You can run and test all features immediately without requiring initial Firebase credentials!

### 1. Install Dependencies
```bash
npm install
```

### 2. Start Local Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 3. Instant Demo Login
On the `/login` screen, click any of the **1-Click Test Demo Roles** buttons:
- 👑 **Super Admin**: `superadmin@coralgenz.com` (Karthick Krishna - Full access)
- 💼 **HR Admin**: `hr@coralgenz.com` (Karthick Krishna - Employees, Leaves, Attendance)
- 📊 **Payroll Manager**: `payroll@coralgenz.com` (Thanvanth H - Salary structures, Payroll engine, Locking)
- 👔 **Team Manager**: `manager@coralgenz.com` (Sarvesh - Team roster, Leave approvals)
- 👩‍💻 **Employee**: `employee@coralgenz.com` (Employee Portal - Check-in/out, Apply leave, Download payslips)

---

## ☁️ Firebase Production Setup

To connect your live Firebase project:

### 1. Create Firebase Project
1. Go to the [Firebase Console](https://console.firebase.google.com/).
2. Click **Add project** and name it `coralgenz-payrole`.
3. Enable **Google Analytics** (optional).

### 2. Enable Authentication
1. Navigate to **Build > Authentication** in the Firebase Console.
2. Click **Get Started** and enable **Email/Password**.

### 3. Create Cloud Firestore
1. Navigate to **Build > Firestore Database**.
2. Click **Create Database** (Choose production mode, and select your preferred location e.g., `asia-south1` for Mumbai / India).
3. Deploy the provided `firestore.rules` and `firestore.indexes.json`:
```bash
npx -y firebase-tools@latest deploy --only firestore
```

### 4. Enable Firebase Storage
1. Navigate to **Build > Storage**.
2. Click **Get Started** and select your storage bucket location.
3. Deploy the provided `storage.rules`:
```bash
npx -y firebase-tools@latest deploy --only storage
```

### 5. Configure Environment Variables
Copy `.env.example` to `.env.local` and add your Firebase credentials:
```env
NEXT_PUBLIC_APP_NAME="Coralgenz Payrole"
NEXT_PUBLIC_APP_TAGLINE="Smart Payroll & Workforce Management"

NEXT_PUBLIC_FIREBASE_API_KEY="AIzaSyYourApiKeyHere..."
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="coralgenz-payrole.firebaseapp.com"
NEXT_PUBLIC_FIREBASE_PROJECT_ID="coralgenz-payrole"
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET="coralgenz-payrole.appspot.com"
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID="123456789012"
NEXT_PUBLIC_FIREBASE_APP_ID="1:123456789012:web:abcdef123456"
NEXT_PUBLIC_ENABLE_DEMO_MODE=false
```

---

## 🚢 Vercel Deployment

The project is pre-configured for direct zero-config deployment on Vercel:

1. Push your repository to GitHub / GitLab / Bitbucket.
2. Go to [Vercel Dashboard](https://vercel.com/) and click **Add New > Project**.
3. Import your `coralgenz-payrole` repository.
4. Under **Environment Variables**, paste the `NEXT_PUBLIC_FIREBASE_...` keys from your `.env.local`.
5. Click **Deploy**.
6. Once deployed, add your Vercel production domain to the **Authorized Domains** list in Firebase Authentication (**Authentication > Settings > Authorized domains**).

---

## 🔒 Security & Compliance
- **Tenant Isolation**: All documents are partitioned under `organizations/{orgId}/...`.
- **Privilege Separation**: Critical payroll operations and locking are sealed and logged to immutable audit trails.
- **Data Privacy**: Bank account numbers and tax IDs are masked by default across normal user screens.
- **Client Security**: No Firebase Admin secret keys are bundled in client assets.

---

## 📜 License
Copyright © 2026 Coralgenz Technologies Pvt. Ltd. All rights reserved.
