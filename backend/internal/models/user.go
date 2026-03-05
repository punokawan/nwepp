package models

import (
	"time"
)

type UserRole string

const (
	RoleCandidate       UserRole = "candidate"
	RoleInstructor      UserRole = "instructor"
	RoleKitchenOperator UserRole = "kitchen_operator"
	RoleRegionalManager UserRole = "regional_manager"
	RoleAdmin           UserRole = "admin"
	RoleSuperAdmin      UserRole = "super_admin"
)

type User struct {
	ID           string    `json:"id" db:"id"`
	Email        string    `json:"email" db:"email"`
	PasswordHash string    `json:"-" db:"password_hash"`
	FullName     string    `json:"full_name" db:"full_name"`
	NIK          *string   `json:"nik,omitempty" db:"nik"`
	Phone        *string   `json:"phone,omitempty" db:"phone"`
	Role         UserRole  `json:"role" db:"role"`
	AvatarURL    *string   `json:"avatar_url,omitempty" db:"avatar_url"`
	Province     *string   `json:"province,omitempty" db:"province"`
	City         *string   `json:"city,omitempty" db:"city"`
	District     *string   `json:"district,omitempty" db:"district"`
	IsActive     bool      `json:"is_active" db:"is_active"`
	CreatedAt    time.Time `json:"created_at" db:"created_at"`
	UpdatedAt    time.Time `json:"updated_at" db:"updated_at"`
}

type RegisterRequest struct {
	Email    string `json:"email" validate:"required,email"`
	Password string `json:"password" validate:"required,min=8"`
	FullName string `json:"full_name" validate:"required"`
	Phone    string `json:"phone,omitempty"`
	Province string `json:"province,omitempty"`
	City     string `json:"city,omitempty"`
}

type LoginRequest struct {
	Email    string `json:"email" validate:"required,email"`
	Password string `json:"password" validate:"required"`
}

type AuthResponse struct {
	AccessToken  string `json:"access_token"`
	RefreshToken string `json:"refresh_token"`
	User         User   `json:"user"`
}

type UserProfile struct {
	User
	TalentProfile *TalentProfile `json:"talent_profile,omitempty"`
	Certificates  []Certificate  `json:"certificates,omitempty"`
}
