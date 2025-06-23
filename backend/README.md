# Crowdfunding Backend API

A Node.js/Express.js backend API for a crowdfunding platform with user registration, email verification, and authentication.

## Features

- User registration with name, email, and password
- Email verification using OTP
- User login with JWT authentication
- Fake email detection and validation
- Password encryption using bcrypt
- MongoDB database integration
- Input validation and error handling
- Protected routes with JWT middleware

## Prerequisites

- Node.js (v14 or higher)
- MongoDB (local or cloud)
- Gmail account for sending emails

## Installation

1. Clone the repository and navigate to the backend folder:

```bash
cd backend
```

2. Install dependencies:

```bash
npm install
```

3. Configure environment variables:

   - Copy `config.env` and update the values:
   - `EMAIL_USER`: Your Gmail address
   - `EMAIL_PASS`: Your Gmail app password (not regular password)
   - `JWT_SECRET`: A random string for JWT signing
   - `MONGODB_URI`: Your MongoDB connection string

4. For Gmail setup:
   - Enable 2-factor authentication
   - Generate an app password
   - Use the app password in `EMAIL_PASS`

## Running the Application

### Development mode:

```bash
npm run dev
```

### Production mode:

```bash
npm start
```

The server will start on port 5001 (or the port specified in config.env).

## API Endpoints

### 1. Register User

**POST** `/api/auth/register`

**Request Body:**

```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123"
}
```

**Response:**

```json
{
  "success": true,
  "message": "Registration successful! Please check your email for OTP verification.",
  "data": {
    "userId": "user_id",
    "name": "John Doe",
    "email": "john@example.com",
    "isEmailVerified": false
  }
}
```

### 2. Login User

**POST** `/api/auth/login`

**Request Body:**

```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

**Response:**

```json
{
  "success": true,
  "message": "Login successful!",
  "data": {
    "user": {
      "userId": "user_id",
      "name": "John Doe",
      "email": "john@example.com",
      "isEmailVerified": true,
      "createdAt": "2024-01-01T00:00:00.000Z"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### 3. Verify OTP

**POST** `/api/auth/verify-otp`

**Request Body:**

```json
{
  "email": "john@example.com",
  "otp": "123456"
}
```

**Response:**

```json
{
  "success": true,
  "message": "Email verified successfully!",
  "data": {
    "userId": "user_id",
    "name": "John Doe",
    "email": "john@example.com",
    "isEmailVerified": true
  }
}
```

### 4. Resend OTP

**POST** `/api/auth/resend-otp`

**Request Body:**

```json
{
  "email": "john@example.com"
}
```

**Response:**

```json
{
  "success": true,
  "message": "New OTP sent successfully! Please check your email."
}
```

### 5. Get User Profile (Protected Route)

**GET** `/api/auth/profile`

**Headers:**

```
Authorization: Bearer YOUR_JWT_TOKEN
```

**Response:**

```json
{
  "success": true,
  "message": "Profile retrieved successfully",
  "data": {
    "user": {
      "userId": "user_id",
      "name": "John Doe",
      "email": "john@example.com",
      "isEmailVerified": true,
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  }
}
```

## Authentication

### JWT Token Usage

After successful login, you'll receive a JWT token. Use this token in the Authorization header for protected routes:

```
Authorization: Bearer YOUR_JWT_TOKEN
```

### Protected Routes

To protect any route, use the `authenticateToken` middleware:

```javascript
const { authenticateToken } = require("../middleware/auth");

router.get("/protected-route", authenticateToken, (req, res) => {
  // Access user info from req.user
  const { userId, email, name } = req.user;
  // Your route logic here
});
```

## Error Handling

The API includes comprehensive error handling for:

- Invalid email formats
- Fake or non-existent email addresses
- Duplicate user registration
- Expired OTP codes
- Invalid OTP codes
- Invalid login credentials
- Unverified email attempts
- Invalid or expired JWT tokens
- Database connection issues
- Email service failures

## Project Structure

```
backend/
├── config/
│   └── database.js          # MongoDB connection
├── middleware/
│   ├── validate.js          # Request validation
│   └── auth.js              # JWT authentication
├── models/
│   └── User.js             # User model
├── routes/
│   └── auth.js             # Authentication routes
├── utils/
│   └── emailService.js     # Email service utilities
├── config.env              # Environment variables
├── package.json            # Dependencies
├── server.js               # Main server file
└── README.md               # This file
```

## Security Features

- Password hashing with bcrypt
- Input validation and sanitization
- Email format validation
- OTP expiration (10 minutes)
- JWT token expiration (7 days)
- Protected routes with middleware
- Error messages that don't expose sensitive information

## Testing the API

You can test the API using tools like Postman, curl, or any HTTP client:

1. **Register a user:**

```bash
curl -X POST http://localhost:5001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","email":"test@example.com","password":"password123"}'
```

2. **Login:**

```bash
curl -X POST http://localhost:5001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'
```

3. **Get profile (with token):**

```bash
curl -X GET http://localhost:5001/api/auth/profile \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## Troubleshooting

1. **Email not sending:** Check your Gmail app password and 2FA settings
2. **MongoDB connection error:** Ensure MongoDB is running and connection string is correct
3. **Port already in use:** Change the PORT in config.env
4. **Fake email detection:** The API will detect and reject fake email addresses
5. **JWT token issues:** Ensure JWT_SECRET is set in config.env

## License

MIT License
