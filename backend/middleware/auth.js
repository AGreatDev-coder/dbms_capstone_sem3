/**
 * LIFE-LINK Authentication & RBAC Middleware
 * Enforces role-based permissions at backend endpoint level
 */

const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'lifelink_super_secret_jwt_key_2026_capstone_academic';

function generateToken(user) {
  return jwt.sign(
    {
      user_id: user.user_id,
      person_id: user.person_id,
      username: user.username,
      email: user.email,
      role: user.role,
      donor_id: user.donor_id || null,
      patient_id: user.patient_id || null,
      staff_id: user.staff_id || null,
    },
    JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
}

function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Access Denied: Missing authentication token.',
    });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({
        success: false,
        message: 'Invalid or expired authentication token.',
      });
    }
    req.user = user;
    next();
  });
}

function authorizeRoles(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user || !req.user.role) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized: User role not identified.',
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Forbidden: Role '${req.user.role}' lacks authorization for this resource. Required: [${allowedRoles.join(', ')}]`,
      });
    }

    next();
  };
}

module.exports = {
  generateToken,
  authenticateToken,
  authorizeRoles,
};

