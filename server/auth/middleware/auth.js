// Authentication middleware to protect route endpoints
//Also verifies JWT tokens and extracts user info for use in route handlers

const jwt = rquire('jsonwebtoken');

function authMiddleware(req,res, next) {
    const authHeader = req.headers['authorization'];
    
    // Check for Bearer token in Authorization header
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Missing or invalid token' });
    }
    const token = authHeader.split(' ')[1];
    try{
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (err) {
        return res.status(401).json({ error: 'Invalid token' });
    }
}

module.exxports = authMiddleware;
