import React, { useState, useEffect } from 'react';
import { MailIcon, LockIcon, EyeIcon, EyeOffIcon } from '../Icons';
import API_BASE from '../../api';

const LoginPage = ({ setView, setStudentAuth, setAdminAuth }) => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isRegistrationOpen, setIsRegistrationOpen] = useState(true);

  useEffect(() => {
    fetch(`${API_BASE}/api/config`)
      .then(res => res.json())
      .then(data => {
        if (data && data.isRegistrationOpen === false) {
          setIsRegistrationOpen(false);
        }
      })
      .catch(err => console.error('Failed to fetch config:', err));
  }, []);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.email.trim()) {
      setError('Please enter your email');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await fetch(`${API_BASE}/api/users/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Invalid email or password');
      }

      // Route based on user role returned by the unified backend login
      if (data.role === 'Student') {
        setStudentAuth(data.token, data.student);
        setView('student-dashboard');
      } else if (data.role === 'Admin' || data.role === 'Staff') {
        setAdminAuth(data.token, data.user);
        setView('admin-dashboard');
      } else {
        throw new Error('Role type not recognized by system.');
      }
    } catch (err) {
      setError(err.message || 'Login failed, please verify details.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden bg-slate-50">
      {/* Decorative Light Blur Spheres */}
      <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-indigo-50/50 rounded-full blur-3xl -z-10 animate-pulse"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-50/50 rounded-full blur-3xl -z-10 animate-pulse delay-700"></div>

      <div className="max-w-md w-full rounded-2xl shadow-xl border border-slate-200/80 p-8 transform transition duration-500 hover:scale-[1.01] bg-white">
        <div className="text-center mb-6">
          <img src="/image.png" alt="GWC Logo" className="h-10 mx-auto mb-4 object-contain" />
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Portal Login</h2>
          <p className="mt-1 text-xs text-slate-500">Sign in with your registered email</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg text-left">
            <span className="font-semibold">Error:</span> {error}
          </div>
        )}

        <form className="space-y-5" onSubmit={handleSubmit}>
          {/* Email Address */}
          <div>
            <label htmlFor="loginEmail" className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Email Address</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400">
                <MailIcon className="w-5 h-5" />
              </span>
              <input
                id="loginEmail"
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="block w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm font-medium"
                placeholder="email@domain.com"
                required
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label htmlFor="loginPassword" className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Password 
              {/* <span className="text-[10px] text-slate-400 lowercase font-normal">(optional for staff)</span> */}
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400">
                <LockIcon className="w-5 h-5" />
              </span>
              <input
                id="loginPassword"
                type={showPassword ? "text" : "password"}
                name="password"
                value={formData.password}
                onChange={handleChange}
                className="block w-full pl-11 pr-12 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm font-medium"
                placeholder="••••••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-indigo-600 transition-colors"
              >
                {showPassword ? <EyeOffIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-3.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl shadow-lg shadow-indigo-100 active:scale-[0.98] transition-all disabled:opacity-50 disabled:pointer-events-none cursor-pointer flex items-center justify-center text-sm"
          >
            {loading ? (
              <span className="flex items-center space-x-2">
                <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>Signing in...</span>
              </span>
            ) : (
              'Sign In'
            )}
          </button>
        </form>

        {isRegistrationOpen && (
          <div className="mt-6 text-center text-sm">
            <p className="text-slate-500">
              Are you a student with no credentials?{' '}
              <button
                onClick={() => setView('student-register')}
                className="text-indigo-600 hover:text-indigo-500 font-semibold transition-colors cursor-pointer"
              >
                Register Now
              </button>
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default LoginPage;
