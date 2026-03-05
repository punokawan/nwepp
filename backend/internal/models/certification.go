package models

import (
	"encoding/json"
	"time"
)

// CertificationLevel represents a certification tier (Level 1-5)
type CertificationLevel struct {
	ID             string   `json:"id" db:"id"`
	Level          int      `json:"level" db:"level"`
	Name           string   `json:"name" db:"name"`
	Description    *string  `json:"description,omitempty" db:"description"`
	RequiredTrack  *string  `json:"required_track,omitempty" db:"required_track"`
	PassingScore   float64  `json:"passing_score" db:"passing_score"`
	ValidityMonths int      `json:"validity_months" db:"validity_months"`
	CreatedAt      time.Time `json:"created_at" db:"created_at"`
}

// Exam represents an assessment for a certification level
type Exam struct {
	ID            string    `json:"id" db:"id"`
	CertLevelID   string    `json:"cert_level_id" db:"cert_level_id"`
	ExamType      string    `json:"exam_type" db:"exam_type"` // theory, practical
	Title         string    `json:"title" db:"title"`
	DurationMin   *int      `json:"duration_min,omitempty" db:"duration_min"`
	TotalQuestions *int     `json:"total_questions,omitempty" db:"total_questions"`
	PassingScore  *float64  `json:"passing_score,omitempty" db:"passing_score"`
	IsActive      bool      `json:"is_active" db:"is_active"`
	CreatedAt     time.Time `json:"created_at" db:"created_at"`

	// Joined
	Questions []ExamQuestion `json:"questions,omitempty"`
}

// MCOption represents a multiple-choice option
type MCOption struct {
	Key       string `json:"key"`
	Text      string `json:"text"`
	IsCorrect bool   `json:"is_correct,omitempty"`
}

// ExamQuestion represents a single question in an exam
type ExamQuestion struct {
	ID           string          `json:"id" db:"id"`
	ExamID       string          `json:"exam_id" db:"exam_id"`
	QuestionText string          `json:"question_text" db:"question_text"`
	QuestionType string          `json:"question_type" db:"question_type"` // multiple_choice, essay, practical
	Options      json.RawMessage `json:"options,omitempty" db:"options"`
	CorrectAnswer *string        `json:"-" db:"correct_answer"` // Hidden from response
	Points       float64         `json:"points" db:"points"`
	SortOrder    int             `json:"sort_order" db:"sort_order"`
}

type AttemptStatus string

const (
	AttemptInProgress AttemptStatus = "in_progress"
	AttemptSubmitted  AttemptStatus = "submitted"
	AttemptGraded     AttemptStatus = "graded"
)

// ExamAttempt records a user's attempt at an exam
type ExamAttempt struct {
	ID          string          `json:"id" db:"id"`
	UserID      string          `json:"user_id" db:"user_id"`
	ExamID      string          `json:"exam_id" db:"exam_id"`
	Status      AttemptStatus   `json:"status" db:"status"`
	Answers     json.RawMessage `json:"answers,omitempty" db:"answers"`
	Score       *float64        `json:"score,omitempty" db:"score"`
	StartedAt   time.Time       `json:"started_at" db:"started_at"`
	SubmittedAt *time.Time      `json:"submitted_at,omitempty" db:"submitted_at"`
	GradedAt    *time.Time      `json:"graded_at,omitempty" db:"graded_at"`
}

type CertificateStatus string

const (
	CertActive  CertificateStatus = "active"
	CertExpired CertificateStatus = "expired"
	CertRevoked CertificateStatus = "revoked"
)

// Certificate represents an issued certificate
type Certificate struct {
	ID            string            `json:"id" db:"id"`
	UserID        string            `json:"user_id" db:"user_id"`
	CertLevelID   string            `json:"cert_level_id" db:"cert_level_id"`
	CertificateNo string            `json:"certificate_no" db:"certificate_no"`
	IssuedAt      time.Time         `json:"issued_at" db:"issued_at"`
	ExpiresAt     *time.Time        `json:"expires_at,omitempty" db:"expires_at"`
	Status        CertificateStatus `json:"status" db:"status"`
	PDFURL        *string           `json:"pdf_url,omitempty" db:"pdf_url"`

	// Joined
	LevelName string `json:"level_name,omitempty" db:"level_name"`
	LevelNum  int    `json:"level,omitempty" db:"level"`
}

// SubmitExamRequest represents the payload when submitting answers
type SubmitExamRequest struct {
	Answers map[string]string `json:"answers" validate:"required"` // question_id -> answer
}

// ExamResult is the response after grading
type ExamResult struct {
	AttemptID    string  `json:"attempt_id"`
	ExamTitle    string  `json:"exam_title"`
	Score        float64 `json:"score"`
	PassingScore float64 `json:"passing_score"`
	Passed       bool    `json:"passed"`
	TotalPoints  float64 `json:"total_points"`
	EarnedPoints float64 `json:"earned_points"`
}
