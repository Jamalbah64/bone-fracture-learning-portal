import mongoose from "mongoose";

const predictionSchema = new mongoose.Schema(
    {
        code: { type: String, required: true },
        confidence: { type: Number, required: true },
    },
    { _id: false }
);

const modelRunSchema = new mongoose.Schema(
    {
        key: String,
        label: String,
        filename: String,
        predictions: [predictionSchema],
        num_labels: { type: Number, default: 0 },
    },
    { _id: false }
);

const scanSchema = new mongoose.Schema(
    {
        patientUser: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Users",
            index: true,
        },
        patientId: {
            type: String,
            required: true,
            index: true,
        },
        uploadedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Users",
            required: true,
            index: true,
        },
        filename: { type: String, required: true },
        imagePath: { type: String, required: true },
        models: [modelRunSchema],
    },
    { timestamps: true }
);

scanSchema.index({ patientUser: 1, createdAt: 1 });
scanSchema.index({ uploadedBy: 1, createdAt: 1 });

export default mongoose.models.Scan || mongoose.model("Scan", scanSchema);
