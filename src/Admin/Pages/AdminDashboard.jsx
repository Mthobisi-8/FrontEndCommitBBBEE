import React, { useEffect, useState } from 'react';
import AdminNavBar from '../AdminNavBar';
import { FaUsers, FaComments, FaChartLine, FaCog } from 'react-icons/fa';

// API Service Layer
const apiService = {
  async fetchClients(token) {
    const response = await fetch('http://localhost:5000/clients', {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to fetch clients');
    }
    return response.json();
  },
};

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    totalClients: 0,
    activeChats: 0,
    growthRate: 0,
    pendingActions: 0,
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      setIsLoading(true);
      try {
        const token = localStorage.getItem('authToken');
        if (!token) throw new Error('No authentication token found');

        // Fetch clients
        const clients = await apiService.fetchClients(token);
        console.log('Fetched clients:', clients.map(c => ({
          id: c.id,
          businessName: c.businessName,
          status: c.status,
          createdAt: c.createdAt
        })));

        // Calculate stats
        const totalClients = clients.length;
        const activeChats = clients.filter(
          (client) => client.status === 'Active'
        ).length;
        const pendingActions = clients.filter(
          (client) => client.status === 'Pending'
        ).length;

        // Calculate growthRate
        const now = new Date();
        const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        const previousMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const previousMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

        const currentMonthClients = clients.filter(
          (client) =>
            client.createdAt &&
            !isNaN(new Date(client.createdAt).getTime()) &&
            new Date(client.createdAt) >= currentMonthStart
        ).length;

        const previousMonthClients = clients.filter(
          (client) =>
            client.createdAt &&
            !isNaN(new Date(client.createdAt).getTime()) &&
            new Date(client.createdAt) >= previousMonthStart &&
            new Date(client.createdAt) <= previousMonthEnd
        ).length;

        let growthRate;
        if (previousMonthClients === 0) {
          growthRate = currentMonthClients > 0 ? 100 : 0;
        } else {
          growthRate = ((currentMonthClients - previousMonthClients) / previousMonthClients) * 100;
        }

        console.log(`Stats calculated:`);
        console.log(`- Total Clients: ${totalClients}`);
        console.log(`- Active Chats: ${activeChats} (clients with status 'Active')`);
        console.log(`- Pending Actions: ${pendingActions} (clients with status 'Pending')`);
        console.log(`- Growth Rate: ${growthRate.toFixed(1)}% (current: ${currentMonthClients}, previous: ${previousMonthClients})`);

        setStats({
          totalClients,
          activeChats,
          growthRate: parseFloat(growthRate.toFixed(1)),
          pendingActions,
        });
      } catch (error) {
        console.error('Error fetching stats:', error);
        setError(
          error.message === 'No authentication token found'
            ? 'Please log in to view dashboard'
            : 'Failed to load dashboard data. Please try again.'
        );
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, []);

  return (
    <div>
      <AdminNavBar />
      <div className="p-6">
        <h2 className="text-2xl font-bold mb-6">Admin Portal Overview</h2>

        {/* Error Display */}
        {error && <p className="text-red-500 text-center mb-4">{error}</p>}

        {/* Stats Cards */}
        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <StatCard
              icon={<FaUsers className="text-blue-500 text-2xl" />}
              title="Total Clients"
              value={stats.totalClients}
            />
            <StatCard
              icon={<FaComments className="text-green-500 text-2xl" />}
              title="Active Chats"
              value={stats.activeChats}
            />
            <StatCard
              icon={<FaChartLine className="text-purple-500 text-2xl" />}
              title="Growth Rate"
              value={stats.growthRate}
              isPositive={stats.growthRate >= 0}
            />
            <StatCard
              icon={<FaCog className="text-yellow-500 text-2xl" />}
              title="Pending Actions"
              value={stats.pendingActions}
            />
          </div>
        )}

        {/* Recent Activity Section */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h3 className="text-xl font-semibold mb-4">Recent Activity</h3>
          <div className="space-y-4">
            <ActivityItem
              time="10 minutes ago"
              action="New client registered"
              details="John Doe signed up for services"
            />
            <ActivityItem
              time="25 minutes ago"
              action="Chat initiated"
              details="Sarah Smith started a new conversation"
            />
            <ActivityItem
              time="1 hour ago"
              action="Profile updated"
              details="Michael Johnson updated business information"
            />
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-xl font-semibold mb-4">Quick Actions</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <QuickAction
              title="Manage Clients"
              link="/Clients"
              color="bg-blue-100 text-blue-600"
            />
            <QuickAction
              title="View Analytics"
              link="/Charts"
              color="bg-green-100 text-green-600"
            />
            <QuickAction
              title="Check Messages"
              link="/chats"
              color="bg-purple-100 text-purple-600"
            />
            <QuickAction
              title="System Settings"
              link="/settings"
              color="bg-yellow-100 text-yellow-600"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

// Stat Card Component
const StatCard = ({ icon, title, value, isPositive }) => (
  <div className="bg-white rounded-lg shadow p-6 flex items-start">
    <div className="mr-4 p-2 rounded-full bg-gray-100">{icon}</div>
    <div>
      <p className="text-gray-500 text-sm">{title}</p>
      <p className="text-2xl font-bold">
        {title === 'Growth Rate' ? `${value}%` : value}
      </p>
      {isPositive !== undefined && (
        <p className={`text-sm ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
          {isPositive ? '↑' : '↓'} {Math.abs(value)}%
        </p>
      )}
    </div>
  </div>
);

// Activity Item Component
const ActivityItem = ({ time, action, details }) => (
  <div className="border-b pb-3 last:border-0 last:pb-0">
    <div className="flex justify-between items-start">
      <div>
        <p className="font-medium">{action}</p>
        <p className="text-gray-600 text-sm">{details}</p>
      </div>
      <span className="text-gray-400 text-sm whitespace-nowrap">{time}</span>
    </div>
  </div>
);

// Quick Action Component
const QuickAction = ({ title, link, color }) => (
  <a
    href={link}
    className={`${color} rounded-lg p-4 text-center font-medium hover:shadow-md transition-shadow`}
  >
    {title}
  </a>
);

export default AdminDashboard;