import PatientAssignment from "../../models/PatientAssignment.js";

/**
 * Determines which patient ObjectIds the current user may access.
 * Returns null when the user has unrestricted access (head_radiologist).
 * Returns an array of ObjectIds otherwise.
 */
export async function accessiblePatientIds(userId, role) {
    if (role === "head_radiologist") return null;

    if (role === "patient") return [userId];

    if (role === "radiologist") {
        const assignments = await PatientAssignment.find({ radiologist: userId })
            .select("patientUser")
            .lean();
        return assignments.map((a) => a.patientUser);
    }

    return [];
}

/**
 * Express middleware that attaches req.accessiblePatients.
 * null  → unrestricted
 * [ids] → only these patients
 */
export default async function loadAccess(req, _res, next) {
    try {
        req.accessiblePatients = await accessiblePatientIds(
            req.user.userId,
            req.user.role
        );
        next();
    } catch (err) {
        next(err);
    }
}
