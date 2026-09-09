import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import mysql from 'mysql2/promise';
import jwt from 'jsonwebtoken';

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 8082;
const DB_HOST = process.env.DB_HOST || 'circulation-db';
const DB_PORT = parseInt(process.env.DB_PORT || '3306', 10);
const DB_USER = process.env.DB_USER || 'circulation_user';
const DB_PASSWORD = process.env.DB_PASSWORD || 'circulation_pass';
const DB_NAME = process.env.DB_NAME || 'circulation_db';
const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-library-jwt-key-change-in-prod';
const CATALOG_SERVICE_URL = process.env.CATALOG_SERVICE_URL || 'http://catalog-service:8081';

let pool: mysql.Pool;

async function initDB() {
  for (let attempt = 1; attempt <= 30; attempt++) {
    try {
      pool = mysql.createPool({
        host: DB_HOST,
        port: DB_PORT,
        user: DB_USER,
        password: DB_PASSWORD,
        database: DB_NAME,
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0,
      });

      const conn = await pool.getConnection();
      console.log(`Connected to Circulation MySQL successfully on attempt ${attempt}!`);
      conn.release();

      // Ensure tables exist
      await pool.query(`
        CREATE TABLE IF NOT EXISTS members (
          id INT AUTO_INCREMENT PRIMARY KEY,
          user_id INT NOT NULL,
          email VARCHAR(255) NOT NULL UNIQUE,
          full_name VARCHAR(255) NOT NULL,
          membership_number VARCHAR(50) NOT NULL UNIQUE,
          status VARCHAR(50) DEFAULT 'ACTIVE',
          joined_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);

      await pool.query(`
        CREATE TABLE IF NOT EXISTS borrowings (
          id INT AUTO_INCREMENT PRIMARY KEY,
          member_id INT NOT NULL,
          member_email VARCHAR(255) NOT NULL,
          member_name VARCHAR(255) NOT NULL,
          book_id INT NOT NULL,
          book_title VARCHAR(255) NOT NULL,
          borrowed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          due_date TIMESTAMP NOT NULL,
          returned_at TIMESTAMP NULL,
          status VARCHAR(50) DEFAULT 'BORROWED',
          notes TEXT,
          FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE CASCADE
        );
      `);

      return;
    } catch (err) {
      console.log(`Waiting for Circulation DB (attempt ${attempt}/30):`, err);
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }
  }
  throw new Error('Could not connect to Circulation MySQL database after 30 attempts');
}

// User Payload Interface from JWT
interface AuthUser {
  sub: string;
  email: string;
  full_name: string;
  role: 'member' | 'staff';
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

// Middleware: Authenticate JWT
function requireAuth(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authorization token required' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as AuthUser;
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

// Middleware: Require Staff Role
function requireStaff(req: Request, res: Response, next: NextFunction) {
  requireAuth(req, res, () => {
    if (req.user?.role !== 'staff') {
      return res.status(403).json({ error: 'Staff access required' });
    }
    next();
  });
}

// Helper: Get or create member record
async function getOrCreateMember(userId: number, email: string, fullName: string) {
  const [rows] = await pool.query<mysql.RowDataPacket[]>(
    'SELECT * FROM members WHERE email = ?',
    [email]
  );
  if (rows.length > 0) {
    return rows[0];
  }

  const membershipNumber = `LIB-MEM-${1000 + userId}`;
  const [insertRes] = await pool.query<mysql.ResultSetHeader>(
    'INSERT INTO members (user_id, email, full_name, membership_number, status) VALUES (?, ?, ?, ?, ?)',
    [userId, email, fullName, membershipNumber, 'ACTIVE']
  );

  return {
    id: insertRes.insertId,
    user_id: userId,
    email,
    full_name: fullName,
    membership_number: membershipNumber,
    status: 'ACTIVE',
  };
}

// Health Check
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', service: 'circulation-service (Node.js/TypeScript)' });
});

// Member Management: List Members (Staff Only)
app.get('/api/circulation/members', requireStaff, async (req, res) => {
  try {
    const [members] = await pool.query<mysql.RowDataPacket[]>(
      `SELECT m.*, 
              (SELECT COUNT(*) FROM borrowings b WHERE b.member_id = m.id AND b.status = 'BORROWED') as active_borrowings
       FROM members m
       ORDER BY m.id ASC`
    );
    res.json(members);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Circulation Stats Overview (Staff)
app.get('/api/circulation/stats', requireStaff, async (req, res) => {
  try {
    const [[membersCount]] = await pool.query<mysql.RowDataPacket[]>(
      'SELECT COUNT(*) as count FROM members'
    );
    const [[activeLoans]] = await pool.query<mysql.RowDataPacket[]>(
      "SELECT COUNT(*) as count FROM borrowings WHERE status = 'BORROWED'"
    );
    const [[returnedLoans]] = await pool.query<mysql.RowDataPacket[]>(
      "SELECT COUNT(*) as count FROM borrowings WHERE status = 'RETURNED'"
    );

    res.json({
      total_members: membersCount.count,
      active_loans: activeLoans.count,
      returned_loans: returnedLoans.count,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// All Borrowings / Loan Catalog (Staff Only)
app.get('/api/circulation/loans', requireStaff, async (req, res) => {
  try {
    const { status, member_id } = req.query;
    let query = 'SELECT * FROM borrowings WHERE 1=1';
    const params: any[] = [];

    if (status && typeof status === 'string' && status !== 'all') {
      query += ' AND status = ?';
      params.push(status);
    }
    if (member_id) {
      query += ' AND member_id = ?';
      params.push(member_id);
    }

    query += ' ORDER BY id DESC';
    const [loans] = await pool.query<mysql.RowDataPacket[]>(query, params);
    res.json(loans);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Patron: Get My Borrowings
app.get('/api/circulation/my-loans', requireAuth, async (req, res) => {
  try {
    const email = req.user!.email;
    const [loans] = await pool.query<mysql.RowDataPacket[]>(
      'SELECT * FROM borrowings WHERE member_email = ? ORDER BY id DESC',
      [email]
    );
    res.json(loans);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Borrow Confirmation (Patron or Staff)
app.post('/api/circulation/borrow', requireAuth, async (req, res) => {
  try {
    const { book_id, book_title } = req.body;
    if (!book_id || !book_title) {
      return res.status(400).json({ error: 'book_id and book_title are required' });
    }

    const userId = parseInt(req.user!.sub, 10);
    const email = req.user!.email;
    const fullName = req.user!.full_name;

    // Check if member already has active loan for this book
    const [existing] = await pool.query<mysql.RowDataPacket[]>(
      "SELECT id FROM borrowings WHERE member_email = ? AND book_id = ? AND status = 'BORROWED'",
      [email, book_id]
    );
    if (existing.length > 0) {
      return res.status(400).json({ error: 'You already currently have an active loan for this book!' });
    }

    // Call Catalog service to decrement copy
    try {
      const catalogRes = await fetch(`${CATALOG_SERVICE_URL}/api/catalog/books/${book_id}/decrement`, {
        method: 'POST',
      });
      if (!catalogRes.ok) {
        const errorData: any = await catalogRes.json().catch(() => ({}));
        return res.status(catalogRes.status).json({
          error: errorData.error || 'Failed to reserve book copy from catalog'
        });
      }
    } catch (err: any) {
      return res.status(502).json({
        error: `Failed to communicate with Catalog Service at ${CATALOG_SERVICE_URL}: ${err.message}`
      });
    }

    // Get or create member record in Circulation DB
    const member = await getOrCreateMember(userId, email, fullName);

    // Calculate due date (14 days loan period)
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 14);

    const [insertResult] = await pool.query<mysql.ResultSetHeader>(
      `INSERT INTO borrowings 
        (member_id, member_email, member_name, book_id, book_title, borrowed_at, due_date, status) 
       VALUES (?, ?, ?, ?, ?, NOW(), ?, 'BORROWED')`,
      [member.id, email, fullName, book_id, book_title, dueDate]
    );

    res.status(201).json({
      success: true,
      message: 'Book borrowed successfully! Enjoy your reading.',
      loan_id: insertResult.insertId,
      due_date: dueDate.toISOString(),
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Return Book (Member or Staff)
app.post('/api/circulation/return/:loanId', requireAuth, async (req, res) => {
  try {
    const loanId = parseInt(req.params.loanId, 10);
    const [loans] = await pool.query<mysql.RowDataPacket[]>(
      'SELECT * FROM borrowings WHERE id = ?',
      [loanId]
    );

    if (loans.length === 0) {
      return res.status(404).json({ error: 'Borrowing record not found' });
    }

    const loan = loans[0];
    if (loan.status === 'RETURNED') {
      return res.status(400).json({ error: 'This book has already been marked as returned' });
    }

    // Check authorization: member can only return their own loan, staff can return anyone's
    if (req.user!.role !== 'staff' && req.user!.email !== loan.member_email) {
      return res.status(403).json({ error: 'You are not authorized to return this loan' });
    }

    // Update status to RETURNED
    await pool.query(
      "UPDATE borrowings SET status = 'RETURNED', returned_at = NOW() WHERE id = ?",
      [loanId]
    );

    // Notify Catalog service to increment copy
    try {
      await fetch(`${CATALOG_SERVICE_URL}/api/catalog/books/${loan.book_id}/increment`, {
        method: 'POST',
      });
    } catch (err) {
      console.warn(`Could not increment catalog copy for book ${loan.book_id}:`, err);
    }

    res.json({
      success: true,
      message: 'Book returned successfully. Thank you!',
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

async function start() {
  await initDB();
  app.listen(PORT, () => {
    console.log(`Circulation Service (Node/TS) listening on port ${PORT}...`);
  });
}

start().catch((err) => {
  console.error('Fatal startup error in Circulation Service:', err);
  process.exit(1);
});
