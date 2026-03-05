package handlers

import (
	"database/sql"
	"net/http"
	"strconv"

	"github.com/nwepp/backend/internal/middleware"
	"github.com/nwepp/backend/internal/models"
	"github.com/nwepp/backend/internal/utils"
)

type TalentHandler struct {
	DB *sql.DB
}

func NewTalentHandler(db *sql.DB) *TalentHandler {
	return &TalentHandler{DB: db}
}

func (h *TalentHandler) GetMyProfile(w http.ResponseWriter, r *http.Request) {
	userID := middleware.GetUserID(r.Context())
	var p models.TalentProfile
	err := h.DB.QueryRow(`SELECT id, user_id, education, specialization, years_experience,
		previous_roles, skills, willing_relocate, preferred_locations, availability, created_at, updated_at
		FROM talent_profiles WHERE user_id = $1`, userID).Scan(
		&p.ID, &p.UserID, &p.Education, &p.Specialization, &p.YearsExperience,
		&p.PreviousRoles, &p.Skills, &p.WillingRelocate, &p.PreferredLocations,
		&p.Availability, &p.CreatedAt, &p.UpdatedAt)
	if err == sql.ErrNoRows {
		err = h.DB.QueryRow(`INSERT INTO talent_profiles (user_id) VALUES ($1)
			RETURNING id, user_id, education, specialization, years_experience,
			previous_roles, skills, willing_relocate, preferred_locations,
			availability, created_at, updated_at`, userID).Scan(
			&p.ID, &p.UserID, &p.Education, &p.Specialization, &p.YearsExperience,
			&p.PreviousRoles, &p.Skills, &p.WillingRelocate, &p.PreferredLocations,
			&p.Availability, &p.CreatedAt, &p.UpdatedAt)
		if err != nil {
			utils.InternalError(w, "failed to create profile")
			return
		}
	} else if err != nil {
		utils.InternalError(w, "database error")
		return
	}
	utils.Success(w, p)
}

func (h *TalentHandler) UpdateMyProfile(w http.ResponseWriter, r *http.Request) {
	userID := middleware.GetUserID(r.Context())
	var req models.UpdateTalentProfileRequest
	if err := utils.DecodeJSON(r, &req); err != nil {
		utils.BadRequest(w, "invalid request body")
		return
	}
	_, err := h.DB.Exec(`INSERT INTO talent_profiles (user_id, education, specialization, years_experience, skills, willing_relocate, preferred_locations, availability)
		VALUES ($1,$2,$3,COALESCE($4,0),$5,COALESCE($6,false),$7,COALESCE($8,'available'))
		ON CONFLICT (user_id) DO UPDATE SET education=COALESCE(NULLIF($2,''),talent_profiles.education),
		specialization=COALESCE(NULLIF($3,''),talent_profiles.specialization),
		years_experience=COALESCE($4,talent_profiles.years_experience),skills=COALESCE($5,talent_profiles.skills),
		willing_relocate=COALESCE($6,talent_profiles.willing_relocate),preferred_locations=COALESCE($7,talent_profiles.preferred_locations),
		availability=COALESCE(NULLIF($8,''),talent_profiles.availability),updated_at=NOW()`,
		userID, req.Education, req.Specialization, req.YearsExperience, req.Skills, req.WillingRelocate, req.PreferredLocations, req.Availability)
	if err != nil {
		utils.InternalError(w, "failed to update profile")
		return
	}
	h.GetMyProfile(w, r)
}

func (h *TalentHandler) GetRanking(w http.ResponseWriter, r *http.Request) {
	page, _ := strconv.Atoi(r.URL.Query().Get("page"))
	if page < 1 { page = 1 }
	offset := (page - 1) * 20
	province := r.URL.Query().Get("province")
	query := `SELECT RANK() OVER (ORDER BY ts.total_score DESC), u.id, u.full_name, COALESCE(u.province,''),
		ts.total_score, ts.exam_score, ts.practical_score, cl.level, cl.name, COALESCE(tp.availability,'available')
		FROM talent_scores ts JOIN users u ON u.id=ts.user_id LEFT JOIN talent_profiles tp ON tp.user_id=u.id
		LEFT JOIN certificates cert ON cert.user_id=u.id AND cert.status='active'
		LEFT JOIN certification_levels cl ON cl.id=cert.cert_level_id`
	var rows *sql.Rows
	var err error
	if province != "" {
		query += ` WHERE u.province=$1 ORDER BY ts.total_score DESC LIMIT 20 OFFSET $2`
		rows, err = h.DB.Query(query, province, offset)
	} else {
		query += ` ORDER BY ts.total_score DESC LIMIT 20 OFFSET $1`
		rows, err = h.DB.Query(query, offset)
	}
	if err != nil { utils.InternalError(w, "failed to fetch rankings"); return }
	defer rows.Close()
	var rankings []models.TalentRanking
	for rows.Next() {
		var tr models.TalentRanking
		rows.Scan(&tr.Rank, &tr.UserID, &tr.FullName, &tr.Province, &tr.TotalScore, &tr.ExamScore, &tr.PracticalScore, &tr.CertLevel, &tr.CertName, &tr.Availability)
		rankings = append(rankings, tr)
	}
	utils.Success(w, rankings)
}

func (h *TalentHandler) SearchTalent(w http.ResponseWriter, r *http.Request) {
	province := r.URL.Query().Get("province")
	availability := r.URL.Query().Get("availability")
	minScore, _ := strconv.ParseFloat(r.URL.Query().Get("min_score"), 64)
	page, _ := strconv.Atoi(r.URL.Query().Get("page"))
	if page < 1 { page = 1 }
	offset := (page - 1) * 20
	rows, err := h.DB.Query(`SELECT u.id, u.full_name, u.province, tp.education, tp.specialization,
		tp.years_experience, tp.skills, tp.availability, COALESCE(ts.total_score,0)
		FROM users u JOIN talent_profiles tp ON tp.user_id=u.id LEFT JOIN talent_scores ts ON ts.user_id=u.id
		WHERE u.is_active=true AND ($1='' OR u.province=$1) AND ($2='' OR tp.availability=$2)
		AND ($3=0 OR COALESCE(ts.total_score,0)>=$3) ORDER BY COALESCE(ts.total_score,0) DESC LIMIT 20 OFFSET $4`,
		province, availability, minScore, offset)
	if err != nil { utils.InternalError(w, "search failed"); return }
	defer rows.Close()
	type R struct {
		UserID string `json:"user_id"`; FullName string `json:"full_name"`; Province *string `json:"province"`
		Education *string `json:"education"`; Specialization *string `json:"specialization"`
		YearsExp int `json:"years_experience"`; Skills []string `json:"skills"`
		Availability string `json:"availability"`; TotalScore float64 `json:"total_score"`
	}
	var results []R
	for rows.Next() {
		var r R
		rows.Scan(&r.UserID, &r.FullName, &r.Province, &r.Education, &r.Specialization, &r.YearsExp, &r.Skills, &r.Availability, &r.TotalScore)
		results = append(results, r)
	}
	utils.Success(w, results)
}

func (h *TalentHandler) GetMyScore(w http.ResponseWriter, r *http.Request) {
	userID := middleware.GetUserID(r.Context())
	var s models.TalentScore
	err := h.DB.QueryRow(`SELECT id, user_id, exam_score, practical_score, experience_score, soft_skill_score,
		total_score, rank_national, rank_provincial, updated_at FROM talent_scores WHERE user_id=$1`, userID).Scan(
		&s.ID, &s.UserID, &s.ExamScore, &s.PracticalScore, &s.ExperienceScore, &s.SoftSkillScore,
		&s.TotalScore, &s.RankNational, &s.RankProvincial, &s.UpdatedAt)
	if err == sql.ErrNoRows { utils.Success(w, models.TalentScore{UserID: userID}); return }
	if err != nil { utils.InternalError(w, "database error"); return }
	utils.Success(w, s)
}
