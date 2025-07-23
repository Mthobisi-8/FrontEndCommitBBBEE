import {
  createBrowserRouter,
  createRoutesFromElements,
  RouterProvider,
  Route,
} from "react-router-dom";
import SignUp from "./Components/Forms/SignUp";
import Login from "./Components/Forms/Login";
import Home from "./Components/Home";
import AdminDashboard from "./Admin/Pages/AdminDashboard";
import AdminLogIn from "./Admin/Forms/AdminLogIn";
import AdminSignUp from "./Admin/Forms/AdminSignUp";
import LandingPage from "./LandingPage";
import ProtectedRoute from "../src/ProtectedRoute";
import Clients from "./Admin/Pages/Clients";
import Charts from "./Admin/Pages/Charts";

const router = createBrowserRouter(
  createRoutesFromElements(
    <>
      <Route path="/" element={<LandingPage />} />
      <Route path="/LandingPage" element={<LandingPage />} />
      <Route path="/SignUp" element={<SignUp />} />
      <Route path="/Login" element={<Login />} />
      <Route element={<ProtectedRoute />}>
        <Route path="/AdminDashboard" element={<AdminDashboard />} />
      </Route>
      <Route path="/AdminLogIn" element={<AdminLogIn />} />
      <Route path="/AdminSignUp" element={<AdminSignUp />} />
      <Route path="/Home" element={<Home />} />
      <Route path="/Clients" element={<Clients />} />
      <Route path="/Charts" element={<Charts />} />
    </>
  )
);

const App = () => {
  return (
    <div>
      <RouterProvider router={router} />
    </div>
  );
};

export default App;