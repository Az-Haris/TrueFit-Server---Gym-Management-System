# True Fit Backend

Welcome to the backend repository for **True Fit**, a comprehensive fitness management platform. This backend API powers the True Fit application, providing robust functionality and secure management of users, trainers, classes, payments, and more.

## Live Server Link
- [True Fit Backend](https://true-fit-server.vercel.app/)

---

## Table of Contents
- [Features](#features)
- [Technologies Used](#technologies-used)
- [Setup Instructions](#setup-instructions)
- [API Endpoints](#api-endpoints)
- [Environment Variables](#environment-variables)
- [Contact Information](#contact-information)

---

## Features

- **JWT Authentication**: Secure user authentication and role-based access control (Admin, Trainer, User).
- **User Management**: APIs to create, update, and manage user profiles.
- **Trainer Applications**: Submit, review, and approve/reject trainer applications.
- **Class Management**: Add, retrieve, and manage fitness classes.
- **Payment Integration**: Stripe-based payment processing for bookings.
- **Forum**: A platform for users and trainers to engage in discussions.
- **Reviews**: Submit and view reviews for trainers and classes.
- **Analytics**: Track subscriber vs. paid member ratios.

---

## Technologies Used

- **Backend Framework**: Node.js with Express.js
- **Database**: MongoDB (Raw Driver)
- **Authentication**: JSON Web Tokens (JWT)
- **Payment Gateway**: Stripe
- **Environment Variables**: `dotenv`
- **Hosting**: Vercel

---

## Setup Instructions

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd true-fit-backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   Create a `.env` file in the root directory and include the following:
   ```env
   PORT=5000
   DB_URI=your_mongodb_uri
   ACCESS_TOKEN_SECRET=your_jwt_secret
   STRIPE_SECRET_KEY=your_stripe_secret_key
   ```

4. Run the server:
   ```bash
   npm start
   ```

5. The server will be available at `http://localhost:5000`.

---

## API Endpoints

### User APIs
- `POST /users`: Save new user data.
- `GET /users/:email`: Retrieve user profile.
- `PATCH /users/:email`: Update user data.

### Trainer APIs
- `GET /trainers`: Get all trainers.
- `POST /apply`: Submit trainer application.

### Class APIs
- `POST /classes`: Add a new class.
- `GET /classes`: Retrieve all classes.

### Payment APIs
- `POST /api/create-payment-intent`: Create a payment intent.
- `GET /bookings/:email`: Retrieve booking info.

### Forum APIs
- `POST /forum`: Create a new forum discussion.
- `GET /forum`: Retrieve all forum discussions.

### Review APIs
- `POST /reviews`: Submit a review.
- `GET /reviews`: Retrieve all reviews.

---

## Environment Variables

| Variable              | Description                          |
|-----------------------|--------------------------------------|
| `PORT`                | Port number for the server          |
| `DB_URI`              | MongoDB connection URI              |
| `ACCESS_TOKEN_SECRET` | Secret key for JWT authentication   |
| `STRIPE_SECRET_KEY`   | Secret key for Stripe integration   |

---

## Contact Information

For any queries or support, feel free to reach out:

- **Name**: MD Alimuzzaman Haris
- **Email**: mdalimuzzaman437@gmail.com
- **Phone**: +880 1405-742311
- **Address**: 23/3, Kanam Homes, Hospital Road, Nalchity, Jhalokati

---

Thank you for visiting the True Fit Backend repository!
