import React, { useState, useEffect } from 'react';

const ManagementControl = ({ userId, onClose, onSubmit }) => {
  console.log('ManagementControl rendered with userId:', userId);

  const [managers, setManagers] = useState([]);
  const [newManager, setNewManager] = useState({
    name: '',
    siteLocation: '',
    idNumber: '',
    position: '',
    jobTitle: '',
    race: '',
    gender: '',
    isDisabled: false,
    votingRights: 0,
    isExecutiveDirector: false,
    isIndependentNonExecutive: false,
  });
  const [editingManagerIndex, setEditingManagerIndex] = useState(null);
  const [managementData, setManagementData] = useState({
    totalVotingRights: 0,
    blackVotingRights: 0,
    blackFemaleVotingRights: 0,
    disabledVotingRights: 0,
  });
  const [documentId, setDocumentId] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch existing data on mount
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        console.log('Fetching data for userId:', userId);
        const response = await fetch(`http://localhost:5000/management-control/${userId}`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
        });

        if (response.ok) {
          const { data } = await response.json();
          console.log('Fetched management control data:', data);
          if (data.length > 0) {
            setManagers(data[0].managers || []);
            setManagementData(data[0].managementData || {
              totalVotingRights: 0,
              blackVotingRights: 0,
              blackFemaleVotingRights: 0,
              disabledVotingRights: 0,
            });
            setDocumentId(data[0].id);
            console.log('Set documentId:', data[0].id);
          } else {
            console.log('No management control data found for userId:', userId);
            setDocumentId(null);
          }
        } else {
          console.warn('GET request failed with status:', response.status);
          alert(`Failed to fetch data: HTTP ${response.status}`);
        }
      } catch (error) {
        console.error('Error fetching management control data:', error);
        alert('Failed to fetch management control data. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    if (userId) fetchData();
  }, [userId]);

  const handleManagerChange = (e) => {
    const { name, value, type, checked } = e.target;
    setNewManager({
      ...newManager,
      [name]: type === 'checkbox' ? checked : type === 'number' ? Number(value) : value,
    });
  };

  const addManager = () => {
    if (!newManager.name || !newManager.idNumber || !newManager.position) {
      alert('Please fill in the Name, ID Number, and Position.');
      return;
    }
    if (managers.some((manager) => manager.idNumber === newManager.idNumber)) {
      alert('A manager with this ID Number already exists.');
      return;
    }
    const updatedManagers = [...managers, newManager];
    setManagers(updatedManagers);
    resetNewManager();
    recalculateManagementData(updatedManagers);
  };

  const editManager = (index) => {
    setEditingManagerIndex(index);
    setNewManager(managers[index]);
  };

  const saveEditedManager = () => {
    if (!newManager.name || !newManager.idNumber || !newManager.position) {
      alert('Please fill in the Name, ID Number, and Position.');
      return;
    }
    if (
      managers.some(
        (manager, index) =>
          manager.idNumber === newManager.idNumber && index !== editingManagerIndex
      )
    ) {
      alert('A manager with this ID Number already exists.');
      return;
    }
    const updatedManagers = managers.map((manager, index) =>
      index === editingManagerIndex ? newManager : manager
    );
    setManagers(updatedManagers);
    resetNewManager();
    setEditingManagerIndex(null);
    recalculateManagementData(updatedManagers);
  };

  const deleteManager = async (index) => {
    if (window.confirm('Are you sure you want to delete this manager?')) {
      setIsLoading(true);
      try {
        // Optimistically update the UI
        const updatedManagers = managers.filter((_, i) => i !== index);
        setManagers(updatedManagers);
        recalculateManagementData(updatedManagers);

        // Ensure documentId is available
        let currentDocumentId = documentId;
        if (!currentDocumentId) {
          const checkResponse = await fetch(`http://localhost:5000/management-control/${userId}`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
          });

          if (!checkResponse.ok) {
            throw new Error(`Failed to fetch document ID: HTTP ${checkResponse.status}`);
          }

          const { data } = await checkResponse.json();
          if (data.length === 0) {
            throw new Error('No management control data found for this user');
          }
          currentDocumentId = data[0].id;
          setDocumentId(currentDocumentId);
        }

        // Update backend
        const response = await fetch(`http://localhost:5000/management-control/${currentDocumentId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId, managers: updatedManagers, managementData }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(`Failed to update manager data: ${errorData.error || 'Unknown error'}`);
        }

        console.log('Manager deleted successfully');
      } catch (error) {
        console.error('Error deleting manager:', error);
        alert(`Failed to delete manager: ${error.message}`);
        // Re-fetch to restore state
        try {
          const response = await fetch(`http://localhost:5000/management-control/${userId}`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
          });
          if (response.ok) {
            const { data } = await response.json();
            if (data.length > 0) {
              setManagers(data[0].managers || []);
              setManagementData(data[0].managementData || {
                totalVotingRights: 0,
                blackVotingRights: 0,
                blackFemaleVotingRights: 0,
                disabledVotingRights: 0,
              });
              setDocumentId(data[0].id);
            } else {
              setManagers([]);
              setManagementData({
                totalVotingRights: 0,
                blackVotingRights: 0,
                blackFemaleVotingRights: 0,
                disabledVotingRights: 0,
              });
              setDocumentId(null);
            }
          }
        } catch (fetchError) {
          console.error('Error re-fetching data:', fetchError);
          alert('Failed to restore data. Please refresh the page.');
        }
      } finally {
        setIsLoading(false);
      }
    }
  };

  const deleteManagementControl = async () => {
    if (window.confirm('Are you sure you want to delete all management control data for this user?')) {
      setIsLoading(true);
      try {
        const response = await fetch(`http://localhost:5000/management-control/${userId}`, {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(`Failed to delete management control data: ${errorData.error || 'Unknown error'}`);
        }

        console.log('Management control data deleted');
        setManagers([]);
        setManagementData({
          totalVotingRights: 0,
          blackVotingRights: 0,
          blackFemaleVotingRights: 0,
          disabledVotingRights: 0,
        });
        setDocumentId(null);
      } catch (error) {
        console.error('Error deleting management control data:', error);
        alert(`Failed to delete: ${error.message}`);
        // Re-fetch to restore state
        try {
          const response = await fetch(`http://localhost:5000/management-control/${userId}`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
          });
          if (response.ok) {
            const { data } = await response.json();
            if (data.length > 0) {
              setManagers(data[0].managers || []);
              setManagementData(data[0].managementData || {
                totalVotingRights: 0,
                blackVotingRights: 0,
                blackFemaleVotingRights: 0,
                disabledVotingRights: 0,
              });
              setDocumentId(data[0].id);
            } else {
              setManagers([]);
              setManagementData({
                totalVotingRights: 0,
                blackVotingRights: 0,
                blackFemaleVotingRights: 0,
                disabledVotingRights: 0,
              });
              setDocumentId(null);
            }
          }
        } catch (fetchError) {
          console.error('Error re-fetching data:', fetchError);
          alert('Failed to restore data. Please refresh the page.');
        }
      } finally {
        setIsLoading(false);
      }
    }
  };

  const resetNewManager = () => {
    setNewManager({
      name: '',
      siteLocation: '',
      idNumber: '',
      position: '',
      jobTitle: '',
      race: '',
      gender: '',
      isDisabled: false,
      votingRights: 0,
      isExecutiveDirector: false,
      isIndependentNonExecutive: false,
    });
  };

  const recalculateManagementData = (updatedManagers) => {
    let totalVotingRights = 0;
    let blackVotingRights = 0;
    let blackFemaleVotingRights = 0;
    let disabledVotingRights = 0;

    updatedManagers.forEach((manager) => {
      const votingRights = Number(manager.votingRights) || 0;
      totalVotingRights += votingRights;
      if (manager.race.toLowerCase() === 'black') {
        blackVotingRights += votingRights;
        if (manager.gender.toLowerCase() === 'female') {
          blackFemaleVotingRights += votingRights;
        }
      }
      if (manager.isDisabled) {
        disabledVotingRights += votingRights;
      }
    });

    setManagementData({
      totalVotingRights,
      blackVotingRights,
      blackFemaleVotingRights,
      disabledVotingRights,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log('Submitting data:', { userId, managers, managementData, documentId });

    if (!userId) {
      alert('User ID is missing. Please ensure you are logged in.');
      return;
    }

    setIsLoading(true);
    try {
      const checkResponse = await fetch(`http://localhost:5000/management-control/${userId}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });

      let method = 'POST';
      let url = 'http://localhost:5000/management-control';
      let existingId = null;

      if (checkResponse.ok) {
        const { data } = await checkResponse.json();
        console.log('Check response data:', data);
        if (data.length > 0) {
          method = 'PUT';
          existingId = data[0].id;
          url = `http://localhost:5000/management-control/${existingId}`;
        }
      }

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, managers, managementData }),
      });

      if (!response.ok) {
        let errorData;
        try {
          errorData = await response.json();
        } catch {
          errorData = { error: `Server error (HTTP ${response.status})` };
        }
        throw new Error(`Failed to save management control data: ${errorData.error || 'Unknown error'}`);
      }

      const result = await response.json();
      console.log('Management control data saved:', result);
      setDocumentId(result.id);
      onSubmit({ managers, managementData });
      onClose();
    } catch (error) {
      console.error('Error saving management control data:', error);
      alert(`Failed to save management control data: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-md p-6 w-full max-w-4xl max-h-[80vh] overflow-y-auto">
        <h2 className="text-xl font-semibold mb-4">Management Control Details</h2>

        <form onSubmit={handleSubmit}>
          <div className="mb-6">
            <h3 className="text-lg font-medium mb-2">Add Manager</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Name & Surname</label>
                <input
                  type="text"
                  name="name"
                  value={newManager.name}
                  onChange={handleManagerChange}
                  className="w-full p-2 border rounded"
                  placeholder="Enter name & surname"
                  disabled={isLoading}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Site/Location (if applicable)</label>
                <input
                  type="text"
                  name="siteLocation"
                  value={newManager.siteLocation}
                  onChange={handleManagerChange}
                  className="w-full p-2 border rounded"
                  placeholder="Enter site/location"
                  disabled={isLoading}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">ID Number</label>
                <input
                  type="text"
                  name="idNumber"
                  value={newManager.idNumber}
                  onChange={handleManagerChange}
                  className="w-full p-2 border rounded"
                  placeholder="Enter ID number"
                  disabled={isLoading}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Position (Occupational Level)</label>
                <input
                  type="text"
                  name="position"
                  value={newManager.position}
                  onChange={handleManagerChange}
                  className="w-full p-2 border rounded"
                  placeholder="Enter position"
                  disabled={isLoading}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Job Title</label>
                <input
                  type="text"
                  name="jobTitle"
                  value={newManager.jobTitle}
                  onChange={handleManagerChange}
                  className="w-full p-2 border rounded"
                  placeholder="Enter job title"
                  disabled={isLoading}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Race</label>
                <select
                  name="race"
                  value={newManager.race}
                  onChange={handleManagerChange}
                  className="w-full p-2 border rounded"
                  disabled={isLoading}
                >
                  <option value="">Select Race</option>
                  <option value="Black">Black</option>
                  <option value="White">White</option>
                  <option value="Coloured">Coloured</option>
                  <option value="Indian">Indian</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Gender</label>
                <select
                  name="gender"
                  value={newManager.gender}
                  onChange={handleManagerChange}
                  className="w-full p-2 border rounded"
                  disabled={isLoading}
                >
                  <option value="">Select Gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div className="flex items-center">
                <label className="text-sm font-medium mr-2">Disabled</label>
                <input
                  type="checkbox"
                  name="isDisabled"
                  checked={newManager.isDisabled}
                  onChange={handleManagerChange}
                  className="mr-2"
                  disabled={isLoading}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Voting Rights (%)</label>
                <input
                  type="number"
                  name="votingRights"
                  value={newManager.votingRights}
                  onChange={handleManagerChange}
                  min="0"
                  max="100"
                  className="w-full p-2 border rounded"
                  placeholder="Enter voting rights"
                  disabled={isLoading}
                />
              </div>
              <div className="flex items-center">
                <label className="text-sm font-medium mr-2">Executive Director</label>
                <input
                  type="checkbox"
                  name="isExecutiveDirector"
                  checked={newManager.isExecutiveDirector}
                  onChange={handleManagerChange}
                  className="mr-2"
                  disabled={isLoading}
                />
              </div>
              <div className="flex items-center">
                <label className="block text-sm font-medium mr-2">Independent Non-Executive</label>
                <input
                  type="checkbox"
                  name="isIndependentNonExecutive"
                  checked={newManager.isIndependentNonExecutive}
                  onChange={handleManagerChange}
                  className="mr-2"
                  disabled={isLoading}
                />
              </div>
            </div>
            <button
              type="button"
              onClick={editingManagerIndex !== null ? saveEditedManager : addManager}
              className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:bg-blue-300"
              disabled={isLoading}
            >
              {editingManagerIndex !== null ? 'Save Edited Manager' : 'Add Manager'}
            </button>
          </div>

          {managers.length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-medium mb-2">Managers List</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full border-collapse border border-gray-300">
                  <thead>
                    <tr className="bg-gray-200">
                      <th className="border border-gray-300 px-4 py-2">Name & Surname</th>
                      <th className="border border-gray-300 px-4 py-2">Site/Location</th>
                      <th className="border border-gray-300 px-4 py-2">ID Number</th>
                      <th className="border border-gray-300 px-4 py-2">Position</th>
                      <th className="border border-gray-300 px-4 py-2">Job Title</th>
                      <th className="border border-gray-300 px-4 py-2">Race</th>
                      <th className="border border-gray-300 px-4 py-2">Gender</th>
                      <th className="border border-gray-300 px-4 py-2">Disabled</th>
                      <th className="border border-gray-300 px-4 py-2">Voting Rights (%)</th>
                      <th className="border border-gray-300 px-4 py-2">Executive Director</th>
                      <th className="border border-gray-300 px-4 py-2">Independent Non-Executive</th>
                      <th className="border border-gray-300 px-4 py-2">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {managers.map((manager, index) => (
                      <tr key={manager.idNumber}>
                        <td className="border border-gray-300 px-4 py-2">{manager.name}</td>
                        <td className="border border-gray-300 px-4 py-2">{manager.siteLocation}</td>
                        <td className="border border-gray-300 px-4 py-2">{manager.idNumber}</td>
                        <td className="border border-gray-300 px-4 py-2">{manager.position}</td>
                        <td className="border border-gray-300 px-4 py-2">{manager.jobTitle}</td>
                        <td className="border border-gray-300 px-4 py-2">{manager.race}</td>
                        <td className="border border-gray-300 px-4 py-2">{manager.gender}</td>
                        <td className="border border-gray-300 px-4 py-2">{manager.isDisabled ? 'Yes' : 'No'}</td>
                        <td className="border border-gray-300 px-4 py-2">{manager.votingRights}</td>
                        <td className="border border-gray-300 px-4 py-2">{manager.isExecutiveDirector ? 'Yes' : 'No'}</td>
                        <td className="border border-gray-300 px-4 py-2">{manager.isIndependentNonExecutive ? 'Yes' : 'No'}</td>
                        <td className="border border-gray-300 px-4 py-2">
                          <button
                            type="button"
                            onClick={() => editManager(index)}
                            className="bg-yellow-500 text-white px-2 py-1 rounded mr-2 hover:bg-yellow-600 disabled:bg-yellow-300"
                            disabled={isLoading}
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => deleteManager(index)}
                            className="bg-red-600 text-white px-2 py-1 rounded hover:bg-red-700 disabled:bg-red-300"
                            disabled={isLoading}
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <div className="mb-6">
            <h3 className="text-lg font-medium mb-2">Management Control Summary</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Total Voting Rights (%)</label>
                <input
                  type="number"
                  value={managementData.totalVotingRights}
                  className="w-full p-2 border rounded"
                  disabled
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Black Voting Rights (%)</label>
                <input
                  type="number"
                  value={managementData.blackVotingRights}
                  className="w-full p-2 border rounded"
                  disabled
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Black Female Voting Rights (%)</label>
                <input
                  type="number"
                  value={managementData.blackFemaleVotingRights}
                  className="w-full p-2 border rounded"
                  disabled
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Disabled Voting Rights (%)</label>
                <input
                  type="number"
                  value={managementData.disabledVotingRights}
                  className="w-full p-2 border rounded"
                  disabled
                />
              </div>
            </div>
          </div>

          <div className="fixed bottom-4 sm:bottom-12 right-2 sm:right-4 md:right-78 flex flex-col sm:flex-row justify-end gap-2 sm:gap-4 bg-white p-3 sm:p-4 rounded-md shadow-lg w-[90%] sm:w-auto max-w-md">
            <button
              type="button"
              onClick={onClose}
              className="bg-gray-200 text-gray-800 px-3 py-2 sm:px-4 sm:py-2 rounded-md hover:bg-gray-300 w-full sm:w-auto transition-all duration-200 disabled:bg-gray-100"
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={deleteManagementControl}
              className="bg-red-600 text-white px-3 py-2 sm:px-4 sm:py-2 rounded-md hover:bg-red-700 w-full sm:w-auto transition-all duration-200 disabled:bg-red-300"
              disabled={isLoading}
            >
              Delete All Data
            </button>
            <button
              type="submit"
              className="bg-blue-600 text-white px-3 py-2 sm:px-4 sm:py-2 rounded-md hover:bg-blue-700 w-full sm:w-auto transition-all duration-200 disabled:bg-blue-300"
              disabled={isLoading}
            >
              Save Management Control Details
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ManagementControl;