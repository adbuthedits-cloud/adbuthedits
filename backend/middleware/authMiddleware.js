const jwt = require('jsonwebtoken');

module.exports = function (req, res, next) {
    // Get token from header
    const token = req.header('Authorization')?.replace('Bearer ', '');

    // Check if not token
    if (!token) {
        return res.status(401).json({ msg: 'No token, authorization denied' });
    }

    // Verify token
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secretkey');
        req.user = decoded.user;

        // Optionally check if account is deactivated
        const User = require('../models/User');
        User.findByPk(decoded.user.id).then(user => {
            if (user && user.is_deactivated) {
                return res.status(403).json({
                    msg: 'Account is deactivated. Kindly activate your account through OTP verification.',
                    isDeactivated: true
                });
            }
            next();
        }).catch(() => next());
    } catch (err) {
        res.status(401).json({ msg: 'Token is not valid' });
    }
};
