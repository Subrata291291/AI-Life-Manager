import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Eye, EyeOff, Lock, Sparkles, CheckCircle2, XCircle } from "lucide-react";
import ThemeToggle from "../../components/ThemeToggle";
import { resetPassword } from "../../services/authService";

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const email = searchParams.get("email") || "";
  const token = searchParams.get("token") || "";

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  const isValidLink = !!email && !!token;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("");

    if (password.length < 6) {
      setStatus("error");
      setMessage("Password must be at least 6 characters long.");
      return;
    }

    if (password !== confirmPassword) {
      setStatus("error");
      setMessage("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      const response = await resetPassword({ email, token, password });

      if (response.success) {
        setStatus("success");
        setMessage(
          response.message ||
            "Your password has been reset successfully. You can log in now."
        );
      } else {
        setStatus("error");
        setMessage(response.message || "Something went wrong.");
      }
    } catch (err: any) {
      setStatus("error");
      setMessage(
        err.response?.data?.message ||
          "Something went wrong. The link may have expired."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-theme">
        <ThemeToggle />
      </div>

      <div className="auth-shell">
        {/* Hero Panel */}
        <section className="auth-hero">
          <div className="auth-hero__badge">
            <Sparkles size={16} />
            AI powered planner
          </div>
          <h1>AI Life Manager</h1>
          <p>
            Set a new secure password to regain access to your personal command
            center.
          </p>
          <div className="auth-hero__metrics">
            <div>
              <strong>Secure</strong>
              <span>256-bit encryption</span>
            </div>
            <div>
              <strong>Fast</strong>
              <span>Instant access</span>
            </div>
          </div>
        </section>

        {/* Card */}
        <section className="auth-card card shadow">
          <div className="card-body p-4 p-md-5">
            <div className="auth-heading">
              <h2>
                {status === "success"
                  ? "Password reset!"
                  : "Set new password"}
              </h2>
              <p>
                {status === "success"
                  ? "Your password has been changed. You can now log in."
                  : !isValidLink
                  ? "This link is invalid or has expired."
                  : "Enter and confirm your new password below."}
              </p>
            </div>

            {/* Success state */}
            {status === "success" && (
              <div className="text-center py-2">
                <div
                  className="verify-icon verify-icon--success mx-auto mb-3"
                  style={{ display: "flex", justifyContent: "center" }}
                >
                  <CheckCircle2 size={48} />
                </div>
                <p className="mb-4" style={{ color: "#334155" }}>
                  {message}
                </p>
                <Link
                  to="/"
                  className="btn btn-primary w-100 auth-submit"
                >
                  Go to Login
                </Link>
              </div>
            )}

            {/* Invalid link state */}
            {!isValidLink && status !== "success" && (
              <div className="text-center py-2">
                <div
                  className="verify-icon verify-icon--error mx-auto mb-3"
                  style={{ display: "flex", justifyContent: "center" }}
                >
                  <XCircle size={48} />
                </div>
                <p className="mb-4" style={{ color: "#ef4444" }}>
                  This password reset link is invalid or has expired. Please
                  request a new one.
                </p>
                <Link to="/" className="btn btn-primary w-100 auth-submit">
                  Back to Login
                </Link>
              </div>
            )}

            {/* Reset form */}
            {isValidLink && status !== "success" && (
              <form onSubmit={handleSubmit} className="auth-form">
                {/* Error alert */}
                {status === "error" && message && (
                  <div className="alert alert-danger">{message}</div>
                )}

                {/* New password */}
                <div>
                  <label className="form-label">New password</label>
                  <div className="input-with-icon">
                    <Lock size={18} />
                    <input
                      id="reset-password"
                      type={showPassword ? "text" : "password"}
                      className="form-control"
                      placeholder="Enter new password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      minLength={6}
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      className="password-toggle"
                      onClick={() => setShowPassword(!showPassword)}
                      aria-label={
                        showPassword ? "Hide password" : "Show password"
                      }
                    >
                      {showPassword ? (
                        <EyeOff size={18} />
                      ) : (
                        <Eye size={18} />
                      )}
                    </button>
                  </div>
                </div>

                {/* Confirm password */}
                <div>
                  <label className="form-label">Confirm new password</label>
                  <div className="input-with-icon">
                    <Lock size={18} />
                    <input
                      id="reset-confirm-password"
                      type={showConfirm ? "text" : "password"}
                      className="form-control"
                      placeholder="Repeat new password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      minLength={6}
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      className="password-toggle"
                      onClick={() => setShowConfirm(!showConfirm)}
                      aria-label={
                        showConfirm ? "Hide password" : "Show password"
                      }
                    >
                      {showConfirm ? (
                        <EyeOff size={18} />
                      ) : (
                        <Eye size={18} />
                      )}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  id="reset-password-submit"
                  className="btn btn-primary w-100 auth-submit"
                  disabled={loading}
                >
                  {loading ? "Resetting..." : "Reset password"}
                </button>

                <div className="text-center mt-3">
                  <Link to="/" className="link-button" style={{ fontSize: "0.875rem" }}>
                    Back to login
                  </Link>
                </div>
              </form>
            )}
          </div>
        </section>
      </div>
    </div>
  );
};

export default ResetPassword;
