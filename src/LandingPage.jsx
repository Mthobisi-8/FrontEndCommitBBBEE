import { Link } from "react-router-dom";

export default function LandingPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-gray-50 to-gray-200">
      <div className="max-w-lg w-full bg-white rounded-xl shadow-lg p-8 border border-gray-100">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-4">B-BBEE Calculator</h1>
          <p className="text-gray-600 text-lg">
            Calculate your Broad-Based Black Economic Empowerment (B-BBEE) score with ease.
          </p>
          <p className="text-gray-500 mt-2">
            Simplify compliance and track your transformation journey.
          </p>
        </div>
        
        <div className="bg-gray-50 p-4 rounded-lg mb-6">
          <h2 className="text-lg font-medium text-gray-700 mb-2">Choose your role to get started</h2>
          <div className="flex flex-col gap-4">
            <Link
              to="/AdminSignUp"
              className="bg-purple-600 text-white text-center px-4 py-3 rounded-lg hover:bg-purple-700 transition flex items-center justify-center gap-2 font-medium"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
              </svg>
              Admin 
            </Link>
            <Link
              to="/SignUp"
              className="bg-blue-600 text-white text-center px-4 py-3 rounded-lg hover:bg-blue-700 transition flex items-center justify-center gap-2 font-medium"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
              </svg>
              Client
            </Link>
          </div>
        </div>
        
        <div className="text-center">
          
          
          <div className="mt-6 pt-6 border-t border-gray-100">
            <p className="text-xs text-gray-400">
              © 2025 B-BBEE Calculator | <Link to="/about" className="hover:underline">About</Link> | <Link to="/contact" className="hover:underline">Contact</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}