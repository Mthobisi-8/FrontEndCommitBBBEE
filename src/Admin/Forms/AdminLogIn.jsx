import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import logo from '../../assets/forge.png'

export default function AdminLogIn() {
  const [formData, setFormData] = useState({ businessEmail: "", password: "" });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    console.log(`Input changed: ${name} = ${value}`);
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log("Submit clicked!", formData);
    setError("");
    setSuccess("");

    try {
      console.log("Sending request to backend...");
      const res = await fetch("http://localhost:5000/admin-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      console.log("Response received:", res.status);
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Something went wrong");

      // Store JWT, uid, and businessEmail in localStorage
      localStorage.setItem("authToken", data.token);
      localStorage.setItem("uid", data.uid);
      localStorage.setItem("businessEmail", data.businessEmail);
      console.log("Stored authToken, uid, and businessEmail in localStorage");

      setSuccess(data.message);
      navigate("/AdminDashboard", {
        state: {
          userData: {
            uid: data.uid,
            businessName: data.businessName,
            businessEmail: data.businessEmail,
            contactNumber: data.contactNumber,
          },
        },
      });
    } catch (err) {
      console.error("Error:", err.message);
      setError(err.message);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-10 p-6 bg-white rounded-lg shadow-md">
      <div className="flex justify-center mb-6">
        <Link to='/LandingPage'>
          <img src={logo} alt="Forge Logo" className="h-16" />
        </Link>
      </div>
      <h2 className="text-2xl font-bold mb-6 text-center">Admin Log In</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="email"
          name="businessEmail"
          placeholder="Business Email"
          value={formData.businessEmail}
          onChange={handleChange}
          className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-600"
          required
          autoComplete="email"
        />
        <input
          type="password"
          name="password"
          placeholder="Password"
          value={formData.password}
          onChange={handleChange}
          className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-600"
          required
          autoComplete="current-password"
        />
        <button
          type="submit"
          className="w-full p-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Log In
        </button>
        <p>
          Don’t have an account?{" "}
          <Link to="/AdminSignUp" className="text-blue-600 hover:underline">
            Sign Up
          </Link>
        </p>
      </form>
      {error && <p className="mt-4 text-red-500">{error}</p>}
      {success && <p className="mt-4 text-green-500">{success}</p>}
    </div>
  );
}