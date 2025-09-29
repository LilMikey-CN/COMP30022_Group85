# Scheduling of Care Items
[![React](https://img.shields.io/badge/React-20232A?style=flat-square&logo=react&logoColor=61DAFB)](https://reactjs.org)
[![React Router](https://img.shields.io/badge/React_Router-CA4245?style=flat-square&logo=react-router&logoColor=white)](https://reactrouter.com/)
[![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=flat-square&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Ant Design](https://img.shields.io/badge/Ant_Design-0170FE?style=flat-square&logo=ant-design&logoColor=white)](https://ant.design/) 
[![Vite](https://img.shields.io/badge/Vite-646CFF?style=flat-square&logo=vite&logoColor=white)](https://vitejs.dev/)
[![NodeJS](https://img.shields.io/badge/Node%20js-339933?style=flat-square&logo=nodedotjs&logoColor=white)](https://nodejs.org/)
[![ExpressJS](https://img.shields.io/badge/Express%20js-000000?style=flat-square&logo=express&logoColor=white)](https://expressjs.com/)
[![Firebase](https://img.shields.io/badge/firebase-ffca28?style=flat-square&logo=firebase&logoColor=black)](https://firebase.google.com/)

**Scheduling of Care Items** is a comprehensive web application designed to help families manage care responsibilities for loved ones with special needs. The platform simplifies the overwhelming task of organizing care routines by providing simple, user-friendly tools for scheduling care tasks, tracking expenses, and coordinating family involvement.

Our application offers four core features:
- **Simple Scheduling**: Create and manage care tasks like changing bedsheets, medication reminders, and daily routines
- **Budget Tracking**: Monitor care-related expenses by category including medical supplies, equipment, and services
- **Task Management**: Mark tasks as complete, set recurring schedules, and never miss important care activities
- **Family Coordination**: Share care responsibilities with family members and caregivers to ensure consistent care

Built with React, Vite, and Ant Design, the application provides an intuitive interface that transforms complex care management into an organized, stress-free experience for families.

## Quick Start

Follow these steps to get the complete Scheduling of Care Items application running on your local machine. The application consists of three main components: Frontend, Backend API, and Object Storage service.

### Prerequisites
- **Node.js** (version 18 or higher)
- **npm** or **yarn** package manager
- **Git** for version control
- **Firebase project** with authentication enabled
- **Digital Ocean Spaces** account (for file storage)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/LilMikey-CN/COMP30022_Group85.git
   cd COMP30022_Group85
   ```

## Frontend Setup

2. **Navigate to the frontend directory**
   ```bash
   cd frontend/soc
   ```

3. **Install frontend dependencies**
   ```bash
   npm install
   ```

4. **Configure frontend environment variables**

   Create a `.env` file in the `frontend/soc` directory:
   ```env
   VITE_FIREBASE_API_KEY=your-firebase-api-key
   VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=your-firebase-project-id
   VITE_FIREBASE_STORAGE_BUCKET=your-project.firebasestorage.app
   VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
   VITE_FIREBASE_APP_ID=your-app-id
   VITE_FIREBASE_MEASUREMENT_ID=your-measurement-id
   VITE_API_URL=http://localhost:3000
   ```

   **Important:** Replace with your actual Firebase project configuration values.

5. **Start the frontend development server**
   ```bash
   npm run dev
   ```

6. **Open your browser**
   - Navigate to `http://localhost:5173` (or the port displayed in your terminal)
   - The application will automatically reload when you make changes to the code

### Frontend Available Scripts

- `npm run dev` - Start the development server with hot reload
- `npm run build` - Build the application for production
- `npm run preview` - Preview the production build locally
- `npm run lint` - Run ESLint to check code quality

## Backend API Setup

7. **Navigate to the backend directory** (from project root)
   ```bash
   cd backend
   ```

8. **Install backend dependencies**
   ```bash
   npm install
   ```

9. **Configure backend environment variables**

   Create a `.env` file in the `backend` directory:
   ```env
   # Server Configuration
   PORT=3000
   NODE_ENV=development

   # Firebase Admin SDK Configuration
   FIREBASE_PROJECT_ID=your-firebase-project-id
   FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour-Private-Key-Here\n-----END PRIVATE KEY-----\n"
   FIREBASE_CLIENT_EMAIL=your-service-account@your-project.iam.gserviceaccount.com

   # Frontend URLs (for CORS) - comma-separated list
   ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3001

   # Rate Limiting
   RATE_LIMIT_WINDOW_MS=900000
   RATE_LIMIT_MAX_REQUESTS=100

   # Logging
   LOG_LEVEL=debug
   ```

   **Important:** Replace with your actual Firebase Admin SDK credentials from your Firebase service account.

10. **Start the backend server**
    ```bash
    # Development with auto-reload
    npm run dev

    # Production
    npm start
    ```

    The backend API will be available at `http://localhost:3000`

### Backend Available Scripts

- `npm start` - Start the production server
- `npm run dev` - Start development server with auto-reload
- `npm test` - Run the test suite

## Object Storage Setup

11. **Navigate to the object storage directory** (from project root)
    ```bash
    cd object-storage
    ```

12. **Install object storage dependencies**
    ```bash
    npm install
    ```

13. **Configure Digital Ocean Spaces environment variables**

    Create a `.env` file in the `object-storage` directory:
    ```env
    DO_SPACES_KEY=your-access-key-here
    DO_SPACES_SECRET=your-secret-key-here
    DO_SPACES_ENDPOINT=https://syd1.digitaloceanspaces.com
    DO_SPACES_REGION=syd1
    DO_SPACES_BUCKET=your-space-name-here
    PORT=3001
    ```

    **Important:** Replace with your actual Digital Ocean Spaces credentials and configuration.

14. **Start the object storage server**
    ```bash
    # Development with auto-reload
    npm run dev

    # Production
    npm start
    ```

    The object storage API will be available at `http://localhost:3001`

### Object Storage Available Scripts

- `npm start` - Start the production server
- `npm run dev` - Start development server with auto-reload
- `npm test` - Run the test suite
- `npm run test:unit` - Run unit tests only
- `npm run test:integration` - Run integration tests only

## Complete Development Setup

To run the complete application stack, open three terminals:

1. **Terminal 1 - Frontend** (port 5173)
   ```bash
   cd frontend/soc && npm run dev
   ```

2. **Terminal 2 - Backend API** (port 3000)
   ```bash
   cd backend && npm run dev
   ```

3. **Terminal 3 - Object Storage** (port 3001)
   ```bash
   cd object-storage && npm run dev
   ```

### Architecture Overview

The application is built with modern technologies:

**Frontend:**
- **React 19** - UI framework
- **Vite** - Build tool and development server
- **Ant Design** - UI component library
- **React Router** - Client-side routing
- **TanStack Query** - Data fetching and caching
- **Firebase Auth** - User authentication

**Backend API:**
- **Express.js** - Web framework
- **Firebase Admin** - Database and authentication
- **CORS** - Cross-origin resource sharing
- **Jest** - Testing framework

**Object Storage:**
- **Express.js** - Web framework
- **AWS SDK v3** - Digital Ocean Spaces integration
- **Multer** - File upload handling
- **Jest** - Testing framework

You're now ready to start using and developing the complete Scheduling of Care Items application!

## Team members
|Role| Name | Email |
|---|---|---|
|Product Owner| Luke Hastings |lhastings@student.unimelb.edu.au|
|Scrum Master| Tammy Le | mytam@student.unimelb.edu.au |
|Fullstack Lead| Xingkai Jiao|	xingkaij@student.unimelb.edu.au|
|Developer| Minh Khue Dang |minhkhued@student.unimelb.edu.au|
|Developer| Isaac Abrham |isaac.abrham@student.unimelb.edu.au|
