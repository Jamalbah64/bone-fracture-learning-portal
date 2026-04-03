import { useState } from 'react';
import { useNavigate } from 'react-router-dom';


/*
Login page for the user authentication system. 
Collects username and password
Prompts user to login if they don't have an account
*/

function Login() {
    const navigate = useNavigate();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [remember, setRemember] = useState(false); //This is for the remember me checkbox

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        try {
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username: username, password }),
            });
            const data = await response.json();
            if (!response.ok) {
                setError(data.error || 'Login failed');
                return;
            }
            // Save token and redirect to dashboard
            localStorage.setItem('token', data.token);
            // notify the app in this tab about the auth change
            try {
                window.dispatchEvent(new Event('auth-change'));
            } catch {
                // ignore
            }
            // If user chose "Remember me" create a persistent cookie.
            // Deleted cookie means the login page will show next time.
            if (remember) {
                // cookie expires in 30 days
                document.cookie = `remember=true; max-age=${60 * 60 * 24 * 30}; path=/`;
            } else {
                // ensure cookie is removed if previously set
                document.cookie = `remember=; max-age=0; path=/`;
            }
            navigate('/dashboard');
        } catch {
            setError('An unexpected error occurred');
        }
    };

    return (
        <div className="auth-container">
            <h2>Login</h2>
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
                <button type="submit">Login</button>
            </form>
            <div>
                <label>
                    <input
                        type="checkbox"
                        checked={remember}
                        onChange={(e) => setRemember(e.target.checked)}
                    />{' '}
                    Remember me
                </label>
            </div>
            <p>
                Don't have an account? <a href="/register">Register</a>
            </p>
        </div>
    );
}

export default Login;
