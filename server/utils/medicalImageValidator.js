// Server-side validation for medical images
// Validates file types, MIME types, and basic image structure to ensure only medical images are accepted

const ALLOWED_EXTENSIONS = [".png", ".jpg", ".jpeg", ".tif", ".tiff", ".dcm", ".dicom"];

const ALLOWED_MIME_TYPES = [
    "image/png",
    "image/jpeg",
    "image/tiff",
    "application/dicom",
];

const MEDICAL_KEYWORDS = ["xray", "x-ray", "radiograph", "mri", "ct", "scan", "dicom"];

/**
 * Validates that a file is a medical image based on extension, MIME type, and filename
 * @param {Object} file - File object with name and mimetype properties
 * @returns {Object} { valid: boolean, reason: string }
 */
export function validateMedicalImage(file) {
    if (!file || !file.originalname) {
        return {
            valid: false,
            reason: "No file provided",
        };
    }

    // Check file extension
    const ext = getFileExtension(file.originalname);
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
        return {
            valid: false,
            reason: `Unsupported file type: ${ext}. Allowed types: ${ALLOWED_EXTENSIONS.join(", ")}`,
        };
    }

    // Check MIME type
    const mimetype = file.mimetype || "";
    const mimeIsValid = !mimetype || ALLOWED_MIME_TYPES.includes(mimetype);
    const nameHasMedicalKeyword = hasMedicalKeyword(file.originalname);

    // Accept if MIME type is valid OR filename contains medical keyword
    if (!mimeIsValid && !nameHasMedicalKeyword) {
        return {
            valid: false,
            reason: "File does not appear to be a medical image (check MIME type or filename)",
        };
    }

    // For DICOM files, check magic number
    if (ext === ".dcm" || ext === ".dicom") {
        const isValidDicom = validateDicomMagicNumber(file.buffer);
        if (!isValidDicom) {
            return {
                valid: false,
                reason: "Invalid DICOM file structure",
            };
        }
    }

    return {
        valid: true,
        reason: "",
    };
}

/**
 * Gets the file extension from a filename
 * @param {string} filename
 * @returns {string} File extension in lowercase
 */
function getFileExtension(filename = "") {
    const dotIndex = filename.lastIndexOf(".");
    return dotIndex >= 0 ? filename.slice(dotIndex).toLowerCase() : "";
}

/**
 * Checks if filename contains medical-related keywords
 * @param {string} filename
 * @returns {boolean}
 */
function hasMedicalKeyword(filename = "") {
    const name = filename.toLowerCase();
    return MEDICAL_KEYWORDS.some((keyword) => name.includes(keyword));
}

/**
 * Validates DICOM file magic number (should start with "DICM" at offset 128)
 * @param {Buffer} buffer - File buffer
 * @returns {boolean}
 */
function validateDicomMagicNumber(buffer) {
    if (!buffer || buffer.length < 132) {
        return false;
    }

    // DICOM files should have "DICM" magic string at offset 128
    const magicString = buffer.toString("ascii", 128, 132);
    return magicString === "DICM";
}
