# Local Deployment Guide

## Prerequisites

Before you begin, ensure you have the following installed on your machine:

- **Node.js** (v18.0.0 or higher) - [Download here](https://nodejs.org/)
- **npm** (v8.0.0 or higher) - Comes with Node.js
- **Git** - [Download here](https://git-scm.com/)

(If you're using MacOS, you can install Node.js and npm via Homebrew: `brew install node`; Git can be installed via `brew install git`)

## Quick Start

Follow these steps to get the application running on your local machine:

### 1. Clone the Repository

### 2. Install Dependencies

```bash
npm install
```

This will install all required packages including:
- React 19
- Ant Design 5
- React Router 6
- All other project dependencies

### 3. Start the Development Server

```bash
npm run dev
```

The application will automatically open in your default browser. If it doesn't, copy and paste the link provided in the terminal (usually `http://localhost:5173`).



## 🚨 Troubleshooting

### Port Already in Use
If port 5173 is already in use, the terminal will ask if you want to run on another port. Type `Y` to accept.
But most of the time, vite will automatically choose another port, so just check the terminal for the correct URL.

### Dependencies Not Installing
Clear npm cache and try again:
```bash
npm cache clean --force
npm install
```

### Application Not Loading
1. Check the console for errors (F12 in browser)
2. Ensure all files are properly saved
3. Try stopping the server (Ctrl+C) and running `npm run dev` again

### Missing Dependencies Error
If you see module not found errors:
```bash
npm install antd @ant-design/icons react-router-dom
```

## 💻 System Requirements

- **OS**: Windows 10/11, macOS 10.14+, or Linux
- **RAM**: Minimum 4GB (8GB recommended)
- **Disk Space**: At least 500MB free space
- **Browser**: Chrome, Firefox, Safari, or Edge (latest versions)

