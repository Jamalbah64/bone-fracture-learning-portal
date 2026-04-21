// Adapter to choose between MongoDB (Mongoose) and local file-based user store
import bcrypt from 'bcryptjs';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const LOCAL_USERS_FILE = path.join(__dirname, '..', 'localdb', 'users.json');

async function ensureLocalFile() { // Ensure the local users file exists, creating it if not
    try {
        await fs.access(LOCAL_USERS_FILE);
    } catch (err) {
        await fs.mkdir(path.dirname(LOCAL_USERS_FILE), { recursive: true });
        await fs.writeFile(LOCAL_USERS_FILE, '[]', 'utf8');
    }
}

async function readUsers() { // Read users from local JSON file, ensuring it exists first
    await ensureLocalFile();
    const raw = await fs.readFile(LOCAL_USERS_FILE, 'utf8');
    return JSON.parse(raw || '[]');
}

async function writeUsers(users) {
    await fs.writeFile(LOCAL_USERS_FILE, JSON.stringify(users, null, 2), 'utf8');
}

// Local file based user methods
const LocalUser = { // Provides methods to find and create users in a local JSON file, with password hashing for security
    async findOne(query) {
        const users = await readUsers();
        if (!query) return null;
        if (query._id) {
            return users.find(u => String(u._id) === String(query._id)) || null;
        }
        if (query.username) {
            return users.find(u => u.username === query.username) || null;
        }
        if (query.staffId) {
            return users.find(u => String(u.staffId || '') === String(query.staffId)) || null;
        }
        return null;
    },

    async create({ username, password, role, staffId }) { // Create a new user, checking for duplicates and hashing the password before storing
        const users = await readUsers();
        if (users.find(u => u.username === username)) {
            const err = new Error('Username already in use');
            err.code = 'DUPLICATE';
            throw err;
        }
        // Hash and salt password before storing
        const salt = await bcrypt.genSalt(10); // Salt added to passwords to ensure they're unique even if two users have the same password
        const hashed = await bcrypt.hash(password, salt); // Added hashing to password to ensure security of user in case of data breach
        const id = Date.now().toString(36) + Math.floor(Math.random() * 36 ** 4).toString(36); // Generate a unique ID for the user
        const user = { _id: id, username, password: hashed, role };
        if (staffId !== undefined && staffId !== null && staffId !== '') {
            user.staffId = staffId;
        }
        users.push(user);
        await writeUsers(users);
        return user;
    }
};

// Mongoose-backed wrapper to provide same methods
let MongoUserWrapper = null;
try {
    // only import mongoose model when available and when not using local DB
    const useLocal = (process.env.USE_LOCAL_DB || '').toLowerCase() === 'true';
    if (!useLocal) {
        // dynamic import of the existing mongoose model
        const mod = await import('./Users.js');
        // Mongoose model has create and findOne methods
        MongoUserWrapper = {
            async findOne(query) {
                return mod.default.findOne(query).exec();
            },
            async create(payload) {
                return mod.default.create(payload);
            }
        };
    }
} catch (err) {
    // if import fails, it'll fall back to local
    MongoUserWrapper = null;
}

const UseLocal = (process.env.USE_LOCAL_DB || '').toLowerCase() === 'true' || MongoUserWrapper === null;

const User = UseLocal ? LocalUser : MongoUserWrapper;

export default User;
