# Last Task - Digital Bullet Journal

[![React](https://img.shields.io/badge/React-19-blue.svg)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue.svg)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-7.x-646CFF.svg)](https://vitejs.dev/)
[![Firebase](https://img.shields.io/badge/Firebase-12.x-FFCA28.svg)](https://firebase.google.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**Last Task** is a minimalist, privacy-focused digital bullet journal designed for deep work and organized productivity. Inspired by the original Bullet Journal method, it combines the flexibility of analog journaling with the power of digital organization.

![Current State](public/screenshot-placeholder.png) *(Add a screenshot here for your portfolio)*

## ✨ Key Features

-   **🗂 Versatile Views:** Seamlessly switch between Daily Logs, Weekly Overviews, Future Logs (Monthly), and custom Collections.
-   **📝 Rich Text Editing:** Powered by Tiptap, allowing for structured notes, links, and formatting within your journal entries.
-   **🔄 Task Management:** Support for recurring tasks, priority levels, and state transitions (open, completed, migrated, cancelled).
-   **🖱 Drag-and-Drop:** Intuitive reorganization of tasks and collections using `@dnd-kit`.
-   **🔍 Global Search:** Instantly find any bullet or note across all logs and collections.
-   **🌗 Premium Aesthetics:** A custom "Premium Paper" feel with HSL-based light and dark modes, smooth animations via Framer Motion, and high-quality typography.
-   **💾 Data Portability:** Built-in export functionality to ensure you always own your data.
-   **🔐 Security:** Robust authentication and "Invitation Only" access model enforced via Firestore Security Rules.

## 🚀 Tech Stack

-   **Frontend:** React 19 (Hooks, Context API, Reducers), TypeScript
-   **Build Tool:** Vite
-   **Backend:** Firebase (Authentication, Firestore)
-   **Rich Text:** Tiptap Editor
-   **Animations:** Framer Motion
-   **Drag & Drop:** `@dnd-kit`
-   **Icons:** Lucide React
-   **Styling:** Custom Vanilla CSS with HSL variables for a consistent design system.

## 🏗 Architecture & Design

Last Task is built with a focus on **predictable state management** and **performance**.

-   **State Management:** Utilizes a centralized `useReducer` pattern combined with React Context to manage complex journal states without the overhead of external libraries.
-   **Security Model:** Implements a strict "Invitation Only" system. Only users with emails pre-authorized in the `allowed_users` Firestore collection can access the application, providing an extra layer of privacy.
-   **Design System:** Built on a custom HSL-based color palette that scales naturally between light and dark modes, ensuring a consistent user experience regardless of the environment.

## 🛠 Getting Started

### Prerequisites

-   Node.js (v18 or higher)
-   A Firebase Project (for Auth and Firestore)

### Local Development

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/your-username/bullet-journal.git
    cd bullet-journal
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Environment Setup:**
    Create a `.env` file in the root directory and add your Firebase configuration:
    ```env
    VITE_FIREBASE_API_KEY=your_api_key
    VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
    VITE_FIREBASE_PROJECT_ID=your_project_id
    VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
    VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
    VITE_FIREBASE_APP_ID=your_app_id
    ```

4.  **Start the development server:**
    ```bash
    npm run dev
    ```

### Firebase Setup

To use the security features, ensure your Firestore rules match the provided `firestore.rules` and you have an `allowed_users` collection where the document ID is the user's email.

## 📜 License

Distributed under the MIT License. See `LICENSE` for more information.

---

*Built with ❤️ for better productivity.*
