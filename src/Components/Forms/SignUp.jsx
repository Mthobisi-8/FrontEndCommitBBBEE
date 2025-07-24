import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import logo from '../../assets/forge.png';
import { API_BASE_URL } from '../config';

// API Service Layer
const apiService = {
  async signup(userData) {
    const response = await fetch(`${API_BASE_URL}/api/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData),
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

export default function SignUp() {
  const [formData, setFormData] = useState({
    businessEmail: '',
    password: '',
    businessName: '',
    financialYearEnd: '',
    address: '',
    contactNumber: '',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
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

  const validateForm = () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const phoneRegex = /^\+?\d{10,15}$/;
    const dateRegex = /^\d{2}\/[A-Za-z]{3}\/\d{4}$/;
    const passwordRegex = /^.{8,}$/;

    if (!emailRegex.test(formData.businessEmail)) {
      return 'Please enter a valid email address';
    }
    if (!passwordRegex.test(formData.password)) {
      return 'Password must be at least 8 characters long';
    }
    if (!formData.businessName.trim()) {
      return 'Business name is required';
    }
    if (!dateRegex.test(formData.financialYearEnd)) {
      return 'Financial year end must be in DD/MMM/YYYY format (e.g., 31/Mar/2025)';
    }
    if (!formData.address.trim()) {
      return 'Address is required';
    }
    if (!phoneRegex.test(formData.contactNumber)) {
      return 'Contact number must be 10-15 digits (e.g., +27123456789)';
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log('Submit clicked!', formData);
    setError('');
    setSuccess('');
    setLoading(true);

    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      setLoading(false);
      return;
    }

    try {
      // Convert DD/MMM/YYYY to ISO date
      const [day, month, year] = formData.financialYearEnd.split('/');
      const monthIndex = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].indexOf(month);
      if (monthIndex === -1) throw new Error('Invalid month format');
      const isoDate = new Date(year, monthIndex, day).toISOString();
      const userData = { ...formData, financialYearEnd: isoDate };

      console.log('Form data being sent:', JSON.stringify(userData));
      const data = await apiService.signup(userData);
      console.log('Response received:', data);

      setSuccess(data.message || 'Signup successful, please log in');

      const userDataForLogin = {
        uid: data.uid,
        businessName: data.businessName,
        financialYearEnd: data.financialYearEnd,
        address: data.address,
        contactNumber: data.contactNumber,
      };
      console.log('userData being passed to Login:', userDataForLogin);

      localStorage.setItem('uid', data.uid); // Store uid consistently

      // Navigate to Login after showing success
      setTimeout(() => {
        navigate('/Login', { state: { userData: userDataForLogin } });
      }, 2000);
    } catch (err) {
      console.error('Error:', err.message);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-10 p-6 bg-white rounded-lg shadow-md">
      <div className="flex justify-center mb-6">
        <Link to="/LandingPage">
          <img src={logo} alt="Forge Logo" className="h-16" />
        </Link>
      </div>
      <h2 className="text-2xl font-bold mb-6 text-center">Sign Up</h2>
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
        <div>
          <label className="block text-sm font-medium mb-1">Business Email</label>
          <input
            type="email"
            name="businessEmail"
            placeholder="Business Email"
            value={formData.businessEmail}
            onChange={handleChange}
            className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-600"
            required
            disabled={loading}
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Password</label>
          <input
            type="password"
            name="password"
            placeholder="Password (min 8 characters)"
            value={formData.password}
            onChange={handleChange}
            className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-600"
            required
            disabled={loading}
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Business Name</label>
          <input
            type="text"
            name="businessName"
            placeholder="Business Name"
            value={formData.businessName}
            onChange={handleChange}
            className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-600"
            required
            disabled={loading}
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Financial Year End</label>
          <input
            type="text"
            name="financialYearEnd"
            placeholder="Financial Year End (DD/MMM/YYYY)"
            value={formData.financialYearEnd}
            onChange={handleChange}
            className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-600"
            required
            disabled={loading}
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Address</label>
          <input
            type="text"
            name="address"
            placeholder="Address"
            value={formData.address}
            onChange={handleChange}
            className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-600"
            required
            disabled={loading}
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Contact Number</label>
          <input
            type="tel"
            name="contactNumber"
            placeholder="Contact Number (e.g., +27123456789)"
            value={formData.contactNumber}
            onChange={handleChange}
            className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-600"
            required
            disabled={loading}
          />
        </div>
        <button
          type="submit"
          className={`w-full p-2 text-white rounded ${
            loading ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
          }`}
          disabled={loading}
        >
          {loading ? 'Signing Up...' : 'Sign Up'}
        </button>
        <p className="text-center">
          Already have an account? <Link to="/Login" className="text-blue-600 hover:underline">Log In</Link>
        </p>
      </form>
      {error && <p className="mt-4 text-red-500 text-center">{error}</p>}
      {success && <p className="mt-4 text-green-500 text-center">{success}</p>}
    </div>
  );
}