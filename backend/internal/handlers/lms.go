package handlers

import (
	"database/sql"
	"net/http"

	"github.com/nwepp/backend/internal/middleware"
	"github.com/nwepp/backend/internal/utils"
	"github.com/nwepp/backend/internal/models"
)

type LMSHandler struct {
	DB *sql.DB
}

func NewLMSHandler(db *sql.DB) *LMSHandler {
	return &LMSHandler{DB: db}
}

// ListTracks returns all published training tracks
func (h *LMSHandler) ListTracks(w http.ResponseWriter, r *http.Request) {
	rows, err := h.DB.Query(`
		SELECT t.id, t.name, t.slug, t.description, t.level, t.estimated_hours, t.is_published, t.created_at,
			   COUNT(c.id) as course_count
		FROM training_tracks t
		LEFT JOIN courses c ON c.track_id = t.id AND c.is_published = true
		WHERE t.is_published = true
		GROUP BY t.id
		ORDER BY t.name
	`)
	if err != nil {
		utils.InternalError(w, "failed to fetch tracks")
		return
	}
	defer rows.Close()

	var tracks []models.TrainingTrack
	for rows.Next() {
		var t models.TrainingTrack
		err := rows.Scan(&t.ID, &t.Name, &t.Slug, &t.Description, &t.Level,
			&t.EstimatedHours, &t.IsPublished, &t.CreatedAt, &t.CourseCount)
		if err != nil {
			utils.InternalError(w, "failed to scan track")
			return
		}
		tracks = append(tracks, t)
	}

	utils.Success(w, tracks)
}

// GetTrack returns a track with its courses
func (h *LMSHandler) GetTrack(w http.ResponseWriter, r *http.Request) {
	trackID := r.PathValue("id")
	if trackID == "" {
		utils.BadRequest(w, "track id is required")
		return
	}

	var track models.TrainingTrack
	err := h.DB.QueryRow(`
		SELECT id, name, slug, description, level, estimated_hours, is_published, created_at
		FROM training_tracks WHERE id = $1
	`, trackID).Scan(&track.ID, &track.Name, &track.Slug, &track.Description,
		&track.Level, &track.EstimatedHours, &track.IsPublished, &track.CreatedAt)
	if err == sql.ErrNoRows {
		utils.NotFound(w, "track not found")
		return
	}
	if err != nil {
		utils.InternalError(w, "database error")
		return
	}

	// Fetch courses for this track
	rows, err := h.DB.Query(`
		SELECT c.id, c.track_id, c.title, c.slug, c.description, c.sort_order, c.is_published, c.created_at,
			   COUNT(l.id) as lesson_count
		FROM courses c
		LEFT JOIN lessons l ON l.course_id = c.id
		WHERE c.track_id = $1 AND c.is_published = true
		GROUP BY c.id
		ORDER BY c.sort_order
	`, trackID)
	if err != nil {
		utils.InternalError(w, "failed to fetch courses")
		return
	}
	defer rows.Close()

	for rows.Next() {
		var c models.Course
		err := rows.Scan(&c.ID, &c.TrackID, &c.Title, &c.Slug, &c.Description,
			&c.SortOrder, &c.IsPublished, &c.CreatedAt, &c.LessonCount)
		if err != nil {
			continue
		}
		track.Courses = append(track.Courses, c)
	}

	utils.Success(w, track)
}

// GetCourse returns a course with its lessons
func (h *LMSHandler) GetCourse(w http.ResponseWriter, r *http.Request) {
	courseID := r.PathValue("id")
	if courseID == "" {
		utils.BadRequest(w, "course id is required")
		return
	}

	var course models.Course
	err := h.DB.QueryRow(`
		SELECT id, track_id, title, slug, description, sort_order, is_published, created_at
		FROM courses WHERE id = $1
	`, courseID).Scan(&course.ID, &course.TrackID, &course.Title, &course.Slug,
		&course.Description, &course.SortOrder, &course.IsPublished, &course.CreatedAt)
	if err == sql.ErrNoRows {
		utils.NotFound(w, "course not found")
		return
	}
	if err != nil {
		utils.InternalError(w, "database error")
		return
	}

	// Fetch lessons
	rows, err := h.DB.Query(`
		SELECT id, course_id, title, content_type, content_url, duration_min, sort_order, created_at
		FROM lessons WHERE course_id = $1 ORDER BY sort_order
	`, courseID)
	if err != nil {
		utils.InternalError(w, "failed to fetch lessons")
		return
	}
	defer rows.Close()

	for rows.Next() {
		var l models.Lesson
		err := rows.Scan(&l.ID, &l.CourseID, &l.Title, &l.ContentType, &l.ContentURL,
			&l.DurationMin, &l.SortOrder, &l.CreatedAt)
		if err != nil {
			continue
		}
		course.Lessons = append(course.Lessons, l)
	}

	utils.Success(w, course)
}

// CreateCourse creates a new course module
func (h *LMSHandler) CreateCourse(w http.ResponseWriter, r *http.Request) {
	var req models.CreateCourseRequest
	if err := utils.DecodeJSON(r, &req); err != nil {
		utils.BadRequest(w, "invalid request body")
		return
	}

	// Assuming sort_order is auto-incremented or calculated. For simplicity, set to 1 or max+1
	var nextSortOrder int
	_ = h.DB.QueryRow(`SELECT COALESCE(MAX(sort_order), 0) + 1 FROM courses WHERE track_id = $1`, req.TrackID).Scan(&nextSortOrder)

	var course models.Course
	err := h.DB.QueryRow(`
		INSERT INTO courses (track_id, title, slug, description, sort_order, is_published)
		VALUES ($1, $2, $3, $4, $5, true)
		RETURNING id, track_id, title, slug, description, sort_order, is_published, created_at
	`, req.TrackID, req.Title, req.Slug, req.Description, nextSortOrder).
		Scan(&course.ID, &course.TrackID, &course.Title, &course.Slug, &course.Description,
			&course.SortOrder, &course.IsPublished, &course.CreatedAt)

	if err != nil {
		utils.InternalError(w, "failed to create course")
		return
	}

	utils.Success(w, course)
}

// CreateLesson creates a new lesson under a course
func (h *LMSHandler) CreateLesson(w http.ResponseWriter, r *http.Request) {
	var req models.CreateLessonRequest
	if err := utils.DecodeJSON(r, &req); err != nil {
		utils.BadRequest(w, "invalid request body")
		return
	}

	var nextSortOrder int
	_ = h.DB.QueryRow(`SELECT COALESCE(MAX(sort_order), 0) + 1 FROM lessons WHERE course_id = $1`, req.CourseID).Scan(&nextSortOrder)

	var lesson models.Lesson
	err := h.DB.QueryRow(`
		INSERT INTO lessons (course_id, title, content_type, content_url, content_body, sort_order)
		VALUES ($1, $2, $3, $4, $5, $6)
		RETURNING id, course_id, title, content_type, content_url, content_body, duration_min, sort_order, created_at
	`, req.CourseID, req.Title, req.ContentType, req.ContentURL, req.ContentBody, nextSortOrder).
		Scan(&lesson.ID, &lesson.CourseID, &lesson.Title, &lesson.ContentType,
			&lesson.ContentURL, &lesson.ContentBody, &lesson.DurationMin, &lesson.SortOrder, &lesson.CreatedAt)

	if err != nil {
		utils.InternalError(w, "failed to create lesson")
		return
	}

	utils.Success(w, lesson)
}

// UpdateCourse updates an existing course
func (h *LMSHandler) UpdateCourse(w http.ResponseWriter, r *http.Request) {
	courseID := r.PathValue("id")
	if courseID == "" {
		utils.BadRequest(w, "course id is required")
		return
	}

	var req models.CreateCourseRequest
	if err := utils.DecodeJSON(r, &req); err != nil {
		utils.BadRequest(w, "invalid request body")
		return
	}

	var course models.Course
	err := h.DB.QueryRow(`
		UPDATE courses SET title = $2, slug = $3, description = $4
		WHERE id = $1
		RETURNING id, track_id, title, slug, description, sort_order, is_published, created_at
	`, courseID, req.Title, req.Slug, req.Description).
		Scan(&course.ID, &course.TrackID, &course.Title, &course.Slug, &course.Description,
			&course.SortOrder, &course.IsPublished, &course.CreatedAt)

	if err != nil {
		utils.InternalError(w, "failed to update course")
		return
	}

	utils.Success(w, course)
}

// UpdateLesson updates an existing lesson
func (h *LMSHandler) UpdateLesson(w http.ResponseWriter, r *http.Request) {
	lessonID := r.PathValue("id")
	if lessonID == "" {
		utils.BadRequest(w, "lesson id is required")
		return
	}

	var req models.CreateLessonRequest
	if err := utils.DecodeJSON(r, &req); err != nil {
		utils.BadRequest(w, "invalid request body")
		return
	}

	var lesson models.Lesson
	err := h.DB.QueryRow(`
		UPDATE lessons SET title = $2, content_type = $3, content_url = $4, content_body = $5
		WHERE id = $1
		RETURNING id, course_id, title, content_type, content_url, content_body, duration_min, sort_order, created_at
	`, lessonID, req.Title, req.ContentType, req.ContentURL, req.ContentBody).
		Scan(&lesson.ID, &lesson.CourseID, &lesson.Title, &lesson.ContentType,
			&lesson.ContentURL, &lesson.ContentBody, &lesson.DurationMin, &lesson.SortOrder, &lesson.CreatedAt)

	if err != nil {
		utils.InternalError(w, "failed to update lesson")
		return
	}

	utils.Success(w, lesson)
}

// GetLesson returns a single lesson's full content
func (h *LMSHandler) GetLesson(w http.ResponseWriter, r *http.Request) {
	lessonID := r.PathValue("id")
	if lessonID == "" {
		utils.BadRequest(w, "lesson id is required")
		return
	}

	var lesson models.Lesson
	err := h.DB.QueryRow(`
		SELECT id, course_id, title, content_type, content_url, content_body, duration_min, sort_order, created_at
		FROM lessons WHERE id = $1
	`, lessonID).Scan(&lesson.ID, &lesson.CourseID, &lesson.Title, &lesson.ContentType,
		&lesson.ContentURL, &lesson.ContentBody, &lesson.DurationMin, &lesson.SortOrder, &lesson.CreatedAt)
	if err == sql.ErrNoRows {
		utils.NotFound(w, "lesson not found")
		return
	}
	if err != nil {
		utils.InternalError(w, "database error")
		return
	}

	utils.Success(w, lesson)
}

// RecordProgress saves or updates user progress on a lesson
func (h *LMSHandler) RecordProgress(w http.ResponseWriter, r *http.Request) {
	userID := middleware.GetUserID(r.Context())
	if userID == "" {
		utils.Unauthorized(w, "not authenticated")
		return
	}

	var req models.UpdateProgressRequest
	if err := utils.DecodeJSON(r, &req); err != nil {
		utils.BadRequest(w, "invalid request body")
		return
	}

	var progress models.UserProgress
	err := h.DB.QueryRow(`
		INSERT INTO user_progress (user_id, lesson_id, status, score, completed_at)
		VALUES ($1, $2, $3, $4, CASE WHEN $3 = 'completed' THEN NOW() ELSE NULL END)
		ON CONFLICT (user_id, lesson_id)
		DO UPDATE SET status = $3, score = COALESCE($4, user_progress.score),
					  completed_at = CASE WHEN $3 = 'completed' THEN NOW() ELSE user_progress.completed_at END
		RETURNING id, user_id, lesson_id, status, score, completed_at, created_at
	`, userID, req.LessonID, req.Status, req.Score).
		Scan(&progress.ID, &progress.UserID, &progress.LessonID, &progress.Status,
			&progress.Score, &progress.CompletedAt, &progress.CreatedAt)
	if err != nil {
		utils.InternalError(w, "failed to update progress")
		return
	}

	utils.Success(w, progress)
}

// GetMyProgress returns the current user's progress summary
func (h *LMSHandler) GetMyProgress(w http.ResponseWriter, r *http.Request) {
	userID := middleware.GetUserID(r.Context())
	if userID == "" {
		utils.Unauthorized(w, "not authenticated")
		return
	}

	rows, err := h.DB.Query(`
		SELECT 
			t.id as track_id,
			COUNT(DISTINCT l.id) as total_lessons,
			COUNT(DISTINCT CASE WHEN up.status = 'completed' THEN l.id END) as completed_count
		FROM training_tracks t
		JOIN courses c ON c.track_id = t.id
		JOIN lessons l ON l.course_id = c.id
		LEFT JOIN user_progress up ON up.lesson_id = l.id AND up.user_id = $1
		WHERE t.is_published = true
		GROUP BY t.id
	`, userID)
	if err != nil {
		utils.InternalError(w, "failed to fetch progress")
		return
	}
	defer rows.Close()

	var progress []models.TrackProgress
	for rows.Next() {
		var tp models.TrackProgress
		err := rows.Scan(&tp.TrackID, &tp.TotalLessons, &tp.CompletedCount)
		if err != nil {
			continue
		}
		if tp.TotalLessons > 0 {
			tp.Percentage = float64(tp.CompletedCount) / float64(tp.TotalLessons) * 100
		}
		progress = append(progress, tp)
	}

	utils.Success(w, progress)
}
