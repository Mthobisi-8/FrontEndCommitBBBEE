import React, { useState, useEffect } from 'react';
import axios from 'axios';
import PropTypes from 'prop-types';

const SupplierDevelopment = ({ userId, onClose, onSubmit, onLogout }) => {
  console.log('SupplierDevelopment rendered with userId:', userId);

  const [localSuppliers, setLocalSuppliers] = useState([]);
  const [newLocalSupplier, setNewLocalSupplier] = useState({
    supplierName: '',
    siteLocation: '',
    regNo: '',
    vatNo: '',
    expenditure: 0,
    supplierClassification: '',
    beeLevel: '',
    is30PercentBlackOwned: false,
    is51PercentBlackOwned: false,
    is30PercentBlackWomanOwned: false,
    blackOwnedPercentage: 0,
    blackWomanOwnedPercentage: 0,
    isESDRecipient: false,
    beeCertificateExpiryDate: '',
  });
  const [editingSupplierIndex, setEditingSupplierIndex] = useState(null);
  const [localSummary, setLocalSummary] = useState({
    totalSuppliers: 0,
    totalExpenditure: 0,
    blackOwnedSuppliers: 0,
    blackWomanOwnedSuppliers: 0,
    esdRecipients: 0,
  });

  const [imports, setImports] = useState([]);
  const [newImport, setNewImport] = useState({
    foreignSupplierName: '',
    siteLocation: '',
    goodsServices: '',
    expenditure: 0,
    reasonForImport: '',
    esdPlan: '',
  });
  const [editingImportIndex, setEditingImportIndex] = useState(null);
  const [importSummary, setImportSummary] = useState({
    totalImports: 0,
    totalExpenditure: 0,
  });

  const [isLoading, setIsLoading] = useState(false);
  const [documentId, setDocumentId] = useState(null);

  useEffect(() => {
    console.log('SupplierDevelopment mounted with userId:', userId);
    if (!userId) {
      console.warn('SupplierDevelopment: userId prop is missing or undefined');
      return;
    }

    const fetchSupplierData = async () => {
      setIsLoading(true);
      try {
        console.log('Fetching supplier development data for userId:', userId);
        const response = await axios.get(`http://localhost:5000/supplier-development/${userId}`);
        const records = response.data.data;
        if (records.length > 0) {
          setLocalSuppliers(records[0].localSuppliers || []);
          setImports(records[0].imports || []);
          setLocalSummary(records[0].localSummary || {
            totalSuppliers: 0,
            totalExpenditure: 0,
            blackOwnedSuppliers: 0,
            blackWomanOwnedSuppliers: 0,
            esdRecipients: 0,
          });
          setImportSummary(records[0].importSummary || {
            totalImports: 0,
            totalExpenditure: 0,
          });
          setDocumentId(records[0].id);
          console.log('Set documentId:', records[0].id);
        } else {
          console.log('No supplier development data found for userId:', userId);
          setLocalSuppliers([]);
          setImports([]);
          setLocalSummary({
            totalSuppliers: 0,
            totalExpenditure: 0,
            blackOwnedSuppliers: 0,
            blackWomanOwnedSuppliers: 0,
            esdRecipients: 0,
          });
          setImportSummary({
            totalImports: 0,
            totalExpenditure: 0,
          });
          setDocumentId(null);
        }
      } catch (error) {
        console.warn('Error fetching supplier development data:', error.response?.data?.error || error.message);
        if (error.response?.status === 404) {
          if (error.response.data.error === 'User not found') {
            alert('Your account is not set up. Please log in again.');
            onLogout();
            return;
          }
          setLocalSuppliers([]);
          setImports([]);
          setLocalSummary({
            totalSuppliers: 0,
            totalExpenditure: 0,
            blackOwnedSuppliers: 0,
            blackWomanOwnedSuppliers: 0,
            esdRecipients: 0,
          });
          setImportSummary({
            totalImports: 0,
            totalExpenditure: 0,
          });
          setDocumentId(null);
        } else {
          alert(`Failed to fetch supplier development data: ${error.response?.data?.error || error.message}`);
          setLocalSuppliers([]);
          setImports([]);
          setLocalSummary({
            totalSuppliers: 0,
            totalExpenditure: 0,
            blackOwnedSuppliers: 0,
            blackWomanOwnedSuppliers: 0,
            esdRecipients: 0,
          });
          setImportSummary({
            totalImports: 0,
            totalExpenditure: 0,
          });
          setDocumentId(null);
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchSupplierData();
  }, [userId, onLogout]);

  const handleLocalSupplierChange = (e) => {
    const { name, value, type, checked } = e.target;
    setNewLocalSupplier({
      ...newLocalSupplier,
      [name]: type === 'checkbox' ? checked : 
              type === 'number' ? (value === '' ? 0 : Number(value)) : 
              value,
    });
  };

  const handleLocalSupplierCSVUpload = (e) => {
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
        const parsedData = parseLocalSupplierCSV(text);
        const validatedData = validateLocalSupplierCSVData(parsedData);
        const updatedSuppliers = [...localSuppliers, ...validatedData];
        setLocalSuppliers(updatedSuppliers);
        recalculateLocalSummary(updatedSuppliers);
      } catch (error) {
        alert(`Error processing local supplier CSV file: ${error.message}`);
      }
    };
    reader.onerror = () => {
      alert('Error reading the local supplier CSV file');
    };
    reader.readAsText(file);
  };

  const parseLocalSupplierCSV = (text) => {
    const lines = text.split('\n').filter(line => line.trim() !== '');
    if (lines.length === 0) throw new Error('Empty CSV file');

    const headers = lines[0].split(',').map(header => header.trim().toLowerCase());
    const requiredHeaders = [
      'suppliername',
      'sitelocation',
      'regno',
      'vatno',
      'expenditure',
      'supplierclassification',
      'beelevel',
      'is30percentblackowned',
      'is51percentblackowned',
      'is30percentblackwomanowned',
      'blackownedpercentage',
      'blackwomanownedpercentage',
      'isesdrecipient',
      'beecertificateexpirydate'
    ];

    if (!requiredHeaders.every(header => headers.includes(header))) {
      throw new Error('Local supplier CSV file must contain all required headers: ' + requiredHeaders.join(', '));
    }

    return lines.slice(1).map(line => {
      const values = line.split(',').map(val => val.trim());
      const obj = {};
      headers.forEach((header, index) => {
        obj[header] = values[index] || '';
      });
      return {
        supplierName: obj.suppliername,
        siteLocation: obj.sitelocation,
        regNo: obj.regno,
        vatNo: obj.vatno,
        expenditure: Number(obj.expenditure) || 0,
        supplierClassification: obj.supplierclassification,
        beeLevel: obj.beelevel,
        is30PercentBlackOwned: obj.is30percentblackowned.toLowerCase() === 'true',
        is51PercentBlackOwned: obj.is51percentblackowned.toLowerCase() === 'true',
        is30PercentBlackWomanOwned: obj.is30percentblackwomanowned.toLowerCase() === 'true',
        blackOwnedPercentage: Number(obj.blackownedpercentage) || 0,
        blackWomanOwnedPercentage: Number(obj.blackwomanownedpercentage) || 0,
        isESDRecipient: obj.isesdrecipient.toLowerCase() === 'true',
        beeCertificateExpiryDate: obj.beecertificateexpirydate,
      };
    });
  };

  const validateLocalSupplierCSVData = (data) => {
    return data.filter(item => {
      if (!item.supplierName.trim() || item.expenditure <= 0 || !item.supplierClassification.trim()) {
        console.warn('Skipping invalid local supplier CSV row:', item);
        return false;
      }
      if (item.blackOwnedPercentage < 0 || item.blackOwnedPercentage > 100 || 
          item.blackWomanOwnedPercentage < 0 || item.blackWomanOwnedPercentage > 100) {
        console.warn('Invalid percentage value in local supplier CSV row:', item);
        return false;
      }
      return true;
    });
  };

  const handleImportCSVUpload = (e) => {
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
        const parsedData = parseImportCSV(text);
        const validatedData = validateImportCSVData(parsedData);
        const updatedImports = [...imports, ...validatedData];
        setImports(updatedImports);
        recalculateImportSummary(updatedImports);
      } catch (error) {
        alert(`Error processing import CSV file: ${error.message}`);
      }
    };
    reader.onerror = () => {
      alert('Error reading the import CSV file');
    };
    reader.readAsText(file);
  };

  const parseImportCSV = (text) => {
    const lines = text.split('\n').filter(line => line.trim() !== '');
    if (lines.length === 0) throw new Error('Empty CSV file');

    const headers = lines[0].split(',').map(header => header.trim().toLowerCase());
    const requiredHeaders = [
      'foreignsuppliername',
      'sitelocation',
      'goodsservices',
      'expenditure',
      'reasonforimport',
      'esdplan'
    ];

    if (!requiredHeaders.every(header => headers.includes(header))) {
      throw new Error('Import CSV file must contain all required headers: ' + requiredHeaders.join(', '));
    }

    return lines.slice(1).map(line => {
      const values = line.split(',').map(val => val.trim());
      const obj = {};
      headers.forEach((header, index) => {
        obj[header] = values[index] || '';
      });
      return {
        foreignSupplierName: obj.foreignsuppliername,
        siteLocation: obj.sitelocation,
        goodsServices: obj.goodsservices,
        expenditure: Number(obj.expenditure) || 0,
        reasonForImport: obj.reasonforimport,
        esdPlan: obj.esdplan,
      };
    });
  };

  const validateImportCSVData = (data) => {
    return data.filter(item => {
      if (!item.foreignSupplierName.trim() || item.expenditure <= 0 || !item.goodsServices.trim()) {
        console.warn('Skipping invalid import CSV row:', item);
        return false;
      }
      return true;
    });
  };

  const addLocalSupplier = () => {
    if (!userId) {
      console.warn('addLocalSupplier: userId is missing');
      return;
    }
    if (!newLocalSupplier.supplierName.trim() || 
        newLocalSupplier.expenditure <= 0 || 
        !newLocalSupplier.supplierClassification.trim()) {
      alert('Please fill in the Supplier Name, Expenditure (greater than 0), and Supplier Classification.');
      return;
    }
    const updatedSuppliers = [...localSuppliers, newLocalSupplier];
    setLocalSuppliers(updatedSuppliers);
    resetNewLocalSupplier();
    recalculateLocalSummary(updatedSuppliers);
  };

  const editLocalSupplier = (index) => {
    setEditingSupplierIndex(index);
    setNewLocalSupplier(localSuppliers[index]);
  };

  const saveEditedLocalSupplier = () => {
    if (!userId) {
      console.warn('saveEditedLocalSupplier: userId is missing');
      return;
    }
    if (!newLocalSupplier.supplierName.trim() || 
        newLocalSupplier.expenditure <= 0 || 
        !newLocalSupplier.supplierClassification.trim()) {
      alert('Please fill in the Supplier Name, Expenditure (greater than 0), and Supplier Classification.');
      return;
    }
    const updatedSuppliers = localSuppliers.map((supplier, index) =>
      index === editingSupplierIndex ? newLocalSupplier : supplier
    );
    setLocalSuppliers(updatedSuppliers);
    resetNewLocalSupplier();
    setEditingSupplierIndex(null);
    recalculateLocalSummary(updatedSuppliers);
  };

  const deleteLocalSupplier = async (index) => {
    if (!userId) {
      console.warn('deleteLocalSupplier: userId is missing');
      return;
    }
    if (window.confirm('Are you sure you want to delete this local supplier?')) {
      setIsLoading(true);
      try {
        const updatedSuppliers = localSuppliers.filter((_, i) => i !== index);
        setLocalSuppliers(updatedSuppliers);
        recalculateLocalSummary(updatedSuppliers);

        let currentDocumentId = documentId;
        if (!currentDocumentId) {
          const checkResponse = await axios.get(`http://localhost:5000/supplier-development/${userId}`);
          if (checkResponse.data.data.length === 0) {
            throw new Error('No supplier development data found for this user');
          }
          currentDocumentId = checkResponse.data.data[0].id;
          setDocumentId(currentDocumentId);
        }

        const response = await axios.put(`http://localhost:5000/supplier-development/${currentDocumentId}`, {
          userId,
          localSuppliers: updatedSuppliers,
          localSummary,
          imports,
          importSummary,
        });

        console.log('Local supplier deleted successfully:', response.data);
      } catch (error) {
        console.error('Error deleting local supplier:', error);
        alert(`Failed to delete local supplier: ${error.response?.data?.error || error.message}`);
        try {
          const response = await axios.get(`http://localhost:5000/supplier-development/${userId}`);
          if (response.data.data.length > 0) {
            setLocalSuppliers(response.data.data[0].localSuppliers || []);
            setImports(response.data.data[0].imports || []);
            setLocalSummary(response.data.data[0].localSummary || {
              totalSuppliers: 0,
              totalExpenditure: 0,
              blackOwnedSuppliers: 0,
              blackWomanOwnedSuppliers: 0,
              esdRecipients: 0,
            });
            setImportSummary(response.data.data[0].importSummary || {
              totalImports: 0,
              totalExpenditure: 0,
            });
            setDocumentId(response.data.data[0].id);
          } else {
            setLocalSuppliers([]);
            setImports([]);
            setLocalSummary({
              totalSuppliers: 0,
              totalExpenditure: 0,
              blackOwnedSuppliers: 0,
              blackWomanOwnedSuppliers: 0,
              esdRecipients: 0,
            });
            setImportSummary({
              totalImports: 0,
              totalExpenditure: 0,
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

  const resetNewLocalSupplier = () => {
    setNewLocalSupplier({
      supplierName: '',
      siteLocation: '',
      regNo: '',
      vatNo: '',
      expenditure: 0,
      supplierClassification: '',
      beeLevel: '',
      is30PercentBlackOwned: false,
      is51PercentBlackOwned: false,
      is30PercentBlackWomanOwned: false,
      blackOwnedPercentage: 0,
      blackWomanOwnedPercentage: 0,
      isESDRecipient: false,
      beeCertificateExpiryDate: '',
    });
  };

  const recalculateLocalSummary = (updatedSuppliers) => {
    const summary = updatedSuppliers.reduce((acc, supplier) => ({
      totalSuppliers: acc.totalSuppliers + 1,
      totalExpenditure: acc.totalExpenditure + Number(supplier.expenditure || 0),
      blackOwnedSuppliers: acc.blackOwnedSuppliers + (supplier.is30PercentBlackOwned ? 1 : 0),
      blackWomanOwnedSuppliers: acc.blackWomanOwnedSuppliers + (supplier.is30PercentBlackWomanOwned ? 1 : 0),
      esdRecipients: acc.esdRecipients + (supplier.isESDRecipient ? 1 : 0),
    }), {
      totalSuppliers: 0,
      totalExpenditure: 0,
      blackOwnedSuppliers: 0,
      blackWomanOwnedSuppliers: 0,
      esdRecipients: 0,
    });
    setLocalSummary(summary);
  };

  const handleImportChange = (e) => {
    const { name, value, type } = e.target;
    setNewImport({
      ...newImport,
      [name]: type === 'number' ? (value === '' ? 0 : Number(value)) : value,
    });
  };

  const addImport = () => {
    if (!userId) {
      console.warn('addImport: userId is missing');
      return;
    }
    if (!newImport.foreignSupplierName.trim() || 
        newImport.expenditure <= 0 || 
        !newImport.goodsServices.trim()) {
      alert('Please fill in the Foreign Supplier Name, Expenditure (greater than 0), and Goods/Services.');
      return;
    }
    const updatedImports = [...imports, newImport];
    setImports(updatedImports);
    resetNewImport();
    recalculateImportSummary(updatedImports);
  };

  const editImport = (index) => {
    setEditingImportIndex(index);
    setNewImport(imports[index]);
  };

  const saveEditedImport = () => {
    if (!userId) {
      console.warn('saveEditedImport: userId is missing');
      return;
    }
    if (!newImport.foreignSupplierName.trim() || 
        newImport.expenditure <= 0 || 
        !newImport.goodsServices.trim()) {
      alert('Please fill in the Foreign Supplier Name, Expenditure (greater than 0), and Goods/Services.');
      return;
    }
    const updatedImports = imports.map((imp, index) =>
      index === editingImportIndex ? newImport : imp
    );
    setImports(updatedImports);
    resetNewImport();
    setEditingImportIndex(null);
    recalculateImportSummary(updatedImports);
  };

  const deleteImport = async (index) => {
    if (!userId) {
      console.warn('deleteImport: userId is missing');
      return;
    }
    if (window.confirm('Are you sure you want to delete this import?')) {
      setIsLoading(true);
      try {
        const updatedImports = imports.filter((_, i) => i !== index);
        setImports(updatedImports);
        recalculateImportSummary(updatedImports);

        let currentDocumentId = documentId;
        if (!currentDocumentId) {
          const checkResponse = await axios.get(`http://localhost:5000/supplier-development/${userId}`);
          if (checkResponse.data.data.length === 0) {
            throw new Error('No supplier development data found for this user');
          }
          currentDocumentId = checkResponse.data.data[0].id;
          setDocumentId(currentDocumentId);
        }

        const response = await axios.put(`http://localhost:5000/supplier-development/${currentDocumentId}`, {
          userId,
          localSuppliers,
          localSummary,
          imports: updatedImports,
          importSummary,
        });

        console.log('Import deleted successfully:', response.data);
      } catch (error) {
        console.error('Error deleting import:', error);
        alert(`Failed to delete import: ${error.response?.data?.error || error.message}`);
        try {
          const response = await axios.get(`http://localhost:5000/supplier-development/${userId}`);
          if (response.data.data.length > 0) {
            setLocalSuppliers(response.data.data[0].localSuppliers || []);
            setImports(response.data.data[0].imports || []);
            setLocalSummary(response.data.data[0].localSummary || {
              totalSuppliers: 0,
              totalExpenditure: 0,
              blackOwnedSuppliers: 0,
              blackWomanOwnedSuppliers: 0,
              esdRecipients: 0,
            });
            setImportSummary(response.data.data[0].importSummary || {
              totalImports: 0,
              totalExpenditure: 0,
            });
            setDocumentId(response.data.data[0].id);
          } else {
            setLocalSuppliers([]);
            setImports([]);
            setLocalSummary({
              totalSuppliers: 0,
              totalExpenditure: 0,
              blackOwnedSuppliers: 0,
              blackWomanOwnedSuppliers: 0,
              esdRecipients: 0,
            });
            setImportSummary({
              totalImports: 0,
              totalExpenditure: 0,
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

  const resetNewImport = () => {
    setNewImport({
      foreignSupplierName: '',
      siteLocation: '',
      goodsServices: '',
      expenditure: 0,
      reasonForImport: '',
      esdPlan: '',
    });
  };

  const recalculateImportSummary = (updatedImports) => {
    const summary = updatedImports.reduce((acc, imp) => ({
      totalImports: acc.totalImports + 1,
      totalExpenditure: acc.totalExpenditure + Number(imp.expenditure || 0),
    }), {
      totalImports: 0,
      totalExpenditure: 0,
    });
    setImportSummary(summary);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log('Submitting supplier development data:', { userId, localSuppliers, localSummary, imports, importSummary });
    if (!userId) {
      console.warn('handleSubmit: userId is missing');
      alert('User ID is missing. Please log in again.');
      return;
    }

    if (localSuppliers.length === 0 && imports.length === 0) {
      alert('Please add at least one local supplier or import before submitting.');
      return;
    }

    setIsLoading(true);
    try {
      let method = 'post';
      let url = 'http://localhost:5000/supplier-development';
      let existingId = null;

      try {
        const checkResponse = await axios.get(`http://localhost:5000/supplier-development/${userId}`);
        if (checkResponse.data.data.length > 0) {
          method = 'put';
          existingId = checkResponse.data.data[0].id;
          url = `http://localhost:5000/supplier-development/${existingId}`;
        }
      } catch (checkError) {
        if (checkError.response?.status === 404) {
          if (checkError.response.data.error === 'User not found') {
            alert('Your account is not set up. Please log in again.');
            onLogout();
            return;
          }
          console.warn('No existing supplier development data found for userId:', userId);
        } else {
          throw checkError;
        }
      }

      const response = await axios[method](url, { userId, localSuppliers, localSummary, imports, importSummary });
      console.log('Supplier development data saved:', response.data);
      setDocumentId(response.data.id);
      onSubmit({ localSuppliers, localSummary, imports, importSummary });
      onClose();
    } catch (error) {
      console.error('Error saving supplier development data:', error);
      alert(`Failed to save supplier development data: ${error.response?.data?.error || error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const deleteSupplierDevelopment = async () => {
    if (!userId) {
      console.warn('deleteSupplierDevelopment: userId is missing');
      return;
    }
    if (window.confirm('Are you sure you want to delete all supplier development data for this user?')) {
      setIsLoading(true);
      try {
        const response = await axios.delete(`http://localhost:5000/supplier-development/${userId}`);
        console.log('Supplier development data deleted:', response.data);
        setLocalSuppliers([]);
        setImports([]);
        setLocalSummary({
          totalSuppliers: 0,
          totalExpenditure: 0,
          blackOwnedSuppliers: 0,
          blackWomanOwnedSuppliers: 0,
          esdRecipients: 0,
        });
        setImportSummary({
          totalImports: 0,
          totalExpenditure: 0,
        });
        setDocumentId(null);
      } catch (error) {
        console.error('Error deleting supplier development data:', error);
        alert(`Failed to delete: ${error.response?.data?.error || error.message}`);
        try {
          const response = await axios.get(`http://localhost:5000/supplier-development/${userId}`);
          if (response.data.data.length > 0) {
            setLocalSuppliers(response.data.data[0].localSuppliers || []);
            setImports(response.data.data[0].imports || []);
            setLocalSummary(response.data.data[0].localSummary || {
              totalSuppliers: 0,
              totalExpenditure: 0,
              blackOwnedSuppliers: 0,
              blackWomanOwnedSuppliers: 0,
              esdRecipients: 0,
            });
            setImportSummary(response.data.data[0].importSummary || {
              totalImports: 0,
              totalExpenditure: 0,
            });
            setDocumentId(response.data.data[0].id);
          } else {
            setLocalSuppliers([]);
            setImports([]);
            setLocalSummary({
              totalSuppliers: 0,
              totalExpenditure: 0,
              blackOwnedSuppliers: 0,
              blackWomanOwnedSuppliers: 0,
              esdRecipients: 0,
            });
            setImportSummary({
              totalImports: 0,
              totalExpenditure: 0,
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
        <h2 className="text-xl font-semibold mb-4">Supplier Development & Imports</h2>

        <form onSubmit={handleSubmit}>
          {/* Local Suppliers CSV Upload */}
          <div className="mb-8">
            <h3 className="text-lg font-medium mb-2">Upload Local Suppliers CSV</h3>
            <input
              type="file"
              accept=".csv"
              onChange={handleLocalSupplierCSVUpload}
              className="w-full p-2 border rounded"
              disabled={isLoading}
            />
            <p className="text-sm text-gray-600 mt-2">
              CSV file must contain headers: supplierName, siteLocation, regNo, vatNo, expenditure,
              supplierClassification, beeLevel, is30PercentBlackOwned, is51PercentBlackOwned,
              is30PercentBlackWomanOwned, blackOwnedPercentage, blackWomanOwnedPercentage,
              isESDRecipient, beeCertificateExpiryDate
            </p>
          </div>

          {/* Local Suppliers Form */}
          <div className="mb-8">
            <h3 className="text-lg font-medium mb-2">Add Local Supplier</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Supplier Name</label>
                <input
                  type="text"
                  name="supplierName"
                  value={newLocalSupplier.supplierName}
                  onChange={handleLocalSupplierChange}
                  className="w-full p-2 border rounded"
                  placeholder="Enter supplier name"
                  disabled={isLoading}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Site/Location (if applicable)</label>
                <input
                  type="text"
                  name="siteLocation"
                  value={newLocalSupplier.siteLocation}
                  onChange={handleLocalSupplierChange}
                  className="w-full p-2 border rounded"
                  placeholder="Enter site/location"
                  disabled={isLoading}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Reg No</label>
                <input
                  type="text"
                  name="regNo"
                  value={newLocalSupplier.regNo}
                  onChange={handleLocalSupplierChange}
                  className="w-full p-2 border rounded"
                  placeholder="Enter registration number"
                  disabled={isLoading}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">VAT No (if applicable)</label>
                <input
                  type="text"
                  name="vatNo"
                  value={newLocalSupplier.vatNo}
                  onChange={handleLocalSupplierChange}
                  className="w-full p-2 border rounded"
                  placeholder="Enter VAT number"
                  disabled={isLoading}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Expenditure (Incl. VAT)</label>
                <input
                  type="number"
                  name="expenditure"
                  value={newLocalSupplier.expenditure}
                  onChange={handleLocalSupplierChange}
                  className="w-full p-2 border rounded"
                  placeholder="Enter expenditure"
                  min="0"
                  disabled={isLoading}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Supplier Classification</label>
                <select
                  name="supplierClassification"
                  value={newLocalSupplier.supplierClassification}
                  onChange={handleLocalSupplierChange}
                  className="w-full p-2 border rounded"
                  disabled={isLoading}
                >
                  <option value="">Select Classification</option>
                  <option value="QSE">QSE</option>
                  <option value="EME">EME</option>
                  <option value="Generic">Generic</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">BEE Level</label>
                <select
                  name="beeLevel"
                  value={newLocalSupplier.beeLevel}
                  onChange={handleLocalSupplierChange}
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
              <div className="flex items-center">
                <input
                  type="checkbox"
                  name="is30PercentBlackOwned"
                  checked={newLocalSupplier.is30PercentBlackOwned}
                  onChange={handleLocalSupplierChange}
                  className="mr-2"
                  disabled={isLoading}
                />
                <label className="text-sm font-medium">30% or more Black Owned</label>
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  name="is51PercentBlackOwned"
                  checked={newLocalSupplier.is51PercentBlackOwned}
                  onChange={handleLocalSupplierChange}
                  className="mr-2"
                  disabled={isLoading}
                />
                <label className="text-sm font-medium">51% or more Black Owned (Flow-through)</label>
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  name="is30PercentBlackWomanOwned"
                  checked={newLocalSupplier.is30PercentBlackWomanOwned}
                  onChange={handleLocalSupplierChange}
                  className="mr-2"
                  disabled={isLoading}
                />
                <label className="text-sm font-medium">30% or more Black Woman Owned</label>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Black Owned (%)</label>
                <input
                  type="number"
                  name="blackOwnedPercentage"
                  value={newLocalSupplier.blackOwnedPercentage}
                  onChange={handleLocalSupplierChange}
                  className="w-full p-2 border rounded"
                  placeholder="Enter percentage"
                  min="0"
                  max="100"
                  disabled={isLoading}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Black Woman Owned (%)</label>
                <input
                  type="number"
                  name="blackWomanOwnedPercentage"
                  value={newLocalSupplier.blackWomanOwnedPercentage}
                  onChange={handleLocalSupplierChange}
                  className="w-full p-2 border rounded"
                  placeholder="Enter percentage"
                  min="0"
                  max="100"
                  disabled={isLoading}
                />
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  name="isESDRecipient"
                  checked={newLocalSupplier.isESDRecipient}
                  onChange={handleLocalSupplierChange}
                  className="mr-2"
                  disabled={isLoading}
                />
                <label className="text-sm font-medium">ESD Recipient & Designated Group Supplier (QSE/EME)</label>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">BEE Certificate Expiry Date</label>
                <input
                  type="date"
                  name="beeCertificateExpiryDate"
                  value={newLocalSupplier.beeCertificateExpiryDate}
                  onChange={handleLocalSupplierChange}
                  className="w-full p-2 border rounded"
                  disabled={isLoading}
                />
              </div>
            </div>
            <button
              type="button"
              onClick={editingSupplierIndex !== null ? saveEditedLocalSupplier : addLocalSupplier}
              className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:bg-blue-300"
              disabled={isLoading}
            >
              {editingSupplierIndex !== null ? 'Save Edited Supplier' : 'Add Local Supplier'}
            </button>
          </div>

          {/* Local Suppliers Table */}
          {localSuppliers.length > 0 && (
            <div className="mb-8">
              <h3 className="text-lg font-medium mb-2">Local Suppliers List</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full border-collapse border border-gray-300">
                  <thead>
                    <tr className="bg-gray-200">
                      <th className="border border-gray-300 px-4 py-2">Supplier Name</th>
                      <th className="border border-gray-300 px-4 py-2">Site/Location</th>
                      <th className="border border-gray-300 px-4 py-2">Reg No</th>
                      <th className="border border-gray-300 px-4 py-2">VAT No</th>
                      <th className="border border-gray-300 px-4 py-2">Expenditure (Incl. VAT)</th>
                      <th className="border border-gray-300 px-4 py-2">Supplier Classification</th>
                      <th className="border border-gray-300 px-4 py-2">BEE Level</th>
                      <th className="border border-gray-300 px-4 py-2">30%+ Black Owned</th>
                      <th className="border border-gray-300 px-4 py-2">51%+ Black Owned</th>
                      <th className="border border-gray-300 px-4 py-2">30%+ Black Woman Owned</th>
                      <th className="border border-gray-300 px-4 py-2">Black Owned (%)</th>
                      <th className="border border-gray-300 px-4 py-2">Black Woman Owned (%)</th>
                      <th className="border border-gray-300 px-4 py-2">ESD Recipient</th>
                      <th className="border border-gray-300 px-4 py-2">BEE Certificate Expiry</th>
                      <th className="border border-gray-300 px-4 py-2">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {localSuppliers.map((supplier, index) => (
                      <tr key={index}>
                        <td className="border border-gray-300 px-4 py-2">{supplier.supplierName}</td>
                        <td className="border border-gray-300 px-4 py-2">{supplier.siteLocation || 'N/A'}</td>
                        <td className="border border-gray-300 px-4 py-2">{supplier.regNo || 'N/A'}</td>
                        <td className="border border-gray-300 px-4 py-2">{supplier.vatNo || 'N/A'}</td>
                        <td className="border border-gray-300 px-4 py-2">{supplier.expenditure}</td>
                        <td className="border border-gray-300 px-4 py-2">{supplier.supplierClassification}</td>
                        <td className="border border-gray-300 px-4 py-2">{supplier.beeLevel || 'N/A'}</td>
                        <td className="border border-gray-300 px-4 py-2">{supplier.is30PercentBlackOwned ? 'Yes' : 'No'}</td>
                        <td className="border border-gray-300 px-4 py-2">{supplier.is51PercentBlackOwned ? 'Yes' : 'No'}</td>
                        <td className="border border-gray-300 px-4 py-2">{supplier.is30PercentBlackWomanOwned ? 'Yes' : 'No'}</td>
                        <td className="border border-gray-300 px-4 py-2">{supplier.blackOwnedPercentage}%</td>
                        <td className="border border-gray-300 px-4 py-2">{supplier.blackWomanOwnedPercentage}%</td>
                        <td className="border border-gray-300 px-4 py-2">{supplier.isESDRecipient ? 'Yes' : 'No'}</td>
                        <td className="border border-gray-300 px-4 py-2">{supplier.beeCertificateExpiryDate || 'N/A'}</td>
                        <td className="border border-gray-300 px-4 py-2">
                          <button
                            type="button"
                            onClick={() => editLocalSupplier(index)}
                            className="bg-yellow-500 text-white px-2 py-1 rounded mr-2 hover:bg-yellow-600 disabled:bg-yellow-300"
                            disabled={isLoading}
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => deleteLocalSupplier(index)}
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

          {/* Local Suppliers Summary */}
          <div className="mb-8">
            <h3 className="text-lg font-medium mb-2">Local Suppliers Summary</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Total Suppliers</label>
                <input
                  type="number"
                  value={localSummary.totalSuppliers}
                  className="w-full p-2 border rounded bg-gray-100"
                  disabled
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Total Expenditure (R)</label>
                <input
                  type="number"
                  value={localSummary.totalExpenditure}
                  className="w-full p-2 border rounded bg-gray-100"
                  disabled
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">30%+ Black Owned Suppliers</label>
                <input
                  type="number"
                  value={localSummary.blackOwnedSuppliers}
                  className="w-full p-2 border rounded bg-gray-100"
                  disabled
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">30%+ Black Woman Owned Suppliers</label>
                <input
                  type="number"
                  value={localSummary.blackWomanOwnedSuppliers}
                  className="w-full p-2 border rounded bg-gray-100"
                  disabled
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">ESD Recipients (QSE/EME)</label>
                <input
                  type="number"
                  value={localSummary.esdRecipients}
                  className="w-full p-2 border rounded bg-gray-100"
                  disabled
                />
              </div>
            </div>
          </div>

          {/* Imports CSV Upload */}
          <div className="mb-8">
            <h3 className="text-lg font-medium mb-2">Upload Imports CSV</h3>
            <input
              type="file"
              accept=".csv"
              onChange={handleImportCSVUpload}
              className="w-full p-2 border rounded"
              disabled={isLoading}
            />
            <p className="text-sm text-gray-600 mt-2">
              CSV file must contain headers: foreignSupplierName, siteLocation, goodsServices,
              expenditure, reasonForImport, esdPlan
            </p>
          </div>

          {/* Imports Form */}
          <div className="mb-8">
            <h3 className="text-lg font-medium mb-2">Add Import (Foreign Supplier)</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Foreign Supplier Name</label>
                <input
                  type="text"
                  name="foreignSupplierName"
                  value={newImport.foreignSupplierName}
                  onChange={handleImportChange}
                  className="w-full p-2 border rounded"
                  placeholder="Enter foreign supplier name"
                  disabled={isLoading}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Site/Location (if applicable)</label>
                <input
                  type="text"
                  name="siteLocation"
                  value={newImport.siteLocation}
                  onChange={handleImportChange}
                  className="w-full p-2 border rounded"
                  placeholder="Enter site/location"
                  disabled={isLoading}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Goods/Services Procured</label>
                <input
                  type="text"
                  name="goodsServices"
                  value={newImport.goodsServices}
                  onChange={handleImportChange}
                  className="w-full p-2 border rounded"
                  placeholder="Enter goods/services"
                  disabled={isLoading}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Expenditure in ZAR for the Year</label>
                <input
                  type="number"
                  name="expenditure"
                  value={newImport.expenditure}
                  onChange={handleImportChange}
                  className="w-full p-2 border rounded"
                  placeholder="Enter expenditure"
                  min="0"
                  disabled={isLoading}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Reason for Import</label>
                <input
                  type="text"
                  name="reasonForImport"
                  value={newImport.reasonForImport}
                  onChange={handleImportChange}
                  className="w-full p-2 border rounded"
                  placeholder="Enter reason for import"
                  disabled={isLoading}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">ESD Plan for Imported Goods/Services</label>
                <input
                  type="text"
                  name="esdPlan"
                  value={newImport.esdPlan}
                  onChange={handleImportChange}
                  className="w-full p-2 border rounded"
                  placeholder="Enter ESD plan"
                  disabled={isLoading}
                />
              </div>
            </div>
            <button
              type="button"
              onClick={editingImportIndex !== null ? saveEditedImport : addImport}
              className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:bg-blue-300"
              disabled={isLoading}
            >
              {editingImportIndex !== null ? 'Save Edited Import' : 'Add Import'}
            </button>
          </div>

          {/* Imports Table */}
          {imports.length > 0 && (
            <div className="mb-8">
              <h3 className="text-lg font-medium mb-2">Imports List</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full border-collapse border border-gray-300">
                  <thead>
                    <tr className="bg-gray-200">
                      <th className="border border-gray-300 px-4 py-2">Foreign Supplier Name</th>
                      <th className="border border-gray-300 px-4 py-2">Site/Location</th>
                      <th className="border border-gray-300 px-4 py-2">Goods/Services Procured</th>
                      <th className="border border-gray-300 px-4 py-2">Expenditure in ZAR</th>
                      <th className="border border-gray-300 px-4 py-2">Reason for Import</th>
                      <th className="border border-gray-300 px-4 py-2">ESD Plan</th>
                      <th className="border border-gray-300 px-4 py-2">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {imports.map((imp, index) => (
                      <tr key={index}>
                        <td className="border border-gray-300 px-4 py-2">{imp.foreignSupplierName}</td>
                        <td className="border border-gray-300 px-4 py-2">{imp.siteLocation || 'N/A'}</td>
                        <td className="border border-gray-300 px-4 py-2">{imp.goodsServices}</td>
                        <td className="border border-gray-300 px-4 py-2">{imp.expenditure}</td>
                        <td className="border border-gray-300 px-4 py-2">{imp.reasonForImport || 'N/A'}</td>
                        <td className="border border-gray-300 px-4 py-2">{imp.esdPlan || 'N/A'}</td>
                        <td className="border border-gray-300 px-4 py-2">
                          <button
                            type="button"
                            onClick={() => editImport(index)}
                            className="bg-yellow-500 text-white px-2 py-1 rounded mr-2 hover:bg-yellow-600 disabled:bg-yellow-300"
                            disabled={isLoading}
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => deleteImport(index)}
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

          {/* Imports Summary */}
          <div className="mb-8">
            <h3 className="text-lg font-medium mb-2">Imports Summary</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Total Imports</label>
                <input
                  type="number"
                  value={importSummary.totalImports}
                  className="w-full p-2 border rounded bg-gray-100"
                  disabled
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Total Expenditure (R)</label>
                <input
                  type="number"
                  value={importSummary.totalExpenditure}
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
            {(localSuppliers.length > 0 || imports.length > 0) && (
              <button
                type="button"
                onClick={deleteSupplierDevelopment}
                className="bg-red-600 text-white px-3 py-2 sm:px-4 sm:py-2 rounded-md hover:bg-red-700 w-full sm:w-auto transition-all duration-200 disabled:bg-red-300"
                disabled={isLoading}
              >
                Delete Supplier Development Details
              </button>
            )}
            <button
              type="submit"
              className="bg-blue-600 text-white px-3 py-2 sm:px-4 sm:py-2 rounded-md hover:bg-blue-700 w-full sm:w-auto transition-all duration-200 disabled:bg-blue-300"
              disabled={isLoading}
            >
              Save Supplier Development Details
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

SupplierDevelopment.propTypes = {
  userId: PropTypes.string.isRequired,
  onClose: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
  onLogout: PropTypes.func.isRequired,
};

export default SupplierDevelopment;