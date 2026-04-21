// Checks to see if the user has one of the allowed roles to access a route
export default function requireRole(...allowedRoles) {
    return (req, res, next) => {
        const userRole = req.user?.role;

        if (!userRole) {
<<<<<<< HEAD
            console.warn("Authorization attempt without role");
=======
>>>>>>> cfd71478b51c4686f71dbb91118365a21552ab44
            return res.status(401).json({ error: "Unauthorized" });
        }

        if (!allowedRoles.includes(userRole)) {
<<<<<<< HEAD
            console.warn(`Authorization denied: user has role '${userRole}', allowed roles are: ${allowedRoles.join(", ")}`);
            return res.status(403).json({ error: "Forbidden" });
        }

        console.log(`Authorization granted: user role '${userRole}' is allowed`);
=======
            return res.status(403).json({ error: "Forbidden" });
        }

>>>>>>> cfd71478b51c4686f71dbb91118365a21552ab44
        next();
    };
}
