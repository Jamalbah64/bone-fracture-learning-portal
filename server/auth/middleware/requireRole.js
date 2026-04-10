// Checks to see if the user has one of the allowed roles to access a route
export default function requireRole(...allowedRoles) {
    return (req, res, next) => {
        const userRole = req.user?.role;

        if (!userRole) {
            return res.status(401).json({ error: "Unauthorized" });
        }

        if (!allowedRoles.includes(userRole)) {
            return res.status(403).json({ error: "Forbidden" });
        }

        next();
    };
}
