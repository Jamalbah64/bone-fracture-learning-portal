import "dotenv/config";
import mongoose from "mongoose";

const mongoUri = process.env.MONGO_URI?.trim(); // Ensure MONGO_URI is provided and trimmed of whitespace
if (!mongoUri) {
    console.error("Missing MONGO_URI in .env");
    process.exit(1);
}

await mongoose.connect(mongoUri);
console.log("Connected to MongoDB");

const db = mongoose.connection.db;

const scansDeleted = await db.collection("scans").deleteMany({});
console.log(`Deleted ${scansDeleted.deletedCount} scans`);

const assignmentsDeleted = await db.collection("patientassignments").deleteMany({});
console.log(`Deleted ${assignmentsDeleted.deletedCount} patient assignments`);

const sharesDeleted = await db.collection("shareditems").deleteMany({});
console.log(`Deleted ${sharesDeleted.deletedCount} shared items`);

const notificationsDeleted = await db.collection("notifications").deleteMany({});
console.log(`Deleted ${notificationsDeleted.deletedCount} notifications`);

console.log("\nAll scan data cleared. User accounts are untouched.");
await mongoose.disconnect();
process.exit(0);
