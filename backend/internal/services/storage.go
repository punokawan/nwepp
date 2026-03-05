package services

import (
	"fmt"
	"io"
	"os"
	"path/filepath"
	"time"

	"github.com/google/uuid"
)

// StorageService abstracts file storage (local for dev, S3/MinIO for production)
type StorageService struct {
	BasePath string // Local storage path (dev) or S3 bucket
	CDNBase  string // CDN base URL
}

func NewStorageService() *StorageService {
	basePath := os.Getenv("STORAGE_PATH")
	if basePath == "" {
		basePath = "./uploads"
	}
	cdnBase := os.Getenv("CDN_BASE_URL")
	if cdnBase == "" {
		cdnBase = "http://localhost:8080/media"
	}
	// Ensure upload directory exists
	os.MkdirAll(basePath, 0755)
	return &StorageService{BasePath: basePath, CDNBase: cdnBase}
}

// Upload stores a file and returns the storage key and CDN URL
func (s *StorageService) Upload(fileType, ext string, reader io.Reader) (storageKey, cdnURL string, err error) {
	now := time.Now()
	id := uuid.New().String()

	// Path: /media/{type}/{year}/{month}/{uuid}.{ext}
	dir := fmt.Sprintf("%s/%s/%d/%02d", fileType, now.Year(), int(now.Month()))
	storageKey = fmt.Sprintf("%s/%s.%s", dir, id, ext)

	fullDir := filepath.Join(s.BasePath, dir)
	if err := os.MkdirAll(fullDir, 0755); err != nil {
		return "", "", fmt.Errorf("failed to create directory: %w", err)
	}

	fullPath := filepath.Join(s.BasePath, storageKey)
	f, err := os.Create(fullPath)
	if err != nil {
		return "", "", fmt.Errorf("failed to create file: %w", err)
	}
	defer f.Close()

	if _, err := io.Copy(f, reader); err != nil {
		return "", "", fmt.Errorf("failed to write file: %w", err)
	}

	cdnURL = fmt.Sprintf("%s/%s", s.CDNBase, storageKey)
	return storageKey, cdnURL, nil
}

// Delete removes a file from storage
func (s *StorageService) Delete(storageKey string) error {
	return os.Remove(filepath.Join(s.BasePath, storageKey))
}

// ServeDir returns the base directory for serving static files
func (s *StorageService) ServeDir() string {
	return s.BasePath
}
