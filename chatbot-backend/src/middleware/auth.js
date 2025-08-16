const jwt = require('jsonwebtoken');

const authMiddleware = (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (authHeader) {
        const token = authHeader.split(' ')[1]; // Bearer <token>

        jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
            if (err) {
                // If the token is invalid or expired, we'll proceed without a user
                // The chatbot can function for both logged-in and guest users
                req.user = null;
                return next();
            }
            req.user = user;
            next();
        });
    } else {
        // No token provided, treat as a guest user
        req.user = null;
        next();
    }
};

module.exports = authMiddleware; 