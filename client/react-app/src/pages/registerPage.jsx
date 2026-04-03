// This is the register page for the user authentication system

import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

/**
 * Registration page component.
 * Collects username and password,
 * and redirects to the login page on success.
 */


function Register() {
    // function for handling user registration. 
    // It sends a POST request to the server with the username and password, 
    // and handles the response accordingly.  
    const navigate = useNavigate();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        // Prevent default form submission behavior
        e.preventDefault();
        setError('');
        try {
            const response = await fetch('/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username: username, password }),
            });
            const data = await response.json();
            if (!response.ok) {
                // If the response is not ok, set the error message from the response or a default message
                setError(data.error || 'Registration failed');
                return;
            }
            // Redirect to login page after successful registration
            navigate('/login');
        } catch (err) {
            setError(err?.message || 'An unexpected error occurred');
        }
    };

    return (
        <div className="auth-container">
            <h2>Register</h2>
            <form onSubmit={handleSubmit}>
                <div>
                    <label htmlFor="username">Username:</label>
                    <input
                        type="text"
                        id="username"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        required
                    />
                </div>
                <div>
                    <label htmlFor="password">Password:</label>
                    <input
                        type="password"
                        id="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />
                </div>
                {error && <p className="error">{error}</p>}
                <button type="submit">Register</button>
            </form>
            <p>
                Already have an account? <Link to="/login">Login</Link>
            </p>
        </div>
    );
}

export default Register;
