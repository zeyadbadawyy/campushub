package handlers

import (
	"encoding/json"
	"net/http"
	"strconv"

	"campushub/internal/database"
	"campushub/internal/models"

	"github.com/go-chi/chi/v5"
)

func CreateStory(
	w http.ResponseWriter,
	r *http.Request,
) {
	userID :=
		r.Context().
			Value("userID").(int)

	var request struct {
		MediaURL string `json:"media_url"`
		Content  string `json:"content"`

		Styling models.StoryStyling `json:"styling"`
	}

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

	if request.MediaURL == "" &&
		request.Content == "" {

		http.Error(
			w,
			"Story must contain media or content",
			http.StatusBadRequest,
		)

		return
	}

	/*
	 * Defaults.
	 */

	if request.Styling.TextStyle == "" {
		request.Styling.TextStyle =
			"classic"
	}

	if request.Styling.TextSize <= 0 {
		request.Styling.TextSize = 32
	}

	if request.Styling.TextSize < 12 ||
		request.Styling.TextSize > 100 {

		http.Error(
			w,
			"Invalid text size",
			http.StatusBadRequest,
		)

		return
	}

	if request.Styling.TextX < -40 ||
		request.Styling.TextX > 40 {

		http.Error(
			w,
			"Invalid text position",
			http.StatusBadRequest,
		)

		return
	}

	if request.Styling.TextY < -40 ||
		request.Styling.TextY > 40 {

		http.Error(
			w,
			"Invalid text position",
			http.StatusBadRequest,
		)

		return
	}

	if request.Styling.BackgroundIndex < 0 {
		request.Styling.BackgroundIndex = 0
	}

	tx, err :=
		database.DB.Begin()

	if err != nil {

		http.Error(
			w,
			"Could not start story transaction",
			http.StatusInternalServerError,
		)

		return
	}

	defer tx.Rollback()

	/*
	 * Create core story.
	 */

	var story models.Story

	err = tx.QueryRow(
		`
		INSERT INTO stories
		(
			user_id,
			media_url,
			content
		)
		VALUES
		(
			$1,
			$2,
			$3
		)
		RETURNING
			id,
			created_at,
			expires_at
		`,
		userID,
		request.MediaURL,
		request.Content,
	).Scan(
		&story.ID,
		&story.CreatedAt,
		&story.ExpiresAt,
	)

	if err != nil {

		http.Error(
			w,
			"Could not create story",
			http.StatusInternalServerError,
		)

		return
	}

	/*
	 * Create styling row.
	 */

	err = tx.QueryRow(
		`
		INSERT INTO story_styling
		(
			story_id,
			text_style,
			text_size,
			text_x,
			text_y,
			background_index
		)
		VALUES
		(
			$1,
			$2,
			$3,
			$4,
			$5,
			$6
		)
		RETURNING
			id
		`,
		story.ID,
		request.Styling.TextStyle,
		request.Styling.TextSize,
		request.Styling.TextX,
		request.Styling.TextY,
		request.Styling.BackgroundIndex,
	).Scan(
		&request.Styling.ID,
	)

	if err != nil {

		http.Error(
			w,
			"Could not create story styling",
			http.StatusInternalServerError,
		)

		return
	}

	/*
	 * Get author info.
	 */

	err = tx.QueryRow(
		`
		SELECT
			name,
			avatar_url
		FROM users
		WHERE id = $1
		`,
		userID,
	).Scan(
		&story.Author,
		&story.AvatarURL,
	)

	if err != nil {

		http.Error(
			w,
			"Could not read story author",
			http.StatusInternalServerError,
		)

		return
	}

	/*
	 * Build response.
	 */

	story.UserID =
		userID

	story.MediaURL =
		request.MediaURL

	story.Content =
		request.Content

	story.IsViewed =
		false

	story.IsOwner =
		true

	story.ViewCount =
		0

	story.Styling =
		request.Styling

	story.Styling.StoryID =
		story.ID

	/*
	 * Commit everything together.
	 */

	if err := tx.Commit(); err != nil {

		http.Error(
			w,
			"Could not save story",
			http.StatusInternalServerError,
		)

		return
	}

	w.Header().Set(
		"Content-Type",
		"application/json",
	)

	w.WriteHeader(
		http.StatusCreated,
	)

	json.NewEncoder(
		w,
	).Encode(story)
}

func GetStories(
	w http.ResponseWriter,
	r *http.Request,
) {
	currentUserID :=
		r.Context().
			Value("userID").(int)

	rows, err :=
		database.DB.Query(
			`
			SELECT
				s.id,
				s.user_id,
				u.name,
				u.avatar_url,
				s.media_url,
				s.content,
				s.created_at,
				s.expires_at,

				CASE
					WHEN EXISTS(
						SELECT 1
						FROM story_views sv
						WHERE
							sv.story_id = s.id
							AND sv.user_id = $1
					)
					THEN TRUE
					ELSE FALSE
				END AS is_viewed,

				(
					SELECT COUNT(*)
					FROM story_views sv2
					WHERE
						sv2.story_id = s.id
						AND sv2.user_id <> s.user_id
				) AS view_count,

				(s.user_id = $1) AS is_owner,

				COALESCE(
					ss.id,
					0
				) AS styling_id,

				COALESCE(
					ss.text_style,
					'classic'
				) AS text_style,

				COALESCE(
					ss.text_size,
					32
				) AS text_size,

				COALESCE(
					ss.text_x,
					0
				) AS text_x,

				COALESCE(
					ss.text_y,
					0
				) AS text_y,

				COALESCE(
					ss.background_index,
					0
				) AS background_index

			FROM stories s

			JOIN users u
				ON u.id = s.user_id

			LEFT JOIN follows f
				ON f.following_id = s.user_id
				AND f.follower_id = $1

			LEFT JOIN story_styling ss
				ON ss.story_id = s.id

			WHERE
				s.expires_at > CURRENT_TIMESTAMP
				AND (
					s.user_id = $1
					OR f.id IS NOT NULL
				)

			ORDER BY
				s.created_at ASC
			`,
			currentUserID,
		)

	if err != nil {

		http.Error(
			w,
			"Could not fetch stories",
			http.StatusInternalServerError,
		)

		return
	}

	defer rows.Close()

	stories :=
		[]models.Story{}

	for rows.Next() {

		var story models.Story

		err := rows.Scan(
			&story.ID,
			&story.UserID,
			&story.Author,
			&story.AvatarURL,
			&story.MediaURL,
			&story.Content,
			&story.CreatedAt,
			&story.ExpiresAt,
			&story.IsViewed,
			&story.ViewCount,
			&story.IsOwner,

			&story.Styling.ID,
			&story.Styling.TextStyle,
			&story.Styling.TextSize,
			&story.Styling.TextX,
			&story.Styling.TextY,
			&story.Styling.BackgroundIndex,
		)

		if err != nil {

			http.Error(
				w,
				"Could not read stories",
				http.StatusInternalServerError,
			)

			return
		}

		story.Styling.StoryID =
			story.ID

		stories =
			append(
				stories,
				story,
			)
	}

	if err := rows.Err(); err != nil {

		http.Error(
			w,
			"Could not read stories",
			http.StatusInternalServerError,
		)

		return
	}

	w.Header().Set(
		"Content-Type",
		"application/json",
	)

	json.NewEncoder(
		w,
	).Encode(stories)
}

func ViewStory(
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

	var allowed bool

	err =
		database.DB.QueryRow(
			`
			SELECT
				(
					s.user_id = $2
					OR EXISTS(
						SELECT 1
						FROM follows f
						WHERE
							f.follower_id = $2
							AND f.following_id = s.user_id
					)
				) AS allowed
			FROM stories s
			WHERE
				s.id = $1
				AND s.expires_at > CURRENT_TIMESTAMP
			`,
			storyID,
			userID,
		).Scan(
			&allowed,
		)

	if err != nil {

		http.Error(
			w,
			"Story not found",
			http.StatusNotFound,
		)

		return
	}

	if !allowed {

		http.Error(
			w,
			"You cannot view this story",
			http.StatusForbidden,
		)

		return
	}

	/*
	 * Store owner views too.
	 *
	 * Owner is excluded from view_count
	 * by GetStories().
	 */

	_, err =
		database.DB.Exec(
			`
			INSERT INTO story_views
			(
				story_id,
				user_id
			)
			VALUES
			(
				$1,
				$2
			)
			ON CONFLICT (
				story_id,
				user_id
			)
			DO NOTHING
			`,
			storyID,
			userID,
		)

	if err != nil {

		http.Error(
			w,
			"Could not record story view",
			http.StatusInternalServerError,
		)

		return
	}

	w.WriteHeader(
		http.StatusNoContent,
	)
}

func DeleteStory(
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

	result, err :=
		database.DB.Exec(
			`
			DELETE FROM stories
			WHERE
				id = $1
				AND user_id = $2
			`,
			storyID,
			userID,
		)

	if err != nil {

		http.Error(
			w,
			"Could not delete story",
			http.StatusInternalServerError,
		)

		return
	}

	rowsAffected, err :=
		result.RowsAffected()

	if err != nil {

		http.Error(
			w,
			"Could not delete story",
			http.StatusInternalServerError,
		)

		return
	}

	if rowsAffected == 0 {

		http.Error(
			w,
			"Story not found",
			http.StatusNotFound,
		)

		return
	}

	w.WriteHeader(
		http.StatusNoContent,
	)
}
