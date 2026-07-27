/**
 * Authentication middleware to check if user has valid tokens in session.
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const requireAuth = (req, res, next) => {
    if (!req.session || !req.session.tokens) {
        return res.status(401).json({ error: 'Unauthorized: No session or tokens found' });
    }
    next();
};

module.exports = { requireAuth };
