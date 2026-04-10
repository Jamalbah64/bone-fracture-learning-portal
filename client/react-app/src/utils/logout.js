// This file handles the logout functionality for the application. It clears the user's session and redirects them to the login page.

export function logoutUser() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    document.cookie = "remember=; max-age=0; path=/";

    try {
        window.dispatchEvent(new Event("auth-change"));
    } catch {
        // ignore
    }
}
