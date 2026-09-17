import React, { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import {
  FiUser,
  FiLock,
  FiMail,
  FiPhone,
  FiUserPlus,
  FiLogIn,
  FiMapPin,
  FiCheckCircle,
  FiAlertCircle,
  FiEye,
  FiEyeOff,
  FiShield,
  FiGlobe,
  FiArrowRight,
} from 'react-icons/fi';
import { FaUserCircle, FaUserTie } from 'react-icons/fa';
import { authApi } from '../api/services.js';
import { getErrorMessage } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import './Login.css';

export default function Login() {
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [registerMode, setRegisterMode] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showRegisterPassword, setShowRegisterPassword] = useState(false);
  const [registerForm, setRegisterForm] = useState({
    username: '',
    password: '',
    name: '',
    role: 'ADMIN',
    email: '',
    phoneNumber: '',
  });

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  const handleLogin = async (event) => {
    event.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(form);
      navigate('/');
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (event) => {
    event.preventDefault();
    setError('');
    setLoading(true);

    try {
      await authApi.register(registerForm);
      await login({
        username: registerForm.username,
        password: registerForm.password,
      });
      navigate('/');
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const toggleRegisterPasswordVisibility = () => {
    setShowRegisterPassword(!showRegisterPassword);
  };

  return (
    <div className="login-page">
      <div className="login-brand-panel">
        <div className="login-brand-mark">
          <img src="/aerologo.png" alt="AERO" />
          <span>AERO GPS-SCHEMA</span>
        </div>

        <div className="login-brand-copy">
          <p className="eyebrow">Fleet Management Console</p>
          <h1>Track, manage, and license your fleet from one place.</h1>
          <p>
            Sign in to access live vehicle tracking, device management, and
            license administration for your organization.
          </p>
        </div>

        <div className="login-brand-readout">
          <div className="status-row">
            <span className="status-dot" />
            <span>ALL SYSTEMS OPERATIONAL</span>
          </div>
          <div>12.9716° N, 79.1325° E · TAMIL NADU REGION</div>
        </div>
      </div>

      <div className="login-form-panel">
        <div className="login-container">
          <div className="login-form-header">
            <h2>Sign in to your account</h2>
            <p>Enter your credentials to continue.</p>
          </div>

          <div className="login-card">
            {error && (
              <div className="alert alert-error">
                <FiAlertCircle className="alert-icon" />
                <span>{error}</span>
              </div>
            )}

            {!registerMode ? (
              <form onSubmit={handleLogin} className="login-form">
                <div className="form-field1">
                  <label>
                    <FiUser className="field-icon" />
                    <span>Username</span>
                  </label>
                  <input
                    className="input"
                    placeholder="Enter your username"
                    value={form.username}
                    onChange={(event) =>
                      setForm({ ...form, username: event.target.value })
                    }
                    required
                  />
                </div>

                <div className="form-field1">
                  <label>
                    <FiLock className="field-icon" />
                    <span>Password</span>
                  </label>
                  <div className="password-wrapper">
                    <input
                      className="input"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Enter your password"
                      value={form.password}
                      onChange={(event) =>
                        setForm({ ...form, password: event.target.value })
                      }
                      required
                    />
                    <button
                      type="button"
                      className="password-toggle"
                      onClick={togglePasswordVisibility}
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <FiEyeOff /> : <FiEye />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  className="btn btn-primary btn-block"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <span className="spinner-small"></span>
                      Signing in...
                    </>
                  ) : (
                    <>
                      Sign In <FiArrowRight />
                    </>
                  )}
                </button>

                {/* <div className="form-footer">
                  <span className="form-footer-text">New to GPS Collection?</span>
                  <button
                    type="button"
                    className="link-btn"
                    onClick={() => { setRegisterMode(true); setError(''); }}
                  >
                    Create an account
                  </button>
                </div> */}
              </form>
            ) : (
              <form onSubmit={handleRegister} className="login-form">
                <div className="form-field1">
                  <label>
                    <FaUserCircle className="field-icon" />
                    <span>Full Name</span>
                  </label>
                  <input
                    className="input"
                    placeholder="Enter your full name"
                    value={registerForm.name}
                    onChange={(event) =>
                      setRegisterForm({ ...registerForm, name: event.target.value })
                    }
                    required
                  />
                </div>

                <div className="form-field1">
                  <label>
                    <FiUser className="field-icon" />
                    <span>Username</span>
                  </label>
                  <input
                    className="input"
                    placeholder="Choose a username"
                    value={registerForm.username}
                    onChange={(event) =>
                      setRegisterForm({ ...registerForm, username: event.target.value })
                    }
                    required
                  />
                </div>

                <div className="form-field1">
                  <label>
                    <FiLock className="field-icon" />
                    <span>Password</span>
                  </label>
                  <div className="password-wrapper">
                    <input
                      className="input"
                      type={showRegisterPassword ? 'text' : 'password'}
                      placeholder="Min 6 characters"
                      value={registerForm.password}
                      onChange={(event) =>
                        setRegisterForm({ ...registerForm, password: event.target.value })
                      }
                      minLength={6}
                      required
                    />
                    <button
                      type="button"
                      className="password-toggle"
                      onClick={toggleRegisterPasswordVisibility}
                      aria-label={
                        showRegisterPassword ? 'Hide password' : 'Show password'
                      }
                    >
                      {showRegisterPassword ? <FiEyeOff /> : <FiEye />}
                    </button>
                  </div>
                </div>

                <div className="form-field1">
                  <label>
                    <FaUserTie className="field-icon" />
                    <span>Role</span>
                  </label>
                  <select
                    className="input"
                    value={registerForm.role}
                    onChange={(event) =>
                      setRegisterForm({ ...registerForm, role: event.target.value })
                    }
                  >
                    <option value="ADMIN">Administrator</option>
                    <option value="DEALER">Dealer</option>
                    <option value="USER">User</option>
                  </select>
                </div>

                <div className="form-field1">
                  <label>
                    <FiMail className="field-icon" />
                    <span>Email</span>
                  </label>
                  <input
                    className="input"
                    type="email"
                    placeholder="Enter your email address"
                    value={registerForm.email}
                    onChange={(event) =>
                      setRegisterForm({ ...registerForm, email: event.target.value })
                    }
                  />
                </div>

                <div className="form-field1">
                  <label>
                    <FiPhone className="field-icon" />
                    <span>Phone Number</span>
                  </label>
                  <input
                    className="input"
                    type="tel"
                    placeholder="9876543210"
                    value={registerForm.phoneNumber}
                    onChange={(event) =>
                      setRegisterForm({
                        ...registerForm,
                        phoneNumber: event.target.value,
                      })
                    }
                    required
                  />
                </div>

                <button
                  type="submit"
                  className="btn btn-primary btn-block"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <span className="spinner-small"></span>
                      Creating account...
                    </>
                  ) : (
                    <>
                      Create Account <FiCheckCircle />
                    </>
                  )}
                </button>

                <div className="form-footer">
                  <span className="form-footer-text">Already have an account?</span>
                  <button
                    type="button"
                    className="link-btn"
                    onClick={() => {
                      setRegisterMode(false);
                      setError('');
                    }}
                  >
                    Sign in here
                  </button>
                </div>
              </form>
            )}
          </div>

          <div className="login-footer">
            <span>© 2026 AERO GPS-SCHEMA</span>
            <span className="footer-divider">•</span>
            <span>Secure access · Enterprise edition</span>
          </div>
        </div>
      </div>
    </div>
  );
}