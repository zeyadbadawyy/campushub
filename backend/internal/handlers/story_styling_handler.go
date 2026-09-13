package handlers

import (
	"encoding/json"
	"net/http"
	"strconv"

	"campushub/internal/database"
	"campushub/internal/models"

	"github.com/go-chi/chi/v5"
)

func GetStoryStyling(
	w http.ResponseWriter,
	r *http.Request,
) {
	userID :=
		r.Context().
			Value("userID").(int)

	storyID, err :=
		strconv.Atoi(
			chi.URLParam(
				r,
				"id",
			),
		)

	if err != nil {
		http.Error(
			w,
			"Invalid story ID",
			http.StatusBadRequest,
		)
		return
	}

	var styling models.StoryStyling

	err = database.DB.QueryRow(
		`
		SELECT
			ss.id,
			ss.story_id,
			ss.text_style,
			ss.text_size,
			ss.text_x,
			ss.text_y,
			ss.background_index
		FROM story_styling ss
		JOIN stories s
			ON s.id = ss.story_id
		WHERE
			ss.story_id = $1
			AND s.user_id = $2
		`,
		storyID,
		userID,
	).Scan(
		&styling.ID,
		&styling.StoryID,
		&styling.TextStyle,
		&styling.TextSize,
		&styling.TextX,
		&styling.TextY,
		&styling.BackgroundIndex,
	)

	if err != nil {
		http.Error(
			w,
			"Story styling not found",
			http.StatusNotFound,
		)
		return
	}

	w.Header().Set(
		"Content-Type",
		"application/json",
	)

	json.NewEncoder(
		w,
	).Encode(styling)
}

func UpdateStoryStyling(
	w http.ResponseWriter,
	r *http.Request,
) {
	userID :=
		r.Context().
			Value("userID").(int)

	storyID, err :=
		strconv.Atoi(
			chi.URLParam(
				r,
				"id",
			),
		)

	if err != nil {
		http.Error(
			w,
			"Invalid story ID",
			http.StatusBadRequest,
		)
		return
	}

	var request models.StoryStyling

	if err := json.NewDecoder(
		r.Body,
	).Decode(&request); err != nil {
		http.Error(
			w,
			"Invalid JSON",
			http.StatusBadRequest,
		)
		return
	}

	if request.TextStyle == "" {
		request.TextStyle = "classic"
	}

	if request.TextSize < 12 ||
		request.TextSize > 100 {
		http.Error(
			w,
			"Invalid text size",
			http.StatusBadRequest,
		)
		return
	}

	if request.TextX < -40 ||
		request.TextX > 40 {
		http.Error(
			w,
			"Invalid text position",
			http.StatusBadRequest,
		)
		return
	}

	if request.TextY < -40 ||
		request.TextY > 40 {
		http.Error(
			w,
			"Invalid text position",
			http.StatusBadRequest,
		)
		return
	}

	if request.BackgroundIndex < 0 {
		request.BackgroundIndex = 0
	}

	var styling models.StoryStyling

	err = database.DB.QueryRow(
		`
		UPDATE story_styling ss
		SET
			text_style = $1,
			text_size = $2,
			text_x = $3,
			text_y = $4,
			background_index = $5,
			updated_at = CURRENT_TIMESTAMP
		FROM stories s
		WHERE
			ss.story_id = $6
			AND s.id = ss.story_id
			AND s.user_id = $7
		RETURNING
			ss.id,
			ss.story_id,
			ss.text_style,
			ss.text_size,
			ss.text_x,
			ss.text_y,
			ss.background_index
		`,
		request.TextStyle,
		request.TextSize,
		request.TextX,
		request.TextY,
		request.BackgroundIndex,
		storyID,
		userID,
	).Scan(
		&styling.ID,
		&styling.StoryID,
		&styling.TextStyle,
		&styling.TextSize,
		&styling.TextX,
		&styling.TextY,
		&styling.BackgroundIndex,
	)

	if err != nil {
		http.Error(
			w,
			"Could not update story styling",
			http.StatusNotFound,
		)
		return
	}

	w.Header().Set(
		"Content-Type",
		"application/json",
	)

	json.NewEncoder(
		w,
	).Encode(styling)
}
