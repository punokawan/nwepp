package handlers

import (
	"database/sql"
	"net/http"
	"time"

	"github.com/nwepp/backend/internal/middleware"
	"github.com/nwepp/backend/internal/models"
	"github.com/nwepp/backend/internal/utils"

	"golang.org/x/crypto/bcrypt"
)

type AuthHandler struct {
	DB  *sql.DB
	JWT *middleware.JWTMiddleware
	Cfg AuthConfig
}

type AuthConfig struct {
	AccessTTL  time.Duration
	RefreshTTL time.Duration
}

func NewAuthHandler(db *sql.DB, jwtMW *middleware.JWTMiddleware, cfg AuthConfig) *AuthHandler {
	return &AuthHandler{DB: db, JWT: jwtMW, Cfg: cfg}
}

// Register creates a new user account
func (h *AuthHandler) Register(w http.ResponseWriter, r *http.Request) {
	var req models.RegisterRequest
	if err := utils.DecodeJSON(r, &req); err != nil {
		utils.BadRequest(w, "invalid request body")
		return
	}

	if req.Email == "" || req.Password == "" || req.FullName == "" {
		utils.BadRequest(w, "email, password, and full_name are required")
		return
	}

	if len(req.Password) < 8 {
		utils.BadRequest(w, "password must be at least 8 characters")
		return
	}

	// Check if email already exists
	var exists bool
	err := h.DB.QueryRow("SELECT EXISTS(SELECT 1 FROM users WHERE email = $1)", req.Email).Scan(&exists)
	if err != nil {
		utils.InternalError(w, "database error")
		return
	}
	if exists {
		utils.BadRequest(w, "email already registered")
		return
	}

	// Hash password
	hash, err := bcrypt.GenerateFromPassword([]byte(req.Password), 12)
	if err != nil {
		utils.InternalError(w, "failed to hash password")
		return
	}

	// Insert user
	var user models.User
	err = h.DB.QueryRow(`
		INSERT INTO users (email, password_hash, full_name, phone, province, city, role)
		VALUES ($1, $2, $3, $4, $5, $6, $7)
		RETURNING id, email, full_name, phone, province, city, role, is_active, created_at, updated_at
	`, req.Email, string(hash), req.FullName, nilIfEmpty(req.Phone), nilIfEmpty(req.Province), nilIfEmpty(req.City), string(models.RoleCandidate)).
		Scan(&user.ID, &user.Email, &user.FullName, &user.Phone, &user.Province, &user.City, &user.Role, &user.IsActive, &user.CreatedAt, &user.UpdatedAt)
	if err != nil {
		utils.InternalError(w, "failed to create user")
		return
	}

	// Generate tokens
	accessToken, err := h.JWT.GenerateAccessToken(user.ID, string(user.Role), h.Cfg.AccessTTL)
	if err != nil {
		utils.InternalError(w, "failed to generate access token")
		return
	}
	refreshToken, err := h.JWT.GenerateRefreshToken(user.ID, h.Cfg.RefreshTTL)
	if err != nil {
		utils.InternalError(w, "failed to generate refresh token")
		return
	}

	utils.Created(w, models.AuthResponse{
		AccessToken:  accessToken,
		RefreshToken: refreshToken,
		User:         user,
	})
}

// Login authenticates a user and returns JWT tokens
func (h *AuthHandler) Login(w http.ResponseWriter, r *http.Request) {
	var req models.LoginRequest
	if err := utils.DecodeJSON(r, &req); err != nil {
		utils.BadRequest(w, "invalid request body")
		return
	}

	if req.Email == "" || req.Password == "" {
		utils.BadRequest(w, "email and password are required")
		return
	}

	// Fetch user by email
	var user models.User
	err := h.DB.QueryRow(`
		SELECT id, email, password_hash, full_name, phone, province, city, role, is_active, created_at, updated_at
		FROM users WHERE email = $1
	`, req.Email).Scan(
		&user.ID, &user.Email, &user.PasswordHash, &user.FullName,
		&user.Phone, &user.Province, &user.City, &user.Role,
		&user.IsActive, &user.CreatedAt, &user.UpdatedAt,
	)
	if err == sql.ErrNoRows {
		utils.Unauthorized(w, "invalid email or password")
		return
	}
	if err != nil {
		utils.InternalError(w, "database error")
		return
	}

	if !user.IsActive {
		utils.Forbidden(w, "account is deactivated")
		return
	}

	// Verify password
	if err := bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(req.Password)); err != nil {
		utils.Unauthorized(w, "invalid email or password")
		return
	}

	// Generate tokens
	accessToken, err := h.JWT.GenerateAccessToken(user.ID, string(user.Role), h.Cfg.AccessTTL)
	if err != nil {
		utils.InternalError(w, "failed to generate access token")
		return
	}
	refreshToken, err := h.JWT.GenerateRefreshToken(user.ID, h.Cfg.RefreshTTL)
	if err != nil {
		utils.InternalError(w, "failed to generate refresh token")
		return
	}

	utils.Success(w, models.AuthResponse{
		AccessToken:  accessToken,
		RefreshToken: refreshToken,
		User:         user,
	})
}

// Me returns the current authenticated user's profile
func (h *AuthHandler) Me(w http.ResponseWriter, r *http.Request) {
	userID := middleware.GetUserID(r.Context())
	if userID == "" {
		utils.Unauthorized(w, "not authenticated")
		return
	}

	var user models.User
	err := h.DB.QueryRow(`
		SELECT id, email, full_name, phone, province, city, district, role, avatar_url, is_active, created_at, updated_at
		FROM users WHERE id = $1
	`, userID).Scan(
		&user.ID, &user.Email, &user.FullName, &user.Phone,
		&user.Province, &user.City, &user.District, &user.Role,
		&user.AvatarURL, &user.IsActive, &user.CreatedAt, &user.UpdatedAt,
	)
	if err == sql.ErrNoRows {
		utils.NotFound(w, "user not found")
		return
	}
	if err != nil {
		utils.InternalError(w, "database error")
		return
	}

	utils.Success(w, user)
}

// RefreshToken generates a new access token from a valid refresh token
func (h *AuthHandler) RefreshToken(w http.ResponseWriter, r *http.Request) {
	var body struct {
		RefreshToken string `json:"refresh_token"`
	}
	if err := utils.DecodeJSON(r, &body); err != nil || body.RefreshToken == "" {
		utils.BadRequest(w, "refresh_token is required")
		return
	}

	claims, err := h.JWT.ValidateRefreshToken(body.RefreshToken)
	if err != nil {
		utils.Unauthorized(w, "invalid or expired refresh token")
		return
	}

	userID := claims["sub"].(string)

	// Fetch user to get current role
	var role string
	err = h.DB.QueryRow("SELECT role FROM users WHERE id = $1 AND is_active = true", userID).Scan(&role)
	if err != nil {
		utils.Unauthorized(w, "user not found or inactive")
		return
	}

	accessToken, err := h.JWT.GenerateAccessToken(userID, role, h.Cfg.AccessTTL)
	if err != nil {
		utils.InternalError(w, "failed to generate token")
		return
	}

	utils.Success(w, map[string]string{
		"access_token": accessToken,
	})
}

func nilIfEmpty(s string) *string {
	if s == "" {
		return nil
	}
	return &s
}
