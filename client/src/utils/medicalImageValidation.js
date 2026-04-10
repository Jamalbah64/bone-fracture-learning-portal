// This file is responsible for validating medical images before they are uploaded
// It checks the file type, size, and dimensions to ensure that only valid medical images are accepted.

const ALLOWED_EXTENSIONS = [ // Common image formats and DICOM files
    ".png",
    ".jpg",
    ".jpeg",
    ".dcm",
    ".dicom",
    ".tif",
    ".tiff",
];

const IMAGE_MIME_TYPES = [ // Common MIME types for medical images
    "image/png",
    "image/jpeg",
    "image/jpg",
    "image/tiff",
    "application/dicom",
    "application/dicom+json",
];

const MEDICAL_KEYWORDS = [ // Keywords to help identify medical images based on filename
    "xray",
    "x-ray",
    "radiograph",
    "mri",
    "ct",
    "scan",
    "dicom",
];

// Utility functions for validating medical images
export function getFileExtension(filename = "") {
    const dotIndex = filename.lastIndexOf(".");
    return dotIndex >= 0 ? filename.slice(dotIndex).toLowerCase() : "";
}

// Checks if the file has an allowed medical image extension
export function isAllowedMedicalExtension(file) {
    const ext = getFileExtension(file?.name || "");
    return ALLOWED_EXTENSIONS.includes(ext);
}

// Checks if the file's MIME type is one of the allowed medical image types
export function isAllowedMedicalMime(file) {
    return IMAGE_MIME_TYPES.includes(file?.type || "");
}

// Checks if the filename contains any medical-related keywords
export function hasMedicalKeyword(file) {
    const name = (file?.name || "").toLowerCase();
    return MEDICAL_KEYWORDS.some((word) => name.includes(word));
}

// Main function to validate a medical image file
export function validateMedicalImage(file) {
    if (!file) {
        return {
            valid: false,
            reason: "No file was selected.",
        };
    }


    const ext = getFileExtension(file.name); // Get the file extension for validation

    if (!ALLOWED_EXTENSIONS.includes(ext)) {
        return {
            valid: false,
            reason: "Unsupported file type. Please upload an X-ray, MRI, or CT image file.",
        };
    }

    // Check if the MIME type looks valid or if the filename contains medical keywords
    const mimeLooksValid = !file.type || isAllowedMedicalMime(file);
    const nameLooksMedical = hasMedicalKeyword(file);

    // If the MIME type doesn't look valid and the filename doesn't contain medical keywords, reject the file
    if (!mimeLooksValid && !nameLooksMedical) {
        return {
            valid: false,
            reason: "This file does not appear to be a supported medical image.",
        };
    }

    return {
        valid: true,
        reason: "",
    };
}
