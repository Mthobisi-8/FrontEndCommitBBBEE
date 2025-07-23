import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import logo from '../../assets/forge.png'


export default function AdminSignUp() {
  const [formData, setFormData] = useState({
    companymail: "",
    Employeename: "",
    contactNumber: "",
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    console.log("Input changed:", { name: e.target.name, value: e.target.value });
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log("Submit clicked!", formData);
    console.log("Form data being sent:", JSON.stringify(formData));
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      console.log("Sending request to backend...");
      const res = await fetch("http://localhost:5000/admin-signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      console.log("Response received:", res.status);

      // Log response text for debugging
      const text = await res.text();
      console.log("Response text:", text);

      // Try parsing as JSON
      let data;
      try {
        data = JSON.parse(text);
      } catch (parseError) {
        console.error("JSON parse error:", parseError.message);
        throw new Error("Server returned invalid JSON response");
      }

      if (!res.ok) {
        console.error("Server error response:", data);
        throw new Error(data.error || `Server error: ${res.status}`);
      }

      console.log("Raw data from backend:", data);
      setSuccess(data.message);

      const userData = {
        uid: data.uid,
        Employeename: data.Employeename,
        companymail: data.companymail,
        contactNumber: data.contactNumber,
      };
      console.log("userData being passed to Login:", userData);

      localStorage.setItem("userId", data.uid);

      // Reset form data
      setFormData({
        companymail: "",
        Employeename: "",
        contactNumber: "",
      });

      // Navigate to AdminLogIn
      setTimeout(() => {
        navigate("/AdminLogIn", { state: { userData } });
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
      
      <h2 className="text-2xl font-bold mb-6 text-center">Admin Sign Up</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Company Email</label>
          <input
            type="email"
            name="companymail"
            placeholder="Company Email"
            value={formData.companymail}
            onChange={handleChange}
            className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-600"
            required
            disabled={loading}
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Employee Name</label>
          <input
            type="text"
            name="Employeename"
            placeholder="Employee Name"
            value={formData.Employeename}
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
          Already have an account? <Link to="/AdminLogIn" className="text-blue-600 hover:underline">Log In</Link>
        </p>
      </form>
      {error && <p className="mt-4 text-red-500 text-center">{error}</p>}
      {success && <p className="mt-4 text-green-500 text-center">{success}</p>}
    </div>
  );
}