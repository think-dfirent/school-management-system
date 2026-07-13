# School Management System (Cổng Thông Tin Học Tập & Đào Tạo PTIT)

A modern, enterprise-grade School Management web application designed for administrators, instructors, and students. Built with the **MERN (MongoDB, Express, React, Node.js)** stack and styled with a custom high-end **Enterprise Modern Red** theme system.

---

## 🌟 Key Features

### 🔑 Authentication & Authorization
- Secure JWT-based authentication system.
- Three major access levels (Role-Based Access Control):
  - **Admin**: Overall control of users, semesters, subjects, classes, notifications, and analytics.
  - **Giảng viên (Instructor)**: View schedules, manage class attendance rosters, grade materials, submit support requests.
  - **Sinh viên (Student)**: Register for classes/credits, view course schedules, check attendance records, view academic transcripts, download documents, and submit student support requests.

### 🏛️ Admin Dashboard & Management
- **Dashboard Analytics**: High-contrast Recharts distribution displays student demographics by department, grade profiles (A to F), open course classes, and financial/credits summaries.
- **User Management**: Unified table with vertical cell centering, status triggers, roles control, and kebab dropdown menus.
- **Semester Management**: Configure registration windows and semester bounds with an intuitive time verification mechanism.
- **Subject & Course Openings**: Create course syllabus files, configure credits, and assign professors to class code rooms.
- **Unified Notifications**: Broadcast system announcements, announcements filters (All, Students, or Instructors), and automated timestamps.

### 🍎 Instructor Portal
- **Class Schedules**: Professional calendar/list layouts showing semester duties.
- **Attendance Registry**: Instant online attendance checkboxes with status summaries.
- **Transcript Grades**: Submit mid-term, final, and overall marks with automatic GPA calculation.
- **Materials Upload**: Upload and categorise syllabus sheets and exercises.

### 🎓 Student Hub
- **Credit Registration**: Open courses registry showing remaining spots, schedules conflicts checks, and credits caps.
- **Academic Profiles**: Unified transcripts tracker showing letters grades breakdown (A+, A, B+, B, C+, C, D+, D, F).
- **Classroom Dashboards**: View course news, download teacher documents, and review attendance statistics.

---

## 🎨 Design System: "Enterprise Modern Red"

The application strictly aligns with an enterprise-level, high-contrast dark/light design system:
- **Tailwind Config Variables**: Utilises system variables linked to CSS parameters:
  - `bg-background` for page wrapper.
  - `bg-surface border border-border rounded-md shadow-sm` for cards/panels.
  - `text-DEFAULT` for high contrast title/header elements.
  - `text-muted` for sub-labels and secondary descriptions.
- **Standardized Elements**:
  - Emojis replaced with semantic Lucide Icons (`<Home />`, `<CheckSquare />`, etc.).
  - Action buttons grouped into space-saving `<MoreHorizontal />` kebab dropdown selectors.
  - Semantic, high-contrast Recharts tooltips (`rgb(var(--bg-surface))` and `rgb(var(--text-primary))`).

---

## 🛠️ Technology Stack

### Frontend
- **Framework**: React (Vite-based bundle)
- **Styling**: Tailwind CSS
- **Routing**: React Router DOM
- **State Management**: Zustand
- **Charts**: Recharts
- **Icons**: Lucide React
- **API Client**: Axios

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB (via Mongoose ODM)
- **Security**: bcryptjs (password hashing), jsonwebtoken (JWT tokens)
- **Configuration**: dotenv

---

## 📁 Repository Structure

```
school-management-system/
├── client/                  # Frontend Vite + React application
│   ├── src/
│   │   ├── components/      # UI features components (Attendance, Grades, etc.)
│   │   ├── pages/           # Pages by roles (admin, instructor, student)
│   │   ├── store/           # Zustand global state configurations
│   │   ├── index.css        # Core Tailwind directives & system variables
│   │   └── App.jsx          # Route mapping configurations
│   └── package.json
│
├── server/                  # Backend Express Node API
│   ├── config/              # MongoDB connection setups
│   ├── controllers/         # Core API handlers
│   ├── middleware/          # JWT auth validation & role checkers
│   ├── models/              # Mongoose DB schema definitions
│   └── routes/              # Express endpoint mappings
│
└── README.md                # General system documentation
```

---

## 🚀 Setup & Installation

### Prerequisites
- Node.js (v16+)
- MongoDB (Local or Atlas cloud instance)

### 1. Server Configuration
Navigate into the server folder:
```bash
cd server
```

Install dependencies:
```bash
npm install
```

Create a `.env` file inside the `server/` directory and configure the variables:
```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/school_management
JWT_SECRET=your_super_secret_jwt_key
```

Run the backend server:
```bash
# Development mode
npm run dev

# Production start
npm start
```

### 2. Client Configuration
Navigate into the client folder:
```bash
cd ../client
```

Install dependencies:
```bash
npm install
```

Start the Vite development server:
```bash
npm run dev
```

The application frontend will be active at `http://localhost:5173`.
