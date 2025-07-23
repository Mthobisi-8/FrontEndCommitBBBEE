import React, { useState, useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import AdminNavBar from '../AdminNavBar';
import { FaSearch, FaUserPlus, FaFilter, FaEdit, FaTrash, FaUserCircle } from 'react-icons/fa';
import { format } from 'date-fns';

// API Service Layer
const apiService = {
  async fetchClients(token) {
    const response = await fetch('http://localhost:5000/clients', {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!response.ok) throw new Error('Failed to fetch clients');
    return response.json();
  },

  async saveClient(token, client, isUpdate = false) {
    const url = isUpdate ? `http://localhost:5000/clients/${client.id}` : 'http://localhost:5000/clients';
    const response = await fetch(url, {
      method: isUpdate ? 'PUT' : 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(client),
    });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to save client');
    }
    return response.json();
  },

  async deleteClient(token, id) {
    const response = await fetch(`http://localhost:5000/clients/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!response.ok) throw new Error('Failed to delete client');
    return response;
  },
};

// Client Form Modal Component
const ClientFormModal = ({ isOpen, onClose, client, onSubmit, error }) => {
  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    defaultValues: client || {
      businessName: '',
      businessEmail: '',
      contactNumber: '',
      financialYearEnd: '',
      address: '',
      status: 'Pending',
    },
  });

  useEffect(() => {
    reset(client || {
      businessName: '',
      businessEmail: '',
      contactNumber: '',
      financialYearEnd: '',
      address: '',
      status: 'Pending',
    });
  }, [client, reset]);


  return (
    isOpen && (
      <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
          <h3 className="text-lg font-bold mb-4">{client ? 'Edit Client' : 'Add New Client'}</h3>
          {error && <p className="text-red-500 mb-4">{error}</p>}
          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700">Business Name</label>
              <input
                {...register('businessName', { required: 'Business name is required' })}
                className="mt-1 block w-full border rounded-lg p-2"
              />
              {errors.businessName && <p className="text-red-500 text-sm">{errors.businessName.message}</p>}
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700">Email</label>
              <input
                {...register('businessEmail', {
                  required: 'Email is required',
                  pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Invalid email' },
                })}
                className="mt-1 block w-full border rounded-lg p-2"
              />
              {errors.businessEmail && <p className="text-red-500 text-sm">{errors.businessEmail.message}</p>}
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700">Contact Number</label>
              <input
                {...register('contactNumber', {
                  required: 'Contact number is required',
                  pattern: { value: /^\+?\d{10,15}$/, message: 'Invalid phone number' },
                })}
                className="mt-1 block w-full border rounded-lg p-2"
              />
              {errors.contactNumber && <p className="text-red-500 text-sm">{errors.contactNumber.message}</p>}
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700">Financial Year End (DD/MMM/YYYY)</label>
              <input
                {...register('financialYearEnd', {
                  required: 'Financial year end is required',
                  pattern: {
                    value: /^\d{2}\/[A-Za-z]{3}\/\d{4}$/,
                    message: 'Use DD/MMM/YYYY format (e.g., 31/Mar/2025)',
                  },
                })}
                className="mt-1 block w-full border rounded-lg p-2"
              />
              {errors.financialYearEnd && <p className="text-red-500 text-sm">{errors.financialYearEnd.message}</p>}
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700">Address</label>
              <input
                {...register('address', { required: 'Address is required' })}
                className="mt-1 block w-full border rounded-lg p-2"
              />
              {errors.address && <p className="text-red-500 text-sm">{errors.address.message}</p>}
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700">Status</label>
              <select
                {...register('status')}
                className="mt-1 block w-full border rounded-lg p-2"
              >
                <option value="Pending">Pending</option>
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-gray-200 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                {client ? 'Update' : 'Add'} Client
              </button>
            </div>
          </form>
        </div>
      </div>
    )
  );
};

// Client Table Component
const ClientTable = ({ clients, onEdit, onDelete }) => (
  <div className="bg-white rounded-lg shadow overflow-hidden">
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Client</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Financial Year End</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {clients.length > 0 ? (
            clients.map((client) => (
              <tr key={client.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <FaUserCircle className="flex-shrink-0 h-10 w-10 text-gray-400" />
                    <div className="ml-4">
                      <div className="text-sm font-medium text-gray-900">{client.businessName}</div>
                      {client.businessName === 'Forge Academy (Pty) Ltd' && (
                        <span className="text-xs text-gray-500">Reg: 2023/123456/07</span>
                      )}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{client.businessEmail}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{client.contactNumber}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {format(new Date(client.financialYearEnd), 'dd/MMM/yyyy')}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                    ${client.status === 'Active' ? 'bg-green-100 text-green-800' : 
                      client.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' : 
                      'bg-red-100 text-red-800'}`}>
                    {client.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <button
                    onClick={() => onEdit(client)}
                    className="text-blue-600 hover:text-blue-900 mr-3"
                    aria-label={`Edit ${client.businessName}`}
                  >
                    <FaEdit />
                  </button>
                  <button
                    onClick={() => onDelete(client.id)}
                    className="text-red-600 hover:text-red-900"
                    aria-label={`Delete ${client.businessName}`}
                  >
                    <FaTrash />
                  </button>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="6" className="px-6 py-4 text-center text-gray-500">
                No clients found matching your search criteria
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  </div>
);

// Main Clients Component
const Clients = () => {
  const [clients, setClients] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [selectedClient, setSelectedClient] = useState(null);

  // Fetch clients
  useEffect(() => {
    const fetchClients = async () => {
      setIsLoading(true);
      try {
        const token = localStorage.getItem('authToken');
        if (!token) throw new Error('No authentication token found');
        const data = await apiService.fetchClients(token);
        setClients(data);
      } catch (error) {
        console.error('Error fetching clients:', error);
        setError(error.message === 'No authentication token found' ? 'Please log in to view clients' : 'Failed to load clients. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchClients();
  }, []);

  // Filter clients (memoized)
  const filteredClients = useMemo(() => {
    return clients.filter(client =>
      client.businessName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.businessEmail.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [clients, searchTerm]);

  // Handle form submission
  const handleSubmit = async (data) => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) throw new Error('No authentication token found');
      const savedClient = await apiService.saveClient(token, data, !!selectedClient);
      setClients(prev => 
        selectedClient 
          ? prev.map(c => c.id === savedClient.id ? savedClient : c)
          : [...prev, savedClient]
      );
      setShowModal(false);
      setSelectedClient(null);
    } catch (error) {
      console.error('Error saving client:', error);
      setError(error.message === 'No authentication token found' 
        ? 'Please log in to save clients' 
        : error.message || 'Failed to save client. Please try again.');
    }
  };
  
  // Handle delete
  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this client?')) {
      try {
        const token = localStorage.getItem('authToken');
        if (!token) throw new Error('No authentication token found');
        await apiService.deleteClient(token, id);
        setClients(prev => prev.filter(client => client.id !== id));
      } catch (error) {
        console.error('Error deleting client:', error);
        setError('Failed to delete client. Please try again.');
      }
    }
  };

  // Open modal
  const openModal = (client = null) => {
    setSelectedClient(client ? { ...client, financialYearEnd: format(new Date(client.financialYearEnd), 'dd/MMM/yyyy') } : null);
    setShowModal(true);
  };

  return (
    <div>
      <AdminNavBar />
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Client Management</h2>
          <button
            onClick={() => openModal()}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 flex items-center"
          >
            <FaUserPlus className="mr-2" /> Add New Client
          </button>
        </div>

        {/* Search and Filter Bar */}
        <div className="bg-white p-4 rounded-lg shadow mb-6 flex flex-col md:flex-row gap-4">
          <div className="relative flex-grow">
            <FaSearch className="absolute left-3 top-3 text-gray-400" />
            <input
              type="text"
              placeholder="Search clients by name or email..."
              className="pl-10 pr-4 py-2 w-full border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              aria-label="Search clients"
            />
          </div>
          <button className="flex items-center justify-center gap-2 px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200">
            <FaFilter /> Filters
          </button>
        </div>

        {/* Error Display */}
        {error && <p className="text-red-500 text-center mb-4">{error}</p>}

        {/* Clients Table */}
        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : (
          <ClientTable
            clients={filteredClients}
            onEdit={openModal}
            onDelete={handleDelete}
          />
        )}

        {/* Modal */}
        <ClientFormModal
          isOpen={showModal}
          onClose={() => {
            setShowModal(false);
            setSelectedClient(null);
          }}
          client={selectedClient}
          onSubmit={handleSubmit}
          error={error}
        />
      </div>
    </div>
  );
};

export default Clients;