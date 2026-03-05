package models

import (
	"time"
)

// TrainingTrack represents a learning path (e.g., Ahli Gizi, Non-Ahli Gizi, Manajemen)
type TrainingTrack struct {
	ID             string    `json:"id" db:"id"`
	Name           string    `json:"name" db:"name"`
	Slug           string    `json:"slug" db:"slug"`
	Description    *string   `json:"description,omitempty" db:"description"`
	Level          *string   `json:"level,omitempty" db:"level"`
	EstimatedHours *int      `json:"estimated_hours,omitempty" db:"estimated_hours"`
	IsPublished    bool      `json:"is_published" db:"is_published"`
	CreatedAt      time.Time `json:"created_at" db:"created_at"`

	// Joined fields
	Courses     []Course `json:"courses,omitempty"`
	CourseCount int      `json:"course_count,omitempty"`
}

// Course represents a module within a training track
type Course struct {
	ID          string    `json:"id" db:"id"`
	TrackID     string    `json:"track_id" db:"track_id"`
	Title       string    `json:"title" db:"title"`
	Slug        string    `json:"slug" db:"slug"`
	Description *string   `json:"description,omitempty" db:"description"`
	SortOrder   int       `json:"sort_order" db:"sort_order"`
	IsPublished bool      `json:"is_published" db:"is_published"`
	CreatedAt   time.Time `json:"created_at" db:"created_at"`

	// Joined fields
	Lessons     []Lesson `json:"lessons,omitempty"`
	LessonCount int      `json:"lesson_count,omitempty"`
}

// Lesson represents individual learning content
type Lesson struct {
	ID          string    `json:"id" db:"id"`
	CourseID    string    `json:"course_id" db:"course_id"`
	Title       string    `json:"title" db:"title"`
	ContentType *string   `json:"content_type,omitempty" db:"content_type"` // video, text, quiz, interactive
	ContentURL  *string   `json:"content_url,omitempty" db:"content_url"`
	ContentBody *string   `json:"content_body,omitempty" db:"content_body"`
	DurationMin *int      `json:"duration_min,omitempty" db:"duration_min"`
	SortOrder   int       `json:"sort_order" db:"sort_order"`
	CreatedAt   time.Time `json:"created_at" db:"created_at"`
}

// CreateCourseRequest is the payload for creating a new course
type CreateCourseRequest struct {
	TrackID     string  `json:"track_id" validate:"required"`
	Title       string  `json:"title" validate:"required"`
	Slug        string  `json:"slug" validate:"required"`
	Description *string `json:"description,omitempty"`
}

// CreateLessonRequest is the payload for creating a new lesson
type CreateLessonRequest struct {
	CourseID    string  `json:"course_id" validate:"required"`
	Title       string  `json:"title" validate:"required"`
	ContentType *string `json:"content_type,omitempty"`
	ContentURL  *string `json:"content_url,omitempty"`
	ContentBody *string `json:"content_body,omitempty"`
}

type ProgressStatus string

const (
	StatusNotStarted ProgressStatus = "not_started"
	StatusInProgress ProgressStatus = "in_progress"
	StatusCompleted  ProgressStatus = "completed"
)

// UserProgress tracks a user's progress on a specific lesson
type UserProgress struct {
	ID          string         `json:"id" db:"id"`
	UserID      string         `json:"user_id" db:"user_id"`
	LessonID    string         `json:"lesson_id" db:"lesson_id"`
	Status      ProgressStatus `json:"status" db:"status"`
	Score       *float64       `json:"score,omitempty" db:"score"`
	CompletedAt *time.Time     `json:"completed_at,omitempty" db:"completed_at"`
	CreatedAt   time.Time      `json:"created_at" db:"created_at"`
}

// UpdateProgressRequest is the payload for recording progress
type UpdateProgressRequest struct {
	LessonID string         `json:"lesson_id" validate:"required"`
	Status   ProgressStatus `json:"status" validate:"required"`
	Score    *float64       `json:"score,omitempty"`
}

// TrackProgress summarizes a user's progress on a track
type TrackProgress struct {
	TrackID        string  `json:"track_id"`
	TotalLessons   int     `json:"total_lessons"`
	CompletedCount int     `json:"completed_count"`
	Percentage     float64 `json:"percentage"`
}
