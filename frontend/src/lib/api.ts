// API Client Helper for Cloud Library Microservices

const API_BASE = process.env.NEXT_PUBLIC_API_URL || '';

export interface UserSession {
  token: string;
  user_id: number;
  email: string;
  full_name: string;
  role: 'member' | 'staff';
}

export interface Book {
  id: number;
  title: string;
  author: string;
  isbn: string;
  category_id: number;
  category_name?: string;
  description: string;
  cover_color: string;
  cover_image: string;
  total_copies: number;
  available_copies: number;
  published_year: number;
}

export interface Category {
  id: number;
  name: string;
  slug: string;
  icon: string;
  description: string;
}

export interface BorrowRecord {
  id: number;
  member_id: number;
  member_email: string;
  member_name: string;
  book_id: number;
  book_title: string;
  borrowed_at: string;
  due_date: string;
  returned_at: string | null;
  status: 'BORROWED' | 'RETURNED' | 'OVERDUE';
}

export interface MemberRecord {
  id: number;
  user_id: number;
  email: string;
  full_name: string;
  membership_number: string;
  status: 'ACTIVE' | 'SUSPENDED';
  joined_date: string;
  active_borrowings?: number;
}

// Helper to get auth headers
export function getAuthHeaders(token?: string) {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

// 1. Catalog API (Service 1 - Go)
export const catalogApi = {
  async getCategories(): Promise<Category[]> {
    const res = await fetch(`${API_BASE}/api/catalog/categories`);
    if (!res.ok) throw new Error('Failed to load categories');
    return res.json();
  },

  async getBooks(category = 'all', search = ''): Promise<Book[]> {
    const params = new URLSearchParams();
    if (category && category !== 'all') params.append('category', category);
    if (search) params.append('search', search);

    const res = await fetch(`${API_BASE}/api/catalog/books?${params.toString()}`);
    if (!res.ok) throw new Error('Failed to load books');
    return res.json();
  },

  async getBook(id: number): Promise<Book> {
    const res = await fetch(`${API_BASE}/api/catalog/books/${id}`);
    if (!res.ok) throw new Error('Failed to load book details');
    return res.json();
  },
};

// 2. Auth API (Service 2 - FastAPI / Python)
export const authApi = {
  async register(data: { email: string; password: string; full_name: string }): Promise<UserSession> {
    const res = await fetch(`${API_BASE}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.detail || 'Registration failed');
    return {
      token: json.access_token,
      user_id: json.user_id,
      email: json.email,
      full_name: json.full_name,
      role: json.role,
    };
  },

  async loginMember(data: { email: string; password: string }): Promise<UserSession> {
    const res = await fetch(`${API_BASE}/api/auth/login/member`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.detail || 'Login failed');
    return {
      token: json.access_token,
      user_id: json.user_id,
      email: json.email,
      full_name: json.full_name,
      role: json.role,
    };
  },

  async loginStaff(data: { email: string; password: string }): Promise<UserSession> {
    const res = await fetch(`${API_BASE}/api/auth/login/staff`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.detail || 'Staff login failed');
    return {
      token: json.access_token,
      user_id: json.user_id,
      email: json.email,
      full_name: json.full_name,
      role: json.role,
    };
  },

  async getMe(token: string) {
    const res = await fetch(`${API_BASE}/api/auth/me`, {
      headers: getAuthHeaders(token),
    });
    if (!res.ok) throw new Error('Session invalid');
    return res.json();
  },
};

// 3. Circulation API (Service 3 - Node.js / TypeScript)
export const circulationApi = {
  async borrowBook(token: string, book_id: number, book_title: string) {
    const res = await fetch(`${API_BASE}/api/circulation/borrow`, {
      method: 'POST',
      headers: getAuthHeaders(token),
      body: JSON.stringify({ book_id, book_title }),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Borrow request failed');
    return json;
  },

  async returnBook(token: string, loanId: number) {
    const res = await fetch(`${API_BASE}/api/circulation/return/${loanId}`, {
      method: 'POST',
      headers: getAuthHeaders(token),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Return request failed');
    return json;
  },

  async getMyLoans(token: string): Promise<BorrowRecord[]> {
    const res = await fetch(`${API_BASE}/api/circulation/my-loans`, {
      headers: getAuthHeaders(token),
    });
    if (!res.ok) throw new Error('Failed to fetch personal loans');
    return res.json();
  },

  async getAllLoans(token: string, status = 'all'): Promise<BorrowRecord[]> {
    const res = await fetch(`${API_BASE}/api/circulation/loans?status=${status}`, {
      headers: getAuthHeaders(token),
    });
    if (!res.ok) throw new Error('Failed to fetch circulation loans');
    return res.json();
  },

  async getMembers(token: string): Promise<MemberRecord[]> {
    const res = await fetch(`${API_BASE}/api/circulation/members`, {
      headers: getAuthHeaders(token),
    });
    if (!res.ok) throw new Error('Failed to fetch members');
    return res.json();
  },

  async getStats(token: string) {
    const res = await fetch(`${API_BASE}/api/circulation/stats`, {
      headers: getAuthHeaders(token),
    });
    if (!res.ok) throw new Error('Failed to fetch stats');
    return res.json();
  },
};
