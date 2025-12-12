import { useNavigate } from 'react-router-dom';

function Dashboard() {
    const navigate = useNavigate();
    const user = JSON.parse(localStorage.getItem('user') || '{}');

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login'; // Force refresh to clear state
    };

    return (
        <div className="glass-card">
            <h1>Welcome, {user.username || 'User'}!</h1>
            <p>You have successfully logged in.</p>
            <p>This is a protected dashboard page.</p>
            <button onClick={handleLogout}>Logout</button>
        </div>
    );
}

export default Dashboard;
