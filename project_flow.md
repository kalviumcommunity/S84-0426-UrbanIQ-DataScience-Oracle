# Application Flow

This document provides a high-level overview of the application flow and architecture.

## Overview
The project is split into a **Backend** functioning as an API server and a **Frontend** acting as the user interface. They are decoupled to allow independent development and scaling.

### Backend (FastAPI)
The backend is built with **FastAPI** to handle requests quickly and asynchronously:
1. **Entry Point (`main.py`)**: The `FastAPI` application is created here. It manages the app lifespan, connecting to the MongoDB database on startup and gracefully closing the connection on shutdown.
2. **Configuration (`config/settings.py`)**: Environment variables and general settings are managed via Pydantic settings.
3. **Database (`database/connection.py` & MongoDB)**: Houses the Mongo client and handles operations like connecting to the database using the connection string from settings.
4. **Routes (`routes/insights.py`)**: This is where API endpoints are declared. They process HTTP requests, call necessary services, and return responses.
5. **Services (`services/data_analysis.py`)**: Contains the business logic and computations, keeping the routing layer thin.
6. **Models (`models/complaint_model.py`)**: Pydantic models validate incoming and outgoing data, ensuring the API is robust.

### Frontend (React + Vite)
The frontend is a fast Single Page Application (SPA) driven by **React** and bundled with **Vite**.
1. **App Initializer (`src/main.jsx`)**: Renders the core `<App />` component into the DOM and sets up any global providers (like React Router).
2. **Routing (`src/App.jsx`)**: The router dynamically loads the appropriate page based on the URL (e.g., `Dashboard` for `/`, `Complaints` for `/complaints`).
3. **Pages (`src/pages/`)**: These components map directly to the application routes, rendering full views.
4. **Styling**: Uses Tailwind CSS integrated via PostCSS for rapid, utility-first styling.

### Connection State
**Currently**, there is no explicit data binding active between the frontend and backend.
- The frontend pages (`Dashboard`, `Complaints`) contain static placeholders.
- The backend API responds to local calls but is pending a CORS (Cross-Origin Resource Sharing) configuration or Vite Proxy to allow the React frontend to fetch data without cross-origin errors.
- As development continues, HTTP clients (like `fetch` or `axios` in JS) will orchestrate the communication via the `/api/v1` routes.
