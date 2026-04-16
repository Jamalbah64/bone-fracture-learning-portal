import mongoose from "mongoose";

const sharedItemSchema = new mongoose.Schema(
    {
        resourceType: {
            type: String,
            enum: ["scan"],
            required: true,
        },
        resourceId: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            index: true,
        },
        sharedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Users",
            required: true,
        },
        sharedWith: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Users",
            required: true,
            index: true,
        },
        message: {
            type: String,
            default: "",
        },
    },
    { timestamps: true }
);

sharedItemSchema.index(
    { resourceType: 1, resourceId: 1, sharedWith: 1 },
    { unique: true }
);

export default mongoose.model("SharedItem", sharedItemSchema);
