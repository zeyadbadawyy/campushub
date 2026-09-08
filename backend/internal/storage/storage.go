package storage

import (
	"os"

	storagego "github.com/supabase-community/storage-go"
)

var Client *storagego.Client

func InitStorage() {
	Client = storagego.NewClient(
		os.Getenv("SUPABASE_URL")+"/storage/v1",
		os.Getenv("SUPABASE_SERVICE_KEY"),
		nil,
	)
}
