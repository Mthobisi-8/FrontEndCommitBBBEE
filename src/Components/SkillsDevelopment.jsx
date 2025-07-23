import React, { useState, useEffect } from 'react';
import axios from 'axios';
import PropTypes from 'prop-types';

// SkillsDevelopment component, aligned with OwnershipDetails, ManagementControl, EmploymentEquity, and Yes4YouthInitiative
const SkillsDevelopment = ({ userId, onClose, onSubmit }) => {
  console.log('SkillsDevelopment rendered with userId:', userId);

  const categories = [
    { value: 'A', label: 'Bursaries: Institution-based, theoretical only, formally assessed (incl. Basic Education)' },
    { value: 'A2', label: 'Institution-based, theoretical instruction alone – formally assessed by educational institutions established by or registered with the Department of Higher Education & Training' },
    { value: 'B', label: 'Internships: Institution-based, theoretical & practical learning, formally assessed' },
    { value: 'C', label: 'Learnerships: Recognised or registered structured experiential learning in the workplace that is required after achievement of qualification, formally assessed' },
    { value: 'D', label: 'Learnerships or Apprenticeships: Occupationally directed instructional & workplace learning programme (formal contract), formally assessed' },
    { value: 'E', label: 'Work-integrated Learning: Occupationally directed instructional & workplace learning programme (no formal contract required), formally assessed' },
    { value: 'F', label: 'Informal Training: Occupationally-directed informal instructional programmes. (Institutions, conferences, meetings)' },
    { value: 'G', label: 'Informal Training | Work-based informal programmes (workplace)' },
  ];

  const [trainings, setTrainings] = useState([]);
  const [newTraining, setNewTraining] = useState({
    startDate: '',
    endDate: '',
    trainingCourse: '',
    trainerProvider: '',
    category: '',
    learnerName: '',
    siteLocation: '',
    idNumber: '',
    race: '',
    gender: '',
    isDisabled: false,
    coreCriticalSkills: '',
    totalDirectExpenditure: 0,
    additionalExpenditure: 0,
    costToCompanySalary: 0,
    trainingDurationHours: 0,
    numberOfParticipants: 0,
    isUnemployedLearner: false,
    isAbsorbedInternalTrainer: false,
  });
  const [editingTrainingIndex, setEditingTrainingIndex] = useState(null);
  const [summary, setSummary] = useState({
    totalTrainings: 0,
    totalDirectExpenditure: 0,
    totalAdditionalExpenditure: 0,
    totalCostToCompanySalary: 0,
    totalTrainingHours: 0,
    totalParticipants: 0,
    unemployedLearners: 0,
    absorbedInternalTrainers: 0,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [documentId, setDocumentId] = useState(null);

  useEffect(() => {
    console.log('SkillsDevelopment mounted with userId:', userId);
    if (!userId) {
      console.warn('SkillsDevelopment: userId prop is missing or undefined');
      return;
    }

    const fetchSkillsData = async () => {
      setIsLoading(true);
      try {
        console.log('Fetching skills development data for userId:', userId);
        const response = await axios.get(`http://localhost:5000/skills-development/${userId}`);
        const records = response.data.data;
        if (records.length > 0) {
          setTrainings(records[0].trainings || []);
          setSummary(records[0].summary || {
            totalTrainings: 0,
            totalDirectExpenditure: 0,
            totalAdditionalExpenditure: 0,
            totalCostToCompanySalary: 0,
            totalTrainingHours: 0,
            totalParticipants: 0,
            unemployedLearners: 0,
            absorbedInternalTrainers: 0,
          });
          setDocumentId(records[0].id);
          console.log('Set documentId:', records[0].id);
        } else {
          console.log('No skills development data found for userId:', userId);
          setTrainings([]);
          setSummary({
            totalTrainings: 0,
            totalDirectExpenditure: 0,
            totalAdditionalExpenditure: 0,
            totalCostToCompanySalary: 0,
            totalTrainingHours: 0,
            totalParticipants: 0,
            unemployedLearners: 0,
            absorbedInternalTrainers: 0,
          });
          setDocumentId(null);
        }
      } catch (error) {
        console.warn('Error fetching skills development data:', error.response?.data?.error || error.message);
        if (error.response?.status === 404) {
          setTrainings([]);
          setSummary({
            totalTrainings: 0,
            totalDirectExpenditure: 0,
            totalAdditionalExpenditure: 0,
            totalCostToCompanySalary: 0,
            totalTrainingHours: 0,
            totalParticipants: 0,
            unemployedLearners: 0,
            absorbedInternalTrainers: 0,
          });
          setDocumentId(null);
        } else {
          alert(`Failed to fetch skills development data: ${error.response?.data?.error || error.message}`);
          setTrainings([]);
          setSummary({
            totalTrainings: 0,
            totalDirectExpenditure: 0,
            totalAdditionalExpenditure: 0,
            totalCostToCompanySalary: 0,
            totalTrainingHours: 0,
            totalParticipants: 0,
            unemployedLearners: 0,
            absorbedInternalTrainers: 0,
          });
          setDocumentId(null);
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchSkillsData();
  }, [userId]);

  const handleTrainingChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (name === 'costToCompanySalary') return;
    setNewTraining({
      ...newTraining,
      [name]: type === 'checkbox' ? checked : type === 'number' ? (value === '' ? 0 : Number(value)) : value,
    });
  };

  const handleCSVUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.name.endsWith('.csv')) {
      alert('Please upload a CSV file');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target.result;
      try {
        const parsedData = parseCSV(text);
        const validatedData = validateCSVData(parsedData);
        const updatedTrainings = [...trainings, ...validatedData];
        setTrainings(updatedTrainings);
        recalculateSummary(updatedTrainings);
      } catch (error) {
        alert(`Error processing CSV file: ${error.message}`);
      }
    };
    reader.onerror = () => {
      alert('Error reading the CSV file');
    };
    reader.readAsText(file);
  };

  const parseCSV = (text) => {
    const lines = text.split('\n').filter(line => line.trim() !== '');
    if (lines.length === 0) throw new Error('Empty CSV file');

    const headers = lines[0].split(',').map(header => header.trim().toLowerCase());
    const requiredHeaders = [
      'startdate',
      'enddate',
      'trainingcourse',
      'trainerprovider',
      'category',
      'learnername',
      'sitelocation',
      'idnumber',
      'race',
      'gender',
      'isdisabled',
      'corecriticalskills',
      'totaldirectexpenditure',
      'additionalexpenditure',
      'costtocompanysalary',
      'trainingdurationhours',
      'numberofparticipants',
      'isunemployedlearner',
      'isabsorbedinternaltrainer'
    ];

    if (!requiredHeaders.every(header => headers.includes(header))) {
      throw new Error('CSV file must contain all required headers: ' + requiredHeaders.join(', '));
    }

    return lines.slice(1).map(line => {
      const values = line.split(',').map(val => val.trim());
      const obj = {};
      headers.forEach((header, index) => {
        obj[header] = values[index] || '';
      });
      return {
        startDate: obj.startdate,
        endDate: obj.enddate,
        trainingCourse: obj.trainingcourse,
        trainerProvider: obj.trainerprovider,
        category: obj.category,
        learnerName: obj.learnername,
        siteLocation: obj.sitelocation,
        idNumber: obj.idnumber,
        race: obj.race,
        gender: obj.gender,
        isDisabled: obj.isdisabled.toLowerCase() === 'true',
        coreCriticalSkills: obj.corecriticalskills,
        totalDirectExpenditure: Number(obj.totaldirectexpenditure) || 0,
        additionalExpenditure: Number(obj.additionalexpenditure) || 0,
        costToCompanySalary: Number(obj.costtocompanysalary) || 0,
        trainingDurationHours: Number(obj.trainingdurationhours) || 0,
        numberOfParticipants: Number(obj.numberofparticipants) || 0,
        isUnemployedLearner: obj.isunemployedlearner.toLowerCase() === 'true',
        isAbsorbedInternalTrainer: obj.isabsorbedinternaltrainer.toLowerCase() === 'true',
      };
    });
  };

  const validateCSVData = (data) => {
    return data.filter(item => {
      if (!item.startDate || !item.trainingCourse || !item.learnerName || !item.idNumber || !item.category) {
        console.warn('Skipping invalid CSV row:', item);
        return false;
      }
      if (item.totalDirectExpenditure < 0 || item.additionalExpenditure < 0 || item.costToCompanySalary < 0 || item.trainingDurationHours < 0 || item.numberOfParticipants < 0) {
        console.warn('Invalid numerical value in CSV row:', item);
        return false;
      }
      if (trainings.some(training => training.idNumber === item.idNumber)) {
        console.warn('Duplicate ID number in CSV row:', item);
        return false;
      }
      return true;
    });
  };

  const addTraining = () => {
    if (!userId) {
      console.warn('addTraining: userId is missing');
      return;
    }
    if (!newTraining.startDate || !newTraining.trainingCourse || !newTraining.learnerName || !newTraining.idNumber || !newTraining.category) {
      alert('Please fill in the Start Date, Training Course, Learner Name, ID Number, and Category.');
      return;
    }
    if (trainings.some((training) => training.idNumber === newTraining.idNumber)) {
      alert('A training with this ID Number already exists.');
      return;
    }
    const updatedTrainings = [...trainings, newTraining];
    setTrainings(updatedTrainings);
    resetNewTraining();
    recalculateSummary(updatedTrainings);
  };

  const editTraining = (index) => {
    setEditingTrainingIndex(index);
    setNewTraining(trainings[index]);
  };

  const saveEditedTraining = () => {
    if (!userId) {
      console.warn('saveEditedTraining: userId is missing');
      return;
    }
    if (!newTraining.startDate || !newTraining.trainingCourse || !newTraining.learnerName || !newTraining.idNumber || !newTraining.category) {
      alert('Please fill in the Start Date, Training Course, Learner Name, ID Number, and Category.');
      return;
    }
    if (
      trainings.some(
        (training, index) => training.idNumber === newTraining.idNumber && index !== editingTrainingIndex
      )
    ) {
      alert('A training with this ID Number already exists.');
      return;
    }
    const updatedTrainings = trainings.map((training, index) =>
      index === editingTrainingIndex ? newTraining : training
    );
    setTrainings(updatedTrainings);
    resetNewTraining();
    setEditingTrainingIndex(null);
    recalculateSummary(updatedTrainings);
  };

  const deleteTraining = async (index) => {
    if (!userId) {
      console.warn('deleteTraining: userId is missing');
      return;
    }
    if (window.confirm('Are you sure you want to delete this training?')) {
      setIsLoading(true);
      try {
        const updatedTrainings = trainings.filter((_, i) => i !== index);
        setTrainings(updatedTrainings);
        recalculateSummary(updatedTrainings);

        let currentDocumentId = documentId;
        if (!currentDocumentId) {
          const checkResponse = await axios.get(`http://localhost:5000/skills-development/${userId}`);
          if (checkResponse.data.data.length === 0) {
            throw new Error('No skills development data found for this user');
          }
          currentDocumentId = checkResponse.data.data[0].id;
          setDocumentId(currentDocumentId);
        }

        const response = await axios.put(`http://localhost:5000/skills-development/${currentDocumentId}`, {
          userId,
          trainings: updatedTrainings,
          summary,
        });

        console.log('Training deleted successfully:', response.data);
      } catch (error) {
        console.error('Error deleting training:', error);
        alert(`Failed to delete training: ${error.response?.data?.error || error.message}`);
        try {
          const response = await axios.get(`http://localhost:5000/skills-development/${userId}`);
          if (response.data.data.length > 0) {
            setTrainings(response.data.data[0].trainings || []);
            setSummary(response.data.data[0].summary || {
              totalTrainings: 0,
              totalDirectExpenditure: 0,
              totalAdditionalExpenditure: 0,
              totalCostToCompanySalary: 0,
              totalTrainingHours: 0,
              totalParticipants: 0,
              unemployedLearners: 0,
              absorbedInternalTrainers: 0,
            });
            setDocumentId(response.data.data[0].id);
          } else {
            setTrainings([]);
            setSummary({
              totalTrainings: 0,
              totalDirectExpenditure: 0,
              totalAdditionalExpenditure: 0,
              totalCostToCompanySalary: 0,
              totalTrainingHours: 0,
              totalParticipants: 0,
              unemployedLearners: 0,
              absorbedInternalTrainers: 0,
            });
            setDocumentId(null);
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

  const resetNewTraining = () => {
    setNewTraining({
      startDate: '',
      endDate: '',
      trainingCourse: '',
      trainerProvider: '',
      category: '',
      learnerName: '',
      siteLocation: '',
      idNumber: '',
      race: '',
      gender: '',
      isDisabled: false,
      coreCriticalSkills: '',
      totalDirectExpenditure: 0,
      additionalExpenditure: 0,
      costToCompanySalary: 0,
      trainingDurationHours: 0,
      numberOfParticipants: 0,
      isUnemployedLearner: false,
      isAbsorbedInternalTrainer: false,
    });
  };

  const recalculateSummary = (updatedTrainings) => {
    let totalTrainings = updatedTrainings.length;
    let totalDirectExpenditure = 0;
    let totalAdditionalExpenditure = 0;
    let totalCostToCompanySalary = 0;
    let totalTrainingHours = 0;
    let totalParticipants = 0;
    let unemployedLearners = 0;
    let absorbedInternalTrainers = 0;

    updatedTrainings.forEach((training) => {
      totalDirectExpenditure += Number(training.totalDirectExpenditure) || 0;
      totalAdditionalExpenditure += Number(training.additionalExpenditure) || 0;
      totalCostToCompanySalary += Number(training.costToCompanySalary) || 0;
      totalTrainingHours += Number(training.trainingDurationHours) || 0;
      totalParticipants += Number(training.numberOfParticipants) || 0;
      if (training.isUnemployedLearner) unemployedLearners += 1;
      if (training.isAbsorbedInternalTrainer) absorbedInternalTrainers += 1;
    });

    setSummary({
      totalTrainings,
      totalDirectExpenditure,
      totalAdditionalExpenditure,
      totalCostToCompanySalary,
      totalTrainingHours,
      totalParticipants,
      unemployedLearners,
      absorbedInternalTrainers,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log('Submitting skills development data:', { userId, trainings, summary });
    if (!userId) {
      console.warn('handleSubmit: userId is missing');
      return;
    }

    setIsLoading(true);
    try {
      let method = 'post';
      let url = 'http://localhost:5000/skills-development';
      let existingId = null;

      try {
        const checkResponse = await axios.get(`http://localhost:5000/skills-development/${userId}`);
        if (checkResponse.data.data.length > 0) {
          method = 'put';
          existingId = checkResponse.data.data[0].id;
          url = `http://localhost:5000/skills-development/${existingId}`;
        }
      } catch (checkError) {
        if (checkError.response?.status === 404) {
          if (checkError.response.data.error === 'User not found') {
            alert('Your account is not set up. Please contact support or log in again.');
            return;
          }
          console.warn('No existing skills development data found for userId:', userId);
        } else {
          throw checkError;
        }
      }

      const response = await axios[method](url, { userId, trainings, summary });
      console.log('Skills development data saved:', response.data);
      setDocumentId(response.data.id);
      onSubmit({ trainings, summary });
      onClose();
    } catch (error) {
      console.error('Error saving skills development data:', error);
      alert(`Failed to save skills development data: ${error.response?.data?.error || error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const deleteSkillsDevelopment = async () => {
    if (!userId) {
      console.warn('deleteSkillsDevelopment: userId is missing');
      return;
    }
    if (window.confirm('Are you sure you want to delete all skills development data for this user?')) {
      setIsLoading(true);
      try {
        const response = await axios.delete(`http://localhost:5000/skills-development/${userId}`);
        console.log('Skills development data deleted:', response.data);
        setTrainings([]);
        setSummary({
          totalTrainings: 0,
          totalDirectExpenditure: 0,
          totalAdditionalExpenditure: 0,
          totalCostToCompanySalary: 0,
          totalTrainingHours: 0,
          totalParticipants: 0,
          unemployedLearners: 0,
          absorbedInternalTrainers: 0,
        });
        setDocumentId(null);
      } catch (error) {
        console.error('Error deleting skills development data:', error);
        alert(`Failed to delete: ${error.response?.data?.error || error.message}`);
        try {
          const response = await axios.get(`http://localhost:5000/skills-development/${userId}`);
          if (response.data.data.length > 0) {
            setTrainings(response.data.data[0].trainings || []);
            setSummary(response.data.data[0].summary || {
              totalTrainings: 0,
              totalDirectExpenditure: 0,
              totalAdditionalExpenditure: 0,
              totalCostToCompanySalary: 0,
              totalTrainingHours: 0,
              totalParticipants: 0,
              unemployedLearners: 0,
              absorbedInternalTrainers: 0,
            });
            setDocumentId(response.data.data[0].id);
          } else {
            setTrainings([]);
            setSummary({
              totalTrainings: 0,
              totalDirectExpenditure: 0,
              totalAdditionalExpenditure: 0,
              totalCostToCompanySalary: 0,
              totalTrainingHours: 0,
              totalParticipants: 0,
              unemployedLearners: 0,
              absorbedInternalTrainers: 0,
            });
            setDocumentId(null);
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

  if (!userId) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg shadow-md p-6 w-full max-w-md">
          <h2 className="text-xl font-semibold mb-4">Error</h2>
          <p className="text-red-600 mb-4">User ID is missing. Please ensure you are logged in and try again.</p>
          <button
            onClick={onClose}
            className="bg-gray-200 text-gray-800 px-4 py-2 rounded-md hover:bg-gray-300"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-md p-6 w-full max-w-5xl max-h-[80vh] overflow-y-auto">
        <h2 className="text-xl font-semibold mb-4">Skills Development Details</h2>

        <form onSubmit={handleSubmit}>
          {/* CSV Upload Section */}
          <div className="mb-6">
            <h3 className="text-lg font-medium mb-2">Upload Training Programs CSV</h3>
            <input
              type="file"
              accept=".csv"
              onChange={handleCSVUpload}
              className="w-full p-2 border rounded"
              disabled={isLoading}
            />
            <p className="text-sm text-gray-600 mt-2">
              CSV file must contain headers: startDate, endDate, trainingCourse, trainerProvider, category,
              learnerName, siteLocation, idNumber, race, gender, isDisabled, coreCriticalSkills,
              totalDirectExpenditure, additionalExpenditure, costToCompanySalary, trainingDurationHours,
              numberOfParticipants, isUnemployedLearner, isAbsorbedInternalTrainer
            </p>
          </div>

          <div className="mb-6">
            <h3 className="text-lg font-medium mb-2">Add Training Program</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Start Date</label>
                <input
                  type="date"
                  name="startDate"
                  value={newTraining.startDate}
                  onChange={handleTrainingChange}
                  className="w-full p-2 border rounded"
                  disabled={isLoading}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">End Date (B/C/D Learnerships Only)</label>
                <input
                  type="date"
                  name="endDate"
                  value={newTraining.endDate}
                  onChange={handleTrainingChange}
                  className="w-full p-2 border rounded"
                  disabled={isLoading}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Training Course</label>
                <input
                  type="text"
                  name="trainingCourse"
                  value={newTraining.trainingCourse}
                  onChange={handleTrainingChange}
                  className="w-full p-2 border rounded"
                  placeholder="Enter training course"
                  disabled={isLoading}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Trainer/Service Provider</label>
                <input
                  type="text"
                  name="trainerProvider"
                  value={newTraining.trainerProvider}
                  onChange={handleTrainingChange}
                  className="w-full p-2 border rounded"
                  placeholder="Enter trainer/provider"
                  disabled={isLoading}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Category</label>
                <select
                  name="category"
                  value={newTraining.category}
                  onChange={handleTrainingChange}
                  className="w-full p-2 border rounded"
                  disabled={isLoading}
                >
                  <option value="">Select Category</option>
                  {categories.map((cat) => (
                    <option key={cat.value} value={cat.value}>
                      {cat.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Learner Name & Surname</label>
                <input
                  type="text"
                  name="learnerName"
                  value={newTraining.learnerName}
                  onChange={handleTrainingChange}
                  className="w-full p-2 border rounded"
                  placeholder="Enter learner name"
                  disabled={isLoading}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Site/Location (if applicable)</label>
                <input
                  type="text"
                  name="siteLocation"
                  value={newTraining.siteLocation}
                  onChange={handleTrainingChange}
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
                  value={newTraining.idNumber}
                  onChange={handleTrainingChange}
                  className="w-full p-2 border rounded"
                  placeholder="Enter ID number"
                  disabled={isLoading}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Race</label>
                <select
                  name="race"
                  value={newTraining.race}
                  onChange={handleTrainingChange}
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
                  value={newTraining.gender}
                  onChange={handleTrainingChange}
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
                <input
                  type="checkbox"
                  name="isDisabled"
                  checked={newTraining.isDisabled}
                  onChange={handleTrainingChange}
                  className="mr-2"
                  disabled={isLoading}
                />
                <label className="text-sm font-medium">Disabled</label>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Core and/or Critical Skills</label>
                <input
                  type="text"
                  name="coreCriticalSkills"
                  value={newTraining.coreCriticalSkills}
                  onChange={handleTrainingChange}
                  className="w-full p-2 border rounded"
                  placeholder="Enter skills"
                  disabled={isLoading}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Total Direct Expenditure (Excl. VAT)</label>
                <input
                  type="number"
                  name="totalDirectExpenditure"
                  value={newTraining.totalDirectExpenditure}
                  onChange={handleTrainingChange}
                  className="w-full p-2 border rounded"
                  placeholder="Enter expenditure"
                  disabled={isLoading}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Additional Expenditure (Hotels & Travel)</label>
                <input
                  type="number"
                  name="additionalExpenditure"
                  value={newTraining.additionalExpenditure}
                  onChange={handleTrainingChange}
                  className="w-full p-2 border rounded"
                  placeholder="Enter additional expenditure"
                  disabled={isLoading}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Cost to Company Annual Salary</label>
                <input
                  type="number"
                  name="costToCompanySalary"
                  value={newTraining.costToCompanySalary}
                  className="w-full p-2 border rounded"
                  placeholder="Enter salary"
                  disabled
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Duration of Training (Hours)</label>
                <input
                  type="number"
                  name="trainingDurationHours"
                  value={newTraining.trainingDurationHours}
                  onChange={handleTrainingChange}
                  className="w-full p-2 border rounded"
                  placeholder="Enter hours"
                  disabled={isLoading}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Number of Participants</label>
                <input
                  type="number"
                  name="numberOfParticipants"
                  value={newTraining.numberOfParticipants}
                  onChange={handleTrainingChange}
                  className="w-full p-2 border rounded"
                  placeholder="Enter number of participants"
                  disabled={isLoading}
                />
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  name="isUnemployedLearner"
                  checked={newTraining.isUnemployedLearner}
                  onChange={handleTrainingChange}
                  className="mr-2"
                  disabled={isLoading}
                />
                <label className="text-sm font-medium">Unemployed Learner</label>
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  name="isAbsorbedInternalTrainer"
                  checked={newTraining.isAbsorbedInternalTrainer}
                  onChange={handleTrainingChange}
                  className="mr-2"
                  disabled={isLoading}
                />
                <label className="text-sm font-medium">Absorbed Internal Trainer</label>
              </div>
            </div>
            <button
              type="button"
              onClick={editingTrainingIndex !== null ? saveEditedTraining : addTraining}
              className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:bg-blue-300"
              disabled={isLoading}
            >
              {editingTrainingIndex !== null ? 'Save Edited Training' : 'Add Training'}
            </button>
          </div>

          {trainings.length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-medium mb-2">Training Programs List</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full border-collapse border border-gray-300">
                  <thead>
                    <tr className="bg-gray-200">
                      <th className="border border-gray-300 px-4 py-2">Start Date</th>
                      <th className="border border-gray-300 px-4 py-2">End Date</th>
                      <th className="border border-gray-300 px-4 py-2">Training Course</th>
                      <th className="border border-gray-300 px-4 py-2">Trainer/Provider</th>
                      <th className="border border-gray-300 px-4 py-2">Category</th>
                      <th className="border border-gray-300 px-4 py-2">Learner Name</th>
                      <th className="border border-gray-300 px-4 py-2">Site/Location</th>
                      <th className="border border-gray-300 px-4 py-2">ID Number</th>
                      <th className="border border-gray-300 px-4 py-2">Race</th>
                      <th className="border border-gray-300 px-4 py-2">Gender</th>
                      <th className="border border-gray-300 px-4 py-2">Disabled</th>
                      <th className="border border-gray-300 px-4 py-2">Core/Critical Skills</th>
                      <th className="border border-gray-300 px-4 py-2">Total Direct Expenditure</th>
                      <th className="border border-gray-300 px-4 py-2">Additional Expenditure</th>
                      <th className="border border-gray-300 px-4 py-2">Cost to Company Salary</th>
                      <th className="border border-gray-300 px-4 py-2">Training Duration (Hours)</th>
                      <th className="border border-gray-300 px-4 py-2">Number of Participants</th>
                      <th className="border border-gray-300 px-4 py-2">Unemployed Learner</th>
                      <th className="border border-gray-300 px-4 py-2">Absorbed Internal Trainer</th>
                      <th className="border border-gray-300 px-4 py-2">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {trainings.map((training, index) => (
                      <tr key={training.idNumber}>
                        <td className="border border-gray-300 px-4 py-2">{training.startDate}</td>
                        <td className="border border-gray-300 px-4 py-2">{training.endDate || 'N/A'}</td>
                        <td className="border border-gray-300 px-4 py-2">{training.trainingCourse}</td>
                        <td className="border border-gray-300 px-4 py-2">{training.trainerProvider || 'N/A'}</td>
                        <td className="border border-gray-300 px-4 py-2">{training.category}</td>
                        <td className="border border-gray-300 px-4 py-2">{training.learnerName}</td>
                        <td className="border border-gray-300 px-4 py-2">{training.siteLocation || 'N/A'}</td>
                        <td className="border border-gray-300 px-4 py-2">{training.idNumber}</td>
                        <td className="border border-gray-300 px-4 py-2">{training.race || 'N/A'}</td>
                        <td className="border border-gray-300 px-4 py-2">{training.gender || 'N/A'}</td>
                        <td className="border border-gray-300 px-4 py-2">{training.isDisabled ? 'Yes' : 'No'}</td>
                        <td className="border border-gray-300 px-4 py-2">{training.coreCriticalSkills || 'N/A'}</td>
                        <td className="border border-gray-300 px-4 py-2">{training.totalDirectExpenditure}</td>
                        <td className="border border-gray-300 px-4 py-2">{training.additionalExpenditure}</td>
                        <td className="border border-gray-300 px-4 py-2">{training.costToCompanySalary}</td>
                        <td className="border border-gray-300 px-4 py-2">{training.trainingDurationHours}</td>
                        <td className="border border-gray-300 px-4 py-2">{training.numberOfParticipants}</td>
                        <td className="border border-gray-300 px-4 py-2">{training.isUnemployedLearner ? 'Yes' : 'No'}</td>
                        <td className="border border-gray-300 px-4 py-2">{training.isAbsorbedInternalTrainer ? 'Yes' : 'No'}</td>
                        <td className="border border-gray-300 px-4 py-2">
                          <button
                            type="button"
                            onClick={() => editTraining(index)}
                            className="bg-yellow-500 text-white px-2 py-1 rounded mr-2 hover:bg-yellow-600 disabled:bg-yellow-300"
                            disabled={isLoading}
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => deleteTraining(index)}
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
            <h3 className="text-lg font-medium mb-2">Skills Development Summary</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Total Trainings</label>
                <input
                  type="number"
                  value={summary.totalTrainings}
                  className="w-full p-2 border rounded"
                  disabled
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Total Direct Expenditure (R)</label>
                <input
                  type="number"
                  value={summary.totalDirectExpenditure}
                  className="w-full p-2 border rounded"
                  disabled
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Total Additional Expenditure (R)</label>
                <input
                  type="number"
                  value={summary.totalAdditionalExpenditure}
                  className="w-full p-2 border rounded"
                  disabled
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Total Cost to Company Salary (R)</label>
                <input
                  type="number"
                  value={summary.totalCostToCompanySalary}
                  className="w-full p-2 border rounded"
                  disabled
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Total Training Hours</label>
                <input
                  type="number"
                  value={summary.totalTrainingHours}
                  className="w-full p-2 border rounded"
                  disabled
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Total Participants</label>
                <input
                  type="number"
                  value={summary.totalParticipants}
                  className="w-full p-2 border rounded"
                  disabled
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Unemployed Learners</label>
                <input
                  type="number"
                  value={summary.unemployedLearners}
                  className="w-full p-2 border rounded"
                  disabled
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Absorbed Internal Trainers</label>
                <input
                  type="number"
                  value={summary.absorbedInternalTrainers}
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
            {trainings.length > 0 && (
              <button
                type="button"
                onClick={deleteSkillsDevelopment}
                className="bg-red-600 text-white px-3 py-2 sm:px-4 sm:py-2 rounded-md hover:bg-red-700 w-full sm:w-auto transition-all duration-200 disabled:bg-red-300"
                disabled={isLoading}
              >
                Delete Skills Development Details
              </button>
            )}
            <button
              type="submit"
              className="bg-blue-600 text-white px-3 py-2 sm:px-4 sm:py-2 rounded-md hover:bg-blue-700 w-full sm:w-auto transition-all duration-200 disabled:bg-blue-300"
              disabled={isLoading}
            >
              Save Skills Development Details
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

SkillsDevelopment.propTypes = {
  userId: PropTypes.string.isRequired,
  onClose: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
};

export default SkillsDevelopment;