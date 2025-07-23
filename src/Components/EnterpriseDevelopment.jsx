import React, { useState, useEffect } from "react";
import PropTypes from "prop-types";

const EnterpriseDevelopment = ({ userId, onClose, onSubmit, onLogout }) => {
  const [beneficiaries, setBeneficiaries] = useState([]);
  const [newBeneficiary, setNewBeneficiary] = useState({
    beneficiaryName: "",
    siteLocation: "",
    isSupplierDevelopmentBeneficiary: false,
    blackOwnershipPercentage: 0,
    blackWomenOwnershipPercentage: 0,
    beeStatusLevel: "",
    contributionType: "",
    contributionDescription: "",
    dateOfContribution: "",
    paymentDate: "",
    contributionAmount: 0,
  });
  const [editingBeneficiaryIndex, setEditingBeneficiaryIndex] = useState(null);
  const [summary, setSummary] = useState({
    totalBeneficiaries: 0,
    totalContributionAmount: 0,
    supplierDevelopmentBeneficiaries: 0,
    blackOwnedBeneficiaries: 0,
    blackWomenOwnedBeneficiaries: 0,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [documentId, setDocumentId] = useState(null);

  // Fetch existing data when component mounts
  useEffect(() => {
    console.log("EnterpriseDevelopment mounted with userId:", userId);
    if (!userId) {
      console.warn("EnterpriseDevelopment: userId prop is missing or undefined");
      return;
    }

    const fetchEnterpriseData = async () => {
      setIsLoading(true);
      try {
        console.log("Fetching enterprise development data for userId:", userId);
        const response = await fetch(`http://localhost:5000/enterprise-development/${userId}`);
        if (!response.ok) {
          const errorData = await response.json();
          if (response.status === 404 && errorData.message === "No enterprise development data found for this user") {
            console.log("No enterprise development data found for userId:", userId);
            setBeneficiaries([]);
            setSummary({
              totalBeneficiaries: 0,
              totalContributionAmount: 0,
              supplierDevelopmentBeneficiaries: 0,
              blackOwnedBeneficiaries: 0,
              blackWomenOwnedBeneficiaries: 0,
            });
            setDocumentId(null);
            return;
          }
          throw new Error(errorData.error || `HTTP error! Status: ${response.status}`);
        }
        const { data } = await response.json();
        if (data.length > 0) {
          setBeneficiaries(data[0].beneficiaries || []);
          setSummary(data[0].summary || {
            totalBeneficiaries: 0,
            totalContributionAmount: 0,
            supplierDevelopmentBeneficiaries: 0,
            blackOwnedBeneficiaries: 0,
            blackWomenOwnedBeneficiaries: 0,
          });
          setDocumentId(data[0].id);
          console.log("Set documentId:", data[0].id);
        } else {
          console.log("No enterprise development data found for userId:", userId);
          setBeneficiaries([]);
          setSummary({
            totalBeneficiaries: 0,
            totalContributionAmount: 0,
            supplierDevelopmentBeneficiaries: 0,
            blackOwnedBeneficiaries: 0,
            blackWomenOwnedBeneficiaries: 0,
          });
          setDocumentId(null);
        }
      } catch (error) {
        console.warn("Error fetching enterprise development data:", error.message);
        if (error.message.includes("User not found")) {
          alert("Your account is not set up. Please log in again.");
          onLogout();
          return;
        }
        alert(`Failed to fetch enterprise development data: ${error.message}`);
        setBeneficiaries([]);
        setSummary({
          totalBeneficiaries: 0,
          totalContributionAmount: 0,
          supplierDevelopmentBeneficiaries: 0,
          blackOwnedBeneficiaries: 0,
          blackWomenOwnedBeneficiaries: 0,
        });
        setDocumentId(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchEnterpriseData();
  }, [userId, onLogout]);

  const handleBeneficiaryChange = (e) => {
    const { name, value, type, checked } = e.target;
    setNewBeneficiary({
      ...newBeneficiary,
      [name]:
        type === "checkbox"
          ? checked
          : type === "number"
          ? value === ""
            ? 0
            : Number(value)
          : value,
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
      'issupplierdevelopmentbeneficiary',
      'blackownershippercentage',
      'blackwomenownershippercentage',
      'beestatuslevel',
      'contributiontype',
      'contributiondescription',
      'dateofcontribution',
      'paymentdate',
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
        isSupplierDevelopmentBeneficiary: obj.issupplierdevelopmentbeneficiary.toLowerCase() === 'true',
        blackOwnershipPercentage: Number(obj.blackownershippercentage) || 0,
        blackWomenOwnershipPercentage: Number(obj.blackwomenownershippercentage) || 0,
        beeStatusLevel: obj.beestatuslevel,
        contributionType: obj.contributiontype,
        contributionDescription: obj.contributiondescription,
        dateOfContribution: obj.dateofcontribution,
        paymentDate: obj.paymentdate,
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
      if (item.blackOwnershipPercentage < 0 || item.blackOwnershipPercentage > 100) {
        console.warn('Invalid black ownership percentage:', item);
        return false;
      }
      if (item.blackWomenOwnershipPercentage < 0 || item.blackWomenOwnershipPercentage > 100) {
        console.warn('Invalid black women ownership percentage:', item);
        return false;
      }
      return true;
    });
  };

  const addBeneficiary = () => {
    if (!userId) {
      console.warn("addBeneficiary: userId is missing");
      return;
    }
    if (
      !newBeneficiary.beneficiaryName.trim() ||
      newBeneficiary.contributionAmount <= 0 ||
      !newBeneficiary.contributionType.trim()
    ) {
      alert(
        "Please fill in the Beneficiary Name, Contribution Amount (greater than 0), and Contribution Type."
      );
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
    if (!userId) {
      console.warn("saveEditedBeneficiary: userId is missing");
      return;
    }
    if (
      !newBeneficiary.beneficiaryName.trim() ||
      newBeneficiary.contributionAmount <= 0 ||
      !newBeneficiary.contributionType.trim()
    ) {
      alert(
        "Please fill in the Beneficiary Name, Contribution Amount (greater than 0), and Contribution Type."
      );
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

  const deleteBeneficiary = async (index) => {
    if (!userId) {
      console.warn("deleteBeneficiary: userId is missing");
      return;
    }
    if (window.confirm("Are you sure you want to delete this beneficiary?")) {
      setIsLoading(true);
      try {
        const updatedBeneficiaries = beneficiaries.filter((_, i) => i !== index);
        setBeneficiaries(updatedBeneficiaries);
        recalculateSummary(updatedBeneficiaries);

        let currentDocumentId = documentId;
        if (!currentDocumentId) {
          const checkResponse = await fetch(`http://localhost:5000/enterprise-development/${userId}`);
          if (!checkResponse.ok) {
            const errorData = await checkResponse.json();
            throw new Error(errorData.error || "No enterprise development data found for this user");
          }
          const { data } = await checkResponse.json();
          if (data.length === 0) {
            throw new Error("No enterprise development data found for this user");
          }
          currentDocumentId = data[0].id;
          setDocumentId(currentDocumentId);
        }

        const response = await fetch(`http://localhost:5000/enterprise-development/${currentDocumentId}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            userId,
            beneficiaries: updatedBeneficiaries,
            summary,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || `HTTP error! Status: ${response.status}`);
        }

        console.log("Beneficiary deleted successfully:", await response.json());
      } catch (error) {
        console.error("Error deleting beneficiary:", error);
        alert(`Failed to delete beneficiary: ${error.message}`);
        try {
          const response = await fetch(`http://localhost:5000/enterprise-development/${userId}`);
          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || `HTTP error! Status: ${response.status}`);
          }
          const { data } = await response.json();
          if (data.length > 0) {
            setBeneficiaries(data[0].beneficiaries || []);
            setSummary(data[0].summary || {
              totalBeneficiaries: 0,
              totalContributionAmount: 0,
              supplierDevelopmentBeneficiaries: 0,
              blackOwnedBeneficiaries: 0,
              blackWomenOwnedBeneficiaries: 0,
            });
            setDocumentId(data[0].id);
          } else {
            setBeneficiaries([]);
            setSummary({
              totalBeneficiaries: 0,
              totalContributionAmount: 0,
              supplierDevelopmentBeneficiaries: 0,
              blackOwnedBeneficiaries: 0,
              blackWomenOwnedBeneficiaries: 0,
            });
            setDocumentId(null);
          }
        } catch (fetchError) {
          console.error("Error re-fetching data:", fetchError);
          alert("Failed to restore data. Please refresh the page.");
        }
      } finally {
        setIsLoading(false);
      }
    }
  };

  const resetNewBeneficiary = () => {
    setNewBeneficiary({
      beneficiaryName: "",
      siteLocation: "",
      isSupplierDevelopmentBeneficiary: false,
      blackOwnershipPercentage: 0,
      blackWomenOwnershipPercentage: 0,
      beeStatusLevel: "",
      contributionType: "",
      contributionDescription: "",
      dateOfContribution: "",
      paymentDate: "",
      contributionAmount: 0,
    });
  };

  const recalculateSummary = (updatedBeneficiaries) => {
    const summary = updatedBeneficiaries.reduce(
      (acc, beneficiary) => ({
        totalBeneficiaries: acc.totalBeneficiaries + 1,
        totalContributionAmount: acc.totalContributionAmount + Number(beneficiary.contributionAmount || 0),
        supplierDevelopmentBeneficiaries:
          acc.supplierDevelopmentBeneficiaries + (beneficiary.isSupplierDevelopmentBeneficiary ? 1 : 0),
        blackOwnedBeneficiaries:
          acc.blackOwnedBeneficiaries + (Number(beneficiary.blackOwnershipPercentage) >= 30 ? 1 : 0),
        blackWomenOwnedBeneficiaries:
          acc.blackWomenOwnedBeneficiaries +
          (Number(beneficiary.blackWomenOwnershipPercentage) >= 30 ? 1 : 0),
      }),
      {
        totalBeneficiaries: 0,
        totalContributionAmount: 0,
        supplierDevelopmentBeneficiaries: 0,
        blackOwnedBeneficiaries: 0,
        blackWomenOwnedBeneficiaries: 0,
      }
    );
    setSummary(summary);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log("Submitting enterprise development data:", { userId, beneficiaries, summary });
    if (!userId) {
      console.warn("handleSubmit: userId is missing");
      alert("User ID is missing. Please log in again.");
      return;
    }

    if (beneficiaries.length === 0) {
      alert("Please add at least one beneficiary before submitting.");
      return;
    }

    setIsLoading(true);
    try {
      let method = "POST";
      let url = "http://localhost:5000/enterprise-development";
      let existingId = null;

      try {
        const checkResponse = await fetch(`http://localhost:5000/enterprise-development/${userId}`);
        if (!checkResponse.ok) {
          const errorData = await checkResponse.json();
          if (errorData.error === "User not found") {
            alert("Your account is not set up. Please log in again.");
            onLogout();
            return;
          }
          throw new Error(errorData.error || `HTTP error! Status: ${checkResponse.status}`);
        }
        const { data } = await checkResponse.json();
        if (data.length > 0) {
          method = "PUT";
          existingId = data[0].id;
          url = `http://localhost:5000/enterprise-development/${existingId}`;
        }
      } catch (checkError) {
        if (checkError.message.includes("No enterprise development data found")) {
          console.warn("No existing enterprise development data found for userId:", userId);
        } else {
          throw checkError;
        }
      }

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId, beneficiaries, summary }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error! Status: ${response.status}`);
      }

      const data = await response.json();
      console.log("Enterprise development data saved:", data);
      setDocumentId(data.id);
      onSubmit({ beneficiaries, summary });
      onClose();
    } catch (error) {
      console.error("Error saving enterprise development data:", error);
      alert(`Failed to save enterprise development data: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const deleteEnterpriseDevelopment = async () => {
    if (!userId) {
      console.warn("deleteEnterpriseDevelopment: userId is missing");
      return;
    }
    if (window.confirm("Are you sure you want to delete all enterprise development data for this user?")) {
      setIsLoading(true);
      try {
        const response = await fetch(`http://localhost:5000/enterprise-development/${userId}`, {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || `HTTP error! Status: ${response.status}`);
        }

        console.log("Enterprise development data deleted:", await response.json());
        setBeneficiaries([]);
        setSummary({
          totalBeneficiaries: 0,
          totalContributionAmount: 0,
          supplierDevelopmentBeneficiaries: 0,
          blackOwnedBeneficiaries: 0,
          blackWomenOwnedBeneficiaries: 0,
        });
        setDocumentId(null);
      } catch (error) {
        console.error("Error deleting enterprise development data:", error);
        alert(`Failed to delete: ${error.message}`);
        try {
          const response = await fetch(`http://localhost:5000/enterprise-development/${userId}`);
          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || `HTTP error! Status: ${response.status}`);
          }
          const { data } = await response.json();
          if (data.length > 0) {
            setBeneficiaries(data[0].beneficiaries || []);
            setSummary(data[0].summary || {
              totalBeneficiaries: 0,
              totalContributionAmount: 0,
              supplierDevelopmentBeneficiaries: 0,
              blackOwnedBeneficiaries: 0,
              blackWomenOwnedBeneficiaries: 0,
            });
            setDocumentId(data[0].id);
          } else {
            setBeneficiaries([]);
            setSummary({
              totalBeneficiaries: 0,
              totalContributionAmount: 0,
              supplierDevelopmentBeneficiaries: 0,
              blackOwnedBeneficiaries: 0,
              blackWomenOwnedBeneficiaries: 0,
            });
            setDocumentId(null);
          }
        } catch (fetchError) {
          console.error("Error re-fetching data:", fetchError);
          alert("Failed to restore data. Please refresh the page.");
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
        <h2 className="text-xl font-semibold mb-4">Enterprise Development Details</h2>

        <form onSubmit={handleSubmit}>
          {/* CSV Upload Section */}
          <div className="mb-6">
            <h3 className="text-lg font-medium mb-2">Upload Beneficiaries CSV</h3>
            <input
              type="file"
              accept=".csv"
              onChange={handleCSVUpload}
              className="w-full p-2 border rounded"
              disabled={isLoading}
            />
            <p className="text-sm text-gray-600 mt-2">
              CSV file must contain headers: beneficiaryName, siteLocation, isSupplierDevelopmentBeneficiary,
              blackOwnershipPercentage, blackWomenOwnershipPercentage, beeStatusLevel, contributionType,
              contributionDescription, dateOfContribution, paymentDate, contributionAmount
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
                  disabled={isLoading}
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
                  disabled={isLoading}
                />
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  name="isSupplierDevelopmentBeneficiary"
                  checked={newBeneficiary.isSupplierDevelopmentBeneficiary}
                  onChange={handleBeneficiaryChange}
                  className="mr-2"
                  disabled={isLoading}
                />
                <label className="text-sm font-medium">Supplier Development Beneficiary</label>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Black Ownership (%)</label>
                <input
                  type="number"
                  name="blackOwnershipPercentage"
                  value={newBeneficiary.blackOwnershipPercentage}
                  onChange={handleBeneficiaryChange}
                  className="w-full p-2 border rounded"
                  placeholder="Enter percentage"
                  min="0"
                  max="100"
                  disabled={isLoading}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Black Women Ownership (%)</label>
                <input
                  type="number"
                  name="blackWomenOwnershipPercentage"
                  value={newBeneficiary.blackWomenOwnershipPercentage}
                  onChange={handleBeneficiaryChange}
                  className="w-full p-2 border rounded"
                  placeholder="Enter percentage"
                  min="0"
                  max="100"
                  disabled={isLoading}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">BEE Status Level</label>
                <select
                  name="beeStatusLevel"
                  value={newBeneficiary.beeStatusLevel}
                  onChange={handleBeneficiaryChange}
                  className="w-full p-2 border rounded"
                  disabled={isLoading}
                >
                  <option value="">Select BEE Level</option>
                  {[...Array(8).keys()].map((level) => (
                    <option key={level + 1} value={level + 1}>
                      Level {level + 1}
                    </option>
                  ))}
                  <option value="Non-compliant">Non-compliant</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Contribution Type</label>
                <select
                  name="contributionType"
                  value={newBeneficiary.contributionType}
                  onChange={handleBeneficiaryChange}
                  className="w-full p-2 border rounded"
                  disabled={isLoading}
                >
                  <option value="">Select Contribution Type</option>
                  <option value="Grant">Grant</option>
                  <option value="Direct Cost">Direct Cost</option>
                  <option value="Discounts">Discounts</option>
                  <option value="Overhead Costs">Overhead Costs</option>
                  <option value="Interest-Free Loan">Interest-Free Loan</option>
                  <option value="Loan to Black owned EME/QSE">Loan to Black owned EME/QSE</option>
                  <option value="Standard Loan">Standard Loan</option>
                  <option value="Guarantees provided on behalf of Beneficiary">
                    Guarantees provided on behalf of Beneficiary
                  </option>
                  <option value="Lower Interest Rate">Lower Interest Rate</option>
                  <option value="Minor Investment in Black EME/QSE">
                    Minor Investment in Black EME/QSE
                  </option>
                  <option value="Major Investment in other Enterprises">
                    Major Investment in other Enterprises
                  </option>
                  <option value="Investment with lower dividend to financier">
                    Investment with lower dividend to financier
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
                  disabled={isLoading}
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
                  disabled={isLoading}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Payment Date (shorter payment terms)</label>
                <input
                  type="date"
                  name="paymentDate"
                  value={newBeneficiary.paymentDate}
                  onChange={handleBeneficiaryChange}
                  className="w-full p-2 border rounded"
                  disabled={isLoading}
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
                  min="0"
                  disabled={isLoading}
                />
              </div>
            </div>
            <button
              type="button"
              onClick={editingBeneficiaryIndex !== null ? saveEditedBeneficiary : addBeneficiary}
              className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:bg-blue-300"
              disabled={isLoading}
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
                      <th className="border border-gray-300 px-4 py-2">Supplier Development Beneficiary</th>
                      <th className="border border-gray-300 px-4 py-2">Black Ownership (%)</th>
                      <th className="border border-gray-300 px-4 py-2">Black Women Ownership (%)</th>
                      <th className="border border-gray-300 px-4 py-2">BEE Status Level</th>
                      <th className="border border-gray-300 px-4 py-2">Contribution Type</th>
                      <th className="border border-gray-300 px-4 py-2">Description of Contribution</th>
                      <th className="border border-gray-300 px-4 py-2">Date of Contribution</th>
                      <th className="border border-gray-300 px-4 py-2">Payment Date</th>
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
                          {beneficiary.isSupplierDevelopmentBeneficiary ? "Yes" : "No"}
                        </td>
                        <td className="border border-gray-300 px-4 py-2">
                          {beneficiary.blackOwnershipPercentage}%
                        </td>
                        <td className="border border-gray-300 px-4 py-2">
                          {beneficiary.blackWomenOwnershipPercentage}%
                        </td>
                        <td className="border border-gray-300 px-4 py-2">{beneficiary.beeStatusLevel || "N/A"}</td>
                        <td className="border border-gray-300 px-4 py-2">{beneficiary.contributionType}</td>
                        <td className="border border-gray-300 px-4 py-2">
                          {beneficiary.contributionDescription || "N/A"}
                        </td>
                        <td className="border border-gray-300 px-4 py-2">
                          {beneficiary.dateOfContribution || "N/A"}
                        </td>
                        <td className="border border-gray-300 px-4 py-2">{beneficiary.paymentDate || "N/A"}</td>
                        <td className="border border-gray-300 px-4 py-2">{beneficiary.contributionAmount}</td>
                        <td className="border border-gray-300 px-4 py-2">
                          <button
                            type="button"
                            onClick={() => editBeneficiary(index)}
                            className="bg-yellow-500 text-white px-2 py-1 rounded mr-2 hover:bg-yellow-600 disabled:bg-yellow-300"
                            disabled={isLoading}
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => deleteBeneficiary(index)}
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

          {/* Summary Section */}
          <div className="mb-6">
            <h3 className="text-lg font-medium mb-2">Enterprise Development Summary</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Total Beneficiaries</label>
                <input
                  type="number"
                  value={summary.totalBeneficiaries}
                  className="w-full p-2 border rounded bg-gray-100"
                  disabled
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Total Contribution Amount (R)</label>
                <input
                  type="number"
                  value={summary.totalContributionAmount}
                  className="w-full p-2 border rounded bg-gray-100"
                  disabled
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Supplier Development Beneficiaries</label>
                <input
                  type="number"
                  value={summary.supplierDevelopmentBeneficiaries}
                  className="w-full p-2 border rounded bg-gray-100"
                  disabled
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">30%+ Black Owned Beneficiaries</label>
                <input
                  type="number"
                  value={summary.blackOwnedBeneficiaries}
                  className="w-full p-2 border rounded bg-gray-100"
                  disabled
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">30%+ Black Women Owned Beneficiaries</label>
                <input
                  type="number"
                  value={summary.blackWomenOwnedBeneficiaries}
                  className="w-full p-2 border rounded bg-gray-100"
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
            {beneficiaries.length > 0 && (
              <button
                type="button"
                onClick={deleteEnterpriseDevelopment}
                className="bg-red-600 text-white px-3 py-2 sm:px-4 sm:py-2 rounded-md hover:bg-red-700 w-full sm:w-auto transition-all duration-200 disabled:bg-red-300"
                disabled={isLoading}
              >
                Delete Enterprise Development Details
              </button>
            )}
            <button
              type="submit"
              className="bg-blue-600 text-white px-3 py-2 sm:px-4 sm:py-2 rounded-md hover:bg-blue-700 w-full sm:w-auto transition-all duration-200 disabled:bg-blue-300"
              disabled={isLoading}
            >
              Save Enterprise Development Details
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

EnterpriseDevelopment.propTypes = {
  userId: PropTypes.string.isRequired,
  onClose: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
  onLogout: PropTypes.func.isRequired,
};

export default EnterpriseDevelopment;