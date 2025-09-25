# Monorepo Setup

This repository contains both the frontend and backend services for the project. Each service runs independently from its respective folder.

## Project Structure

```
dtcc-tracker/
│── frontend/    # Frontend application (React/Next.js)
│── backend/     # Backend application (Django)
│── README.md    # Project documentation
```

---

## Installation

### 1. Clone the Repository

```bash
git clone <your-repo-url>
cd dtcc-tracker
```

### 2. Install Frontend Dependencies

```bash
cd frontend
npm install  # or yarn install
```

### 3. Install Backend Dependencies

```bash
cd ../backend
python -m venv venv  # Create a virtual environment
source venv/bin/activate  # Activate it (Linux/macOS)
venv\Scripts\activate  # Activate it (Windows)
pip install -r requirements.txt
```

---

## Running the Project

### 1. Run the Backend

```bash
cd backend
source venv/bin/activate  # (If not activated)
python manage.py migrate
python manage.py createsuperuser # Creating initial superuser
python manage.py runserver
```

By default, the backend runs on `http://127.0.0.1:8000/`.

### 2. Run the Frontend

Open a new terminal and run:

```bash
cd frontend
npm run dev  # or yarn dev
```

By default, the frontend runs on `http://localhost:3000/`.

---
## Additional Commands

### Running Backend Migrations

```bash
cd backend
python manage.py makemigrations
python manage.py migrate
```
