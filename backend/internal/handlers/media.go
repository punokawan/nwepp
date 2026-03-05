package handlers

import (
	"database/sql"
	"fmt"
	"net/http"
	"path/filepath"
	"strings"

	"github.com/nwepp/backend/internal/middleware"
	"github.com/nwepp/backend/internal/services"
	"github.com/nwepp/backend/internal/utils"
)

var allowedTypes = map[string]string{
	".mp4":  "video",
	".webm": "video",
	".mov":  "video",
	".jpg":  "image",
	".jpeg": "image",
	".png":  "image",
	".webp": "image",
	".gif":  "image",
	".pdf":  "pdf",
	".doc":  "document",
	".docx": "document",
}

var maxSizes = map[string]int64{
	"video":    2 * 1024 * 1024 * 1024, // 2 GB
	"image":    10 * 1024 * 1024,        // 10 MB
	"pdf":      50 * 1024 * 1024,        // 50 MB
	"document": 50 * 1024 * 1024,        // 50 MB
}

type MediaHandler struct {
	DB      *sql.DB
	Storage *services.StorageService
}

func NewMediaHandler(db *sql.DB, storage *services.StorageService) *MediaHandler {
	return &MediaHandler{DB: db, Storage: storage}
}

// Upload handles multipart file upload
func (h *MediaHandler) Upload(w http.ResponseWriter, r *http.Request) {
	userID := middleware.GetUserID(r.Context())
	if userID == "" {
		utils.Unauthorized(w, "not authenticated")
		return
	}

	// 2GB max request
	r.Body = http.MaxBytesReader(w, r.Body, 2*1024*1024*1024)

	if err := r.ParseMultipartForm(32 << 20); err != nil {
		utils.BadRequest(w, "failed to parse upload: file may be too large")
		return
	}

	file, header, err := r.FormFile("file")
	if err != nil {
		utils.BadRequest(w, "file is required")
		return
	}
	defer file.Close()

	// Validate file extension
	ext := strings.ToLower(filepath.Ext(header.Filename))
	fileType, ok := allowedTypes[ext]
	if !ok {
		utils.BadRequest(w, fmt.Sprintf("file type %s is not allowed", ext))
		return
	}

	// Validate file size
	if header.Size > maxSizes[fileType] {
		utils.BadRequest(w, fmt.Sprintf("file too large: max %d MB for %s", maxSizes[fileType]/(1024*1024), fileType))
		return
	}

	// Upload to storage
	storageKey, cdnURL, err := h.Storage.Upload(fileType, ext[1:], file)
	if err != nil {
		utils.InternalError(w, "failed to store file")
		return
	}

	// Detect MIME type
	mimeType := header.Header.Get("Content-Type")
	if mimeType == "" {
		mimeType = "application/octet-stream"
	}

	// Save metadata to database
	var mediaID string
	err = h.DB.QueryRow(`
		INSERT INTO media_files (uploader_id, file_type, file_name, file_size, mime_type, storage_key, cdn_url, status)
		VALUES ($1, $2, $3, $4, $5, $6, $7, 'ready')
		RETURNING id
	`, userID, fileType, header.Filename, header.Size, mimeType, storageKey, cdnURL).Scan(&mediaID)
	if err != nil {
		utils.InternalError(w, "failed to save file metadata")
		return
	}

	utils.Created(w, map[string]interface{}{
		"id":        mediaID,
		"cdn_url":   cdnURL,
		"file_name": header.Filename,
		"file_size": header.Size,
		"file_type": fileType,
		"mime_type": mimeType,
	})
}

// GetMedia returns file metadata and CDN URL
func (h *MediaHandler) GetMedia(w http.ResponseWriter, r *http.Request) {
	mediaID := r.PathValue("id")

	var m struct {
		ID          string  `json:"id"`
		FileType    string  `json:"file_type"`
		FileName    string  `json:"file_name"`
		FileSize    int64   `json:"file_size"`
		MimeType    string  `json:"mime_type"`
		CDNURL      string  `json:"cdn_url"`
		Thumbnail   *string `json:"thumbnail"`
		DurationSec *int    `json:"duration_sec"`
		Status      string  `json:"status"`
	}

	err := h.DB.QueryRow(`
		SELECT id, file_type, file_name, file_size, mime_type, cdn_url, thumbnail, duration_sec, status
		FROM media_files WHERE id = $1
	`, mediaID).Scan(&m.ID, &m.FileType, &m.FileName, &m.FileSize, &m.MimeType,
		&m.CDNURL, &m.Thumbnail, &m.DurationSec, &m.Status)
	if err == sql.ErrNoRows {
		utils.NotFound(w, "media not found")
		return
	}
	if err != nil {
		utils.InternalError(w, "database error")
		return
	}

	utils.Success(w, m)
}

// DeleteMedia deletes a file (instructor/admin only)
func (h *MediaHandler) DeleteMedia(w http.ResponseWriter, r *http.Request) {
	userID := middleware.GetUserID(r.Context())
	role := middleware.GetUserRole(r.Context())
	mediaID := r.PathValue("id")

	// Verify ownership or admin
	var uploaderID, storageKey string
	err := h.DB.QueryRow("SELECT uploader_id, storage_key FROM media_files WHERE id = $1", mediaID).
		Scan(&uploaderID, &storageKey)
	if err == sql.ErrNoRows {
		utils.NotFound(w, "media not found")
		return
	}
	if err != nil {
		utils.InternalError(w, "database error")
		return
	}

	if uploaderID != userID && role != "admin" && role != "super_admin" {
		utils.Forbidden(w, "you can only delete your own files")
		return
	}

	// Delete from storage
	_ = h.Storage.Delete(storageKey)

	// Delete from database
	h.DB.Exec("DELETE FROM media_files WHERE id = $1", mediaID)

	utils.Success(w, map[string]string{"deleted": mediaID})
}
