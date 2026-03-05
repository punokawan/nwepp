package main

import (
	"database/sql"
	"fmt"
	"log"
	"net/http"

	"github.com/nwepp/backend/internal/config"
	"github.com/nwepp/backend/internal/handlers"
	"github.com/nwepp/backend/internal/middleware"
	"github.com/nwepp/backend/internal/services"

	_ "github.com/lib/pq"
)

func main() {
	cfg := config.Load()

	// Connect to database
	db, err := sql.Open("postgres", cfg.Database.DSN())
	if err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}
	defer db.Close()

	if err := db.Ping(); err != nil {
		log.Fatalf("Failed to ping database: %v", err)
	}
	log.Println("Connected to database")

	// Initialize JWT middleware
	jwtMW := middleware.NewJWTMiddleware(cfg.JWT.Secret)

	// Initialize handlers
	authH := handlers.NewAuthHandler(db, jwtMW, handlers.AuthConfig{
		AccessTTL:  cfg.JWT.AccessTokenTTL,
		RefreshTTL: cfg.JWT.RefreshTokenTTL,
	})
	lmsH := handlers.NewLMSHandler(db)
	certH := handlers.NewCertificationHandler(db)
	talentH := handlers.NewTalentHandler(db)
	placementH := handlers.NewPlacementHandler(db)

	// Initialize storage & media handler
	storage := services.NewStorageService()
	mediaH := handlers.NewMediaHandler(db, storage)

	// Setup router using Go 1.22 ServeMux
	mux := http.NewServeMux()

	// ── Health check ──
	mux.HandleFunc("GET /api/v1/health", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		w.Write([]byte(`{"status":"ok","service":"nwepp-api"}`))
	})

	// ── Auth routes (public) ──
	mux.HandleFunc("POST /api/v1/auth/register", authH.Register)
	mux.HandleFunc("POST /api/v1/auth/login", authH.Login)
	mux.HandleFunc("POST /api/v1/auth/refresh", authH.RefreshToken)

	// ── Auth routes (protected) ──
	mux.Handle("GET /api/v1/auth/me", jwtMW.Authenticate(http.HandlerFunc(authH.Me)))

	// ── LMS routes ──
	mux.HandleFunc("GET /api/v1/tracks", lmsH.ListTracks)
	mux.Handle("GET /api/v1/tracks/{id}", http.HandlerFunc(lmsH.GetTrack))
	mux.Handle("GET /api/v1/courses/{id}", http.HandlerFunc(lmsH.GetCourse))
	
	// Instructor/Admin Protected LMS routes
	mux.Handle("POST /api/v1/courses", jwtMW.Authenticate(
		middleware.RequireRole("instructor", "admin", "super_admin")(http.HandlerFunc(lmsH.CreateCourse))))
	mux.Handle("POST /api/v1/lessons", jwtMW.Authenticate(
		middleware.RequireRole("instructor", "admin", "super_admin")(http.HandlerFunc(lmsH.CreateLesson))))
	mux.Handle("PUT /api/v1/courses/{id}", jwtMW.Authenticate(
		middleware.RequireRole("instructor", "admin", "super_admin")(http.HandlerFunc(lmsH.UpdateCourse))))
	mux.Handle("PUT /api/v1/lessons/{id}", jwtMW.Authenticate(
		middleware.RequireRole("instructor", "admin", "super_admin")(http.HandlerFunc(lmsH.UpdateLesson))))
	
	mux.Handle("GET /api/v1/lessons/{id}", jwtMW.Authenticate(http.HandlerFunc(lmsH.GetLesson)))
	mux.Handle("POST /api/v1/progress", jwtMW.Authenticate(http.HandlerFunc(lmsH.RecordProgress)))
	mux.Handle("GET /api/v1/progress/me", jwtMW.Authenticate(http.HandlerFunc(lmsH.GetMyProgress)))

	// ── Certification routes ──
	mux.HandleFunc("GET /api/v1/certifications", certH.ListCertifications)
	mux.Handle("GET /api/v1/exams/{id}", jwtMW.Authenticate(http.HandlerFunc(certH.GetExam)))
	mux.Handle("POST /api/v1/exams/{id}/start", jwtMW.Authenticate(http.HandlerFunc(certH.StartExam)))
	mux.Handle("PUT /api/v1/exams/{id}/submit", jwtMW.Authenticate(http.HandlerFunc(certH.SubmitExam)))
	mux.Handle("GET /api/v1/exams/{id}/result", jwtMW.Authenticate(http.HandlerFunc(certH.GetExamResult)))
	mux.Handle("GET /api/v1/certificates/me", jwtMW.Authenticate(http.HandlerFunc(certH.GetMyCertificates)))
	mux.HandleFunc("GET /api/v1/certificates/{id}/verify", certH.VerifyCertificate)

	// ── Talent routes ──
	mux.Handle("GET /api/v1/talent/profile/me", jwtMW.Authenticate(http.HandlerFunc(talentH.GetMyProfile)))
	mux.Handle("PUT /api/v1/talent/profile/me", jwtMW.Authenticate(http.HandlerFunc(talentH.UpdateMyProfile)))
	mux.Handle("GET /api/v1/talent/ranking", jwtMW.Authenticate(
		middleware.RequireRole("admin", "super_admin", "regional_manager")(http.HandlerFunc(talentH.GetRanking))))
	mux.Handle("GET /api/v1/talent/search", jwtMW.Authenticate(
		middleware.RequireRole("admin", "super_admin", "kitchen_operator", "regional_manager")(http.HandlerFunc(talentH.SearchTalent))))
	mux.Handle("GET /api/v1/talent/score/me", jwtMW.Authenticate(http.HandlerFunc(talentH.GetMyScore)))

	// ── Placement routes ──
	mux.Handle("GET /api/v1/kitchens", jwtMW.Authenticate(http.HandlerFunc(placementH.ListKitchens)))
	mux.Handle("POST /api/v1/kitchens", jwtMW.Authenticate(
		middleware.RequireRole("admin", "super_admin", "kitchen_operator")(http.HandlerFunc(placementH.CreateKitchen))))
	mux.Handle("GET /api/v1/positions", jwtMW.Authenticate(http.HandlerFunc(placementH.ListPositions)))
	mux.Handle("POST /api/v1/positions", jwtMW.Authenticate(
		middleware.RequireRole("admin", "kitchen_operator")(http.HandlerFunc(placementH.CreatePosition))))
	mux.Handle("POST /api/v1/placements", jwtMW.Authenticate(
		middleware.RequireRole("admin", "super_admin", "regional_manager")(http.HandlerFunc(placementH.ProposePlacement))))
	mux.Handle("PUT /api/v1/placements/{id}", jwtMW.Authenticate(http.HandlerFunc(placementH.UpdatePlacement)))
	mux.Handle("GET /api/v1/placements/me", jwtMW.Authenticate(http.HandlerFunc(placementH.GetMyPlacements)))

	// ── Media routes ──
	mux.Handle("POST /api/v1/media/upload", jwtMW.Authenticate(
		middleware.RequireRole("admin", "super_admin", "instructor")(http.HandlerFunc(mediaH.Upload))))
	mux.Handle("GET /api/v1/media/{id}", jwtMW.Authenticate(http.HandlerFunc(mediaH.GetMedia)))
	mux.Handle("DELETE /api/v1/media/{id}", jwtMW.Authenticate(http.HandlerFunc(mediaH.DeleteMedia)))

	// ── Static file server (dev only — production uses CDN) ──
	fs := http.FileServer(http.Dir(storage.ServeDir()))
	mux.Handle("/media/", http.StripPrefix("/media/", fs))

	// Apply global middleware
	handler := middleware.Logger(middleware.CORS(mux))

	addr := fmt.Sprintf("%s:%s", cfg.Server.Host, cfg.Server.Port)
	log.Printf("NWEPP API server starting on %s", addr)
	if err := http.ListenAndServe(addr, handler); err != nil {
		log.Fatalf("Server failed: %v", err)
	}
}
