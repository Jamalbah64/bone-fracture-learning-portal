// Checks to see if the user has one of the allowed roles to access a route
export default function requireRole(...allowedRoles) {
    return (req, res, next) => {
        const userRole = req.user?.role;

        if (!userRole) {
            console.warn("Authorization attempt without role");
            return res.status(401).json({ error: "Unauthorized" });
        }

        if (!allowedRoles.includes(userRole)) {
            console.warn(`Authorization denied: user has role '${userRole}', allowed roles are: ${allowedRoles.join(", ")}`);
            return res.status(403).json({ error: "Forbidden" });
        }

        console.log(`Authorization granted: user role '${userRole}' is allowed`);
        next();
    };
}
