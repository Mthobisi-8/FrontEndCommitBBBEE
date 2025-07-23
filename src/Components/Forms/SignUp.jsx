import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import logo from '../../assets/forge.png'


export default function SignUp() {
  const [formData, setFormData] = useState({
    businessEmail: "",
    businessName: "",
    financialYearEnd: "",
    address: "",
    contactNumber: "",
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const validateForm = () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const phoneRegex = /^\+?\d{10,15}$/;
    const dateRegex = /^\d{2}\/[A-Za-z]{3}\/\d{4}$/;

    if (!emailRegex.test(formData.businessEmail)) {
      return "Please enter a valid email address";
    }
    if (!formData.businessName.trim()) {
      return "Business name is required";
    }
    if (!dateRegex.test(formData.financialYearEnd)) {
      return "Financial year end must be in DD/MMM/YYYY format (e.g., 31/Mar/2025)";
    }
    if (!formData.address.trim()) {
      return "Address is required";
    }
    if (!phoneRegex.test(formData.contactNumber)) {
      return "Contact number must be 10-15 digits (e.g., +27123456789)";
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log("Submit clicked!", formData);
    console.log("Form data being sent:", JSON.stringify(formData));
    setError("");
    setSuccess("");
    setLoading(true);

    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      setLoading(false);
      return;
    }

    try {
      console.log("Sending request to backend...");
      const res = await fetch("http://localhost:5000/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      console.log("Response received:", res.status);
      const data = await res.json();

      if (!res.ok) {
        console.error("Server error response:", data);
        throw new Error(data.error || "Something went wrong");
      }

      console.log("Raw data from backend:", data);
      setSuccess(data.message);

      const userData = {
        uid: data.uid,
        businessName: data.businessName,
        financialYearEnd: data.financialYearEnd,
        address: data.address,
        contactNumber: data.contactNumber,
      };
      console.log("userData being passed to Login:", userData);

      localStorage.setItem("userId", data.uid);

      // Navigate to Login with userData after showing success
      setTimeout(() => {
        navigate("/Login", { state: { userData } });
      }, 2000);
    } catch (err) {
      console.error("Error:", err.message);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-10 p-6 bg-white rounded-lg shadow-md">
            <div className="flex justify-center mb-6">
              <Link to='/LandingPage'>
              <img src={logo} alt="Forge Logo" className="h-16" />
              </Link>
            </div>
      <h2 className="text-2xl font-bold mb-6 text-center">Sign Up</h2>
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
            loading ? "bg-blue-400 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700"
          }`}
          disabled={loading}
        >
          {loading ? "Signing Up..." : "Sign Up"}
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