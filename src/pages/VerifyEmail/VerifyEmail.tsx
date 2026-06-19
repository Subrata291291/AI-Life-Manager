import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { CheckCircle2, Loader2, XCircle } from "lucide-react";
import ThemeToggle from "../../components/ThemeToggle";
import { verifyEmail } from "../../services/authService";

const VerifyEmail = () => {
  const [searchParams] = useSearchParams();
  const [status, setStatus] =
    useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] =
    useState("Verifying your email address...");

  useEffect(() => {
    const email =
      searchParams.get("email") || "";
    const token =
      searchParams.get("token") || "";

    const runVerification = async () => {
      if (!email || !token) {
        setStatus("error");
        setMessage(
          "Verification link is missing required information."
        );
        return;
      }

      try {
        const response =
          await verifyEmail({
            email,
            token,
          });

        if (response.success) {
          setStatus("success");
          setMessage(
            response.message ||
              "Your email is verified. You can log in now."
          );
          return;
        }

        setStatus("error");
        setMessage(
          response.message ||
            "This verification link is invalid or expired."
        );
      } catch (err: any) {
        setStatus("error");
        setMessage(
          err.response?.data?.message ||
            "This verification link is invalid or expired."
        );
      }
    };

    runVerification();
  }, [searchParams]);

  return (
    <div className="auth-page">
      <div className="auth-theme">
        <ThemeToggle />
      </div>

      <section className="auth-card verify-card card shadow">
        <div className="card-body p-4 p-md-5 text-center">
          <div className={`verify-icon verify-icon--${status}`}>
            {status === "loading" && (
              <Loader2 size={34} />
            )}
            {status === "success" && (
              <CheckCircle2 size={34} />
            )}
            {status === "error" && (
              <XCircle size={34} />
            )}
          </div>

          <h2>
            {status === "success"
              ? "Email verified"
              : status === "error"
              ? "Verification failed"
              : "Checking link"}
          </h2>

          <p>
            {message}
          </p>

          <Link
            to="/"
            className="btn btn-primary w-100 auth-submit"
          >
            Go to login
          </Link>
        </div>
      </section>
    </div>
  );
};

export default VerifyEmail;
