package utils

import "campushub/internal/database"

func CanViewUser(
	viewerID int,
	targetUserID int,
) (bool, error) {

	if viewerID == targetUserID {

		return true, nil
	}

	var isPrivate bool

	err := database.DB.QueryRow(
		`
		SELECT private_account
		FROM user_settings
		WHERE user_id=$1
		`,
		targetUserID,
	).Scan(
		&isPrivate,
	)

	if err != nil {

		return false, err
	}

	if !isPrivate {

		return true, nil
	}

	var isFollower bool

	err = database.DB.QueryRow(
		`
		SELECT EXISTS(
			SELECT 1
			FROM follows
			WHERE follower_id=$1
			AND following_id=$2
		)
		`,
		viewerID,
		targetUserID,
	).Scan(
		&isFollower,
	)

	if err != nil {

		return false, err
	}

	return isFollower, nil
}
