export const AUTH_COOKIE_NAME = "fract_auth";

// Function to get cookie options based on the environment
export function getCookieOptions() {
    const isProduction = process.env.NODE_ENV === "production";

    return {
        httpOnly: true,
        secure: isProduction,
        sameSite: isProduction ? "strict" : "lax",
        path: "/",
        maxAge: 1000 * 60 * 60 * 2, // 2 hours
    };
}
