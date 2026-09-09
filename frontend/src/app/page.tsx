'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { catalogApi, circulationApi, Book, Category } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import {
  Search,
  BookOpen,
  CheckCircle,
  AlertCircle,
  Sparkles,
  Filter,
  ArrowRight,
  Compass,
  Cpu,
  Landmark,
  Lightbulb,
  Palette
} from 'lucide-react';
import Link from 'next/link';

export default function HomePage() {
  const router = useRouter();
  const { user } = useAuth();

  const [categories, setCategories] = useState<Category[]>([]);
  const [books, setBooks] = useState<Book[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Borrow Modal State
  const [selectedBookForBorrow, setSelectedBookForBorrow] = useState<Book | null>(null);
  const [borrowLoading, setBorrowLoading] = useState<boolean>(false);
  const [borrowSuccessMsg, setBorrowSuccessMsg] = useState<string | null>(null);
  const [borrowErrorMsg, setBorrowErrorMsg] = useState<string | null>(null);

  // Helper to render crisp Lucide category icon instead of emojis
  const renderCategoryIcon = (iconName: string) => {
    switch (iconName?.toLowerCase()) {
      case 'cpu':
        return <Cpu size={16} />;
      case 'landmark':
        return <Landmark size={16} />;
      case 'lightbulb':
        return <Lightbulb size={16} />;
      case 'palette':
        return <Palette size={16} />;
      case 'sparkles':
        return <Sparkles size={16} />;
      case 'book':
      default:
        return <BookOpen size={16} />;
    }
  };

  // Fetch initial data
  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [catList, bookList] = await Promise.all([
        catalogApi.getCategories().catch(() => []),
        catalogApi.getBooks(selectedCategory, searchQuery).catch(() => []),
      ]);
      setCategories(catList);
      setBooks(bookList);
    } catch (err) {
      console.error('Error fetching catalog:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedCategory]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchData();
  };

  const handleInitiateBorrow = (book: Book) => {
    if (!user) {
      router.push(`/login?redirect=borrow&bookId=${book.id}&bookTitle=${encodeURIComponent(book.title)}`);
      return;
    }
    if (user.role === 'staff') {
      alert('Staff accounts administer the catalog. To borrow as a patron, please use a Member account.');
      return;
    }
    setBorrowErrorMsg(null);
    setBorrowSuccessMsg(null);
    setSelectedBookForBorrow(book);
  };

  const handleConfirmBorrow = async () => {
    if (!selectedBookForBorrow || !user) return;
    try {
      setBorrowLoading(true);
      setBorrowErrorMsg(null);
      await circulationApi.borrowBook(user.token, selectedBookForBorrow.id, selectedBookForBorrow.title);
      setBorrowSuccessMsg(`Success! "${selectedBookForBorrow.title}" has been issued to your account for 14 days.`);
      fetchData();
    } catch (err: any) {
      setBorrowErrorMsg(err.message || 'Failed to borrow book.');
    } finally {
      setBorrowLoading(false);
    }
  };

  return (
    <div className="container">
      {/* Hero Section */}
      <section style={{
        background: 'linear-gradient(135deg, #FFFFFF 0%, #EBF4FF 100%)',
        border: '3px solid var(--border-color)',
        borderRadius: 24,
        padding: '36px 32px',
        boxShadow: 'var(--cartoon-shadow)',
        marginBottom: 36,
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{ maxWidth: 680 }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            background: 'var(--accent-yellow)',
            border: '2px solid var(--border-color)',
            padding: '6px 14px',
            borderRadius: 9999,
            fontWeight: 800,
            fontSize: '0.85rem',
            marginBottom: 16
          }}>
            <Sparkles size={16} color="#78350F" />
            Public Digital Library
          </div>

          <h1 style={{
            fontSize: '2.5rem',
            fontWeight: 900,
            lineHeight: 1.2,
            letterSpacing: '-1px',
            marginBottom: 12,
            color: 'var(--text-main)'
          }}>
            Discover, Learn, and Borrow Knowledge
          </h1>

          <p style={{
            fontSize: '1.1rem',
            color: 'var(--text-muted)',
            fontWeight: 500,
            marginBottom: 24
          }}>
            Welcome to the community library catalog. Explore thousands of titles across literature, science, and history, reserve copies with instant digital checkout, and manage your personal loans with ease.
          </p>

          {/* Search Form */}
          <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: 10, maxWidth: 540 }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <input
                type="text"
                placeholder="Search by title, author, or ISBN..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="cartoon-input"
                style={{ paddingLeft: 42 }}
              />
              <Search
                size={20}
                style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }}
              />
            </div>
            <button type="submit" className="cartoon-btn cartoon-btn-primary">
              Search
            </button>
          </form>
        </div>
      </section>

      {/* Category Pills */}
      <section style={{ marginBottom: 32 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
          <Filter size={18} />
          <h2 style={{ fontSize: '1.1rem', fontWeight: 800 }}>Browse by Category</h2>
        </div>

        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button
            onClick={() => setSelectedCategory('all')}
            className={`cartoon-pill ${selectedCategory === 'all' ? 'cartoon-btn-primary' : 'cartoon-btn-secondary'}`}
            style={{ cursor: 'pointer' }}
          >
            <Compass size={16} />
            <span>All Categories</span>
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.slug)}
              className={`cartoon-pill ${selectedCategory === cat.slug ? 'cartoon-btn-primary' : 'cartoon-btn-secondary'}`}
              style={{ cursor: 'pointer' }}
            >
              {renderCategoryIcon(cat.icon)}
              <span>{cat.name}</span>
            </button>
          ))}
        </div>
      </section>

      {/* Books Grid */}
      <section>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
          <h2 style={{ fontSize: '1.3rem', fontWeight: 800 }}>
            Available Catalog ({books.length} titles)
          </h2>
          {isLoading && <span style={{ fontSize: '0.9rem', color: 'var(--primary-blue)', fontWeight: 700 }}>Loading catalog...</span>}
        </div>

        {books.length === 0 && !isLoading ? (
          <div className="cartoon-card" style={{ padding: 48, textAlign: 'center' }}>
            <Search size={48} color="var(--primary-blue)" style={{ margin: '0 auto 12px auto' }} />
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: 8 }}>No books matched your criteria</h3>
            <p style={{ color: 'var(--text-muted)', marginBottom: 16 }}>Try searching for another keyword or reset the category filter.</p>
            <button
              onClick={() => { setSelectedCategory('all'); setSearchQuery(''); fetchData(); }}
              className="cartoon-btn cartoon-btn-primary"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: 24
          }}>
            {books.map((book) => {
              const isAvailable = book.available_copies > 0;
              return (
                <div key={book.id} className="cartoon-card" style={{
                  display: 'flex',
                  flexDirection: 'column',
                  overflow: 'hidden',
                  background: '#FFFFFF'
                }}>
                  {/* Book Top Banner with real photo */}
                  <div style={{
                    height: 180,
                    width: '100%',
                    position: 'relative',
                    overflow: 'hidden',
                    borderBottom: '2.5px solid var(--border-color)',
                    backgroundColor: '#E2E8F0'
                  }}>
                    <img
                      src={book.cover_image}
                      alt={book.title}
                      loading="lazy"
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        transition: 'transform 0.3s ease'
                      }}
                    />
                    <span style={{
                      position: 'absolute',
                      top: 10,
                      right: 10,
                      background: 'rgba(255,255,255,0.95)',
                      border: '1.5px solid var(--border-color)',
                      padding: '2px 8px',
                      borderRadius: 9999,
                      fontSize: '0.75rem',
                      fontWeight: 800
                    }}>
                      {book.published_year}
                    </span>
                  </div>

                  {/* Content */}
                  <div style={{ padding: 18, display: 'flex', flexDirection: 'column', flex: 1 }}>
                    <div style={{
                      fontSize: '0.75rem',
                      fontWeight: 800,
                      color: 'var(--primary-blue)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                      marginBottom: 4
                    }}>
                      {book.category_name}
                    </div>

                    <h3 style={{
                      fontSize: '1.15rem',
                      fontWeight: 800,
                      lineHeight: 1.3,
                      marginBottom: 6,
                      color: 'var(--text-main)'
                    }}>
                      {book.title}
                    </h3>

                    <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600, marginBottom: 12 }}>
                      by {book.author}
                    </div>

                    <p style={{
                      fontSize: '0.85rem',
                      color: '#475569',
                      lineHeight: 1.45,
                      marginBottom: 16,
                      flex: 1
                    }}>
                      {book.description}
                    </p>

                    {/* Stock Status Badge */}
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '8px 12px',
                      background: isAvailable ? 'var(--accent-green)' : 'var(--accent-coral)',
                      border: '2px solid var(--border-color)',
                      borderRadius: 12,
                      marginBottom: 14
                    }}>
                      <span style={{
                        fontSize: '0.8rem',
                        fontWeight: 800,
                        color: isAvailable ? 'var(--accent-green-text)' : 'var(--accent-coral-text)'
                      }}>
                        {isAvailable ? 'In Stock' : 'Out of Stock'}
                      </span>
                      <span style={{
                        fontSize: '0.8rem',
                        fontWeight: 800,
                        color: isAvailable ? 'var(--accent-green-text)' : 'var(--accent-coral-text)'
                      }}>
                        {book.available_copies} of {book.total_copies} available
                      </span>
                    </div>

                    {/* Borrow Button */}
                    <button
                      onClick={() => handleInitiateBorrow(book)}
                      disabled={!isAvailable}
                      className={`cartoon-btn ${isAvailable ? 'cartoon-btn-primary' : 'cartoon-btn-secondary'}`}
                      style={{
                        width: '100%',
                        opacity: isAvailable ? 1 : 0.6,
                        cursor: isAvailable ? 'pointer' : 'not-allowed'
                      }}
                    >
                      <BookOpen size={16} />
                      {user ? 'Borrow This Book' : 'Login to Borrow'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Borrow Confirmation Modal */}
      {selectedBookForBorrow && (
        <div className="modal-overlay" onClick={() => setSelectedBookForBorrow(null)}>
          <div
            className="cartoon-card"
            style={{ maxWidth: 480, width: '100%', padding: 28, background: '#FFFFFF' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 }}>
              <img
                src={selectedBookForBorrow.cover_image}
                alt={selectedBookForBorrow.title}
                style={{
                  width: 52,
                  height: 52,
                  borderRadius: 12,
                  objectFit: 'cover',
                  border: '2px solid var(--border-color)',
                  boxShadow: 'var(--cartoon-shadow-sm)'
                }}
              />
              <div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 800 }}>Confirm Book Loan</h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Circulation & Lending Desk</p>
              </div>
            </div>

            {borrowSuccessMsg ? (
              <div>
                <div style={{
                  padding: 16,
                  background: 'var(--accent-green)',
                  border: '2px solid var(--border-color)',
                  borderRadius: 14,
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 12,
                  marginBottom: 20
                }}>
                  <CheckCircle size={22} color="var(--accent-green-text)" />
                  <div>
                    <div style={{ fontWeight: 800, color: 'var(--accent-green-text)', marginBottom: 4 }}>Loan Confirmed!</div>
                    <div style={{ fontSize: '0.9rem', color: 'var(--accent-green-text)' }}>{borrowSuccessMsg}</div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 12 }}>
                  <Link
                    href="/patron/dashboard"
                    className="cartoon-btn cartoon-btn-primary"
                    style={{ flex: 1 }}
                  >
                    Go to My Loans
                    <ArrowRight size={16} />
                  </Link>
                  <button
                    onClick={() => setSelectedBookForBorrow(null)}
                    className="cartoon-btn cartoon-btn-secondary"
                  >
                    Close
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <div style={{
                  background: 'var(--primary-light)',
                  border: '2px solid var(--border-color)',
                  borderRadius: 14,
                  padding: 16,
                  marginBottom: 18
                }}>
                  <div style={{ fontWeight: 800, fontSize: '1rem', marginBottom: 4 }}>
                    {selectedBookForBorrow.title}
                  </div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: 8 }}>
                    Author: {selectedBookForBorrow.author} | ISBN: {selectedBookForBorrow.isbn}
                  </div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--primary-blue)' }}>
                    Borrower: {user?.full_name} ({user?.email})
                  </div>
                  <div style={{ fontSize: '0.85rem', color: '#475569', marginTop: 4 }}>
                    Standard loan duration: <strong>14 Days</strong>
                  </div>
                </div>

                {borrowErrorMsg && (
                  <div style={{
                    padding: 12,
                    background: 'var(--accent-coral)',
                    border: '2px solid var(--border-color)',
                    borderRadius: 12,
                    color: 'var(--accent-coral-text)',
                    fontSize: '0.85rem',
                    fontWeight: 700,
                    marginBottom: 16,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8
                  }}>
                    <AlertCircle size={18} />
                    {borrowErrorMsg}
                  </div>
                )}

                <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
                  <button
                    onClick={() => setSelectedBookForBorrow(null)}
                    className="cartoon-btn cartoon-btn-secondary"
                    disabled={borrowLoading}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleConfirmBorrow}
                    className="cartoon-btn cartoon-btn-primary"
                    disabled={borrowLoading}
                  >
                    {borrowLoading ? 'Processing Loan...' : 'Confirm & Checkout'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
