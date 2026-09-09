'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { circulationApi, BorrowRecord, MemberRecord } from '@/lib/api';
import { Shield, Users, BookMarked, CheckCircle2, RotateCcw, Search, Filter, AlertCircle, RefreshCw } from 'lucide-react';

export default function StaffDashboardPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();

  const [activeTab, setActiveTab] = useState<'circulation' | 'members'>('circulation');
  const [stats, setStats] = useState<{ total_members: number; active_loans: number; returned_loans: number } | null>(null);
  const [loans, setLoans] = useState<BorrowRecord[]>([]);
  const [members, setMembers] = useState<MemberRecord[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const loadData = async () => {
    if (!user || user.role !== 'staff') return;
    try {
      setIsLoading(true);
      const [statsData, loansData, membersData] = await Promise.all([
        circulationApi.getStats(user.token).catch(() => null),
        circulationApi.getAllLoans(user.token, statusFilter).catch(() => []),
        circulationApi.getMembers(user.token).catch(() => []),
      ]);
      setStats(statsData);
      setLoans(loansData);
      setMembers(membersData);
    } catch (err) {
      console.error('Error fetching staff data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.push('/login');
      } else if (user.role !== 'staff') {
        router.push('/patron/dashboard');
      } else {
        loadData();
      }
    }
  }, [user, authLoading, statusFilter]);

  const handleStaffReturn = async (loanId: number, title: string, borrower: string) => {
    if (!user) return;
    try {
      await circulationApi.returnBook(user.token, loanId);
      setActionSuccess(`Book "${title}" returned on behalf of ${borrower}. Catalog updated.`);
      loadData();
      setTimeout(() => setActionSuccess(null), 5000);
    } catch (err: any) {
      alert(err.message || 'Failed to process return');
    }
  };

  if (authLoading || (!user && isLoading)) {
    return (
      <div className="container" style={{ textAlign: 'center', paddingTop: 80 }}>
        <h2>Verifying Staff Credentials...</h2>
      </div>
    );
  }

  return (
    <div className="container">
      {/* Staff Header Banner */}
      <section style={{
        background: '#FFFBEB',
        border: '3px solid #D97706',
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
            background: 'var(--accent-yellow)',
            width: 64,
            height: 64,
            borderRadius: 18,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '2.5px solid var(--border-color)',
            boxShadow: 'var(--cartoon-shadow-sm)'
          }}>
            <Shield size={32} color="#B45309" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <h1 style={{ fontSize: '1.5rem', fontWeight: 900 }}>Staff Administration Hub</h1>
              <span style={{
                background: '#FEF3C7',
                color: '#92400E',
                padding: '2px 8px',
                borderRadius: 9999,
                fontSize: '0.75rem',
                fontWeight: 800,
                border: '1.5px solid #D97706'
              }}>
                Authorized Officer
              </span>
            </div>
            <div style={{ fontSize: '0.9rem', color: '#78350F', fontWeight: 600 }}>
              Logged in as {user?.full_name} ({user?.email})
            </div>
          </div>
        </div>

        <button
          onClick={loadData}
          className="cartoon-btn cartoon-btn-secondary"
          style={{ fontSize: '0.9rem' }}
        >
          <RefreshCw size={16} />
          Refresh Records
        </button>
      </section>

      {/* Metrics Cards */}
      <section style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
        gap: 20,
        marginBottom: 32
      }}>
        <div className="cartoon-card" style={{ padding: 22, background: '#FFFFFF' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <span style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--text-muted)' }}>REGISTERED MEMBERS</span>
            <Users size={24} color="var(--primary-blue)" />
          </div>
          <div style={{ fontSize: '2.2rem', fontWeight: 900 }}>{stats?.total_members ?? members.length}</div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 4 }}>Member profiles in Circulation DB</div>
        </div>

        <div className="cartoon-card" style={{ padding: 22, background: '#FFFFFF' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <span style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--text-muted)' }}>ACTIVE LOANS</span>
            <BookMarked size={24} color="#D97706" />
          </div>
          <div style={{ fontSize: '2.2rem', fontWeight: 900, color: '#D97706' }}>
            {stats?.active_loans ?? loans.filter((l) => l.status === 'BORROWED').length}
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 4 }}>Books currently checked out</div>
        </div>

        <div className="cartoon-card" style={{ padding: 22, background: '#FFFFFF' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <span style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--text-muted)' }}>RETURNED LOANS</span>
            <CheckCircle2 size={24} color="#166534" />
          </div>
          <div style={{ fontSize: '2.2rem', fontWeight: 900, color: '#166534' }}>
            {stats?.returned_loans ?? loans.filter((l) => l.status === 'RETURNED').length}
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 4 }}>Completed reading transactions</div>
        </div>
      </section>

      {actionSuccess && (
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
          <span>{actionSuccess}</span>
        </div>
      )}

      {/* Main Content Tabs */}
      <section>
        <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
          <button
            onClick={() => setActiveTab('circulation')}
            className={`cartoon-btn ${activeTab === 'circulation' ? 'cartoon-btn-primary' : 'cartoon-btn-secondary'}`}
          >
            <BookMarked size={16} />
            Borrowing Logs & Circulation
          </button>
          <button
            onClick={() => setActiveTab('members')}
            className={`cartoon-btn ${activeTab === 'members' ? 'cartoon-btn-primary' : 'cartoon-btn-secondary'}`}
          >
            <Users size={16} />
            Member Directory ({members.length})
          </button>
        </div>

        {/* 1. Circulation View */}
        {activeTab === 'circulation' && (
          <div className="cartoon-card" style={{ padding: 24, background: '#FFFFFF' }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: 14,
              marginBottom: 20
            }}>
              <div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 900 }}>Circulation Records</h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  Monitor book checkouts and process return confirmations
                </p>
              </div>

              {/* Status Filter */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 700 }}>Filter:</span>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="cartoon-input"
                  style={{ width: 'auto', padding: '6px 12px', fontSize: '0.85rem' }}
                >
                  <option value="all">All Loans</option>
                  <option value="BORROWED">Active Borrowed</option>
                  <option value="RETURNED">Returned</option>
                </select>
              </div>
            </div>

            {loans.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 36, color: 'var(--text-muted)' }}>
                No loan records found for this filter.
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.88rem' }}>
                  <thead>
                    <tr style={{ background: 'var(--bg-secondary)', borderBottom: '2.5px solid var(--border-color)' }}>
                      <th style={{ padding: '12px 14px', fontWeight: 800 }}>Loan ID</th>
                      <th style={{ padding: '12px 14px', fontWeight: 800 }}>Book Title</th>
                      <th style={{ padding: '12px 14px', fontWeight: 800 }}>Borrower</th>
                      <th style={{ padding: '12px 14px', fontWeight: 800 }}>Borrowed On</th>
                      <th style={{ padding: '12px 14px', fontWeight: 800 }}>Due Date</th>
                      <th style={{ padding: '12px 14px', fontWeight: 800 }}>Status</th>
                      <th style={{ padding: '12px 14px', fontWeight: 800, textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loans.map((loan, idx) => {
                      const isBorrowed = loan.status === 'BORROWED';
                      return (
                        <tr key={loan.id} style={{
                          borderBottom: idx === loans.length - 1 ? 'none' : '1.5px solid #E2E8F0'
                        }}>
                          <td style={{ padding: '12px 14px', fontWeight: 700 }}>#{loan.id}</td>
                          <td style={{ padding: '12px 14px', fontWeight: 800, color: 'var(--primary-blue)' }}>
                            {loan.book_title}
                          </td>
                          <td style={{ padding: '12px 14px' }}>
                            <div style={{ fontWeight: 700 }}>{loan.member_name}</div>
                            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{loan.member_email}</div>
                          </td>
                          <td style={{ padding: '12px 14px', color: 'var(--text-muted)' }}>
                            {new Date(loan.borrowed_at).toLocaleDateString()}
                          </td>
                          <td style={{ padding: '12px 14px', fontWeight: 700, color: isBorrowed ? '#B45309' : 'inherit' }}>
                            {new Date(loan.due_date).toLocaleDateString()}
                          </td>
                          <td style={{ padding: '12px 14px' }}>
                            <span style={{
                              background: isBorrowed ? 'var(--accent-yellow)' : 'var(--accent-green)',
                              color: isBorrowed ? '#78350F' : 'var(--accent-green-text)',
                              padding: '4px 10px',
                              borderRadius: 9999,
                              fontSize: '0.78rem',
                              fontWeight: 800,
                              border: '1.5px solid var(--border-color)'
                            }}>
                              {loan.status}
                            </span>
                          </td>
                          <td style={{ padding: '12px 14px', textAlign: 'right' }}>
                            {isBorrowed ? (
                              <button
                                onClick={() => handleStaffReturn(loan.id, loan.book_title, loan.member_name)}
                                className="cartoon-btn cartoon-btn-secondary"
                                style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                                title="Process return and increment catalog available count"
                              >
                                <RotateCcw size={14} />
                                Process Return
                              </button>
                            ) : (
                              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>Completed</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* 2. Member Directory View */}
        {activeTab === 'members' && (
          <div className="cartoon-card" style={{ padding: 24, background: '#FFFFFF' }}>
            <div style={{ marginBottom: 20 }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 900 }}>Member Directory</h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                Patrons registered in the system with active library credentials
              </p>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.88rem' }}>
                <thead>
                  <tr style={{ background: 'var(--bg-secondary)', borderBottom: '2.5px solid var(--border-color)' }}>
                    <th style={{ padding: '12px 14px', fontWeight: 800 }}>Membership Card #</th>
                    <th style={{ padding: '12px 14px', fontWeight: 800 }}>Full Name</th>
                    <th style={{ padding: '12px 14px', fontWeight: 800 }}>Email Address</th>
                    <th style={{ padding: '12px 14px', fontWeight: 800 }}>Active Borrows</th>
                    <th style={{ padding: '12px 14px', fontWeight: 800 }}>Member Status</th>
                    <th style={{ padding: '12px 14px', fontWeight: 800 }}>Enrolled Date</th>
                  </tr>
                </thead>
                <tbody>
                  {members.map((member, idx) => (
                    <tr key={member.id} style={{
                      borderBottom: idx === members.length - 1 ? 'none' : '1.5px solid #E2E8F0'
                    }}>
                      <td style={{ padding: '12px 14px' }}>
                        <span style={{
                          fontFamily: 'monospace',
                          fontWeight: 800,
                          background: 'var(--primary-light)',
                          padding: '3px 8px',
                          borderRadius: 8,
                          border: '1.5px solid var(--border-color)'
                        }}>
                          {member.membership_number}
                        </span>
                      </td>
                      <td style={{ padding: '12px 14px', fontWeight: 800 }}>{member.full_name}</td>
                      <td style={{ padding: '12px 14px', color: 'var(--text-muted)' }}>{member.email}</td>
                      <td style={{ padding: '12px 14px' }}>
                        <span style={{
                          background: (member.active_borrowings ?? 0) > 0 ? 'var(--accent-coral)' : 'var(--bg-secondary)',
                          color: (member.active_borrowings ?? 0) > 0 ? 'var(--accent-coral-text)' : 'inherit',
                          fontWeight: 800,
                          padding: '3px 10px',
                          borderRadius: 9999,
                          border: '1.5px solid var(--border-color)',
                          fontSize: '0.8rem'
                        }}>
                          {member.active_borrowings ?? 0} book(s)
                        </span>
                      </td>
                      <td style={{ padding: '12px 14px' }}>
                        <span style={{
                          background: 'var(--accent-green)',
                          color: 'var(--accent-green-text)',
                          padding: '3px 8px',
                          borderRadius: 9999,
                          fontSize: '0.78rem',
                          fontWeight: 800,
                          border: '1.5px solid var(--border-color)'
                        }}>
                          {member.status}
                        </span>
                      </td>
                      <td style={{ padding: '12px 14px', color: 'var(--text-muted)' }}>
                        {new Date(member.joined_date).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
