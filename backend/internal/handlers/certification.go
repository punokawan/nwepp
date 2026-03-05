package handlers

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"net/http"
	"time"

	"github.com/nwepp/backend/internal/middleware"
	"github.com/nwepp/backend/internal/models"
	"github.com/nwepp/backend/internal/utils"
)

type CertificationHandler struct {
	DB *sql.DB
}

func NewCertificationHandler(db *sql.DB) *CertificationHandler {
	return &CertificationHandler{DB: db}
}

// ListCertifications returns all certification levels
func (h *CertificationHandler) ListCertifications(w http.ResponseWriter, r *http.Request) {
	rows, err := h.DB.Query(`
		SELECT id, level, name, description, required_track, passing_score, validity_months, created_at
		FROM certification_levels ORDER BY level
	`)
	if err != nil {
		utils.InternalError(w, "failed to fetch certifications")
		return
	}
	defer rows.Close()

	var levels []models.CertificationLevel
	for rows.Next() {
		var cl models.CertificationLevel
		if err := rows.Scan(&cl.ID, &cl.Level, &cl.Name, &cl.Description,
			&cl.RequiredTrack, &cl.PassingScore, &cl.ValidityMonths, &cl.CreatedAt); err != nil {
			continue
		}
		levels = append(levels, cl)
	}

	utils.Success(w, levels)
}

// GetExam returns an exam with its questions (without correct answers)
func (h *CertificationHandler) GetExam(w http.ResponseWriter, r *http.Request) {
	examID := r.PathValue("id")

	var exam models.Exam
	err := h.DB.QueryRow(`
		SELECT id, cert_level_id, exam_type, title, duration_min, total_questions, passing_score, is_active, created_at
		FROM exams WHERE id = $1 AND is_active = true
	`, examID).Scan(&exam.ID, &exam.CertLevelID, &exam.ExamType, &exam.Title,
		&exam.DurationMin, &exam.TotalQuestions, &exam.PassingScore, &exam.IsActive, &exam.CreatedAt)
	if err == sql.ErrNoRows {
		utils.NotFound(w, "exam not found")
		return
	}
	if err != nil {
		utils.InternalError(w, "database error")
		return
	}

	// Fetch questions (without correct answers - note the json:"-" tag on CorrectAnswer)
	rows, err := h.DB.Query(`
		SELECT id, exam_id, question_text, question_type, options, points, sort_order
		FROM exam_questions WHERE exam_id = $1 ORDER BY sort_order
	`, examID)
	if err != nil {
		utils.InternalError(w, "failed to fetch questions")
		return
	}
	defer rows.Close()

	for rows.Next() {
		var q models.ExamQuestion
		if err := rows.Scan(&q.ID, &q.ExamID, &q.QuestionText, &q.QuestionType,
			&q.Options, &q.Points, &q.SortOrder); err != nil {
			continue
		}
		// Strip is_correct from options for client
		q.Options = stripCorrectAnswers(q.Options)
		exam.Questions = append(exam.Questions, q)
	}

	utils.Success(w, exam)
}

// StartExam creates a new exam attempt
func (h *CertificationHandler) StartExam(w http.ResponseWriter, r *http.Request) {
	userID := middleware.GetUserID(r.Context())
	examID := r.PathValue("id")

	// Check if user already has an in-progress attempt
	var existingID string
	err := h.DB.QueryRow(`
		SELECT id FROM exam_attempts 
		WHERE user_id = $1 AND exam_id = $2 AND status = 'in_progress'
	`, userID, examID).Scan(&existingID)
	if err == nil {
		utils.BadRequest(w, "you already have an in-progress attempt for this exam")
		return
	}

	var attempt models.ExamAttempt
	err = h.DB.QueryRow(`
		INSERT INTO exam_attempts (user_id, exam_id, status)
		VALUES ($1, $2, 'in_progress')
		RETURNING id, user_id, exam_id, status, started_at
	`, userID, examID).Scan(&attempt.ID, &attempt.UserID, &attempt.ExamID, &attempt.Status, &attempt.StartedAt)
	if err != nil {
		utils.InternalError(w, "failed to start exam")
		return
	}

	utils.Created(w, attempt)
}

// SubmitExam grades and submits an exam attempt
func (h *CertificationHandler) SubmitExam(w http.ResponseWriter, r *http.Request) {
	userID := middleware.GetUserID(r.Context())
	examID := r.PathValue("id")

	var req models.SubmitExamRequest
	if err := utils.DecodeJSON(r, &req); err != nil {
		utils.BadRequest(w, "invalid request body")
		return
	}

	// Fetch the in-progress attempt
	var attemptID string
	err := h.DB.QueryRow(`
		SELECT id FROM exam_attempts 
		WHERE user_id = $1 AND exam_id = $2 AND status = 'in_progress'
	`, userID, examID).Scan(&attemptID)
	if err == sql.ErrNoRows {
		utils.BadRequest(w, "no in-progress attempt found")
		return
	}

	// Fetch questions with correct answers for grading
	rows, err := h.DB.Query(`
		SELECT id, question_type, options, correct_answer, points
		FROM exam_questions WHERE exam_id = $1
	`, examID)
	if err != nil {
		utils.InternalError(w, "failed to fetch questions for grading")
		return
	}
	defer rows.Close()

	var totalPoints, earnedPoints float64
	for rows.Next() {
		var qID, qType string
		var options json.RawMessage
		var correctAnswer *string
		var points float64

		if err := rows.Scan(&qID, &qType, &options, &correctAnswer, &points); err != nil {
			continue
		}
		totalPoints += points

		userAnswer, ok := req.Answers[qID]
		if !ok {
			continue // No answer provided
		}

		if qType == "multiple_choice" && correctAnswer != nil && userAnswer == *correctAnswer {
			earnedPoints += points
		}
		// Essay and practical questions are graded manually (not auto-graded)
	}

	score := 0.0
	if totalPoints > 0 {
		score = (earnedPoints / totalPoints) * 100
	}

	// Save answers and score
	answersJSON, _ := json.Marshal(req.Answers)
	now := time.Now()
	_, err = h.DB.Exec(`
		UPDATE exam_attempts 
		SET status = 'graded', answers = $1, score = $2, submitted_at = $3, graded_at = $3
		WHERE id = $4
	`, answersJSON, score, now, attemptID)
	if err != nil {
		utils.InternalError(w, "failed to save exam results")
		return
	}

	// Fetch passing score
	var passingScore float64
	var examTitle string
	h.DB.QueryRow(`
		SELECT e.title, COALESCE(e.passing_score, cl.passing_score, 70)
		FROM exams e
		JOIN certification_levels cl ON cl.id = e.cert_level_id
		WHERE e.id = $1
	`, examID).Scan(&examTitle, &passingScore)

	passed := score >= passingScore

	// If passed, issue certificate
	if passed {
		var certLevelID string
		h.DB.QueryRow("SELECT cert_level_id FROM exams WHERE id = $1", examID).Scan(&certLevelID)

		certNo := fmt.Sprintf("NWEPP-%s-%d", certLevelID[:8], time.Now().UnixMilli())
		var validityMonths int
		h.DB.QueryRow("SELECT validity_months FROM certification_levels WHERE id = $1", certLevelID).Scan(&validityMonths)
		expiresAt := time.Now().AddDate(0, validityMonths, 0)

		h.DB.Exec(`
			INSERT INTO certificates (user_id, cert_level_id, certificate_no, expires_at)
			VALUES ($1, $2, $3, $4)
			ON CONFLICT DO NOTHING
		`, userID, certLevelID, certNo, expiresAt)
	}

	utils.Success(w, models.ExamResult{
		AttemptID:    attemptID,
		ExamTitle:    examTitle,
		Score:        score,
		PassingScore: passingScore,
		Passed:       passed,
		TotalPoints:  totalPoints,
		EarnedPoints: earnedPoints,
	})
}

// GetExamResult returns the result of a specific attempt
func (h *CertificationHandler) GetExamResult(w http.ResponseWriter, r *http.Request) {
	userID := middleware.GetUserID(r.Context())
	examID := r.PathValue("id")

	var attempt models.ExamAttempt
	err := h.DB.QueryRow(`
		SELECT id, user_id, exam_id, status, score, started_at, submitted_at, graded_at
		FROM exam_attempts
		WHERE user_id = $1 AND exam_id = $2 AND status = 'graded'
		ORDER BY graded_at DESC LIMIT 1
	`, userID, examID).Scan(&attempt.ID, &attempt.UserID, &attempt.ExamID, &attempt.Status,
		&attempt.Score, &attempt.StartedAt, &attempt.SubmittedAt, &attempt.GradedAt)
	if err == sql.ErrNoRows {
		utils.NotFound(w, "no graded attempt found")
		return
	}
	if err != nil {
		utils.InternalError(w, "database error")
		return
	}

	utils.Success(w, attempt)
}

// GetMyCertificates returns the current user's certificates
func (h *CertificationHandler) GetMyCertificates(w http.ResponseWriter, r *http.Request) {
	userID := middleware.GetUserID(r.Context())

	rows, err := h.DB.Query(`
		SELECT c.id, c.user_id, c.cert_level_id, c.certificate_no, c.issued_at, c.expires_at, c.status, c.pdf_url,
			   cl.name as level_name, cl.level
		FROM certificates c
		JOIN certification_levels cl ON cl.id = c.cert_level_id
		WHERE c.user_id = $1
		ORDER BY cl.level
	`, userID)
	if err != nil {
		utils.InternalError(w, "failed to fetch certificates")
		return
	}
	defer rows.Close()

	var certs []models.Certificate
	for rows.Next() {
		var cert models.Certificate
		if err := rows.Scan(&cert.ID, &cert.UserID, &cert.CertLevelID, &cert.CertificateNo,
			&cert.IssuedAt, &cert.ExpiresAt, &cert.Status, &cert.PDFURL,
			&cert.LevelName, &cert.LevelNum); err != nil {
			continue
		}
		certs = append(certs, cert)
	}

	utils.Success(w, certs)
}

// VerifyCertificate publicly verifies a certificate by its number
func (h *CertificationHandler) VerifyCertificate(w http.ResponseWriter, r *http.Request) {
	certID := r.PathValue("id")

	var cert models.Certificate
	var userName string
	err := h.DB.QueryRow(`
		SELECT c.id, c.certificate_no, c.issued_at, c.expires_at, c.status,
			   cl.name as level_name, cl.level,
			   u.full_name
		FROM certificates c
		JOIN certification_levels cl ON cl.id = c.cert_level_id
		JOIN users u ON u.id = c.user_id
		WHERE c.id = $1 OR c.certificate_no = $1
	`, certID).Scan(&cert.ID, &cert.CertificateNo, &cert.IssuedAt, &cert.ExpiresAt, &cert.Status,
		&cert.LevelName, &cert.LevelNum, &userName)
	if err == sql.ErrNoRows {
		utils.NotFound(w, "certificate not found")
		return
	}
	if err != nil {
		utils.InternalError(w, "database error")
		return
	}

	utils.Success(w, map[string]interface{}{
		"certificate": cert,
		"holder_name": userName,
		"valid":       cert.Status == "active",
	})
}

// stripCorrectAnswers removes is_correct field from MC options sent to client
func stripCorrectAnswers(raw json.RawMessage) json.RawMessage {
	if raw == nil {
		return nil
	}
	var opts []map[string]interface{}
	if err := json.Unmarshal(raw, &opts); err != nil {
		return raw
	}
	for _, opt := range opts {
		delete(opt, "is_correct")
	}
	cleaned, _ := json.Marshal(opts)
	return cleaned
}
