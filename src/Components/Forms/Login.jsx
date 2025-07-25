import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import logo from '../../assets/forge.png';
import { API_BASE_URL } from '../../config';

// API Service Layer
const apiService = {
  async login(credentials) {
    const response = await fetch(`${API_BASE_URL}/api/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || 'Something went wrong');
    }
    return response.json();
  },

  async fetchData() {
    const response = await fetch(`${API_BASE_URL}/api/health`);
    if (!response.ok) {
      throw new Error(`Health check failed: ${response.status}`);
    }
    return response.json();
  },
};

export default function Login() {
  const [formData, setFormData] = useState({ businessEmail: '', password: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [healthStatus, setHealthStatus] = useState(null);
  const [loadingHealth, setLoadingHealth] = useState(false);
  const navigate = useNavigate();

  // Check backend health on mount
  useEffect(() => {
    const checkHealth = async () => {
      setLoadingHealth(true);
      try {
        const healthData = await apiService.fetchData();
        console.log('Backend health:', healthData);
        setHealthStatus(healthData);
      } catch (err) {
        console.error('Health check error:', err.message);
        setError('Failed to connect to backend');
      } finally {
        setLoadingHealth(false);
      }
    };
    checkHealth();
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError(''); // Clear error on input change
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log('Submit clicked!', formData);
    setError('');
    setSuccess('');
    setIsLoading(true);

    try {
      const data = await apiService.login(formData);

      if (data.idToken && data.uid) {
        localStorage.setItem('authToken', data.idToken); // Use authToken for consistency
        localStorage.setItem('uid', data.uid);
        console.log('authToken stored:', data.idToken);
        console.log('uid stored:', data.uid);
      } else {
        throw new Error('idToken or uid missing in response');
      }

      setSuccess(data.message || 'Login successful');
      navigate('/Home', {
        state: {
          userData: {
            uid: data.uid,
            businessName: data.businessName,
            financialYearEnd: data.financialYearEnd,
          },
        },
      });
    } catch (err) {
      console.error('Error:', err.message);
      setError(err.message);
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
      <h2 className="text-2xl font-bold mb-6 text-center">Log In</h2>
      {/* Health Status Display */}
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
          Don’t have an account? <Link to="/SignUp" className="text-blue-600 hover:underline">Sign Up</Link>
        </p>
      </form>
      {error && <p className="mt-4 text-red-500 text-center">{error}</p>}
      {success && <p className="mt-4 text-green-500 text-center">{success}</p>}
    </div>
  );
}