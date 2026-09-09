'use client';

import React, { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { authApi } from '@/lib/api';
import { User, Shield, KeyRound, Mail, Lock, UserPlus, Sparkles, Check, AlertCircle, BookOpen } from 'lucide-react';
import Link from 'next/link';

function LoginFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useAuth();

  const redirectIntent = searchParams.get('redirect');
  const bookTitle = searchParams.get('bookTitle');

  // Active Tab: 'member_login' | 'member_register' | 'staff_login'
  const [activeTab, setActiveTab] = useState<'member_login' | 'member_register' | 'staff_login'>('member_login');

  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const resetForm = () => {
    setErrorMessage(null);
  };

  const handleMemberLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setIsLoading(true);
    try {
      const session = await authApi.loginMember({ email, password });
      login(session);
      if (redirectIntent === 'borrow') {
        router.push('/');
      } else {
        router.push('/patron/dashboard');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleMemberRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setIsLoading(true);
    try {
      const session = await authApi.register({ email, password, full_name: fullName });
      login(session);
      router.push('/patron/dashboard');
    } catch (err: any) {
      setErrorMessage(err.message || 'Registration failed. Try a different email.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleStaffLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setIsLoading(true);
    try {
      const session = await authApi.loginStaff({ email, password });
      login(session);
      router.push('/staff/dashboard');
    } catch (err: any) {
      setErrorMessage(err.message || 'Staff verification failed. Access denied.');
    } finally {
      setIsLoading(false);
    }
  };

  // Quick autofill buttons for easy evaluation
  const fillDemoPatron = () => {
    setEmail('patron@library.com');
    setPassword('patron123');
    setErrorMessage(null);
  };

  const fillDemoStaff = () => {
    setEmail('staff@library.com');
    setPassword('staff123');
    setErrorMessage(null);
  };

  return (
    <div className="container" style={{ maxWidth: 540, paddingTop: 40 }}>
      {/* Notice if redirected from Catalog */}
      {redirectIntent === 'borrow' && (
        <div style={{
          background: 'var(--accent-yellow)',
          border: '2.5px solid var(--border-color)',
          borderRadius: 16,
          padding: '12px 18px',
          boxShadow: 'var(--cartoon-shadow-sm)',
          marginBottom: 24,
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          fontWeight: 700,
          fontSize: '0.9rem'
        }}>
          <Sparkles size={20} color="#78350F" />
          <div>
            Please log in or register to confirm borrowing: <strong>{bookTitle || 'Selected Book'}</strong>
          </div>
        </div>
      )}

      <div className="cartoon-card" style={{ padding: '32px 28px', background: '#FFFFFF' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 56,
            height: 56,
            borderRadius: 16,
            background: activeTab === 'staff_login' ? 'var(--accent-yellow)' : 'var(--primary-light)',
            border: '2.5px solid var(--border-color)',
            boxShadow: 'var(--cartoon-shadow-sm)',
            marginBottom: 12
          }}>
            {activeTab === 'staff_login' ? <Shield size={28} color="#B45309" /> : <BookOpen size={28} color="var(--primary-blue)" />}
          </div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 900, marginBottom: 6 }}>
            {activeTab === 'staff_login' ? 'Staff Portal' : activeTab === 'member_register' ? 'Join the Library' : 'Patron Sign In'}
          </h1>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: 500 }}>
            {activeTab === 'staff_login'
              ? 'Secure staff authentication via FastAPI Service'
              : 'Sign in to borrow books & view reading logs'}
          </p>
        </div>

        {/* Tab Switcher */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 8,
          background: 'var(--bg-secondary)',
          padding: 6,
          borderRadius: 16,
          border: '2px solid var(--border-color)',
          marginBottom: 24
        }}>
          <button
            type="button"
            onClick={() => { setActiveTab('member_login'); resetForm(); }}
            style={{
              padding: '10px 12px',
              borderRadius: 12,
              fontWeight: 800,
              fontSize: '0.85rem',
              border: activeTab !== 'staff_login' ? '2px solid var(--border-color)' : 'none',
              background: activeTab !== 'staff_login' ? '#FFFFFF' : 'transparent',
              boxShadow: activeTab !== 'staff_login' ? 'var(--cartoon-shadow-sm)' : 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6
            }}
          >
            <User size={15} />
            Patron / Member
          </button>

          <button
            type="button"
            onClick={() => { setActiveTab('staff_login'); resetForm(); }}
            style={{
              padding: '10px 12px',
              borderRadius: 12,
              fontWeight: 800,
              fontSize: '0.85rem',
              border: activeTab === 'staff_login' ? '2px solid var(--border-color)' : 'none',
              background: activeTab === 'staff_login' ? '#FFFFFF' : 'transparent',
              boxShadow: activeTab === 'staff_login' ? 'var(--cartoon-shadow-sm)' : 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6
            }}
          >
            <Shield size={15} />
            Staff Portal
          </button>
        </div>

        {/* Error Notification */}
        {errorMessage && (
          <div style={{
            background: 'var(--accent-coral)',
            border: '2px solid var(--border-color)',
            borderRadius: 12,
            padding: 12,
            marginBottom: 20,
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            color: 'var(--accent-coral-text)',
            fontSize: '0.85rem',
            fontWeight: 700
          }}>
            <AlertCircle size={18} />
            <div>{errorMessage}</div>
          </div>
        )}

        {/* Member Mode Switch (Login vs Register) */}
        {activeTab !== 'staff_login' && (
          <div style={{ display: 'flex', justifyContent: 'center', gap: 16, marginBottom: 20 }}>
            <button
              type="button"
              onClick={() => { setActiveTab('member_login'); resetForm(); }}
              style={{
                background: 'none',
                border: 'none',
                fontSize: '0.9rem',
                fontWeight: 800,
                color: activeTab === 'member_login' ? 'var(--primary-blue)' : 'var(--text-muted)',
                cursor: 'pointer',
                borderBottom: activeTab === 'member_login' ? '2px solid var(--primary-blue)' : '2px solid transparent',
                paddingBottom: 4
              }}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => { setActiveTab('member_register'); resetForm(); }}
              style={{
                background: 'none',
                border: 'none',
                fontSize: '0.9rem',
                fontWeight: 800,
                color: activeTab === 'member_register' ? 'var(--primary-blue)' : 'var(--text-muted)',
                cursor: 'pointer',
                borderBottom: activeTab === 'member_register' ? '2px solid var(--primary-blue)' : '2px solid transparent',
                paddingBottom: 4
              }}
            >
              Register Card
            </button>
          </div>
        )}

        {/* 1. Member Sign In Form */}
        {activeTab === 'member_login' && (
          <form onSubmit={handleMemberLogin} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label style={{ display: 'block', fontWeight: 800, fontSize: '0.85rem', marginBottom: 6 }}>
                Email Address
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type="email"
                  required
                  placeholder="patron@library.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="cartoon-input"
                  style={{ paddingLeft: 42 }}
                />
                <Mail size={18} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontWeight: 800, fontSize: '0.85rem', marginBottom: 6 }}>
                Password
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="cartoon-input"
                  style={{ paddingLeft: 42 }}
                />
                <Lock size={18} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="cartoon-btn cartoon-btn-primary"
              style={{ width: '100%', padding: '12px 20px', marginTop: 8 }}
            >
              {isLoading ? 'Signing In...' : 'Sign In to Account'}
            </button>

            {/* Quick autofill helper */}
            <div style={{ textAlign: 'center', marginTop: 8 }}>
              <button
                type="button"
                onClick={fillDemoPatron}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '0.8rem',
                  color: 'var(--primary-blue)',
                  cursor: 'pointer',
                  fontWeight: 700,
                  textDecoration: 'underline'
                }}
              >
                Autofill Demo Patron (patron@library.com)
              </button>
            </div>
          </form>
        )}

        {/* 2. Member Registration Form */}
        {activeTab === 'member_register' && (
          <form onSubmit={handleMemberRegister} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label style={{ display: 'block', fontWeight: 800, fontSize: '0.85rem', marginBottom: 6 }}>
                Full Name
              </label>
              <input
                type="text"
                required
                placeholder="Jane Doe"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="cartoon-input"
              />
            </div>

            <div>
              <label style={{ display: 'block', fontWeight: 800, fontSize: '0.85rem', marginBottom: 6 }}>
                Email Address
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type="email"
                  required
                  placeholder="jane@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="cartoon-input"
                  style={{ paddingLeft: 42 }}
                />
                <Mail size={18} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontWeight: 800, fontSize: '0.85rem', marginBottom: 6 }}>
                Choose Password
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="cartoon-input"
                  style={{ paddingLeft: 42 }}
                />
                <Lock size={18} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="cartoon-btn cartoon-btn-primary"
              style={{ width: '100%', padding: '12px 20px', marginTop: 8 }}
            >
              {isLoading ? 'Creating Library Card...' : 'Issue My Library Card'}
            </button>
          </form>
        )}

        {/* 3. Staff Login Form */}
        {activeTab === 'staff_login' && (
          <form onSubmit={handleStaffLogin} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{
              background: '#FFFBEB',
              border: '2px solid #F59E0B',
              padding: '10px 14px',
              borderRadius: 12,
              fontSize: '0.8rem',
              fontWeight: 700,
              color: '#92400E',
              display: 'flex',
              alignItems: 'center',
              gap: 8
            }}>
              <Lock size={16} color="#92400E" />
              <span>Authorized Staff only. Grants access to member management and loan records.</span>
            </div>

            <div>
              <label style={{ display: 'block', fontWeight: 800, fontSize: '0.85rem', marginBottom: 6 }}>
                Staff Email
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type="email"
                  required
                  placeholder="staff@library.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="cartoon-input"
                  style={{ paddingLeft: 42 }}
                />
                <Shield size={18} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontWeight: 800, fontSize: '0.85rem', marginBottom: 6 }}>
                Staff Password
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="cartoon-input"
                  style={{ paddingLeft: 42 }}
                />
                <KeyRound size={18} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="cartoon-btn cartoon-btn-yellow"
              style={{ width: '100%', padding: '12px 20px', marginTop: 8 }}
            >
              {isLoading ? 'Authenticating Staff...' : 'Sign In as Staff'}
            </button>

            {/* Quick autofill helper */}
            <div style={{ textAlign: 'center', marginTop: 8 }}>
              <button
                type="button"
                onClick={fillDemoStaff}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '0.8rem',
                  color: '#B45309',
                  cursor: 'pointer',
                  fontWeight: 700,
                  textDecoration: 'underline'
                }}
              >
                Autofill Demo Staff (staff@library.com)
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="container" style={{ textAlign: 'center', paddingTop: 60 }}>Loading...</div>}>
      <LoginFormContent />
    </Suspense>
  );
}
