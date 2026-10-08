import React, { useState } from 'react';
import {
  X,
  User,
  Mail,
  Lock,
  Building,
  CheckCircle,
  Shield,
  ArrowRight,
  AlertCircle,
  ExternalLink,
  Loader2,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { DEMO_USERS } from '../lib/seedData';
import { getFriendlyAuthErrorMessage } from '../lib/authErrors';
import { UniHutIcon } from './UniHutLogo';

export const AuthModal: React.FC = () => {
  const {
    isAuthModalOpen,
    authModalMode,
    closeAuthModal,
    signInWithGoogle,
    signInWithEmail,
    signUpWithEmail,
    loginAsDemoUser,
  } = useAuth();

  const [mode, setMode] = useState<'login' | 'register'>(authModalMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [hostel, setHostel] = useState('');

  // Field-level error messages
  const [fieldErrors, setFieldErrors] = useState<{
    name?: string;
    hostel?: string;
    email?: string;
    password?: string;
  }>({});

  // Top-level auth error
  const [authError, setAuthError] = useState<{
    message: string;
    isConfigError?: boolean;
    consoleUrl?: string;
  } | null>(null);

  // Success message after registration
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [submitting, setSubmitting] = useState(false);

  if (!isAuthModalOpen) return null;

  // Real validation logic before submitting to Firebase
  const validateForm = (): boolean => {
    const errors: { name?: string; hostel?: string; email?: string; password?: string } = {};

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (mode === 'register') {
      if (!name.trim()) {
        errors.name = 'Full name is required';
      }
      if (!hostel.trim()) {
        errors.hostel = 'Hostel / Hall / Block is required';
      }
    }

    if (!email.trim()) {
      errors.email = 'University / personal email is required';
    } else if (!emailRegex.test(email.trim())) {
      errors.email = 'Please enter a valid university email (e.g. 25btmcbpy0039@pondiuni.ac.in)';
    }

    if (!password) {
      errors.password = 'Password is required';
    } else if (password.length < 6) {
      errors.password = 'Password must contain at least 6 characters.';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setSuccessMessage(null);

    if (!validateForm() || submitting) {
      return;
    }

    setSubmitting(true);

    try {
      if (mode === 'login') {
        await signInWithEmail(email.trim(), password);
      } else {
        await signUpWithEmail(email.trim(), password, name.trim(), hostel.trim());
        setSuccessMessage('Welcome to UniHut! Your student account has been created.');
        setTimeout(() => {
          closeAuthModal();
        }, 1500);
      }
    } catch (err: any) {
      const friendly = getFriendlyAuthErrorMessage(err, 'email', mode);
      setAuthError(friendly);
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setAuthError(null);
    setSuccessMessage(null);
    setSubmitting(true);
    try {
      await signInWithGoogle();
    } catch (err: any) {
      const friendly = getFriendlyAuthErrorMessage(err, 'google', mode);
      setAuthError(friendly);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="fixed inset-0" onClick={closeAuthModal} />

      <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-stone-200 overflow-hidden z-10 animate-in zoom-in-95 duration-150 max-h-[92vh] flex flex-col">
        
        {/* Header */}
        <div className="px-6 pt-6 pb-4 bg-gradient-to-br from-amber-50 to-orange-50/40 border-b border-stone-100 flex items-start justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="relative">
              <UniHutIcon className="w-10 h-10" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-0.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800">
                  Campus Student Portal
                </span>
              </div>
              <h2 className="text-xl font-black text-stone-900 tracking-tight leading-tight">
                {mode === 'login' ? 'Welcome Back!' : 'Join UniHut'}
              </h2>
              <p className="text-xs text-stone-500">
                Buy, sell & bargain directly with students on campus.
              </p>
            </div>
          </div>
          <button
            onClick={closeAuthModal}
            className="p-1 rounded-full text-stone-400 hover:text-stone-700 hover:bg-stone-200/60 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-6 space-y-4 overflow-y-auto">

          {/* Quick Evaluator Demo Switcher (Separated from real Firebase auth) */}
          <div className="bg-amber-50/70 border border-amber-200/80 rounded-2xl p-3.5">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-amber-600" />
                Quick Evaluator Demo Switcher
              </span>
              <span className="text-[10px] bg-amber-200 text-amber-900 font-semibold px-2 py-0.5 rounded-full">
                Demo Persona
              </span>
            </div>
            <p className="text-[11px] text-amber-800/80 mb-2">
              Preview marketplace buyer & seller views for hackathon testing:
            </p>
            <div className="grid grid-cols-3 gap-2">
              {DEMO_USERS.map((demo, idx) => {
                const demoName = demo.displayName || demo.name || 'Demo Student';
                const demoPhoto = demo.photoURL || demo.avatarUrl;
                const demoUid = demo.uid || demo.id;
                return (
                  <button
                    key={demoUid}
                    type="button"
                    onClick={() => loginAsDemoUser(idx)}
                    className="bg-white hover:bg-amber-100/70 border border-amber-200/70 hover:border-amber-400 rounded-xl p-2 text-left transition-all group flex flex-col items-center text-center cursor-pointer shadow-2xs"
                  >
                    <img
                      src={demoPhoto}
                      alt={demoName}
                      className="w-8 h-8 rounded-full object-cover mb-1 border border-amber-300"
                    />
                    <span className="text-[11px] font-bold text-stone-800 group-hover:text-amber-900 leading-tight">
                      {demoName.split(' ')[0]}
                    </span>
                    <span className="text-[9px] text-stone-500 truncate w-full">
                      {idx === 0 ? 'Seller (Aarav)' : idx === 1 ? 'Buyer (Priya)' : 'Senior (Rohan)'}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Google Sign In */}
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={submitting}
            className="w-full flex items-center justify-center gap-3 py-2.5 px-4 bg-white hover:bg-stone-50 text-stone-700 font-semibold text-sm rounded-xl border border-stone-300 shadow-xs transition-all active:scale-98 cursor-pointer disabled:opacity-60"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span>Continue with Google</span>
          </button>

          <div className="relative flex items-center justify-center">
            <div className="border-t border-stone-200 w-full" />
            <span className="bg-white px-3 text-[11px] font-medium text-stone-400 uppercase tracking-wider absolute">
              or university email
            </span>
          </div>

          {/* Success Banner */}
          {successMessage && (
            <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* Top-Level Auth Error Banner */}
          {authError && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs space-y-1.5">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <span className="font-semibold">{authError.message}</span>
              </div>
              {authError.isConfigError && (
                <div className="pl-6 pt-1">
                  <p className="text-[11px] text-rose-700">
                    To enable Email/Password or Google provider in your Firebase project:
                  </p>
                  <ol className="list-decimal list-inside text-[11px] text-rose-700 mt-0.5 space-y-0.5">
                    <li>Open Firebase Console &rarr; Authentication &rarr; Sign-in method</li>
                    <li>Click <strong>Email/Password</strong> or <strong>Google</strong> &rarr; Toggle <strong>Enable</strong> &rarr; Save</li>
                  </ol>
                  {authError.consoleUrl && (
                    <a
                      href={authError.consoleUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-900 underline mt-1.5 hover:text-rose-700"
                    >
                      <span>Open Firebase Console Settings</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Real Firebase Form */}
          <form onSubmit={handleSubmit} className="space-y-3">
            {mode === 'register' && (
              <>
                {/* Full Name */}
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Full Name *
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 absolute left-3 top-3 text-stone-400" />
                    <input
                      type="text"
                      placeholder="e.g. Test Student"
                      value={name}
                      onChange={(e) => {
                        setName(e.target.value);
                        if (fieldErrors.name) setFieldErrors({ ...fieldErrors, name: undefined });
                      }}
                      className={`w-full pl-9 pr-3 py-2 text-sm bg-stone-50 border rounded-xl outline-none transition-colors ${
                        fieldErrors.name
                          ? 'border-rose-400 focus:border-rose-500 bg-rose-50/30'
                          : 'border-stone-200 focus:border-amber-500'
                      }`}
                    />
                  </div>
                  {fieldErrors.name && (
                    <p className="text-[11px] text-rose-600 font-semibold mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      <span>{fieldErrors.name}</span>
                    </p>
                  )}
                </div>

                {/* Hostel */}
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Hostel / Hall / Block *
                  </label>
                  <div className="relative">
                    <Building className="w-4 h-4 absolute left-3 top-3 text-stone-400" />
                    <input
                      type="text"
                      placeholder="e.g. Aurobindo Hostel"
                      value={hostel}
                      onChange={(e) => {
                        setHostel(e.target.value);
                        if (fieldErrors.hostel) setFieldErrors({ ...fieldErrors, hostel: undefined });
                      }}
                      className={`w-full pl-9 pr-3 py-2 text-sm bg-stone-50 border rounded-xl outline-none transition-colors ${
                        fieldErrors.hostel
                          ? 'border-rose-400 focus:border-rose-500 bg-rose-50/30'
                          : 'border-stone-200 focus:border-amber-500'
                      }`}
                    />
                  </div>
                  {fieldErrors.hostel && (
                    <p className="text-[11px] text-rose-600 font-semibold mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      <span>{fieldErrors.hostel}</span>
                    </p>
                  )}
                </div>
              </>
            )}

            {/* Email */}
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                University / Personal Email *
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3 top-3 text-stone-400" />
                <input
                  type="email"
                  placeholder="e.g. 25btmcbpy0039@pondiuni.ac.in"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (fieldErrors.email) setFieldErrors({ ...fieldErrors, email: undefined });
                  }}
                  className={`w-full pl-9 pr-3 py-2 text-sm bg-stone-50 border rounded-xl outline-none transition-colors ${
                    fieldErrors.email
                      ? 'border-rose-400 focus:border-rose-500 bg-rose-50/30'
                      : 'border-stone-200 focus:border-amber-500'
                  }`}
                />
              </div>
              {fieldErrors.email && (
                <p className="text-[11px] text-rose-600 font-semibold mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  <span>{fieldErrors.email}</span>
                </p>
              )}
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Password * (min. 6 characters)
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3 top-3 text-stone-400" />
                <input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (fieldErrors.password) setFieldErrors({ ...fieldErrors, password: undefined });
                  }}
                  className={`w-full pl-9 pr-3 py-2 text-sm bg-stone-50 border rounded-xl outline-none transition-colors ${
                    fieldErrors.password
                      ? 'border-rose-400 focus:border-rose-500 bg-rose-50/30'
                      : 'border-stone-200 focus:border-amber-500'
                  }`}
                />
              </div>
              {fieldErrors.password && (
                <p className="text-[11px] text-rose-600 font-semibold mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  <span>{fieldErrors.password}</span>
                </p>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-2.5 px-4 bg-amber-600 hover:bg-amber-700 disabled:bg-amber-400 text-white font-bold text-sm rounded-xl shadow-md shadow-amber-600/20 active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>{mode === 'login' ? 'Signing in...' : 'Creating account...'}</span>
                </>
              ) : (
                <>
                  <span>
                    {mode === 'login' ? 'Sign In to UniHut' : 'Create Student Account'}
                  </span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Toggle Login / Register */}
          <div className="text-center pt-1">
            <button
              type="button"
              onClick={() => {
                setMode(mode === 'login' ? 'register' : 'login');
                setAuthError(null);
                setFieldErrors({});
                setSuccessMessage(null);
              }}
              className="text-xs text-stone-600 hover:text-amber-700 font-medium cursor-pointer"
            >
              {mode === 'login' ? (
                <>
                  Don't have an account?{' '}
                  <span className="font-bold text-amber-600">Register here</span>
                </>
              ) : (
                <>
                  Already have an account?{' '}
                  <span className="font-bold text-amber-600">Sign in</span>
                </>
              )}
            </button>
          </div>

        </div>

      </div>
    </div>
  );
};
