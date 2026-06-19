import { NavLink, useNavigate } from "react-router-dom";
import type { ReactNode } from "react";
import {
  CheckSquare,
  CreditCard,
  LayoutDashboard,
  LogOut,
  Receipt,
  Target,
} from "lucide-react";

import NotificationBell from "../components/NotificationBell";
import ThemeToggle from "../components/ThemeToggle";

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

  const navItems = [
    {
      to: "/dashboard",
      label: "Dashboard",
      icon: LayoutDashboard,
    },
    {
      to: "/tasks",
      label: "Tasks",
      icon: CheckSquare,
    },
    {
      to: "/expenses",
      label: "Expenses",
      icon: CreditCard,
    },
    {
      to: "/bills",
      label: "Bills",
      icon: Receipt,
    },
    {
      to: "/goals",
      label: "Goals",
      icon: Target,
    },
  ];

  return (
    <div className="app-shell">
      <div className="row g-0">

        <div
          className="col-md-4 col-lg-2 app-sidebar"
        >
          <div className="app-brand">
            <span className="app-brand__mark">
              AI
            </span>
            <div>
              <h4>
                AI Life Manager
              </h4>
              <span>
                Personal command center
              </span>
            </div>
          </div>

          <div className="sidebar-label">
            Menu
          </div>

          <ul className="nav flex-column sidebar-nav">

            {navItems.map((item) => {
              const Icon = item.icon;

              return (
                <li
                  className="nav-item"
                  key={item.to}
                >
                  <NavLink
                    to={item.to}
                    className={({ isActive }) =>
                      `nav-link${isActive ? " active" : ""}`
                    }
                  >
                    <span className="nav-link__icon">
                      <Icon size={18} />
                    </span>
                    <span>
                      {item.label}
                    </span>
                  </NavLink>
                </li>
              );
            })}

          </ul>

          <div className="sidebar-profile">
            <div className="sidebar-profile__info">
              <div className="sidebar-profile__avatar">
                {(user.name || "U").charAt(0).toUpperCase()}
              </div>
              <div>
                <strong>
                  {user.name || "User"}
                </strong>
                <span>
                  All systems synced
                </span>
              </div>
            </div>
            <button
              type="button"
              className="sidebar-logout"
              onClick={handleLogout}
              title="Logout"
              aria-label="Logout"
            >
              <LogOut size={17} />
            </button>
          </div>
        </div>

        <main className="col-md-8 col-lg-10 app-main">

          <div className="app-topbar">

            <div>
              <span className="app-kicker">
                Workspace
              </span>
              <h5 className="mb-0">
                Welcome, {user.name || "User"}
              </h5>
            </div>

            <div className="d-flex align-items-center gap-2">

              <ThemeToggle />

              <NotificationBell />

              <button
                className="topbar-logout"
                onClick={handleLogout}
                type="button"
              >
                <LogOut size={17} />
                Logout
              </button>

            </div>

          </div>

          {children}

        </main>

      </div>
    </div>
  );
};

export default MainLayout;
