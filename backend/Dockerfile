FROM golang:1.24-alpine AS builder

WORKDIR /app
COPY go.mod go.sum ./
RUN go mod download
COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -o /nwepp-api ./cmd/server

FROM alpine:3.19
RUN apk --no-cache add ca-certificates
COPY --from=builder /nwepp-api /nwepp-api
RUN mkdir -p /app/uploads
EXPOSE 8081
CMD ["/nwepp-api"]
