package models

import (
	"encoding/json"
	"time"
)

// TalentProfile stores a candidate's talent information
type TalentProfile struct {
	ID                 string          `json:"id" db:"id"`
	UserID             string          `json:"user_id" db:"user_id"`
	Education          *string         `json:"education,omitempty" db:"education"`
	Specialization     *string         `json:"specialization,omitempty" db:"specialization"`
	YearsExperience    int             `json:"years_experience" db:"years_experience"`
	PreviousRoles      json.RawMessage `json:"previous_roles,omitempty" db:"previous_roles"`
	Skills             []string        `json:"skills,omitempty" db:"skills"`
	WillingRelocate    bool            `json:"willing_relocate" db:"willing_relocate"`
	PreferredLocations []string        `json:"preferred_locations,omitempty" db:"preferred_locations"`
	Availability       string          `json:"availability" db:"availability"` // available, employed, unavailable
	CreatedAt          time.Time       `json:"created_at" db:"created_at"`
	UpdatedAt          time.Time       `json:"updated_at" db:"updated_at"`
}

// TalentScore stores the weighted composite score for ranking
type TalentScore struct {
	ID              string    `json:"id" db:"id"`
	UserID          string    `json:"user_id" db:"user_id"`
	ExamScore       float64   `json:"exam_score" db:"exam_score"`             // 40% weight
	PracticalScore  float64   `json:"practical_score" db:"practical_score"`   // 30% weight
	ExperienceScore float64   `json:"experience_score" db:"experience_score"` // 20% weight
	SoftSkillScore  float64   `json:"soft_skill_score" db:"soft_skill_score"` // 10% weight
	TotalScore      float64   `json:"total_score" db:"total_score"`
	RankNational    *int      `json:"rank_national,omitempty" db:"rank_national"`
	RankProvincial  *int      `json:"rank_provincial,omitempty" db:"rank_provincial"`
	UpdatedAt       time.Time `json:"updated_at" db:"updated_at"`
}

// UpdateTalentProfileRequest is the payload for editing talent profile
type UpdateTalentProfileRequest struct {
	Education          string   `json:"education,omitempty"`
	Specialization     string   `json:"specialization,omitempty"`
	YearsExperience    *int     `json:"years_experience,omitempty"`
	Skills             []string `json:"skills,omitempty"`
	WillingRelocate    *bool    `json:"willing_relocate,omitempty"`
	PreferredLocations []string `json:"preferred_locations,omitempty"`
	Availability       string   `json:"availability,omitempty"`
}

// TalentSearchParams defines filters for searching the talent database
type TalentSearchParams struct {
	Province     string  `json:"province,omitempty"`
	MinScore     float64 `json:"min_score,omitempty"`
	CertLevel    int     `json:"cert_level,omitempty"`
	Availability string  `json:"availability,omitempty"`
	Skills       string  `json:"skills,omitempty"`
	Page         int     `json:"page,omitempty"`
	PageSize     int     `json:"page_size,omitempty"`
}

// TalentRanking is the view model for the ranking table
type TalentRanking struct {
	Rank           int      `json:"rank"`
	UserID         string   `json:"user_id"`
	FullName       string   `json:"full_name"`
	Province       string   `json:"province"`
	TotalScore     float64  `json:"total_score"`
	ExamScore      float64  `json:"exam_score"`
	PracticalScore float64  `json:"practical_score"`
	CertLevel      *int     `json:"cert_level,omitempty"`
	CertName       *string  `json:"cert_name,omitempty"`
	Availability   string   `json:"availability"`
}
