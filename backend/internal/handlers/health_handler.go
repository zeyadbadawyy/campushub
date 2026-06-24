package handlers

import (
	"encoding/json"
	"net/http"
)

// HealthCheck godoc
//
//	@Summary		Health Check
//	@Description	Check if API is running
//	@Tags			System
//	@Produce		json
//	@Success		200 {object} map[string]string
//	@Router			/health [get]
func HealthCheck(
	w http.ResponseWriter,
	r *http.Request,
) {

	json.NewEncoder(
		w,
	).Encode(
		map[string]string{
			"status": "ok",
		},
	)
}
