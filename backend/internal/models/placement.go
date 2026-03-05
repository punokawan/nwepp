package models

import (
	"time"
)

// Kitchen represents an MBG kitchen facility
type Kitchen struct {
	ID           string    `json:"id" db:"id"`
	Name         string    `json:"name" db:"name"`
	Code         string    `json:"code" db:"code"`
	Province     *string   `json:"province,omitempty" db:"province"`
	City         *string   `json:"city,omitempty" db:"city"`
	District     *string   `json:"district,omitempty" db:"district"`
	Address      *string   `json:"address,omitempty" db:"address"`
	CapacityMeals *int     `json:"capacity_meals,omitempty" db:"capacity_meals"`
	OperatorID   *string   `json:"operator_id,omitempty" db:"operator_id"`
	Status       string    `json:"status" db:"status"` // active, inactive
	CreatedAt    time.Time `json:"created_at" db:"created_at"`
}

type PositionType string

const (
	PositionStructural  PositionType = "structural"
	PositionOperational PositionType = "operational"
)

// JobPosition represents an open position at a kitchen
type JobPosition struct {
	ID           string       `json:"id" db:"id"`
	KitchenID    string       `json:"kitchen_id" db:"kitchen_id"`
	Title        string       `json:"title" db:"title"`
	PositionType PositionType `json:"position_type" db:"position_type"`
	RoleCategory string       `json:"role_category" db:"role_category"`
	RequiredCert *string      `json:"required_cert,omitempty" db:"required_cert"`
	MinScore     *float64     `json:"min_score,omitempty" db:"min_score"`
	Slots        int          `json:"slots" db:"slots"`
	Filled       int          `json:"filled" db:"filled"`
	Status       string       `json:"status" db:"status"` // open, filled, closed
	CreatedAt    time.Time    `json:"created_at" db:"created_at"`

	// Joined
	KitchenName string `json:"kitchen_name,omitempty" db:"kitchen_name"`
	KitchenCity string `json:"kitchen_city,omitempty" db:"kitchen_city"`
}

type PlacementStatus string

const (
	PlacementProposed  PlacementStatus = "proposed"
	PlacementAccepted  PlacementStatus = "accepted"
	PlacementRejected  PlacementStatus = "rejected"
	PlacementActive    PlacementStatus = "active"
	PlacementCompleted PlacementStatus = "completed"
)

// Placement represents a candidate-position match
type Placement struct {
	ID          string          `json:"id" db:"id"`
	UserID      string          `json:"user_id" db:"user_id"`
	PositionID  string          `json:"position_id" db:"position_id"`
	Status      PlacementStatus `json:"status" db:"status"`
	MatchScore  *float64        `json:"match_score,omitempty" db:"match_score"`
	ProposedAt  time.Time       `json:"proposed_at" db:"proposed_at"`
	AcceptedAt  *time.Time      `json:"accepted_at,omitempty" db:"accepted_at"`
	StartDate   *time.Time      `json:"start_date,omitempty" db:"start_date"`
	EndDate     *time.Time      `json:"end_date,omitempty" db:"end_date"`

	// Joined
	PositionTitle string `json:"position_title,omitempty" db:"position_title"`
	KitchenName   string `json:"kitchen_name,omitempty" db:"kitchen_name"`
	UserName      string `json:"user_name,omitempty" db:"user_name"`
}

// CreatePositionRequest is the payload for creating a job position
type CreatePositionRequest struct {
	KitchenID    string  `json:"kitchen_id" validate:"required"`
	Title        string  `json:"title" validate:"required"`
	PositionType string  `json:"position_type" validate:"required"`
	RoleCategory string  `json:"role_category" validate:"required"`
	RequiredCert *string `json:"required_cert,omitempty"`
	MinScore     *float64 `json:"min_score,omitempty"`
	Slots        int     `json:"slots" validate:"required,min=1"`
}

// CreateKitchenRequest is the payload for registering a kitchen
type CreateKitchenRequest struct {
	Name          string `json:"name" validate:"required"`
	Code          string `json:"code" validate:"required"`
	Province      string `json:"province"`
	City          string `json:"city"`
	District      string `json:"district"`
	Address       string `json:"address"`
	CapacityMeals *int   `json:"capacity_meals"`
}

// PaginatedResponse wraps paginated list results
type PaginatedResponse struct {
	Data       interface{} `json:"data"`
	Total      int         `json:"total"`
	Page       int         `json:"page"`
	PageSize   int         `json:"page_size"`
	TotalPages int         `json:"total_pages"`
}
