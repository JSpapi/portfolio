package upload

import (
	"context"
	"fmt"
	"io"
	"os"
	"path/filepath"
	"regexp"
	"strings"

	"github.com/aws/aws-sdk-go-v2/aws"
	awsconfig "github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/credentials"
	"github.com/aws/aws-sdk-go-v2/service/s3"
)

// Client wraps an S3-compatible client pointed at Cloudflare R2.
type Client struct {
	s3        *s3.Client
	bucket    string
	publicURL string
}

// New builds an R2 client from the R2_* environment variables.
func New(ctx context.Context) (*Client, error) {
	accountID := os.Getenv("R2_ACCOUNT_ID")
	if accountID == "" {
		return nil, fmt.Errorf("R2_ACCOUNT_ID not set")
	}
	cfg, err := awsconfig.LoadDefaultConfig(ctx,
		awsconfig.WithCredentialsProvider(credentials.NewStaticCredentialsProvider(
			os.Getenv("R2_ACCESS_KEY_ID"),
			os.Getenv("R2_SECRET_ACCESS_KEY"),
			"",
		)),
		awsconfig.WithRegion("auto"),
	)
	if err != nil {
		return nil, err
	}
	client := s3.NewFromConfig(cfg, func(o *s3.Options) {
		o.BaseEndpoint = aws.String(
			fmt.Sprintf("https://%s.r2.cloudflarestorage.com", accountID),
		)
	})
	return &Client{
		s3:        client,
		bucket:    os.Getenv("R2_BUCKET"),
		publicURL: strings.TrimRight(os.Getenv("R2_PUBLIC_URL"), "/"),
	}, nil
}

var filenameSanitize = regexp.MustCompile(`[^a-zA-Z0-9._-]+`)

// Key builds a namespaced, collision-resistant object key:
// posts/{slug}/{sanitized-filename}-{unix}.{ext}
func Key(slug, filename string, unix int64) string {
	ext := filepath.Ext(filename)
	base := strings.TrimSuffix(filepath.Base(filename), ext)
	base = filenameSanitize.ReplaceAllString(base, "-")
	base = strings.Trim(base, "-")
	if base == "" {
		base = "file"
	}
	return fmt.Sprintf("posts/%s/%s-%d%s", slug, base, unix, ext)
}

// PublicURL returns the CDN URL for an object key.
func (c *Client) PublicURL(key string) string {
	return c.publicURL + "/" + key
}

// Put streams the reader directly to R2 — nothing touches local disk.
func (c *Client) Put(ctx context.Context, key, contentType string, body io.Reader) error {
	_, err := c.s3.PutObject(ctx, &s3.PutObjectInput{
		Bucket:      aws.String(c.bucket),
		Key:         aws.String(key),
		Body:        body,
		ContentType: aws.String(contentType),
	})
	return err
}

// Delete removes an object. Missing objects are treated as success.
func (c *Client) Delete(ctx context.Context, key string) error {
	_, err := c.s3.DeleteObject(ctx, &s3.DeleteObjectInput{
		Bucket: aws.String(c.bucket),
		Key:    aws.String(key),
	})
	return err
}
