import os
import time
import datetime
from typing import Optional
from fastapi import FastAPI, HTTPException, Depends, status, Header
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, EmailStr
from sqlalchemy import create_engine, Column, Integer, String, DateTime
from sqlalchemy.orm import declarative_base, sessionmaker, Session
from passlib.context import CryptContext
import jwt

# Environment Configurations
DB_HOST = os.getenv("DB_HOST", "auth-db")
DB_PORT = os.getenv("DB_PORT", "5432")
DB_USER = os.getenv("DB_USER", "auth_user")
DB_PASSWORD = os.getenv("DB_PASSWORD", "auth_pass")
DB_NAME = os.getenv("DB_NAME", "auth_db")
JWT_SECRET = os.getenv("JWT_SECRET", "super-secret-library-jwt-key-change-in-prod")
JWT_ALGORITHM = "HS256"
JWT_EXPIRATION_HOURS = 24

DATABASE_URL = f"postgresql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}"

# Setup Database & Retry Loop
engine = None
for attempt in range(1, 31):
    try:
        engine = create_engine(DATABASE_URL, pool_pre_ping=True)
        with engine.connect() as conn:
            print(f"Connected to PostgreSQL successfully on attempt {attempt}!")
        break
    except Exception as e:
        print(f"Waiting for Postgres (attempt {attempt}/30): {e}")
        time.sleep(2)

if engine is None:
    raise RuntimeError("Failed to connect to PostgreSQL after 30 attempts")

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Models
class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    full_name = Column(String(255), nullable=False)
    role = Column(String(50), nullable=False, default="member")  # 'member' or 'staff'
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

Base.metadata.create_all(bind=engine)

# Helper Functions
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def create_access_token(user_id: int, email: str, full_name: str, role: str) -> str:
    payload = {
        "sub": str(user_id),
        "email": email,
        "full_name": full_name,
        "role": role,
        "exp": datetime.datetime.utcnow() + datetime.timedelta(hours=JWT_EXPIRATION_HOURS)
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

def get_current_user_payload(authorization: Optional[str] = Header(None)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Missing or invalid bearer token")
    token = authorization.split(" ")[1]
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token has expired")
    except Exception:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid authentication token")

# Seed initial default users
def seed_default_users():
    db = SessionLocal()
    try:
        # Check Staff
        staff = db.query(User).filter(User.email == "staff@library.com").first()
        if not staff:
            db.add(User(
                email="staff@library.com",
                password_hash=hash_password("staff123"),
                full_name="Head Librarian Elena",
                role="staff"
            ))
            print("Seeded default staff: staff@library.com / staff123")

        # Check Patron
        patron = db.query(User).filter(User.email == "patron@library.com").first()
        if not patron:
            db.add(User(
                email="patron@library.com",
                password_hash=hash_password("patron123"),
                full_name="Alex Morgan (Demo Patron)",
                role="member"
            ))
            print("Seeded default patron: patron@library.com / patron123")

        patron2 = db.query(User).filter(User.email == "alice@library.com").first()
        if not patron2:
            db.add(User(
                email="alice@library.com",
                password_hash=hash_password("alice123"),
                full_name="Alice Wonder",
                role="member"
            ))
            print("Seeded default patron: alice@library.com / alice123")

        db.commit()
    finally:
        db.close()

seed_default_users()

# Schemas
class RegisterRequest(BaseModel):
    email: EmailStr
    password: str
    full_name: str

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class AuthResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user_id: int
    email: str
    full_name: str
    role: str

# FastAPI Application
app = FastAPI(
    title="Cloud Library - Auth Service",
    description="Microservice for patron and staff authentication",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
def health_check():
    return {"status": "healthy", "service": "auth-service (FastAPI/Python)"}

@app.post("/api/auth/register", response_model=AuthResponse)
def register(req: RegisterRequest, db: Session = Depends(get_db)):
    existing = db.query(User).filter(User.email == req.email.lower()).first()
    if existing:
        raise HTTPException(status_code=400, detail="An account with this email already exists")

    new_user = User(
        email=req.email.lower(),
        password_hash=hash_password(req.password),
        full_name=req.full_name,
        role="member"
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    token = create_access_token(new_user.id, new_user.email, new_user.full_name, new_user.role)
    return AuthResponse(
        access_token=token,
        user_id=new_user.id,
        email=new_user.email,
        full_name=new_user.full_name,
        role=new_user.role
    )

@app.post("/api/auth/login/member", response_model=AuthResponse)
def login_member(req: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == req.email.lower()).first()
    if not user or not verify_password(req.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    if user.role != "member":
        raise HTTPException(
            status_code=403,
            detail="Staff credentials detected. Please log in using the Staff Portal."
        )

    token = create_access_token(user.id, user.email, user.full_name, user.role)
    return AuthResponse(
        access_token=token,
        user_id=user.id,
        email=user.email,
        full_name=user.full_name,
        role=user.role
    )

@app.post("/api/auth/login/staff", response_model=AuthResponse)
def login_staff(req: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == req.email.lower()).first()
    if not user or not verify_password(req.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid staff credentials")

    if user.role != "staff":
        raise HTTPException(
            status_code=403,
            detail="Access denied: You do not possess staff authorization."
        )

    token = create_access_token(user.id, user.email, user.full_name, user.role)
    return AuthResponse(
        access_token=token,
        user_id=user.id,
        email=user.email,
        full_name=user.full_name,
        role=user.role
    )

@app.get("/api/auth/me")
def get_me(payload: dict = Depends(get_current_user_payload), db: Session = Depends(get_db)):
    user_id = int(payload.get("sub"))
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return {
        "id": user.id,
        "email": user.email,
        "full_name": user.full_name,
        "role": user.role,
        "created_at": user.created_at
    }

@app.get("/api/auth/users")
def list_users(payload: dict = Depends(get_current_user_payload), db: Session = Depends(get_db)):
    if payload.get("role") != "staff":
        raise HTTPException(status_code=403, detail="Staff access required")
    users = db.query(User).order_by(User.id.asc()).all()
    return [{
        "id": u.id,
        "email": u.email,
        "full_name": u.full_name,
        "role": u.role,
        "created_at": u.created_at
    } for u in users]
