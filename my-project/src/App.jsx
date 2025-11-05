import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Signup from "./pages/Signup";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import useAuthStore from "./store/userAuthStore.js";
import InterView from "./pages/InterView.jsx";
import Evaluate from "./pages/Evaluate.jsx";
import GiveQuiz from "./pages/GiveQuiz.jsx";
import Course from "./pages/Course.jsx";
import Analytics from "./pages/Analytics.jsx";

function App() {
  const { token } = useAuthStore();

  return (
    <Router>
      <Routes>
        <Route path="/" element={token ? <Dashboard /> : <Navigate to="/login" />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/dashboard" element={< Dashboard/>} />
        <Route path="/interview" element={<InterView />} />
        <Route path="/login" element={<Login />} />
        <Route path="/evaluate" element={<Evaluate />} />
        <Route path="/quiz" element={<GiveQuiz/>} />
        <Route path="/course" element={<Course/>} />
        <Route path="/analytics" element={<Analytics />} />
      </Routes>
    </Router>
  );
}

export default App;
