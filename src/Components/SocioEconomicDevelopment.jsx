import React, { useState, useEffect } from "react";

const SocioEconomicDevelopment = ({ userId, onClose, onSubmit }) => {
  const [beneficiaries, setBeneficiaries] = useState([]);
  const [newBeneficiary, setNewBeneficiary] = useState({
    beneficiaryName: "",
    siteLocation: "",
    blackParticipationPercentage: 0,
    contributionType: "",
    contributionDescription: "",
    dateOfContribution: "",
    contributionAmount: 0,
  });
  const [editingBeneficiaryIndex, setEditingBeneficiaryIndex] = useState(null);
  const [summary, setSummary] = useState({
    totalBeneficiaries: 0,
    totalContributionAmount: 0,
    averageBlackParticipation: 0,
  });
  const [existingId, setExistingId] = useState(null);

  // Fetch existing data when component mounts
  useEffect(() => {
    const fetchSocioEconomicData = async () => {
      try {
        console.log("Fetching socio-economic data for userId:", userId);
        const response = await fetch(`http://localhost:5000/socio-economic-development/${userId}`);
        if (!response.ok) {
          const errorText = await response.text();
          console.error("GET request failed:", { status: response.status, errorText });
          if (response.status === 404) {
            console.log("No data found for userId, proceeding with empty form");
            return;
          }
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        const { data } = await response.json();
        console.log("Retrieved socio-economic data:", data);
        if (data.length > 0) {
          setBeneficiaries(data[0].beneficiaries);
          setSummary(data[0].summary);
          setExistingId(data[0].id);
        }
      } catch (error) {
        console.error("Error fetching socio-economic development data:", error.message);
      }
    };
    if (userId) fetchSocioEconomicData();
  }, [userId]);

  const handleBeneficiaryChange = (e) => {
    const { name, value, type } = e.target;
    setNewBeneficiary({
      ...newBeneficiary,
      [name]: type === "number" ? (value === "" ? 0 : Number(value)) : value,
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
        const updatedBeneficiaries = [...beneficiaries, ...validatedData];
        setBeneficiaries(updatedBeneficiaries);
        recalculateSummary(updatedBeneficiaries);
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
      'beneficiaryname', 
      'sitelocation', 
      'blackparticipationpercentage', 
      'contributiontype', 
      'contributiondescription', 
      'dateofcontribution', 
      'contributionamount'
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
        beneficiaryName: obj.beneficiaryname,
        siteLocation: obj.sitelocation,
        blackParticipationPercentage: Number(obj.blackparticipationpercentage) || 0,
        contributionType: obj.contributiontype,
        contributionDescription: obj.contributiondescription,
        dateOfContribution: obj.dateofcontribution,
        contributionAmount: Number(obj.contributionamount) || 0,
      };
    });
  };

  const validateCSVData = (data) => {
    return data.filter(item => {
      if (!item.beneficiaryName || !item.contributionType || !item.contributionAmount) {
        console.warn('Skipping invalid CSV row:', item);
        return false;
      }
      if (item.blackParticipationPercentage < 0 || item.blackParticipationPercentage > 100) {
        console.warn('Invalid black participation percentage:', item);
        return false;
      }
      return true;
    });
  };

  const addBeneficiary = () => {
    if (
      !newBeneficiary.beneficiaryName ||
      !newBeneficiary.contributionAmount ||
      !newBeneficiary.contributionType
    ) {
      alert("Please fill in the Beneficiary Name, Contribution Amount, and Contribution Type.");
      return;
    }

    const updatedBeneficiaries = [...beneficiaries, newBeneficiary];
    setBeneficiaries(updatedBeneficiaries);
    resetNewBeneficiary();
    recalculateSummary(updatedBeneficiaries);
  };

  const editBeneficiary = (index) => {
    setEditingBeneficiaryIndex(index);
    setNewBeneficiary(beneficiaries[index]);
  };

  const saveEditedBeneficiary = () => {
    if (
      !newBeneficiary.beneficiaryName ||
      !newBeneficiary.contributionAmount ||
      !newBeneficiary.contributionType
    ) {
      alert("Please fill in the Beneficiary Name, Contribution Amount, and Contribution Type.");
      return;
    }

    const updatedBeneficiaries = beneficiaries.map((beneficiary, index) =>
      index === editingBeneficiaryIndex ? newBeneficiary : beneficiary
    );
    setBeneficiaries(updatedBeneficiaries);
    resetNewBeneficiary();
    setEditingBeneficiaryIndex(null);
    recalculateSummary(updatedBeneficiaries);
  };

  const deleteBeneficiary = (index) => {
    const updatedBeneficiaries = beneficiaries.filter((_, i) => i !== index);
    setBeneficiaries(updatedBeneficiaries);
    recalculateSummary(updatedBeneficiaries);
  };

  const resetNewBeneficiary = () => {
    setNewBeneficiary({
      beneficiaryName: "",
      siteLocation: "",
      blackParticipationPercentage: 0,
      contributionType: "",
      contributionDescription: "",
      dateOfContribution: "",
      contributionAmount: 0,
    });
  };

  const recalculateSummary = (updatedBeneficiaries) => {
    let totalBeneficiaries = updatedBeneficiaries.length;
    let totalContributionAmount = 0;
    let totalBlackParticipation = 0;

    updatedBeneficiaries.forEach((beneficiary) => {
      totalContributionAmount += Number(beneficiary.contributionAmount);
      totalBlackParticipation += Number(beneficiary.blackParticipationPercentage);
    });

    const averageBlackParticipation =
      totalBeneficiaries > 0 ? (totalBlackParticipation / totalBeneficiaries).toFixed(2) : 0;

    setSummary({
      totalBeneficiaries,
      totalContributionAmount,
      averageBlackParticipation,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = { userId, beneficiaries, summary };
      let method = "POST";
      let url = "http://localhost:5000/socio-economic-development";
      
      if (existingId) {
        method = "PUT";
        url = `http://localhost:5000/socio-economic-development/${existingId}`;
      }

      console.log("Submitting socio-economic development data:", payload);
      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        const errorText = await response.text();
        console.error("Submit request failed:", { status: response.status, errorText });
        throw new Error(`HTTP error! Status: ${response.status}: ${errorText}`);
      }
      const data = await response.json();
      console.log("Socio-economic development data saved:", data);
      setExistingId(data.id);
      onSubmit(payload);
      onClose();
    } catch (error) {
      console.error("Error saving socio-economic development data:", error.message);
      alert(`Failed to save socio-economic development data: ${error.message}`);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("Are you sure you want to delete all socio-economic development data for this user?")) {
      return;
    }

    try {
      console.log("Sending DELETE request for userId:", userId);
      const response = await fetch(`http://localhost:5000/socio-economic-development/${userId}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        const errorText = await response.text();
        console.error("DELETE request failed:", { status: response.status, errorText });
        throw new Error(`HTTP error! Status: ${response.status}: ${errorText}`);
      }
      console.log("Socio-economic development data deleted");
      setBeneficiaries([]);
      setSummary({
        totalBeneficiaries: 0,
        totalContributionAmount: 0,
        averageBlackParticipation: 0,
      });
      setExistingId(null);
      onSubmit(null);
      onClose();
    } catch (error) {
      console.error("Error deleting socio-economic development data:", error.message);
      alert(`Failed to delete socio-economic development data: ${error.message}`);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-md p-6 w-full max-w-5xl max-h-[80vh] overflow-y-auto">
        <h2 className="text-xl font-semibold mb-4">Socio-Economic Development Details</h2>

        <form onSubmit={handleSubmit}>
          {/* CSV Upload Section */}
          <div className="mb-6">
            <h3 className="text-lg font-medium mb-2">Upload Beneficiaries CSV</h3>
            <input
              type="file"
              accept=".csv"
              onChange={handleCSVUpload}
              className="w-full p-2 border rounded"
            />
            <p className="text-sm text-gray-600 mt-2">
              CSV file must contain headers: beneficiaryName, siteLocation, blackParticipationPercentage, 
              contributionType, contributionDescription, dateOfContribution, contributionAmount
            </p>
          </div>

          {/* Beneficiary Input Form */}
          <div className="mb-6">
            <h3 className="text-lg font-medium mb-2">Add Beneficiary</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Beneficiary Name</label>
                <input
                  type="text"
                  name="beneficiaryName"
                  value={newBeneficiary.beneficiaryName}
                  onChange={handleBeneficiaryChange}
                  className="w-full p-2 border rounded"
                  placeholder="Enter beneficiary name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Site/Location (if applicable)</label>
                <input
                  type="text"
                  name="siteLocation"
                  value={newBeneficiary.siteLocation}
                  onChange={handleBeneficiaryChange}
                  className="w-full p-2 border rounded"
                  placeholder="Enter site/location"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">% Black Participation</label>
                <input
                  type="number"
                  name="blackParticipationPercentage"
                  value={newBeneficiary.blackParticipationPercentage}
                  onChange={handleBeneficiaryChange}
                  className="w-full p-2 border rounded"
                  placeholder="Enter percentage"
                  min="0"
                  max="100"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Contribution Type</label>
                <select
                  name="contributionType"
                  value={newBeneficiary.contributionType}
                  onChange={handleBeneficiaryChange}
                  className="w-full p-2 border rounded"
                >
                  <option value="">Select Contribution Type</option>
                  <option value="Grant">Grant</option>
                  <option value="Direct Cost">Direct Cost</option>
                  <option value="Discounts">Discounts</option>
                  <option value="Overhead Costs">Overhead Costs</option>
                  <option value="Professional Services rendered at no cost">
                    Professional Services rendered at no cost
                  </option>
                  <option value="Professional Services rendered at a discount">
                    Professional Services rendered at a discount
                  </option>
                  <option value="Time of employee deployed in assisting beneficiaries">
                    Time of employee deployed in assisting beneficiaries
                  </option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Description of Contribution</label>
                <input
                  type="text"
                  name="contributionDescription"
                  value={newBeneficiary.contributionDescription}
                  onChange={handleBeneficiaryChange}
                  className="w-full p-2 border rounded"
                  placeholder="Enter description"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Date of Contribution</label>
                <input
                  type="date"
                  name="dateOfContribution"
                  value={newBeneficiary.dateOfContribution}
                  onChange={handleBeneficiaryChange}
                  className="w-full p-2 border rounded"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Amount of Contribution (R)</label>
                <input
                  type="number"
                  name="contributionAmount"
                  value={newBeneficiary.contributionAmount}
                  onChange={handleBeneficiaryChange}
                  className="w-full p-2 border rounded"
                  placeholder="Enter amount"
                />
              </div>
            </div>
            <button
              type="button"
              onClick={editingBeneficiaryIndex !== null ? saveEditedBeneficiary : addBeneficiary}
              className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
            >
              {editingBeneficiaryIndex !== null ? "Save Edited Beneficiary" : "Add Beneficiary"}
            </button>
          </div>

          {/* Beneficiaries Table */}
          {beneficiaries.length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-medium mb-2">Beneficiaries List</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full border-collapse border border-gray-300">
                  <thead>
                    <tr className="bg-gray-200">
                      <th className="border border-gray-300 px-4 py-2">Beneficiary</th>
                      <th className="border border-gray-300 px-4 py-2">Site/Location</th>
                      <th className="border border-gray-300 px-4 py-2">% Black Participation</th>
                      <th className="border border-gray-300 px-4 py-2">Contribution Type</th>
                      <th className="border border-gray-300 px-4 py-2">Description of Contribution</th>
                      <th className="border border-gray-300 px-4 py-2">Date of Contribution</th>
                      <th className="border border-gray-300 px-4 py-2">Amount of Contribution (R)</th>
                      <th className="border border-gray-300 px-4 py-2">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {beneficiaries.map((beneficiary, index) => (
                      <tr key={index}>
                        <td className="border border-gray-300 px-4 py-2">{beneficiary.beneficiaryName}</td>
                        <td className="border border-gray-300 px-4 py-2">{beneficiary.siteLocation || "N/A"}</td>
                        <td className="border border-gray-300 px-4 py-2">
                          {beneficiary.blackParticipationPercentage}%
                        </td>
                        <td className="border border-gray-300 px-4 py-2">{beneficiary.contributionType}</td>
                        <td className="border border-gray-300 px-4 py-2">
                          {beneficiary.contributionDescription || "N/A"}
                        </td>
                        <td className="border border-gray-300 px-4 py-2">{beneficiary.dateOfContribution || "N/A"}</td>
                        <td className="border border-gray-300 px-4 py-2">{beneficiary.contributionAmount}</td>
                        <td className="border border-gray-300 px-4 py-2">
                          <button
                            type="button"
                            onClick={() => editBeneficiary(index)}
                            className="bg-yellow-500 text-white px-2 py-1 rounded mr-2 hover:bg-yellow-600"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => deleteBeneficiary(index)}
                            className="bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600"
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

          {/* Summary Section */}
          <div className="mb-6">
            <h3 className="text-lg font-medium mb-2">Socio-Economic Development Summary</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Total Beneficiaries</label>
                <input
                  type="number"
                  value={summary.totalBeneficiaries}
                  className="w-full p-2 border rounded"
                  disabled
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Total Contribution Amount (R)</label>
                <input
                  type="number"
                  value={summary.totalContributionAmount}
                  className="w-full p-2 border rounded"
                  disabled
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Average % Black Participation</label>
                <input
                  type="number"
                  value={summary.averageBlackParticipation}
                  className="w-full p-2 border rounded"
                  disabled
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-4">
            <button
              type="button"
              onClick={onClose}
              className="bg-gray-200 text-gray-800 px-4 py-2 rounded-md hover:bg-gray-300"
            >
              Cancel
            </button>
            {userId && (
              <button
                type="button"
                onClick={handleDelete}
                className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700"
              >
                Delete Socio-Economic Development Details
              </button>
            )}
            <button
              type="submit"
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
            >
              Save Socio-Economic Development Details
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SocioEconomicDevelopment;