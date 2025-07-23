import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { FaBars, FaTimes } from 'react-icons/fa';
import logo from '../assets/forge.png'


const AdminNavBar = () => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    // Check for authToken to ensure user is logged in
    const token = localStorage.getItem('authToken');
    if (!token) {
      navigate('/AdminLogIn');
      return;
    }

    // Try to get email from location.state or localStorage
    const userData = location.state?.userData;
    const storedEmail = localStorage.getItem('businessEmail');
    const storedUid = localStorage.getItem('uid');

    if (userData?.businessEmail) {
      console.log('Using email from location.state:', userData.businessEmail);
      setEmail(userData.businessEmail);
    } else if (storedEmail) {
      console.log('Using email from localStorage:', storedEmail);
      setEmail(storedEmail);
    } else if (storedUid) {
      // Fallback: Fetch profile data if email is missing but uid is available
      const fetchProfile = async () => {
        try {
          console.log('Fetching profile for UID:', storedUid);
          const res = await fetch(`http://localhost:5000/get-profile?uid=${storedUid}`, {
            headers: { Authorization: `Bearer ${token}` }, // Include token if required by backend
          });
          const data = await res.json();

          if (!res.ok) {
            console.error('Profile fetch failed with status:', res.status, 'Error:', data.error);
            throw new Error(data.error || 'Failed to fetch profile');
          }

          console.log('Profile data received:', data);
          setEmail(data.businessEmail || '');
          // Update localStorage with fetched email
          localStorage.setItem('businessEmail', data.businessEmail || '');
        } catch (err) {
          console.error('Error fetching profile:', err.message, 'UID:', storedUid);
          setError('Failed to load user profile. Please try logging in again.');
        }
      };

      fetchProfile();
    } else {
      console.warn('No user data or UID available');
      setError('No user information available. Please log in.');
    }
  }, [location.state, navigate]);

  const handleLogout = () => {
    // Clear authToken, uid, and businessEmail from localStorage
    localStorage.removeItem('authToken');
    localStorage.removeItem('uid');
    localStorage.removeItem('businessEmail');
    // Redirect to login page
    navigate('/AdminLogIn');
  };

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  return (
    <>
      <nav className="bg-gray-800 p-4 flex justify-between items-center">
        <button onClick={toggleSidebar} className="text-white focus:outline-none">
          <FaBars className="w-6 h-6" />
        </button>
        <div className="flex items-center space-x-4">
          {error ? (
            <p className="text-red-400">{error}</p>
          ) : (
            <p className="text-white">Logged in as: <span className="font-semibold">{email || 'Loading...'}</span></p>
          )}
        </div>
      </nav>
      <div
        className={`fixed top-0 left-0 h-full w-64 bg-gray-900 text-white transform ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } transition-transform duration-300 ease-in-out z-50`}
      >
        <div className="p-4">
          <button
            onClick={toggleSidebar}
            className="text-white focus:outline-none mb-4"
          >
            <FaTimes className="w-6 h-6" />
          </button>
          <h2 className="text-xl font-semibold mb-6">Menu</h2>
                      <div className="flex justify-center mb-6">
                        <Link to='/AdminDashboard'>
                        <img src={logo} alt="Forge Logo" className="h-16" />
                        </Link>
                      </div>
          
          <nav className="space-y-4">
            <Link
              to="/Clients"
              onClick={toggleSidebar}
              className="block text-lg hover:bg-gray-700 p-2 rounded"
            >
              Clients
            </Link>
            <Link
              to="/Charts"
              onClick={toggleSidebar}
              className="block text-lg hover:bg-gray-700 p-2 rounded"
            >
              Charts
            </Link>
            <Link
              to="/settings"
              onClick={toggleSidebar}
              className="block text-lg hover:bg-gray-700 p-2 rounded"
            >
              Settings
            </Link>
            <Link
              to="/chats"
              onClick={toggleSidebar}
              className="block text-lg hover:bg-gray-700 p-2 rounded"
            >
              Chats
            </Link>
          </nav>
          <button
            onClick={handleLogout}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Log Out
          </button>

        </div>
      </div>
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black opacity-50 z-40"
          onClick={toggleSidebar}
        />
      )}
    </>
  );
};

export default AdminNavBar;