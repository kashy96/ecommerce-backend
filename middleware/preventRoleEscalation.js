/**
 * Middleware to prevent role escalation
 * Removes 'role' field from request body to prevent users from setting admin role
 */
const preventRoleEscalation = (req, res, next) => {
  // Remove role field from request body if present
  if (req.body && req.body.role) {
    console.log(`Role escalation attempt detected from IP: ${req.ip}`);
    delete req.body.role;
  }

  next();
};

module.exports = preventRoleEscalation;