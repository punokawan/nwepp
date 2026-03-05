package models

import (
	"encoding/json"
	"time"
)

// MediaFileType defines supported media types
type MediaFileType string

const (
	MediaVideo    MediaFileType = "video"
	MediaImage    MediaFileType = "image"
	MediaPDF      MediaFileType = "pdf"
	MediaDocument MediaFileType = "document"
)

type MediaStatus string

const (
	MediaProcessing MediaStatus = "processing"
	MediaReady      MediaStatus = "ready"
	MediaFailed     MediaStatus = "failed"
)

// MediaFile represents an uploaded media file in object storage
type MediaFile struct {
	ID          string          `json:"id" db:"id"`
	UploaderID  string          `json:"uploader_id" db:"uploader_id"`
	FileType    MediaFileType   `json:"file_type" db:"file_type"`
	FileName    string          `json:"file_name" db:"file_name"`
	FileSize    int64           `json:"file_size" db:"file_size"`
	MimeType    string          `json:"mime_type" db:"mime_type"`
	StorageKey  string          `json:"-" db:"storage_key"`
	CDNURL      string          `json:"cdn_url" db:"cdn_url"`
	Thumbnail   *string         `json:"thumbnail,omitempty" db:"thumbnail"`
	DurationSec *int            `json:"duration_sec,omitempty" db:"duration_sec"`
	Status      MediaStatus     `json:"status" db:"status"`
	Metadata    json.RawMessage `json:"metadata,omitempty" db:"metadata"`
	CreatedAt   time.Time       `json:"created_at" db:"created_at"`
}

// UploadResponse is returned after a successful upload
type UploadResponse struct {
	ID       string `json:"id"`
	CDNURL   string `json:"cdn_url"`
	FileName string `json:"file_name"`
	FileSize int64  `json:"file_size"`
	FileType string `json:"file_type"`
}
