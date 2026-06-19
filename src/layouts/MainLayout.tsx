import { Link, useNavigate } from "react-router-dom";
import type { ReactNode } from "react";

import NotificationBell from "../components/NotificationBell";

interface MainLayoutProps {
  children: ReactNode;
}

const MainLayout = ({ children }: MainLayoutProps) => {
  const navigate = useNavigate();

  const user = JSON.parse(
    localStorage.getItem("user") || "{}"
  );

  const handleLogout = () => {
    localStorage.removeItem("user");
    navigate("/");
  };

  return (
    <div className="container-fluid">
      <div className="row">

        <div
          className="col-md-2 bg-dark text-white p-3"
          style={{ minHeight: "100vh" }}
        >
          <h4 className="mb-4">
            AI Life Manager
          </h4>

          <ul className="nav flex-column">

            <li className="nav-item mb-2">
              <Link
                to="/dashboard"
                className="nav-link text-white"
              >
                Dashboard
              </Link>
            </li>

            <li className="nav-item mb-2">
              <Link
                to="/tasks"
                className="nav-link text-white"
              >
                Tasks
              </Link>
            </li>

            <li className="nav-item mb-2">
              <Link
                to="/expenses"
                className="nav-link text-white"
              >
                Expenses
              </Link>
            </li>

            <li className="nav-item mb-2">
              <Link
                to="/bills"
                className="nav-link text-white"
              >
                Bills
              </Link>
            </li>

            <li className="nav-item mb-2">
              <Link
                to="/goals"
                className="nav-link text-white"
              >
                Goals
              </Link>
            </li>

          </ul>
        </div>

        <div className="col-md-10 p-4">

          <div className="d-flex justify-content-between mb-4">

            <div>
              <h5>
                Welcome, {user.name || "User"}
              </h5>
            </div>

            <div className="d-flex align-items-center">

              <NotificationBell />

              <button
                className="btn btn-danger" onClick={handleLogout}
              >
                Logout
              </button>

            </div>

          </div>

          {children}

        </div>

      </div>
    </div>
  );
};

export default MainLayout;