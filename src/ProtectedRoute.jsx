import { useEffect, useState } from "react";
import { Navigate, Outlet } from "react-router-dom";

export default function ProtectedRoute() {
  const [isAdmin, setIsAdmin] = useState(null);

  useEffect(() => {
    const checkAdminStatus = async () => {
      try {
        const token = localStorage.getItem("authToken");
        console.log("ProtectedRoute: Checking token:", token ? "present" : "missing");

        if (!token) {
          console.log("ProtectedRoute: No token, redirecting to /AdminLogIn");
          setIsAdmin(false);
          return;
        }

        console.log("ProtectedRoute: Sending request to /verify-admin");
        const response = await fetch("http://localhost:5000/verify-admin", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        console.log("ProtectedRoute: Response received:", response.status);
        const data = await response.json();

        if (!response.ok) {
          console.log("ProtectedRoute: Verify-admin failed:", data.error || `HTTP ${response.status}`);
          setIsAdmin(false);
          return;
        }

        console.log("ProtectedRoute: Admin status:", data.isAdmin);
        setIsAdmin(data.isAdmin);
      } catch (error) {
        console.error("ProtectedRoute: Error checking admin status:", error.message);
        setIsAdmin(false);
      }
    };

    checkAdminStatus();
  }, []);

  if (isAdmin === null) {
    console.log("ProtectedRoute: Loading admin status...");
    return <div>Loading...</div>;
  }

  return isAdmin ? <Outlet /> : <Navigate to="/AdminLogIn" replace />;
}