# Timeless Attire

Timeless Attire is a modern e-commerce web application for a vintage fashion store. It provides a full shopping experience — product browsing, cart management, checkout with Stripe payments, order tracking, and an admin dashboard for managing products, categories, orders, and reviews.

**Live repository:** https://github.com/akramnemri/Timeless-Attire

---

## Table of contents

1. [Features](#features)
2. [Tech stack](#tech-stack)
3. [Project structure](#project-structure)
4. [Prerequisites](#prerequisites)
5. [Getting started](#getting-started)
   - [Clone the repo](#clone-the-repo)
   - [Backend setup](#backend-setup)
   - [Frontend setup](#frontend-setup)
6. [Environment variables](#environment-variables)
7. [Running the app](#running-the-app)
8. [Running tests](#running-tests)
9. [Branching & workflow](#branching--workflow)
10. [Contributing](#contributing)
11. [License](#license)

---

## Features

- User registration, login, and password reset
- Product catalog with search and category filtering
- Product detail pages with image galleries and reviews
- Shopping cart with stock validation
- Checkout flow with Stripe payment integration
- Order history and tracking
- "Like" / favorite products
- Admin dashboard with sales metrics, top products, and order management
- Admin product/category/review management
- Responsive design with Material-UI components

---

## Tech stack

### Frontend

- React 18 (Create React App + react-app-rewired)
- Material-UI (MUI) v7
- React Router v7
- Axios
- Stripe React SDK (`@stripe/react-stripe-js`, `@stripe/stripe-js`)
- Chart.js + react-chartjs-2
- Day.js
- js-cookie
- dotenv for client-side environment variables

### Backend

- Python 3.10+
- Django 5.1
- Django REST Framework
- Simple JWT (authentication)
- Stripe Python SDK
- python-dotenv
- SQLite (development)

### Tooling

- ESLint (frontend)
- Jest + React Testing Library (frontend tests)

---

## Project structure

```
timeless-attire/
├── backend/
│   ├── api/
│   │   ├── migrations/           # Django database migrations
│   │   ├── admin.py
│   │   ├── models.py             # User, Product, Category, Cart, Order, Review, Like
│   │   ├── serializers.py
│   │   ├── tests.py              # Backend tests (placeholder)
│   │   ├── urls.py
│   │   └── views.py              # API endpoints
│   ├── backend/
│   │   ├── settings.py           # Django settings
│   │   ├── urls.py
│   │   └── wsgi.py
│   ├── media/                    # User-uploaded files
│   ├── manage.py
│   ├── requirements.txt
│   ├── .env                      # Local secrets (gitignored)
│   └── .env.example              # Template for environment variables
└── frontend/
    ├── public/
    ├── src/
    │   ├── components/
    │   │   ├── user/             # User-facing pages (Login, Register, Home, Cart, etc.)
    │   │   ├── admin/            # Admin pages (Dashboard, Products, Orders, etc.)
    │   │   ├── AdminLayout.js
    │   │   ├── Layout.js
    │   │   └── ...
    │   ├── App.js
    │   ├── Theme.js
    │   └── index.js
    ├── package.json
    ├── .env.local                # Local frontend env (gitignored)
    └── .env.example              # Template for frontend env vars
```

---

## Prerequisites

- Python 3.10+
- Node.js 16+ and npm
- A Stripe account (for payments)
- Git

---

## Getting started

### Clone the repo

```bash
git clone https://github.com/akramnemri/Timeless-Attire.git
cd Timeless-Attire
```

### Backend setup

```bash
cd backend

# Create a virtual environment (recommended)
python -m venv venv
source venv/bin/activate   # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Copy environment template and fill in values
cp .env.example .env
```

### Frontend setup

```bash
cd frontend

# Install dependencies
npm install

# Copy environment template and fill in values
cp .env.example .env.local
```

---

## Environment variables

### Backend (`.env`)

| Variable | Description | Required |
|----------|-------------|----------|
| `DEBUG` | Django debug mode (`True` / `False`) | Yes |
| `SECRET_KEY` | Django secret key (generate a strong random value) | **Yes** |
| `STRIPE_SECRET_KEY` | Stripe secret key (starts with `sk_test_` or `sk_live_`) | **Yes** |
| `EMAIL_HOST_USER` | Gmail address for transactional emails | **Yes** |
| `EMAIL_HOST_PASSWORD` | Gmail app password | **Yes** |
| `FRONTEND_URL` | Frontend origin for password reset links | Yes |
| `CORS_ALLOWED_ORIGINS` | Comma-separated list of allowed frontend origins | Yes |
| `ALLOWED_HOSTS` | Comma-separated list of allowed Django hosts | Yes |

### Frontend (`.env.local`)

| Variable | Description | Required |
|----------|-------------|----------|
| `REACT_APP_STRIPE_PUBLISHABLE_KEY` | Stripe publishable key (starts with `pk_test_` or `pk_live_`) | **Yes** |

> **Important:** Never commit `.env` or `.env.local` to version control. Use `.env.example` as a template.

---

## Running the app

### Start the backend

```bash
cd backend
source venv/bin/activate   # Windows: venv\Scripts\activate
python manage.py migrate
python manage.py runserver 8000
```

The API will be available at `http://localhost:8000/api/`.

### Start the frontend

```bash
cd frontend
npm start
```

The app will open at `http://localhost:3000/`.

---

## Running tests

### Frontend

```bash
cd frontend
npm test
```

### Backend

```bash
cd backend
python manage.py test
```

---

## Branching & workflow

This project follows a **feature-branch workflow**:

1. `main` — production-ready code
2. Create a feature branch from `main`:
   ```bash
   git checkout -b feature/your-feature-name
   ```
3. Make changes and commit with clear messages
4. Push the branch:
   ```bash
   git push origin feature/your-feature-name
   ```
5. Create a pull request and merge into `main` after review

Branch naming examples:

- `docs/readme`
- `ci/github-actions`
- `security/env-variables`
- `backend/requirements`
- `frontend/stripe-env-fix`

---

## Contributing

Contributions are welcome. Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## License

This project is licensed under the terms included in the `LICENSE` file.
