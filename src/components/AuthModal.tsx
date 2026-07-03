import React, { useState } from "react";
import { X, Mail, Lock, User as UserIcon, Loader2, CheckCircle2, ShieldAlert, Key } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthSuccess: (token: string, user: any) => void;
}

export default function AuthModal({ isOpen, onClose, onAuthSuccess }: AuthModalProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [rememberMe, setRememberMe] = useState(true);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [debugToken, setDebugToken] = useState<string | null>(null);

  const handleResetForm = () => {
    setEmail("");
    setPassword("");
    setName("");
    setError(null);
    setSuccessMessage(null);
    setDebugToken(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);
    setDebugToken(null);
    setIsLoading(true);

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError("Please enter a valid email address");
      setIsLoading(false);
      return;
    }

    if (!isForgotPassword && password.length < 6) {
      setError("Password must be at least 6 characters long");
      setIsLoading(false);
      return;
    }

    try {
      if (isForgotPassword) {
        // Forgot password flow
        const response = await fetch("/api/auth/forgot-password", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email }),
        });
        const resData = await response.json();
        if (!response.ok) throw new Error(resData.error || "Reset failed");

        setSuccessMessage("A password recovery link has been simulated successfully.");
        if (resData.debugToken) {
          setDebugToken(resData.debugToken);
        }
      } else {
        // Login or Register flow
        const url = isLogin ? "/api/auth/login" : "/api/auth/register";
        const body = isLogin ? { email, password } : { email, password, name };

        const response = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        const resData = await response.json();
        if (!response.ok) throw new Error(resData.error || "Authentication failed");

        if (rememberMe) {
          localStorage.setItem("aether_token", resData.token);
          localStorage.setItem("aether_user", JSON.stringify(resData.user));
        }

        onAuthSuccess(resData.token, resData.user);
        onClose();
        handleResetForm();
      }
    } catch (err: any) {
      setError(err.message || "An unexpected issue occurred. Please retry.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Dark Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.6 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm"
          />

          {/* Floating Form Modal */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              id="auth-modal-panel"
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ type: "spring", duration: 0.5 }}
              className="relative w-full max-w-md overflow-hidden rounded-2xl border border-white/10 bg-slate-900/95 p-6 shadow-2xl backdrop-blur-xl"
            >
              {/* Close button */}
              <button
                id="close-auth-modal-btn"
                onClick={onClose}
                className="absolute right-4 top-4 rounded-lg p-1 text-slate-400 hover:bg-white/5 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>

              {/* Form Title & Context */}
              <div className="mb-6">
                <h3 className="font-sans text-lg font-bold text-white">
                  {isForgotPassword
                    ? "Reset Password"
                    : isLogin
                    ? "Welcome to AetherSky"
                    : "Create Secure Account"}
                </h3>
                <p className="font-sans text-xs text-slate-400 mt-1">
                  {isForgotPassword
                    ? "Enter your email to simulate a reset verification token."
                    : isLogin
                    ? "Log in to view saved cities, favorites, and search histories."
                    : "Register to personalize metrics and pin favorites."}
                </p>
              </div>

              {/* Status Indicators */}
              {error && (
                <div className="mb-4 flex items-center gap-2 rounded-xl border border-red-500/20 bg-red-500/5 p-3 text-xs text-red-400">
                  <ShieldAlert className="h-4.5 w-4.5" />
                  <span>{error}</span>
                </div>
              )}

              {successMessage && (
                <div className="mb-4 rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3 text-xs text-emerald-400 space-y-1">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4.5 w-4.5" />
                    <span className="font-semibold">{successMessage}</span>
                  </div>
                  {debugToken && (
                    <div className="mt-2 flex items-center gap-1 bg-slate-950/50 p-2 rounded border border-white/5 font-mono text-[9px] text-sky-400">
                      <Key className="h-3.5 w-3.5" />
                      <span>DEBUG RECOVERY TOKEN: {debugToken}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Form Content */}
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Full Name (Only for Register) */}
                {!isLogin && !isForgotPassword && (
                  <div className="flex flex-col gap-1">
                    <label className="font-sans text-xs font-semibold text-slate-300">Your Full Name</label>
                    <div className="relative">
                      <UserIcon className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                      <input
                        id="auth-input-name"
                        type="text"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="John Doe"
                        className="w-full rounded-xl border border-white/10 bg-slate-950/40 py-2.5 pl-10 pr-4 font-sans text-xs text-white placeholder-slate-600 focus:border-sky-500 focus:outline-none"
                      />
                    </div>
                  </div>
                )}

                {/* Email Address */}
                <div className="flex flex-col gap-1">
                  <label className="font-sans text-xs font-semibold text-slate-300">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                    <input
                      id="auth-input-email"
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      className="w-full rounded-xl border border-white/10 bg-slate-950/40 py-2.5 pl-10 pr-4 font-sans text-xs text-white placeholder-slate-600 focus:border-sky-500 focus:outline-none"
                    />
                  </div>
                </div>

                {/* Password (Not for forgot password) */}
                {!isForgotPassword && (
                  <div className="flex flex-col gap-1">
                    <label className="font-sans text-xs font-semibold text-slate-300">Secure Password</label>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                      <input
                        id="auth-input-password"
                        type="password"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full rounded-xl border border-white/10 bg-slate-950/40 py-2.5 pl-10 pr-4 font-sans text-xs text-white placeholder-slate-600 focus:border-sky-500 focus:outline-none"
                      />
                    </div>
                  </div>
                )}

                {/* Remember Me and Forgot Password (Only during Login) */}
                {isLogin && !isForgotPassword && (
                  <div className="flex items-center justify-between text-xs">
                    <label className="flex items-center gap-2 cursor-pointer text-slate-400 hover:text-white">
                      <input
                        id="auth-checkbox-remember"
                        type="checkbox"
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                        className="h-4 w-4 rounded border-white/10 bg-slate-950/50 text-sky-500 focus:ring-sky-500 focus:ring-offset-slate-900"
                      />
                      <span>Remember me</span>
                    </label>
                    <button
                      id="auth-btn-forgot"
                      type="button"
                      onClick={() => {
                        setIsForgotPassword(true);
                        setError(null);
                        setSuccessMessage(null);
                      }}
                      className="text-sky-400 font-semibold hover:underline"
                    >
                      Forgot password?
                    </button>
                  </div>
                )}

                {/* Submit Action */}
                <button
                  id="auth-submit-btn"
                  type="submit"
                  disabled={isLoading}
                  className="flex h-11 w-full items-center justify-center rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 font-sans text-sm font-bold text-white hover:opacity-90 disabled:opacity-50 shadow-lg shadow-sky-500/20 transition-all cursor-pointer"
                >
                  {isLoading ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : isForgotPassword ? (
                    "Send Recovery Token"
                  ) : isLogin ? (
                    "Sign In"
                  ) : (
                    "Register Account"
                  )}
                </button>
              </form>

              {/* Toggle Account Mode Footer */}
              <div className="mt-5 border-t border-white/5 pt-4 text-center text-xs text-slate-400">
                {isForgotPassword ? (
                  <button
                    id="auth-back-login"
                    type="button"
                    onClick={() => {
                      setIsForgotPassword(false);
                      setIsLogin(true);
                      handleResetForm();
                    }}
                    className="text-sky-400 font-semibold hover:underline"
                  >
                    Back to Log In
                  </button>
                ) : isLogin ? (
                  <span>
                    Don't have an account?{" "}
                    <button
                      id="auth-toggle-register"
                      type="button"
                      onClick={() => {
                        setIsLogin(false);
                        handleResetForm();
                      }}
                      className="text-sky-400 font-semibold hover:underline"
                    >
                      Register
                    </button>
                  </span>
                ) : (
                  <span>
                    Already have an account?{" "}
                    <button
                      id="auth-toggle-login"
                      type="button"
                      onClick={() => {
                        setIsLogin(true);
                        handleResetForm();
                      }}
                      className="text-sky-400 font-semibold hover:underline"
                    >
                      Sign In
                    </button>
                  </span>
                )}
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
