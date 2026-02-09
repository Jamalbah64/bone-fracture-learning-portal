//Routes are set up in the server/index.js file. This is the main entry point for the React application.

// This is the main App component that sets up routing and renders the NavBar and main content area. The actual pages (Home, Login, ChapterView, Dashboard) are defined in the pages directory.
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import ChapterView from './pages/ChapterView';
import Dashboard from './pages/Dashboard';
import Home from './pages/Home';
import Login from './pages/Login';
function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/login" element={<Login />} />
                <Route path="/chapter/:id" element={<ChapterView />} />
                <Route path="/dashboard" element={<Dashboard />} />
            </Routes>
        </BrowserRouter>
    );
}
export default App;
