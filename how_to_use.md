# How to Use the Project

This guide provides step-by-step instructions on how to set up, run, and develop the application locally.

## Prerequisites
- **Python 3.9+**
- **Node.js (LTS version recommended)**
- **MongoDB** running locally or via a cloud provider (e.g., Atlas).

---

## 1. Setting up the Backend

1. **Navigate to the Backend Directory**:
    ```bash
    cd backend
    ```

2. **Activate the Virtual Environment**:
    A virtual environment (`venv1`) is already created in the root directory. Activate it based on your OS:
    - **Windows (PowerShell)**:
      ```powershell
      ..\venv1\Scripts\Activate.ps1
      ```
    - **Mac/Linux**:
      ```bash
      source ../venv1/bin/activate
      ```

3. **Install Dependencies**:
    ```bash
    pip install -r requirements.txt
    ```

4. **Environment Variables**:
    Create a `.env` file in the `backend` folder (if it doesn't already exist) or configure `settings.py` locally containing database URIs and app settings.

5. **Start the Development Server**:
    ```bash
    uvicorn main:app --reload
    ```
    - The API will be available at `http://localhost:8000`.
    - Interactive API Docs (Swagger UI) are accessible at `http://localhost:8000/docs`.

---

## 2. Setting up the Frontend

1. **Navigate to the Frontend Directory**:
    Open a new terminal window/tab to keep the backend running, then navigate to your frontend folder:
    ```bash
    cd frontend
    ```

2. **Install Node Modules**:
    ```bash
    npm install
    ```

3. **Run the Development Server**:
    ```bash
    npm run dev
    ```
    - The React app should now be running (usually on `http://localhost:5173`).
    - Vite provides instantaneous Hot Module Replacement (HMR) for rapid UI development.

---

## 3. Developing

- **To write Backend code**: Focus your changes inside the `backend/routes/`, `backend/services/`, and `backend/models/` directories.
- **To write Frontend code**: Edit React files inside `frontend/src/` (such as `App.jsx`, pages, and components).
- **Restarting**: Changes in React (Frontend) or FastAPI (Backend if run with `--reload`) will be instantly reflected without manually restarting the servers.
