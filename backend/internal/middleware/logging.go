package middleware

import (
	"log"
	"net/http"
	"os"
	"strings"
	"time"
)

// Logger logs each HTTP request with method, path, status, and duration
func Logger(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		start := time.Now()
		sw := &statusWriter{ResponseWriter: w, status: http.StatusOK}

		next.ServeHTTP(sw, r)

		log.Printf("[%s] %s %s %d %s",
			r.Method,
			r.URL.Path,
			r.RemoteAddr,
			sw.status,
			time.Since(start),
		)
	})
}

// CORS handles cross-origin requests
func CORS(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		allowedOrigin := os.Getenv("CORS_ORIGINS")
		if allowedOrigin == "" {
			allowedOrigin = "*"
		} else {
			// If it's a specific origin like https://nwepp.vercel.app, and it matches the request origin, use it.
			// For simplicity in this raw IP setup, if the origin matches the request we send it back, or just allow the configured origin.
			origin := r.Header.Get("Origin")
			if origin != "" && strings.Contains(allowedOrigin, origin) {
				allowedOrigin = origin
			} else {
				// Just pick the first one from the list if not matched, or wildcard
				if strings.Contains(allowedOrigin, ",") {
					allowedOrigin = strings.Split(allowedOrigin, ",")[0]
				}
			}
		}

		w.Header().Set("Access-Control-Allow-Origin", allowedOrigin)
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS, PATCH")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")
		w.Header().Set("Access-Control-Max-Age", "86400")

		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusNoContent)
			return
		}

		next.ServeHTTP(w, r)
	})
}

type statusWriter struct {
	http.ResponseWriter
	status int
}

func (sw *statusWriter) WriteHeader(code int) {
	sw.status = code
	sw.ResponseWriter.WriteHeader(code)
}
