import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Eye,
  EyeOff,
  Lock,
  Mail,
  Sparkles,
  User,
} from "lucide-react";
import ThemeToggle from "../../components/ThemeToggle";
import {
  forgotPassword,
  login,
  register,
} from "../../services/authService";

type AuthMode = "login" | "register" | "forgot";

const Login = () => {
  const navigate = useNavigate();

  const [mode, setMode] =
    useState<AuthMode>("login");

  const [showPassword, setShowPassword] =
    useState(false);

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const resetFeedback = () => {
    setError("");
    setSuccess("");
  };

  const changeMode = (nextMode: AuthMode) => {
    setMode(nextMode);
    setShowPassword(false);
    resetFeedback();
  };

  const handleLogin = async () => {
    const response = await login({
      email: formData.email,
      password: formData.password,
    });

    if (response.success) {
      localStorage.setItem(
        "user",
        JSON.stringify(response)
      );

      navigate("/dashboard");
      return;
    }

    throw new Error(
      response.message || "Login failed"
    );
  };

  const handleRegister = async () => {
    if (
      formData.password !==
      formData.confirmPassword
    ) {
      throw new Error(
        "Passwords do not match."
      );
    }

    const response = await register({
      name: formData.name,
      email: formData.email,
      password: formData.password,
    });

    if (response.success) {
      setSuccess(
        response.message ||
          "Account created. Please check your email and verify your account before logging in."
      );
      setMode("login");
      setFormData({
        ...formData,
        password: "",
        confirmPassword: "",
      });
      return;
    }

    throw new Error(
      response.message || "Registration failed"
    );
  };

  const handleForgotPassword = async () => {
    const response = await forgotPassword({
      email: formData.email,
    });

    setSuccess(
      response.message ||
        "If this email exists, reset instructions will be sent shortly."
    );
  };

  const handleSubmit = async (
    e: React.FormEvent
  ) => {
    e.preventDefault();
    setLoading(true);
    resetFeedback();

    try {
      if (mode === "login") {
        await handleLogin();
      }

      if (mode === "register") {
        await handleRegister();
      }

      if (mode === "forgot") {
        await handleForgotPassword();
      }
    } catch (err: any) {
      setError(
        err.response?.data?.message ||
          err.message ||
          "Something went wrong"
      );
    } finally {
      setLoading(false);
    }
  };

  const title =
    mode === "register"
      ? "Create your account"
      : mode === "forgot"
      ? "Reset your password"
      : "Welcome back";

  const subtitle =
    mode === "register"
      ? "Set up your workspace and start managing life with clarity."
      : mode === "forgot"
      ? "Enter your email and we will send reset instructions."
      : "Sign in to continue to your personal command center.";

  return (
    <div className="auth-page">
      <div className="auth-theme">
        <ThemeToggle />
      </div>

      <div className="auth-shell">
        <section className="auth-hero">
          <div className="auth-hero__badge">
            <Sparkles size={16} />
            AI powered planner
          </div>

          <h1>
            AI Life Manager
          </h1>

          <p>
            Organize tasks, bills, expenses, and goals in one calm workspace built for daily focus.
          </p>

          <div className="auth-hero__metrics">
            <div>
              <strong>
                24/7
              </strong>
              <span>
                Smart reminders
              </span>
            </div>
            <div>
              <strong>
                5
              </strong>
              <span>
                Life modules
              </span>
            </div>
          </div>
        </section>

        <section className="auth-card card shadow">
          <div className="card-body p-4 p-md-5">
            {mode !== "forgot" ? (
              <div className="auth-tabs">
                <button
                  type="button"
                  className={mode === "login" ? "active" : ""}
                  onClick={() =>
                    changeMode("login")
                  }
                >
                  Login
                </button>
                <button
                  type="button"
                  className={mode === "register" ? "active" : ""}
                  onClick={() =>
                    changeMode("register")
                  }
                >
                  Register
                </button>
              </div>
            ) : (
              <button
                type="button"
                className="auth-back"
                onClick={() =>
                  changeMode("login")
                }
              >
                <ArrowLeft size={16} />
                Back to login
              </button>
            )}

            <div className="auth-heading">
              <h2>
                {title}
              </h2>
              <p>
                {subtitle}
              </p>
            </div>

            {error && (
              <div className="alert alert-danger">
                {error}
              </div>
            )}

            {success && (
              <div className="alert alert-success">
                {success}
              </div>
            )}

            <form
              onSubmit={handleSubmit}
              className="auth-form"
            >
              {mode === "register" && (
                <div>
                  <label className="form-label">
                    Full name
                  </label>
                  <div className="input-with-icon">
                    <User size={18} />
                    <input
                      type="text"
                      name="name"
                      className="form-control"
                      value={formData.name}
                      onChange={handleChange}
                      placeholder="Enter your name"
                      required
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="form-label">
                  Email address
                </label>
                <div className="input-with-icon">
                  <Mail size={18} />
                  <input
                    type="email"
                    name="email"
                    className="form-control"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="you@example.com"
                    required
                  />
                </div>
              </div>

              {mode !== "forgot" && (
                <div>
                  <label className="form-label">
                    Password
                  </label>
                  <div className="input-with-icon">
                    <Lock size={18} />
                    <input
                      type={showPassword ? "text" : "password"}
                      name="password"
                      className="form-control"
                      value={formData.password}
                      onChange={handleChange}
                      placeholder="Enter your password"
                      required
                      minLength={6}
                    />
                    <button
                      type="button"
                      className="password-toggle"
                      onClick={() =>
                        setShowPassword(!showPassword)
                      }
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? (
                        <EyeOff size={18} />
                      ) : (
                        <Eye size={18} />
                      )}
                    </button>
                  </div>
                </div>
              )}

              {mode === "register" && (
                <div>
                  <label className="form-label">
                    Confirm password
                  </label>
                  <div className="input-with-icon">
                    <Lock size={18} />
                    <input
                      type={showPassword ? "text" : "password"}
                      name="confirmPassword"
                      className="form-control"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      placeholder="Repeat your password"
                      required
                      minLength={6}
                    />
                  </div>
                </div>
              )}

              {mode === "login" && (
                <div className="auth-options">
                  <label className="auth-check">
                    <input type="checkbox" />
                    Remember me
                  </label>
                  <button
                    type="button"
                    className="link-button"
                    onClick={() =>
                      changeMode("forgot")
                    }
                  >
                    Forgot password?
                  </button>
                </div>
              )}

              <button
                type="submit"
                className="btn btn-primary w-100 auth-submit"
                disabled={loading}
              >
                {loading
                  ? "Please wait..."
                  : mode === "register"
                  ? "Create account"
                  : mode === "forgot"
                  ? "Send reset link"
                  : "Login"}
              </button>
            </form>
          </div>
        </section>
      </div>
    </div>
  );
};

export default Login;
