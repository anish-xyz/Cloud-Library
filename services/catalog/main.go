package main

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"
	"strconv"
	"strings"
	"time"

	_ "github.com/go-sql-driver/mysql"
)

type Category struct {
	ID          int    `json:"id"`
	Name        string `json:"name"`
	Slug        string `json:"slug"`
	Icon        string `json:"icon"`
	Description string `json:"description"`
}

type Book struct {
	ID              int       `json:"id"`
	Title           string    `json:"title"`
	Author          string    `json:"author"`
	ISBN            string    `json:"isbn"`
	CategoryID      int       `json:"category_id"`
	CategoryName    string    `json:"category_name,omitempty"`
	Description     string    `json:"description"`
	CoverColor      string    `json:"cover_color"`
	CoverImage      string    `json:"cover_image"`
	TotalCopies     int       `json:"total_copies"`
	AvailableCopies int       `json:"available_copies"`
	PublishedYear   int       `json:"published_year"`
	CreatedAt       time.Time `json:"created_at"`
}

var db *sql.DB

func initDB() {
	dbHost := getEnv("DB_HOST", "catalog-db")
	dbPort := getEnv("DB_PORT", "3306")
	dbUser := getEnv("DB_USER", "catalog_user")
	dbPass := getEnv("DB_PASSWORD", "catalog_pass")
	dbName := getEnv("DB_NAME", "catalog_db")

	dsn := fmt.Sprintf("%s:%s@tcp(%s:%s)/%s?parseTime=true&charset=utf8mb4",
		dbUser, dbPass, dbHost, dbPort, dbName)

	var err error
	for attempts := 1; attempts <= 30; attempts++ {
		db, err = sql.Open("mysql", dsn)
		if err == nil {
			err = db.Ping()
			if err == nil {
				log.Printf("Successfully connected to MySQL at %s:%s/%s", dbHost, dbPort, dbName)
				return
			}
		}
		log.Printf("Waiting for database connection (attempt %d/30): %v", attempts, err)
		time.Sleep(2 * time.Second)
	}

	log.Fatalf("Could not connect to database after 30 attempts: %v", err)
}

func getEnv(key, defaultVal string) string {
	if val, ok := os.LookupEnv(key); ok && val != "" {
		return val
	}
	return defaultVal
}

func enableCORS(w *http.ResponseWriter) {
	(*w).Header().Set("Access-Control-Allow-Origin", "*")
	(*w).Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
	(*w).Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")
}

func handleHealth(w http.ResponseWriter, r *http.Request) {
	enableCORS(&w)
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{
		"status":  "healthy",
		"service": "catalog-service (Go)",
	})
}

func handleGetCategories(w http.ResponseWriter, r *http.Request) {
	enableCORS(&w)
	if r.Method == http.MethodOptions {
		return
	}

	rows, err := db.Query("SELECT id, name, slug, icon, description FROM categories ORDER BY id ASC")
	if err != nil {
		http.Error(w, fmt.Sprintf(`{"error": "%s"}`, err.Error()), http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	categories := make([]Category, 0)
	for rows.Next() {
		var c Category
		if err := rows.Scan(&c.ID, &c.Name, &c.Slug, &c.Icon, &c.Description); err != nil {
			log.Printf("Error scanning category: %v", err)
			continue
		}
		categories = append(categories, c)
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(categories)
}

func handleBooks(w http.ResponseWriter, r *http.Request) {
	enableCORS(&w)
	if r.Method == http.MethodOptions {
		return
	}

	query := r.URL.Query().Get("search")
	categorySlug := r.URL.Query().Get("category")

	sqlQuery := `
		SELECT b.id, b.title, b.author, b.isbn, b.category_id, c.name as category_name,
		       b.description, b.cover_color, b.cover_image, b.total_copies, b.available_copies,
		       b.published_year, b.created_at
		FROM books b
		JOIN categories c ON b.category_id = c.id
		WHERE 1=1
	`
	args := []interface{}{}

	if query != "" {
		sqlQuery += " AND (b.title LIKE ? OR b.author LIKE ? OR b.isbn LIKE ?)"
		searchTerm := "%" + query + "%"
		args = append(args, searchTerm, searchTerm, searchTerm)
	}

	if categorySlug != "" && categorySlug != "all" {
		sqlQuery += " AND c.slug = ?"
		args = append(args, categorySlug)
	}

	sqlQuery += " ORDER BY b.id ASC"

	rows, err := db.Query(sqlQuery, args...)
	if err != nil {
		http.Error(w, fmt.Sprintf(`{"error": "%s"}`, err.Error()), http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	books := make([]Book, 0)
	for rows.Next() {
		var b Book
		if err := rows.Scan(
			&b.ID, &b.Title, &b.Author, &b.ISBN, &b.CategoryID, &b.CategoryName,
			&b.Description, &b.CoverColor, &b.CoverImage, &b.TotalCopies,
			&b.AvailableCopies, &b.PublishedYear, &b.CreatedAt,
		); err != nil {
			log.Printf("Error scanning book: %v", err)
			continue
		}
		books = append(books, b)
	}

	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	json.NewEncoder(w).Encode(books)
}

func handleBookByID(w http.ResponseWriter, r *http.Request) {
	enableCORS(&w)
	if r.Method == http.MethodOptions {
		return
	}

	parts := strings.Split(strings.Trim(r.URL.Path, "/"), "/")
	// e.g. api/catalog/books/1
	if len(parts) < 4 {
		http.Error(w, `{"error": "Book ID required"}`, http.StatusBadRequest)
		return
	}
	bookID, err := strconv.Atoi(parts[3])
	if err != nil {
		http.Error(w, `{"error": "Invalid Book ID"}`, http.StatusBadRequest)
		return
	}

	// Sub-action: /api/catalog/books/{id}/decrement or /api/catalog/books/{id}/increment
	if len(parts) >= 5 {
		action := parts[4]
		if action == "decrement" && r.Method == http.MethodPost {
			res, err := db.Exec("UPDATE books SET available_copies = available_copies - 1 WHERE id = ? AND available_copies > 0", bookID)
			if err != nil {
				http.Error(w, fmt.Sprintf(`{"error": "%s"}`, err.Error()), http.StatusInternalServerError)
				return
			}
			rowsAffected, _ := res.RowsAffected()
			if rowsAffected == 0 {
				http.Error(w, `{"error": "Book is currently out of stock"}`, http.StatusConflict)
				return
			}
			w.Header().Set("Content-Type", "application/json; charset=utf-8")
			json.NewEncoder(w).Encode(map[string]interface{}{"success": true, "message": "Book copy checked out"})
			return
		}

		if action == "increment" && r.Method == http.MethodPost {
			_, err := db.Exec("UPDATE books SET available_copies = LEAST(total_copies, available_copies + 1) WHERE id = ?", bookID)
			if err != nil {
				http.Error(w, fmt.Sprintf(`{"error": "%s"}`, err.Error()), http.StatusInternalServerError)
				return
			}
			w.Header().Set("Content-Type", "application/json; charset=utf-8")
			json.NewEncoder(w).Encode(map[string]interface{}{"success": true, "message": "Book copy returned"})
			return
		}
	}

	// Default: GET /api/catalog/books/{id}
	var b Book
	query := `
		SELECT b.id, b.title, b.author, b.isbn, b.category_id, c.name as category_name,
		       b.description, b.cover_color, b.cover_image, b.total_copies, b.available_copies,
		       b.published_year, b.created_at
		FROM books b
		JOIN categories c ON b.category_id = c.id
		WHERE b.id = ?
	`
	err = db.QueryRow(query, bookID).Scan(
		&b.ID, &b.Title, &b.Author, &b.ISBN, &b.CategoryID, &b.CategoryName,
		&b.Description, &b.CoverColor, &b.CoverImage, &b.TotalCopies,
		&b.AvailableCopies, &b.PublishedYear, &b.CreatedAt,
	)
	if err == sql.ErrNoRows {
		http.Error(w, `{"error": "Book not found"}`, http.StatusNotFound)
		return
	} else if err != nil {
		http.Error(w, fmt.Sprintf(`{"error": "%s"}`, err.Error()), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	json.NewEncoder(w).Encode(b)
}

func main() {
	initDB()
	defer db.Close()

	mux := http.NewServeMux()
	mux.HandleFunc("/health", handleHealth)
	mux.HandleFunc("/api/catalog/categories", handleGetCategories)
	bookHandler := func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path == "/api/catalog/books" || r.URL.Path == "/api/catalog/books/" {
			handleBooks(w, r)
		} else {
			handleBookByID(w, r)
		}
	}
	mux.HandleFunc("/api/catalog/books", bookHandler)
	mux.HandleFunc("/api/catalog/books/", bookHandler)

	port := getEnv("PORT", "8081")
	log.Printf("Go Catalog Service listening on port %s...", port)
	if err := http.ListenAndServe(":"+port, mux); err != nil {
		log.Fatalf("Server failed to start: %v", err)
	}
}
