package handler

import (
	"encoding/xml"
	"net/http"
	"os"
	"time"

	"github.com/gin-gonic/gin"
)

type rssItem struct {
	Title   string `xml:"title"`
	Link    string `xml:"link"`
	GUID    string `xml:"guid"`
	PubDate string `xml:"pubDate"`
	Desc    string `xml:"description"`
}

type rssChannel struct {
	Title       string    `xml:"title"`
	Link        string    `xml:"link"`
	Description string    `xml:"description"`
	Items       []rssItem `xml:"item"`
}

type rss struct {
	XMLName xml.Name   `xml:"rss"`
	Version string     `xml:"version,attr"`
	Channel rssChannel `xml:"channel"`
}

// FeedRSS returns an RSS 2.0 feed of the last 20 published posts.
func (h *Handler) FeedRSS(c *gin.Context) {
	rows, err := h.Q.ListRecentPublished(c.Request.Context(), 20)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "could not build feed"})
		return
	}
	base := os.Getenv("APP_BASE_URL")

	items := make([]rssItem, 0, len(rows))
	for _, p := range rows {
		pub := ""
		if t := tsToPtr(p.PublishedAt); t != nil {
			pub = t.UTC().Format(time.RFC1123Z)
		}
		link := base + "/blog/" + p.Slug
		items = append(items, rssItem{
			Title: p.Title, Link: link, GUID: link, PubDate: pub, Desc: p.Summary,
		})
	}

	feed := rss{
		Version: "2.0",
		Channel: rssChannel{
			Title:       "Blog",
			Link:        base + "/blog",
			Description: "Latest posts",
			Items:       items,
		},
	}
	c.Header("Content-Type", "application/rss+xml; charset=utf-8")
	out, _ := xml.MarshalIndent(feed, "", "  ")
	c.String(http.StatusOK, xml.Header+string(out))
}
