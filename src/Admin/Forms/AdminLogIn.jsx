import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import logo from '../../assets/forge.png';
import { API_BASE_URL } from '../../config';

// API Service Layer
const apiService = {
  async checkHealth() {
    const response = await fetch(`${API_BASE_URL}/api/health`);
    if (!response.ok) throw new Error(`Health check failed: ${response.status}`);
    return response.json();
  },

  async login(credentials) {
    const response = await fetch(`${API_BASE_URL}/admin-login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Login failed');
    return data;
  },

  async refreshToken(token) {
    const response = await fetch(`${API_BASE_URL}/refresh-token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Token refresh failed');
    return data.token;
  },

  async fetchAdmins(token) {
    const response = await fetch(`${API_BASE_URL}/api/admins`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
    const data = await response.json();
    if (!response.ok) throw new Error(`Fetch admins failed: ${response.status}`);
    return data;
  },

  async fetchSomeData() {
    const response = await fetch(`${API_BASE_URL}/api/some-data`);
    if (!response.ok) throw new Error(`Fetch some data failed: ${response.status}`);
    return response.json();
  },
};

export default function AdminLogIn() {
  const [formData, setFormData] = useState({ businessEmail: '', password: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [healthStatus, setHealthStatus] = useState(null);
  const [loadingHealth, setLoadingHealth] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const initialize = async () => {
      setLoadingHealth(true);
      try {
        const healthData = await apiService.checkHealth();
        setHealthStatus(healthData);

        const token = localStorage.getItem('adminToken');
        if (token) {
          try {
            await apiService.fetchAdmins(token);
          } catch {
            localStorage.removeItem('adminToken');
            localStorage.removeItem('uid');
            localStorage.removeItem('businessEmail');
          }
        }

        // Fetch additional data (optional)
        await apiService.fetchSomeData();
      // eslint-disable-next-line no-unused-vars
      } catch (err) {
        setError('Failed to connect to backend');
      } finally {
        setLoadingHealth(false);
      }
    };
    initialize();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsLoading(true);

    try {
      const loginData = await apiService.login(formData);
      const { token, uid, businessName, businessEmail, contactNumber, message } = loginData;

      if (!token || !uid) throw new Error('Token or UID missing');

      localStorage.setItem('adminToken', token);
      localStorage.setItem('uid', uid);
      localStorage.setItem('businessEmail', businessEmail);

      let adminsData;
      try {
        adminsData = await apiService.fetchAdmins(token);
      } catch (err) {
        if (err.message.includes('401')) {
          const newToken = await apiService.refreshToken(token);
          localStorage.setItem('adminToken', newToken);
          adminsData = await apiService.fetchAdmins(newToken);
        } else {
          throw err;
        }
      }

      setSuccess(message || 'Login successful');
      navigate('/AdminDashboard', {
        state: {
          userData: {
            uid,
            businessName,
            businessEmail,
            contactNumber,
          },
          admins: adminsData.admins,
        },
      });
    } catch (err) {
      if (err.message.includes('401')) {
        setError('Invalid email or password');
      } else if (err.message.includes('403')) {
        setError('Access denied: Not an admin');
      } else {
        setError(err.message || 'Login failed');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-10 p-6 bg-white rounded-lg shadow-md">
      <div className="flex justify-center mb-6">
        <Link to="/LandingPage">
          <img src={logo} alt="Forge Logo" className="h-16" />
        </Link>
      </div>

      <h2 className="text-2xl font-bold mb-6 text-center">Admin Log In</h2>

      {loadingHealth ? (
        <p className="text-yellow-500 text-center mb-4">Checking backend status...</p>
      ) : healthStatus ? (
        <p className="text-green-500 text-center mb-4">
          Backend Status: {healthStatus.message} ({healthStatus.status})
        </p>
      ) : (
        <p className="text-red-500 text-center mb-4">Failed to check backend status</p>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="email"
          name="businessEmail"
          placeholder="Business Email"
          value={formData.businessEmail}
          onChange={handleChange}
          className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-600"
          required
          autoComplete="email"
          disabled={isLoading}
        />
        <input
          type="password"
          name="password"
          placeholder="Password"
          value={formData.password}
          onChange={handleChange}
          className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-600"
          required
          autoComplete="current-password"
          disabled={isLoading}
        />
        <button
          type="submit"
          className={`w-full p-2 text-white rounded ${
            isLoading ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
          }`}
          disabled={isLoading}
        >
          {isLoading ? 'Logging In...' : 'Log In'}
        </button>
        <p className="text-center">
          Don’t have an account?{' '}
          <Link to="/AdminSignUp" className="text-blue-600 hover:underline">
            Sign Up
          </Link>
        </p>
      </form>

      {error && <p className="mt-4 text-red-500 text-center">{error}</p>}
      {success && <p className="mt-4 text-green-500 text-center">{success}</p>}
    </div>
  );
}
