import React, { useState } from 'react';
import { UserIcon, PhoneIcon, MailIcon, IdIcon, GraduationCapIcon, CheckIcon, LockIcon, EyeIcon, EyeOffIcon } from '../Icons';
import API_BASE from '../../api';

const Register = ({ setView }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    usn: '',
    collegeName: '',
    password: '',
    confirmPassword: ''
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [credentials, setCredentials] = useState(null);
  const [copied, setCopied] = useState(false);
  const [showPassword, setShowPassword] = useState(true);
  const [showConfirmPassword, setShowConfirmPassword] = useState(true);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError('');
  };

  const validateForm = () => {
    if (!formData.name.trim()) return 'Name is required';
    if (!formData.email.trim() || !/\S+@\S+\.\S+/.test(formData.email)) return 'Provide a valid email address';
    
    const cleanPhone = formData.phone.replace(/\D/g, '');
    if (cleanPhone.length < 10) return 'Phone number must be at least 10 digits';
    
    if (!formData.usn.trim()) return 'College USN is required';
    if (!formData.collegeName.trim()) return 'College Name is required';
    if (formData.password.length < 6) return 'Password must be at least 6 characters';
    if (formData.password !== formData.confirmPassword) return 'Passwords do not match';
    
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await fetch(`${API_BASE}/api/students/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Registration failed');
      }

      setCredentials(data.credentials);
      setShowModal(true);
    } catch (err) {
      setError(err.message || 'Server error, please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    if (!credentials) return;
    const text = `College Drive Credentials\n\nStudent ID: ${credentials.studentId}\nEmail: ${credentials.email}\n\nKeep this secure.`;
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } else {
        throw new Error('Clipboard API not supported');
      }
    } catch (err) {
      alert('Failed to copy automatically. Please copy the password manually from the screen.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 relative overflow-hidden bg-slate-50">
      {/* Decorative Light Blur Spheres */}
      <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-indigo-500/10 rounded-full blur-3xl -z-10 animate-pulse"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl -z-10 animate-pulse delay-700"></div>

      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-slate-200/80 p-8 transform transition duration-500 hover:scale-[1.01]">
        <div className="text-center mb-6">
          <img src="/image.png" alt="GWC Logo" className="h-10 mx-auto mb-4 object-contain" />
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Student Registration</h2>
          <p className="mt-1 text-xs text-slate-500">Join the drive and showcase your potential</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg text-left">
            <span className="font-semibold">Error:</span> {error}
          </div>
        )}

        <form className="space-y-5" onSubmit={handleSubmit}>
          {/* Full Name */}
          <div>
            <label htmlFor="regName" className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Full Name</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400">
                <UserIcon className="w-5 h-5" />
              </span>
              <input
                id="regName"
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="block w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm font-medium"
                placeholder="e.g. Your Name"
                required
              />
            </div>
          </div>

          {/* Email Address */}
          <div>
            <label htmlFor="regEmail" className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Email Address</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400">
                <MailIcon className="w-5 h-5" />
              </span>
              <input
                id="regEmail"
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="block w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm font-medium"
                placeholder="student@example.com"
                required
              />
            </div>
          </div>

          {/* Mobile Number */}
          <div>
            <label htmlFor="regPhone" className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Mobile Number</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400">
                <PhoneIcon className="w-5 h-5" />
              </span>
              <input
                id="regPhone"
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className="block w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm font-medium"
                placeholder="9876543210"
                required
              />
            </div>
          </div>

          {/* College USN */}
          <div>
            <label htmlFor="regUsn" className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">College USN</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400">
                <IdIcon className="w-5 h-5" />
              </span>
              <input
                id="regUsn"
                type="text"
                name="usn"
                value={formData.usn}
                onChange={handleChange}
                className="block w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm font-medium"
                placeholder="1DB22CS123"
                required
              />
            </div>
          </div>

          {/* College Name */}
          <div>
            <label htmlFor="regCollege" className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">College Name</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400">
                <GraduationCapIcon className="w-5 h-5" />
              </span>
              <input
                id="regCollege"
                type="text"
                name="collegeName"
                value={formData.collegeName}
                onChange={handleChange}
                className="block w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm font-medium"
                placeholder="Don Bosco Institute of Technology"
                required
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label htmlFor="regPassword" className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Create Password</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400">
                <LockIcon className="w-5 h-5" />
              </span>
              <input
                id="regPassword"
                type={showPassword ? "text" : "password"}
                name="password"
                autoComplete="new-password"
                value={formData.password}
                onChange={handleChange}
                className="block w-full pl-11 pr-12 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm font-medium"
                placeholder="Minimum 6 characters"
                required
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

          {/* Confirm Password */}
          <div>
            <label htmlFor="regConfirmPassword" className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Confirm Password</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400">
                <LockIcon className="w-5 h-5" />
              </span>
              <input
                id="regConfirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                name="confirmPassword"
                autoComplete="new-password"
                value={formData.confirmPassword}
                onChange={handleChange}
                className="block w-full pl-11 pr-12 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm font-medium"
                placeholder="Confirm your password"
                required
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-indigo-600 transition-colors"
              >
                {showConfirmPassword ? <EyeOffIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
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
                <span>Processing...</span>
              </span>
            ) : (
              'Register & Generate Credentials'
            )}
          </button>
        </form>

        <div className="mt-6 text-center text-sm">
          <p className="text-slate-500">
            Already registered?{' '}
            <button
              onClick={() => setView('login')}
              className="text-indigo-600 hover:text-indigo-500 font-semibold transition-colors cursor-pointer"
            >
              Sign In
            </button>
          </p>
          <button
            onClick={() => setView('login')}
            className="mt-4 text-xs text-slate-500 hover:text-slate-600 transition-colors cursor-pointer"
          >
            &larr; Back to Login
          </button>
        </div>
      </div>

      {/* SUCCESS CREDENTIALS DIALOG MODAL */}
      {showModal && credentials && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-fadeIn">
          <div className="max-w-md w-full bg-white border border-slate-200 rounded-2xl p-8 shadow-2xl relative text-slate-800">
            <div className="text-center mb-6">
              <div className="inline-flex p-3 bg-emerald-50 text-emerald-600 rounded-full mb-3 border border-emerald-100">
                <CheckIcon className="w-8 h-8" />
              </div>
              <h3 className="text-2xl font-bold text-slate-900">Registration Successful!</h3>
              <p className="text-slate-550 text-sm mt-1">You can now log in with the password you created.</p>
            </div>

            <div className="space-y-4 bg-slate-50 p-5 rounded-xl border border-slate-200/80 text-left">
              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-400 tracking-wider">Primary Key (Identity ID)</label>
                <div className="text-indigo-600 font-mono font-bold text-lg mt-0.5">{credentials.studentId}</div>
              </div>
              <hr className="border-slate-200" />
              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-400 tracking-wider">Login Email</label>
                <div className="text-slate-900 font-mono text-sm mt-0.5 font-medium">{credentials.email}</div>
              </div>
            </div>

            <div className="mt-6 flex flex-col gap-3">
              <button
                onClick={() => {
                  setShowModal(false);
                  setView('login');
                }}
                className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl shadow-lg shadow-indigo-100 transition-all cursor-pointer text-sm"
              >
                Proceed to Login
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Register;
