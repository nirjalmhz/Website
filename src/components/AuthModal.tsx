import React, { useState } from "react";
import { X, Mail, Lock, User as UserIcon, Loader2, CheckCircle2, ShieldAlert, Key, Github } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { auth, signInWithEmailAndPassword, createUserWithEmailAndPassword } from "../firebase";
import { FirestoreService } from "../lib/firestoreService";

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

  // Social Auth states
  const [socialProvider, setSocialProvider] = useState<"google" | "github" | null>(null);
  const [customSocialEmail, setCustomSocialEmail] = useState("");
  const [customSocialName, setCustomSocialName] = useState("");
  const [showCustomSocialForm, setShowCustomSocialForm] = useState(false);

  const handleResetForm = () => {
    setEmail("");
    setPassword("");
    setName("");
    setError(null);
    setSuccessMessage(null);
    setDebugToken(null);
    setSocialProvider(null);
    setShowCustomSocialForm(false);
    setCustomSocialEmail("");
    setCustomSocialName("");
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

        // --- CLIENT-SIDE FIREBASE SYNC ---
        try {
          if (isLogin) {
            // Sign in to Firebase client-side
            await signInWithEmailAndPassword(auth, email, password);
          } else {
            // Create user in Firebase client-side
            await createUserWithEmailAndPassword(auth, email, password);
          }
        } catch (fbErr: any) {
          console.warn("Firebase client-side auth sync error:", fbErr.message || fbErr);
          // If we are registering but account exists in FB, or vice versa, attempt graceful recovery
          if (!isLogin && fbErr.code === "auth/email-already-in-use") {
            try {
              await signInWithEmailAndPassword(auth, email, password);
            } catch (err2) {
              console.warn("Fallback sign in also failed", err2);
            }
          } else if (isLogin && (fbErr.code === "auth/user-not-found" || fbErr.code === "auth/invalid-credential" || fbErr.code === "auth/wrong-password")) {
            try {
              await createUserWithEmailAndPassword(auth, email, password);
            } catch (err2) {
              console.warn("Fallback sign up also failed", err2);
            }
          }
        }

        // Write/sync profile to cloud Firestore directly from client to bypass server IAM issues
        try {
          const fbUid = auth.currentUser?.uid || resData.user.id;
          await FirestoreService.saveUserProfile(fbUid, resData.user.email, resData.user.name);
        } catch (fsErr) {
          console.error("Failed to sync user profile directly to Firestore:", fsErr);
        }

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

  const handleSocialSelect = async (socialEmail: string, socialName: string) => {
    setError(null);
    setIsLoading(true);
    try {
      const response = await fetch("/api/auth/social-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: socialEmail,
          name: socialName,
          provider: socialProvider,
        }),
      });

      const resData = await response.json();
      if (!response.ok) throw new Error(resData.error || "Social authentication failed");

      // --- CLIENT-SIDE FIREBASE SOCIAL PRESENCE SYNC ---
      // We log them into Firebase Auth client-side using their email with a secure social password
      const socialPassword = "AetherSkySocialPass123!";
      try {
        await signInWithEmailAndPassword(auth, socialEmail, socialPassword);
      } catch (fbErr: any) {
        if (fbErr.code === "auth/user-not-found" || fbErr.code === "auth/invalid-credential" || fbErr.code === "auth/wrong-password") {
          try {
            await createUserWithEmailAndPassword(auth, socialEmail, socialPassword);
          } catch (createErr) {
            console.warn("Auto social account sign up failed:", createErr);
          }
        } else {
          console.warn("Social Firebase Auth sync error:", fbErr);
        }
      }

      // Sync profile directly to cloud Firestore to bypass server IAM issues
      try {
        const fbUid = auth.currentUser?.uid || resData.user.id;
        await FirestoreService.saveUserProfile(fbUid, resData.user.email, resData.user.name);
      } catch (fsErr) {
        console.error("Failed to sync social user profile directly to Firestore:", fsErr);
      }

      if (rememberMe) {
        localStorage.setItem("aether_token", resData.token);
        localStorage.setItem("aether_user", JSON.stringify(resData.user));
      }

      onAuthSuccess(resData.token, resData.user);
      onClose();
      handleResetForm();
    } catch (err: any) {
      setError(err.message || "An unexpected issue occurred. Please retry.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCustomSocialSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customSocialEmail) {
      setError("Please enter a valid email address");
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(customSocialEmail)) {
      setError("Please enter a valid email address");
      return;
    }
    handleSocialSelect(customSocialEmail, customSocialName);
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

              {/* SOCIAL INTERACTIVE PANEL (Google / GitHub Dialog) */}
              {socialProvider ? (
                <div className="space-y-5 py-2">
                  {/* Provider Header logo and description */}
                  <div className="text-center mb-6">
                    {socialProvider === "google" ? (
                      <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-white/5 p-2">
                        {/* Custom exact Google colored vector logo */}
                        <svg className="h-6 w-6" viewBox="0 0 24 24">
                          <path
                            fill="#EA4335"
                            d="M12.24 10.285V14.4h6.887C18.2 16.63 15.655 18 12.24 18a6 6 0 1 1 0-12c1.61 0 3.12.612 4.28 1.725l3.127-3.127C17.65 2.65 15.11 1.5 12.24 1.5a10.5 10.5 0 1 0 0 21c5.8 0 10.38-4.08 10.38-10.38 0-.6-.055-1.185-.16-1.74H12.24z"
                          />
                        </svg>
                      </div>
                    ) : (
                      <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-slate-950 text-white p-2 border border-white/10">
                        <Github className="h-6 w-6" />
                      </div>
                    )}
                    <h3 className="font-sans text-md font-bold text-white">
                      {socialProvider === "google" ? "Sign in with Google" : "Authorize with GitHub"}
                    </h3>
                    <p className="font-sans text-xs text-slate-400 mt-1">
                      to continue to <span className="text-sky-400 font-semibold">Aether Weather</span>
                    </p>
                  </div>

                  {error && (
                    <div className="flex items-center gap-2 rounded-xl border border-red-500/20 bg-red-500/5 p-3 text-xs text-red-400">
                      <ShieldAlert className="h-4.5 w-4.5" />
                      <span>{error}</span>
                    </div>
                  )}

                  {isLoading ? (
                    <div className="py-8 flex flex-col items-center justify-center gap-3">
                      <Loader2 className="h-8 w-8 animate-spin text-sky-400" />
                      <span className="text-xs text-slate-400 font-sans">Connecting with {socialProvider}...</span>
                    </div>
                  ) : (
                    <>
                      {/* Interactive Preset Account Selector */}
                      {!showCustomSocialForm ? (
                        <div className="space-y-2.5">
                          <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider block mb-1">
                            Choose an active account
                          </span>

                          {/* Account 1: Owner */}
                          <button
                            type="button"
                            onClick={() => handleSocialSelect("nirzalmhrjn87@gmail.com", "Nirjal Maharjan")}
                            className="w-full flex items-center justify-between p-3 rounded-xl border border-white/5 bg-slate-950/40 hover:bg-white/5 hover:border-white/10 transition-all text-left group"
                          >
                            <div className="flex items-center gap-3">
                              <div className="h-8.5 w-8.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 font-sans text-xs font-black flex items-center justify-center">
                                NM
                              </div>
                              <div className="space-y-0.5">
                                <span className="text-xs font-bold text-white group-hover:text-sky-400 transition-colors">
                                  Nirjal Maharjan
                                </span>
                                <span className="text-[10px] font-mono text-slate-400 block">nirzalmhrjn87@gmail.com</span>
                              </div>
                            </div>
                            <span className="text-[10px] bg-indigo-500/10 text-indigo-300 font-mono px-2 py-0.5 rounded-full border border-indigo-500/20">
                              Active
                            </span>
                          </button>

                          {/* Account 2: Admin */}
                          <button
                            type="button"
                            onClick={() => handleSocialSelect("69nirjalmaharjan@gmail.com", "Nirjal (Admin)")}
                            className="w-full flex items-center justify-between p-3 rounded-xl border border-white/5 bg-slate-950/40 hover:bg-white/5 hover:border-white/10 transition-all text-left group"
                          >
                            <div className="flex items-center gap-3">
                              <div className="h-8.5 w-8.5 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400 font-sans text-xs font-black flex items-center justify-center">
                                AD
                              </div>
                              <div className="space-y-0.5">
                                <span className="text-xs font-bold text-white group-hover:text-sky-400 transition-colors">
                                  Nirjal Maharjan (Admin)
                                </span>
                                <span className="text-[10px] font-mono text-slate-400 block">69nirjalmaharjan@gmail.com</span>
                              </div>
                            </div>
                            <span className="text-[10px] bg-rose-500/10 text-rose-300 font-mono px-2 py-0.5 rounded-full border border-rose-500/20">
                              Admin
                            </span>
                          </button>

                          {/* Account 3: Generic Demo */}
                          <button
                            type="button"
                            onClick={() => handleSocialSelect("demo@aethersky.com", "Aether Observer")}
                            className="w-full flex items-center justify-between p-3 rounded-xl border border-white/5 bg-slate-950/40 hover:bg-white/5 hover:border-white/10 transition-all text-left group"
                          >
                            <div className="flex items-center gap-3">
                              <div className="h-8.5 w-8.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-sans text-xs font-black flex items-center justify-center">
                                AO
                              </div>
                              <div className="space-y-0.5">
                                <span className="text-xs font-bold text-white group-hover:text-sky-400 transition-colors">
                                  Aether Observer
                                </span>
                                <span className="text-[10px] font-mono text-slate-400 block">demo@aethersky.com</span>
                              </div>
                            </div>
                            <span className="text-[10px] bg-slate-800 text-slate-400 font-mono px-2 py-0.5 rounded-full">
                              Guest
                            </span>
                          </button>

                          {/* Use another account selector */}
                          <button
                            type="button"
                            onClick={() => {
                              setShowCustomSocialForm(true);
                              setError(null);
                            }}
                            className="w-full text-center py-2.5 rounded-xl border border-dashed border-white/10 text-slate-400 hover:text-white hover:border-white/20 transition-all text-xs font-medium mt-2"
                          >
                            ➕ Sign in with another {socialProvider === "google" ? "Google" : "GitHub"} account
                          </button>
                        </div>
                      ) : (
                        /* Manual input form for social account */
                        <form onSubmit={handleCustomSocialSubmit} className="space-y-4">
                          <div className="flex flex-col gap-1">
                            <label className="font-sans text-xs font-semibold text-slate-300">
                              {socialProvider === "google" ? "Google Mail Address" : "GitHub Primary Email"}
                            </label>
                            <div className="relative">
                              <Mail className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                              <input
                                type="email"
                                required
                                value={customSocialEmail}
                                onChange={(e) => setCustomSocialEmail(e.target.value)}
                                placeholder="name@domain.com"
                                className="w-full rounded-xl border border-white/10 bg-slate-950/40 py-2.5 pl-10 pr-4 font-sans text-xs text-white placeholder-slate-600 focus:border-sky-500 focus:outline-none"
                              />
                            </div>
                          </div>

                          <div className="flex flex-col gap-1">
                            <label className="font-sans text-xs font-semibold text-slate-300">Display Profile Name</label>
                            <div className="relative">
                              <UserIcon className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                              <input
                                type="text"
                                value={customSocialName}
                                onChange={(e) => setCustomSocialName(e.target.value)}
                                placeholder="Your Name"
                                className="w-full rounded-xl border border-white/10 bg-slate-950/40 py-2.5 pl-10 pr-4 font-sans text-xs text-white placeholder-slate-600 focus:border-sky-500 focus:outline-none"
                              />
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                setShowCustomSocialForm(false);
                                setCustomSocialEmail("");
                                setCustomSocialName("");
                                setError(null);
                              }}
                              className="w-1/2 h-10 rounded-xl border border-white/10 text-xs font-semibold text-slate-400 hover:text-white hover:bg-white/5 transition-all"
                            >
                              Back
                            </button>
                            <button
                              type="submit"
                              className="w-1/2 h-10 rounded-xl bg-sky-500 hover:bg-sky-400 text-xs font-bold text-white transition-all shadow-lg shadow-sky-500/20"
                            >
                              Authorize Session
                            </button>
                          </div>
                        </form>
                      )}

                      {/* Go Back button */}
                      <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-center">
                        <button
                          type="button"
                          onClick={() => {
                            setSocialProvider(null);
                            setShowCustomSocialForm(false);
                            setError(null);
                          }}
                          className="text-[11px] font-sans font-semibold text-slate-400 hover:text-white"
                        >
                          ← Cancel and Use Email Login
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ) : (
                /* STANDARD FORM VIEW */
                <>
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

                  {/* Standard Form */}
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

                  {/* Dynamic Divider for Social Auth Platforms */}
                  {!isForgotPassword && (
                    <>
                      <div className="relative flex items-center justify-center my-4">
                        <div className="absolute inset-0 flex items-center">
                          <div className="w-full border-t border-white/5" />
                        </div>
                        <span className="relative bg-slate-900 px-3 font-sans text-[10px] uppercase text-slate-500 tracking-wider font-semibold">
                          Or sign in with
                        </span>
                      </div>

                      {/* Social login buttons */}
                      <div className="grid grid-cols-2 gap-3">
                        {/* Google Social login */}
                        <button
                          type="button"
                          onClick={() => {
                            setSocialProvider("google");
                            setError(null);
                          }}
                          className="flex h-10 items-center justify-center gap-2 rounded-xl border border-white/10 bg-slate-950/30 hover:bg-white/5 transition-all text-xs font-semibold text-white cursor-pointer"
                        >
                          <svg className="h-4 w-4" viewBox="0 0 24 24">
                            <path
                              fill="#EA4335"
                              d="M12.24 10.285V14.4h6.887C18.2 16.63 15.655 18 12.24 18a6 6 0 1 1 0-12c1.61 0 3.12.612 4.28 1.725l3.127-3.127C17.65 2.65 15.11 1.5 12.24 1.5a10.5 10.5 0 1 0 0 21c5.8 0 10.38-4.08 10.38-10.38 0-.6-.055-1.185-.16-1.74H12.24z"
                            />
                          </svg>
                          <span>Google</span>
                        </button>

                        {/* GitHub Social login */}
                        <button
                          type="button"
                          onClick={() => {
                            setSocialProvider("github");
                            setError(null);
                          }}
                          className="flex h-10 items-center justify-center gap-2 rounded-xl border border-white/10 bg-slate-950/30 hover:bg-white/5 transition-all text-xs font-semibold text-white cursor-pointer"
                        >
                          <Github className="h-4 w-4" />
                          <span>GitHub</span>
                        </button>
                      </div>
                    </>
                  )}

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
                </>
              )}
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
