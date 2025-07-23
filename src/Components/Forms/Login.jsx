import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import logo from '../../assets/forge.png';

export default function Login() {
  const [formData, setFormData] = useState({ businessEmail: "", password: "" });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

const handleSubmit = async (e) => {
  e.preventDefault();
  console.log("Submit clicked!", formData);
  setError("");
  setSuccess("");

  try {
    const res = await fetch("http://localhost:5000/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formData),
    });
    const data = await res.json();

    if (!res.ok) throw new Error(data.error || "Something went wrong");

    if (data.idToken && data.uid) {
      localStorage.setItem("idToken", data.idToken);
      localStorage.setItem("uid", data.uid);
      console.log("idToken stored:", data.idToken);
      console.log("uid stored:", data.uid);
    } else {
      throw new Error("idToken or uid missing in response");
    }

    setSuccess(data.message);
    navigate("/Home", {
      state: {
        userData: {
          uid: data.uid,
          businessName: data.businessName,
          financialYearEnd: data.financialYearEnd,
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
      <h2 className="text-2xl font-bold mb-6 text-center">Log In</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="email"
          name="businessEmail"
          placeholder="Business Email"
          value={formData.businessEmail}
          onChange={handleChange}
          className="w-full p-2 border rounded"
          required
        />
        <input
          type="password"
          name="password"
          placeholder="Password"
          value={formData.password}
          onChange={handleChange}
          className="w-full p-2 border rounded"
          required
        />
        <button
          type="submit"
          className="w-full p-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Log In
        </button>
        <p>
          Don’t have an account? <Link to="/SignUp" className="text-blue-600">Sign Up</Link>
        </p>
      </form>
      {error && <p className="mt-4 text-red-500">{error}</p>}
      {success && <p className="mt-4 text-green-500">{success}</p>}
    </div>
  );
}