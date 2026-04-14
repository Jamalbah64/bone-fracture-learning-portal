import mongoose from "mongoose";

// Schema for user sessions, storing information about the user, token, role, and session metadata
const sessionSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Users",
            required: true,
            index: true,
        },
        jti: {
            type: String,
            required: true,
            unique: true,
            index: true,
        },
        tokenHash: {
            type: String,
            required: true,
        },
        role: {
            type: String,
            enum: [
                "patient",
                "radiologist",
                "head_radiologist",
                "clinician",
                "admin",
            ],
            required: true,
        },
        userAgent: {
            type: String,
            default: "",
        },
        ipAddress: {
            type: String,
            default: "",
        },
        revoked: {
            type: Boolean,
            default: false,
            index: true,
        },
        expiresAt: {
            type: Date,
            required: true,
            index: true,
        },
        lastUsedAt: {
            type: Date,
            default: Date.now,
        },
    },
    { timestamps: true }
);

export default mongoose.model("Session", sessionSchema);
