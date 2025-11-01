# Scheduling of Care Items
[![React](https://img.shields.io/badge/React-20232A?style=flat-square&logo=react&logoColor=61DAFB)](https://reactjs.org)
[![React Router](https://img.shields.io/badge/React_Router-CA4245?style=flat-square&logo=react-router&logoColor=white)](https://reactrouter.com/)
[![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=flat-square&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Ant Design](https://img.shields.io/badge/Ant_Design-0170FE?style=flat-square&logo=ant-design&logoColor=white)](https://ant.design/) 
[![Vite](https://img.shields.io/badge/Vite-646CFF?style=flat-square&logo=vite&logoColor=white)](https://vitejs.dev/)
[![NodeJS](https://img.shields.io/badge/Node%20js-339933?style=flat-square&logo=nodedotjs&logoColor=white)](https://nodejs.org/)
[![ExpressJS](https://img.shields.io/badge/Express%20js-000000?style=flat-square&logo=express&logoColor=white)](https://expressjs.com/)
[![Firebase](https://img.shields.io/badge/firebase-ffca28?style=flat-square&logo=firebase&logoColor=black)](https://firebase.google.com/)

## Product Overview
**Scheduling of Care Items** is a comprehensive web application designed to help families manage care responsibilities for loved ones with special needs. The platform simplifies the overwhelming task of organizing care routines by providing simple, user-friendly tools for scheduling care tasks, tracking expenses, and coordinating family involvement.

Our application offers four core features:
- **Simple Scheduling**: Create and manage care tasks like changing bedsheets, medication reminders, and daily routines
- **Budget Tracking**: Monitor care-related expenses by category including medical supplies, equipment, and services
- **Task Management**: Mark tasks as complete, set recurring schedules, and never miss important care activities
- **Family Coordination**: Share care responsibilities with family members and caregivers to ensure consistent care

Built with React, Vite, and Ant Design, the application provides an intuitive interface that transforms complex care management into an organized, stress-free experience for families.

## Architecture Overview
The system is composed of three loosely coupled services that communicate over HTTP:

- **Frontend (`frontend/soc`)**: React 19 single-page application served by Vite. It authenticates users with Firebase Auth, orchestrates client-side routing with React Router, and manages API data with TanStack Query. The frontend talks to the backend REST API and requests signed URLs from the object storage service for file uploads.
- **Backend API (`backend`)**: Express.js service that exposes business APIs, validates Firebase ID tokens through the Firebase Admin SDK, and applies rate limiting and logging controls. It acts as the orchestration layer for scheduling, budgeting, and task management features.
- **Object Storage Service (`object-storage`)**: Lightweight Express.js wrapper around Digital Ocean Spaces (AWS S3 compatible) that provides APIs for secure file upload/download. Multer handles multipart uploads before passing them to the AWS SDK v3 client.

Cross-cutting concerns:
- **Authentication**: Firebase Auth on the client, verified by Firebase Admin on the backend.
- **Security & CORS**: Allowed origins are configured via environment variables; HTTPS is recommended in production for all services.
- **Testing**: Each service uses Jest (frontend leverages Vitest under the same command) to cover automated testing.

## Local Deployment Manual
Follow these steps to run the full stack locally.

### Prerequisites
- **Node.js** 18+
- **npm** or **yarn**
- **Git**
- **Firebase project** with authentication enabled
- **Digital Ocean Spaces** (or other S3-compatible) account for file storage

### Clone the repository
```bash
git clone https://github.com/LilMikey-CN/COMP30022_Group85.git
cd COMP30022_Group85
```

### Frontend service (`frontend/soc`)
1. Install dependencies:
   ```bash
   cd frontend/soc
   npm install
   ```
2. Create `.env` with Firebase configuration and API URL:
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
3. Start the dev server:
   ```bash
   npm run dev
   ```
4. Browse to `http://localhost:5173` (or the port shown in the console). Vite hot reloads on file changes.

Available scripts:
- `npm run dev` – Development server with hot reload
- `npm run build` – Production build
- `npm run preview` – Preview the production build locally
- `npm run lint` – ESLint code quality checks
- `npm test` – Run Vitest suite

### Backend API (`backend`)
1. Install dependencies:
   ```bash
   cd backend
   npm install
   ```
2. Create `.env`:
   ```env
   PORT=3000
   NODE_ENV=development
   FIREBASE_PROJECT_ID=your-firebase-project-id
   FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour-Private-Key-Here\n-----END PRIVATE KEY-----\n"
   FIREBASE_CLIENT_EMAIL=your-service-account@your-project.iam.gserviceaccount.com
   ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3001
   RATE_LIMIT_WINDOW_MS=900000
   RATE_LIMIT_MAX_REQUESTS=100
   LOG_LEVEL=debug
   ```
3. Start the API:
   ```bash
   # Development (auto-reload)
   npm run dev

   # Production-like
   npm start
   ```
4. The API listens on `http://localhost:3000`.

Available scripts:
- `npm run dev` – Development server with auto-reload
- `npm start` – Production server entrypoint
- `npm test` – Jest test suite

### Object Storage service (`object-storage`)
1. Install dependencies:
   ```bash
   cd object-storage
   npm install
   ```
2. Create `.env`:
   ```env
   DO_SPACES_KEY=your-access-key-here
   DO_SPACES_SECRET=your-secret-key-here
   DO_SPACES_ENDPOINT=https://syd1.digitaloceanspaces.com
   DO_SPACES_REGION=syd1
   DO_SPACES_BUCKET=your-space-name-here
   PORT=3001
   ```
3. Start the service:
   ```bash
   # Development (auto-reload)
   npm run dev

   # Production-like
   npm start
   ```
4. The service responds on `http://localhost:3001`.

Available scripts:
- `npm run dev` – Development server with Nodemon
- `npm start` – Production server entrypoint
- `npm test` – Jest test suite
- `npm run test:unit` – Run unit tests
- `npm run test:integration` – Run integration tests
- `npm run test:all` – Sequentially run unit and integration tests

### Running the full stack
Open three terminals (or background each process):
```bash
# Terminal 1 - Frontend (port 5173)
cd frontend/soc && npm run dev

# Terminal 2 - Backend API (port 3000)
cd backend && npm run dev

# Terminal 3 - Object Storage (port 3001)
cd object-storage && npm run dev
```

## Production Deployment Manual (Vercel)
All three services deploy to Vercel as separate projects that share this repository. You only need a Vercel account with GitHub integration enabled.

1. **Connect the repository**
   - In the Vercel dashboard choose *Add New → Project*, import `COMP30022_Group85`, and grant access to the repo.
   - Repeat the “Add New Project” flow three times, once per service, pointing each project at the appropriate root directory (`frontend/soc`, `backend`, `object-storage`).

2. **Frontend project (`frontend/soc`)**
   - **Framework preset**: `Vite / Other` (build command `npm run build`, output directory `dist`, install command `npm install`).
   - **Environment variables**: provide the production Firebase values plus `VITE_API_URL=https://<backend-project>.vercel.app`. Use Vercel’s *Environment Variables* tab so they sync across Preview/Production.
   - **Domains**: attach your custom domain (optional) and confirm the generated `https://<frontend-project>.vercel.app` URL.

3. **Backend API project (`backend`)**
   - Vercel auto-detects the Node serverless target via `backend/vercel.json`. Ensure the project root is `backend` so the config and `index.js` are used.
   - Set environment variables that mirror the backend `.env` (Firebase Admin credentials, `ALLOWED_ORIGINS` with your frontend/Object Storage Vercel domains, rate limiting values, etc.).
   - After the first deploy, note the API base URL `https://<backend-project>.vercel.app` and update the frontend `VITE_API_URL` accordingly.

4. **Object storage project (`object-storage`)**
   - Create a third Vercel project with root `object-storage` and the same Node serverless preset.
   - Define Digital Ocean Spaces credentials as environment variables (`DO_SPACES_*`). Add `ALLOWED_ORIGINS` if enforced within the service.
   - Record the deployment URL `https://<object-storage-project>.vercel.app` and add it to the backend/frontend environment variables where applicable.

5. **Promote and verify**
   - Trigger production deployments by merging to your main branch or manually promoting a Preview build.
   - Run end-to-end smoke tests: authenticate via the frontend, schedule a task, upload a file, and confirm responses from both backend endpoints and object storage.
   - Use Vercel’s *Logs* tab for each project to monitor errors; configure *Analytics* and *Performance Insights* as needed.

## Testing Manual
The project supports automated testing with Jest/Vitest and manual verification flows for critical paths.

### Frontend (`frontend/soc`)
- **Automated**: `npm test` runs Vitest; use `npm run lint` to enforce code style.
- **Manual**: With `npm run dev` running, exercise scheduling, budgeting, and task completion flows in the browser. Validate login/logout, navigation, and API error handling messages.

### Backend API (`backend`)
- **Automated**: `npm test` runs the Jest suite. Add new tests under `__tests__/` or alongside modules.
- **Manual**: With the server running, call endpoints with `curl` or Postman. Confirm:
  - Authenticated requests succeed when a valid Firebase ID token is supplied.
  - Unauthorized requests return 401/403.
  - Rate limiting headers reflect configured values.

### Object Storage (`object-storage`)
- **Automated**: `npm run test:unit`, `npm run test:integration`, or `npm run test:all` for full coverage.
- **Manual**: Use `curl` or a REST client to upload and retrieve a sample file. Check that generated URLs target the expected Digital Ocean Spaces bucket and expire according to configuration.

## Scaling Manual
- Adopt containerization (Docker + Compose/Kubernetes) to manage multi-service deployments consistently.
- Introduce CI/CD pipelines that run linting, tests, and automated builds on every pull request.
- Centralize logging and metrics (e.g., ELK, Grafana, Firebase Crashlytics) to monitor usage and diagnose production incidents.
- Layer feature flags or configuration-driven modules so new scheduling or budgeting features can be toggled without redeploy.
- Evaluate moving from Firebase Auth + custom backend to a more comprehensive identity provider if enterprise requirements emerge.
- Document API contracts with an OpenAPI spec to ease integration with future mobile or partner applications.

## Team members
|Role| Name | Email |
|---|---|---|
|Product Owner| Luke Hastings |lhastings@student.unimelb.edu.au|
|Scrum Master| Tammy Le | mytam@student.unimelb.edu.au |
|Fullstack Lead| Xingkai Jiao|	xingkaij@student.unimelb.edu.au|
|Developer| Minh Khue Dang |minhkhued@student.unimelb.edu.au|
|Developer| Isaac Abrham |isaac.abrham@student.unimelb.edu.au|
