import mongoose from "mongoose";

const patientAssignmentSchema = new mongoose.Schema(
    {
        patientUser: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Users",
            required: true,
            index: true,
        },
        radiologist: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Users",
            required: true,
            index: true,
        },
        assignedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Users",
            required: true,
        },
    },
    { timestamps: true }
);

patientAssignmentSchema.index(
    { patientUser: 1, radiologist: 1 },
    { unique: true }
);

export default mongoose.model("PatientAssignment", patientAssignmentSchema);
