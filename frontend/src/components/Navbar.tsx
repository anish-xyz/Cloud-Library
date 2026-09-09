'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { BookOpen, User, Shield, LogOut, Sparkles, BookMarked, GraduationCap } from 'lucide-react';

export default function Navbar() {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  return (
    <header style={{
      background: '#FFFFFF',
      borderBottom: '3px solid var(--border-color)',
      position: 'sticky',
      top: 0,
      zIndex: 100,
      boxShadow: '0 4px 12px rgba(15, 23, 42, 0.05)'
    }}>
      <div style={{
        maxWidth: 1200,
        margin: '0 auto',
        padding: '14px 20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 16
      }}>
        {/* Brand */}
        <Link href="/" style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          textDecoration: 'none',
          color: 'var(--text-main)',
        }}>
          <div style={{
            background: 'var(--primary-blue)',
            color: '#FFFFFF',
            width: 44,
            height: 44,
            borderRadius: 12,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '2px solid var(--border-color)',
            boxShadow: 'var(--cartoon-shadow-sm)'
          }}>
            <BookOpen size={24} />
          </div>
          <div>
            <div style={{
              fontWeight: 900,
              fontSize: '1.25rem',
              letterSpacing: '-0.5px',
              display: 'flex',
              alignItems: 'center',
              gap: 6
            }}>
              Cloud Library
              <span style={{
                fontSize: '0.65rem',
                background: 'var(--accent-yellow)',
                border: '1.5px solid var(--border-color)',
                padding: '2px 6px',
                borderRadius: 9999,
                fontWeight: 800
              }}>v1.0</span>
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>
              Online Catalog & Circulation
            </div>
          </div>
        </Link>

        {/* Navigation Links */}
        <nav style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Link
            href="/"
            className={`cartoon-btn cartoon-btn-secondary`}
            style={{
              padding: '8px 14px',
              fontSize: '0.9rem',
              borderColor: pathname === '/' ? 'var(--primary-blue)' : 'var(--border-color)',
              background: pathname === '/' ? 'var(--primary-light)' : '#FFFFFF'
            }}
          >
            <BookOpen size={16} />
            Catalog
          </Link>

          {user?.role === 'member' && (
            <Link
              href="/patron/dashboard"
              className={`cartoon-btn cartoon-btn-secondary`}
              style={{
                padding: '8px 14px',
                fontSize: '0.9rem',
                borderColor: pathname === '/patron/dashboard' ? 'var(--primary-blue)' : 'var(--border-color)',
                background: pathname === '/patron/dashboard' ? 'var(--primary-light)' : '#FFFFFF'
              }}
            >
              <BookMarked size={16} />
              My Borrowed Books
            </Link>
          )}

          {user?.role === 'staff' && (
            <Link
              href="/staff/dashboard"
              className={`cartoon-btn cartoon-btn-secondary`}
              style={{
                padding: '8px 14px',
                fontSize: '0.9rem',
                borderColor: pathname === '/staff/dashboard' ? 'var(--primary-blue)' : 'var(--border-color)',
                background: pathname === '/staff/dashboard' ? 'var(--primary-light)' : '#FFFFFF'
              }}
            >
              <Shield size={16} />
              Staff Dashboard
            </Link>
          )}

          {/* User Status / Login Button */}
          {user ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{
                background: user.role === 'staff' ? '#FEF3C7' : 'var(--primary-light)',
                border: '2px solid var(--border-color)',
                padding: '6px 12px',
                borderRadius: 12,
                fontSize: '0.85rem',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                gap: 6
              }}>
                {user.role === 'staff' ? <Shield size={14} color="#B45309" /> : <GraduationCap size={14} color="var(--primary-blue)" />}
                <span>{user.role === 'staff' ? 'Staff:' : 'Patron:'} {user.full_name}</span>
              </div>
              <button
                onClick={handleLogout}
                className="cartoon-btn cartoon-btn-danger"
                style={{ padding: '8px 12px', fontSize: '0.85rem' }}
                title="Log out"
              >
                <LogOut size={16} />
              </button>
            </div>
          ) : (
            <Link
              href="/login"
              className="cartoon-btn cartoon-btn-primary"
              style={{ padding: '8px 18px', fontSize: '0.9rem' }}
            >
              <User size={16} />
              Login / Sign Up
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
