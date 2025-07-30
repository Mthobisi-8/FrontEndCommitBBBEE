import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import logo from '../../assets/forge.png';
import { API_BASE_URL } from '../../config';

// Debug: Check API base URL
console.log('API_BASE_URL from config:', API_BASE_URL);

// API Service Layer
const apiService = {
  async checkHealth() {
    try {
      const response = await fetch(`${API_BASE_URL}/api/health`);
      if (!response.ok) {
        throw new Error(`Health check failed: ${response.status}`);
      }
      return response.json();
    } catch (error) {
      console.error('Health check error:', error.message);
      throw error;
    }
  },

  async login(credentials) {
    try {
      const response = await fetch(`${API_BASE_URL}/admin-login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Something went wrong');
      }
      console.log('Login response:', data); // Debug
      return data;
    } catch (error) {
      console.error('Login error:', error.message);
      throw error;
    }
  },

  async refreshToken(token) {
    try {
      const response = await fetch(`${API_BASE_URL}/refresh-token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Token refresh failed');
      }
      console.log('Refresh token response:', data); // Debug
      return data.token;
    } catch (error) {
      console.error('Refresh token error:', error.message);
      throw error;
    }
  },

  async fetchAdmins(token) {
    try {
      console.log('Using token for /api/admins:', token); // Debug
      const response = await fetch(`${API_BASE_URL}/api/admins`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });
      const data = await response.json();
      if (!response.ok) {
        console.log('Fetch admins response status:', response.status, data); // Debug
        throw new Error(`Fetch admins failed: ${response.status}`);
      }
      console.log('Admins data:', data); // Debug
      return data;
    } catch (error) {
      console.error('Fetch admins error:', error.message);
      throw error;
    }
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
    // Check backend health and token validity on mount
    const initialize = async () => {
      setLoadingHealth(true);
      try {
        const healthData = await apiService.checkHealth();
        console.log('Backend health:', healthData);
        setHealthStatus(healthData);

        // Check if existing token is valid
        const token = localStorage.getItem('adminToken');
        if (token) {
          try {
            await apiService.fetchAdmins(token);
            console.log('Existing token is valid');
          } catch (err) {
            console.warn('Existing token invalid, clearing:', err.message);
            localStorage.removeItem('adminToken');
            localStorage.removeItem('uid');
            localStorage.removeItem('businessEmail');
          }
        }
      } catch (err) {
        console.error('Health check error:', err.message);
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
      console.log('Storing token:', loginData.token); // Debug
      if (loginData.token && loginData.uid) {
        localStorage.setItem('adminToken', loginData.token);
        localStorage.setItem('uid', loginData.uid);
        localStorage.setItem('businessEmail', loginData.businessEmail);
      } else {
        throw new Error('Token or uid missing in response');
      }

      // Attempt to fetch admins with the new token
      try {
        const adminsData = await apiService.fetchAdmins(loginData.token);
        setSuccess(loginData.message || 'Login successful');
        navigate('/AdminDashboard', {
          state: {
            userData: {
              uid: loginData.uid,
              businessName: loginData.businessName,
              businessEmail: loginData.businessEmail,
              contactNumber: loginData.contactNumber,
            },
            admins: adminsData.admins,
          },
        });
      } catch (err) {
        if (err.message.includes('401')) {
          // Try refreshing the token
          try {
            const newToken = await apiService.refreshToken(loginData.token);
            localStorage.setItem('adminToken', newToken);
            const adminsData = await apiService.fetchAdmins(newToken);
            setSuccess(loginData.message || 'Login successful');
            navigate('/AdminDashboard', {
              state: {
                userData: {
                  uid: loginData.uid,
                  businessName: loginData.businessName,
                  businessEmail: loginData.businessEmail,
                  contactNumber: loginData.contactNumber,
                },
                admins: adminsData.admins,
              },
            });
          // eslint-disable-next-line no-unused-vars
          } catch (refreshErr) {
            throw new Error('Authentication failed: Please log in again');
          }
        } else {
          throw err;
        }
      }
    } catch (err) {
      console.error('Login Error:', err.message);
      if (err.message.includes('401')) {
        setError('Authentication failed: Invalid email or password');
      } else if (err.message.includes('403')) {
        setError('Access denied: User is not an admin');
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

      {/* Health check display */}
      {loadingHealth ? (
        <p className="text-yellow-500 mb-4 text-center">Checking backend status...</p>
      ) : healthStatus ? (
        <p className="text-green-500 mb-4 text-center">
          Backend Status: {healthStatus.message} ({healthStatus.status})
        </p>
      ) : (
        <p className="text-red-500 mb-4 text-center">Failed to check backend status</p>
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