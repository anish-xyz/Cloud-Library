'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { circulationApi, BorrowRecord } from '@/lib/api';
import { BookOpen, Calendar, CheckCircle2, Clock, RotateCcw, AlertTriangle, ArrowRight, UserCheck, GraduationCap } from 'lucide-react';
import Link from 'next/link';

export default function PatronDashboardPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();

  const [loans, setLoans] = useState<BorrowRecord[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const fetchLoans = async () => {
    if (!user) return;
    try {
      setIsLoading(true);
      const data = await circulationApi.getMyLoans(user.token);
      setLoans(data);
    } catch (err: any) {
      console.error('Failed to load loans:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.push('/login');
      } else if (user.role === 'staff') {
        router.push('/staff/dashboard');
      } else {
        fetchLoans();
      }
    }
  }, [user, authLoading]);

  const handleReturnBook = async (loanId: number, title: string) => {
    if (!user) return;
    try {
      await circulationApi.returnBook(user.token, loanId);
      setActionMessage(`"${title}" has been successfully returned!`);
      fetchLoans();
      setTimeout(() => setActionMessage(null), 5000);
    } catch (err: any) {
      alert(err.message || 'Failed to return book');
    }
  };

  if (authLoading || (!user && isLoading)) {
    return (
      <div className="container" style={{ textAlign: 'center', paddingTop: 80 }}>
        <h2>Loading Patron Portal...</h2>
      </div>
    );
  }

  const activeLoans = loans.filter((l) => l.status === 'BORROWED');
  const pastLoans = loans.filter((l) => l.status === 'RETURNED');

  return (
    <div className="container">
      {/* Member Card Profile Banner */}
      <section style={{
        background: '#FFFFFF',
        border: '3px solid var(--border-color)',
        borderRadius: 22,
        padding: '28px 24px',
        boxShadow: 'var(--cartoon-shadow)',
        marginBottom: 32,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 20
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{
            background: 'var(--primary-light)',
            width: 64,
            height: 64,
            borderRadius: 18,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '2.5px solid var(--border-color)',
            boxShadow: 'var(--cartoon-shadow-sm)'
          }}>
            <GraduationCap size={32} color="var(--primary-blue)" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <h1 style={{ fontSize: '1.5rem', fontWeight: 900 }}>{user?.full_name}</h1>
              <span style={{
                background: 'var(--accent-green)',
                color: 'var(--accent-green-text)',
                padding: '2px 8px',
                borderRadius: 9999,
                fontSize: '0.75rem',
                fontWeight: 800,
                border: '1.5px solid var(--border-color)'
              }}>
                Active Patron
              </span>
            </div>
            <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: 600 }}>
              {user?.email} • Managed by Circulation Service (Node/TS)
            </div>
          </div>
        </div>

        <Link href="/" className="cartoon-btn cartoon-btn-primary">
          <BookOpen size={16} />
          Browse More Books
        </Link>
      </section>

      {actionMessage && (
        <div style={{
          background: 'var(--accent-green)',
          border: '2px solid var(--border-color)',
          borderRadius: 14,
          padding: 14,
          marginBottom: 24,
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          color: 'var(--accent-green-text)',
          fontWeight: 800
        }}>
          <CheckCircle2 size={20} />
          <span>{actionMessage}</span>
        </div>
      )}

      {/* Active Borrowings */}
      <section style={{ marginBottom: 40 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
          <Clock size={22} color="var(--primary-blue)" />
          <h2 style={{ fontSize: '1.3rem', fontWeight: 900 }}>
            Currently Borrowed Books ({activeLoans.length})
          </h2>
        </div>

        {activeLoans.length === 0 ? (
          <div className="cartoon-card" style={{ padding: 36, textAlign: 'center', background: '#FFFFFF' }}>
            <BookOpen size={40} color="var(--primary-blue)" style={{ margin: '0 auto 12px auto' }} />
            <h3 style={{ fontSize: '1.15rem', fontWeight: 800, marginBottom: 6 }}>No Active Loans</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: 16 }}>
              You do not have any borrowed books at the moment. Head over to the catalog to borrow one!
            </p>
            <Link href="/" className="cartoon-btn cartoon-btn-primary">
              Explore Catalog
              <ArrowRight size={16} />
            </Link>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 20 }}>
            {activeLoans.map((loan) => (
              <div key={loan.id} className="cartoon-card" style={{ padding: 20, background: '#FFFFFF' }}>
                <div style={{
                  fontSize: '0.8rem',
                  fontWeight: 800,
                  color: 'var(--primary-blue)',
                  marginBottom: 6,
                  textTransform: 'uppercase'
                }}>
                  Loan #{loan.id}
                </div>

                <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: 12 }}>
                  {loan.book_title}
                </h3>

                <div style={{
                  background: 'var(--bg-secondary)',
                  borderRadius: 12,
                  padding: '10px 14px',
                  marginBottom: 16,
                  border: '1.5px solid var(--border-color)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 6,
                  fontSize: '0.85rem'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Borrowed On:</span>
                    <span style={{ fontWeight: 700 }}>{new Date(loan.borrowed_at).toLocaleDateString()}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Due Date:</span>
                    <span style={{ fontWeight: 800, color: '#B45309' }}>{new Date(loan.due_date).toLocaleDateString()}</span>
                  </div>
                </div>

                <button
                  onClick={() => handleReturnBook(loan.id, loan.book_title)}
                  className="cartoon-btn cartoon-btn-secondary"
                  style={{ width: '100%', borderColor: 'var(--border-color)' }}
                >
                  <RotateCcw size={16} />
                  Return This Book
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Borrowing History */}
      <section>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
          <CheckCircle2 size={22} color="#166534" />
          <h2 style={{ fontSize: '1.3rem', fontWeight: 900 }}>
            Returned Books History ({pastLoans.length})
          </h2>
        </div>

        {pastLoans.length === 0 ? (
          <div className="cartoon-card" style={{ padding: 24, textAlign: 'center', background: '#FFFFFF', color: 'var(--text-muted)' }}>
            No past returned books logged yet.
          </div>
        ) : (
          <div className="cartoon-card" style={{ overflow: 'hidden', background: '#FFFFFF' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
              <thead>
                <tr style={{ background: 'var(--bg-secondary)', borderBottom: '2.5px solid var(--border-color)' }}>
                  <th style={{ padding: '12px 16px', fontWeight: 800 }}>Book Title</th>
                  <th style={{ padding: '12px 16px', fontWeight: 800 }}>Borrowed On</th>
                  <th style={{ padding: '12px 16px', fontWeight: 800 }}>Returned On</th>
                  <th style={{ padding: '12px 16px', fontWeight: 800 }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {pastLoans.map((loan, idx) => (
                  <tr key={loan.id} style={{
                    borderBottom: idx === pastLoans.length - 1 ? 'none' : '1.5px solid #E2E8F0'
                  }}>
                    <td style={{ padding: '12px 16px', fontWeight: 700 }}>{loan.book_title}</td>
                    <td style={{ padding: '12px 16px', color: 'var(--text-muted)' }}>
                      {new Date(loan.borrowed_at).toLocaleDateString()}
                    </td>
                    <td style={{ padding: '12px 16px', color: 'var(--text-muted)' }}>
                      {loan.returned_at ? new Date(loan.returned_at).toLocaleDateString() : '—'}
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{
                        background: 'var(--accent-green)',
                        color: 'var(--accent-green-text)',
                        padding: '4px 10px',
                        borderRadius: 9999,
                        fontSize: '0.8rem',
                        fontWeight: 800,
                        border: '1.5px solid var(--border-color)'
                      }}>
                        Returned
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
