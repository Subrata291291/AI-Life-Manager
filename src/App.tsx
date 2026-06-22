import { Routes, Route } from "react-router-dom";

import Login from "./pages/Login/Login";
import VerifyEmail from "./pages/VerifyEmail/VerifyEmail";
import ResetPassword from "./pages/ResetPassword/ResetPassword";
import Dashboard from "./pages/Dashboard/Dashboard";
import Tasks from "./pages/Tasks/Tasks";
import Expenses from "./pages/Expenses/Expenses";
import Bills from "./pages/Bills/Bills";
import Goals from "./pages/Goals/Goals";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Login />} />
      <Route path="/verify-email" element={<VerifyEmail />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/tasks" element={<Tasks />} />
      <Route path="/expenses" element={<Expenses />}/>
      <Route path="/bills" element={<Bills />}/>
      <Route path="/goals" element={<Goals />}/>
    </Routes>
  );
}

export default App;
