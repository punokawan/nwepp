package handlers

import (
	"database/sql"
	"net/http"
	"strconv"
	"time"

	"github.com/nwepp/backend/internal/middleware"
	"github.com/nwepp/backend/internal/models"
	"github.com/nwepp/backend/internal/utils"
)

type PlacementHandler struct {
	DB *sql.DB
}

func NewPlacementHandler(db *sql.DB) *PlacementHandler {
	return &PlacementHandler{DB: db}
}

func (h *PlacementHandler) ListKitchens(w http.ResponseWriter, r *http.Request) {
	page, _ := strconv.Atoi(r.URL.Query().Get("page"))
	if page < 1 { page = 1 }
	rows, err := h.DB.Query(`SELECT id, name, code, province, city, district, address, capacity_meals, operator_id, status, created_at
		FROM kitchens WHERE status='active' ORDER BY name LIMIT 20 OFFSET $1`, (page-1)*20)
	if err != nil { utils.InternalError(w, "failed to fetch kitchens"); return }
	defer rows.Close()
	var ks []models.Kitchen
	for rows.Next() {
		var k models.Kitchen
		rows.Scan(&k.ID, &k.Name, &k.Code, &k.Province, &k.City, &k.District, &k.Address, &k.CapacityMeals, &k.OperatorID, &k.Status, &k.CreatedAt)
		ks = append(ks, k)
	}
	utils.Success(w, ks)
}

func (h *PlacementHandler) CreateKitchen(w http.ResponseWriter, r *http.Request) {
	var req models.CreateKitchenRequest
	if err := utils.DecodeJSON(r, &req); err != nil { utils.BadRequest(w, "invalid request"); return }
	if req.Name == "" || req.Code == "" { utils.BadRequest(w, "name and code required"); return }
	operatorID := middleware.GetUserID(r.Context())
	var k models.Kitchen
	err := h.DB.QueryRow(`INSERT INTO kitchens (name, code, province, city, district, address, capacity_meals, operator_id)
		VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING id, name, code, province, city, district, address, capacity_meals, operator_id, status, created_at`,
		req.Name, req.Code, nilIfEmpty(req.Province), nilIfEmpty(req.City), nilIfEmpty(req.District), nilIfEmpty(req.Address), req.CapacityMeals, operatorID).Scan(
		&k.ID, &k.Name, &k.Code, &k.Province, &k.City, &k.District, &k.Address, &k.CapacityMeals, &k.OperatorID, &k.Status, &k.CreatedAt)
	if err != nil { utils.InternalError(w, "failed to create kitchen"); return }
	utils.Created(w, k)
}

func (h *PlacementHandler) ListPositions(w http.ResponseWriter, r *http.Request) {
	status := r.URL.Query().Get("status")
	if status == "" { status = "open" }
	rows, err := h.DB.Query(`SELECT p.id, p.kitchen_id, p.title, p.position_type, p.role_category, p.required_cert,
		p.min_score, p.slots, p.filled, p.status, p.created_at, k.name, k.city
		FROM job_positions p JOIN kitchens k ON k.id=p.kitchen_id WHERE p.status=$1 ORDER BY p.created_at DESC LIMIT 50`, status)
	if err != nil { utils.InternalError(w, "failed to fetch positions"); return }
	defer rows.Close()
	var ps []models.JobPosition
	for rows.Next() {
		var p models.JobPosition
		rows.Scan(&p.ID, &p.KitchenID, &p.Title, &p.PositionType, &p.RoleCategory, &p.RequiredCert,
			&p.MinScore, &p.Slots, &p.Filled, &p.Status, &p.CreatedAt, &p.KitchenName, &p.KitchenCity)
		ps = append(ps, p)
	}
	utils.Success(w, ps)
}

func (h *PlacementHandler) CreatePosition(w http.ResponseWriter, r *http.Request) {
	var req models.CreatePositionRequest
	if err := utils.DecodeJSON(r, &req); err != nil { utils.BadRequest(w, "invalid request"); return }
	if req.Title == "" || req.KitchenID == "" { utils.BadRequest(w, "title and kitchen_id required"); return }
	var p models.JobPosition
	err := h.DB.QueryRow(`INSERT INTO job_positions (kitchen_id, title, position_type, role_category, required_cert, min_score, slots)
		VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING id, kitchen_id, title, position_type, role_category, required_cert, min_score, slots, filled, status, created_at`,
		req.KitchenID, req.Title, req.PositionType, req.RoleCategory, req.RequiredCert, req.MinScore, req.Slots).Scan(
		&p.ID, &p.KitchenID, &p.Title, &p.PositionType, &p.RoleCategory, &p.RequiredCert, &p.MinScore, &p.Slots, &p.Filled, &p.Status, &p.CreatedAt)
	if err != nil { utils.InternalError(w, "failed to create position"); return }
	utils.Created(w, p)
}

func (h *PlacementHandler) ProposePlacement(w http.ResponseWriter, r *http.Request) {
	var body struct {
		UserID     string  `json:"user_id"`
		PositionID string  `json:"position_id"`
		MatchScore float64 `json:"match_score"`
	}
	if err := utils.DecodeJSON(r, &body); err != nil { utils.BadRequest(w, "invalid request"); return }
	var pl models.Placement
	err := h.DB.QueryRow(`INSERT INTO placements (user_id, position_id, match_score)
		VALUES ($1,$2,$3) RETURNING id, user_id, position_id, status, match_score, proposed_at`,
		body.UserID, body.PositionID, body.MatchScore).Scan(
		&pl.ID, &pl.UserID, &pl.PositionID, &pl.Status, &pl.MatchScore, &pl.ProposedAt)
	if err != nil { utils.InternalError(w, "failed to create placement"); return }
	utils.Created(w, pl)
}

func (h *PlacementHandler) UpdatePlacement(w http.ResponseWriter, r *http.Request) {
	placementID := r.PathValue("id")
	var body struct {
		Status    string     `json:"status"`
		StartDate *time.Time `json:"start_date"`
		EndDate   *time.Time `json:"end_date"`
	}
	if err := utils.DecodeJSON(r, &body); err != nil { utils.BadRequest(w, "invalid request"); return }
	_, err := h.DB.Exec(`UPDATE placements SET status=$1, accepted_at=CASE WHEN $1='accepted' THEN NOW() ELSE accepted_at END,
		start_date=COALESCE($2,start_date), end_date=COALESCE($3,end_date) WHERE id=$4`,
		body.Status, body.StartDate, body.EndDate, placementID)
	if err != nil { utils.InternalError(w, "failed to update placement"); return }
	utils.Success(w, map[string]string{"id": placementID, "status": body.Status})
}

func (h *PlacementHandler) GetMyPlacements(w http.ResponseWriter, r *http.Request) {
	userID := middleware.GetUserID(r.Context())
	rows, err := h.DB.Query(`SELECT p.id, p.user_id, p.position_id, p.status, p.match_score, p.proposed_at, p.accepted_at,
		p.start_date, p.end_date, jp.title, k.name FROM placements p
		JOIN job_positions jp ON jp.id=p.position_id JOIN kitchens k ON k.id=jp.kitchen_id
		WHERE p.user_id=$1 ORDER BY p.proposed_at DESC`, userID)
	if err != nil { utils.InternalError(w, "failed to fetch placements"); return }
	defer rows.Close()
	var pls []models.Placement
	for rows.Next() {
		var pl models.Placement
		rows.Scan(&pl.ID, &pl.UserID, &pl.PositionID, &pl.Status, &pl.MatchScore, &pl.ProposedAt,
			&pl.AcceptedAt, &pl.StartDate, &pl.EndDate, &pl.PositionTitle, &pl.KitchenName)
		pls = append(pls, pl)
	}
	utils.Success(w, pls)
}
