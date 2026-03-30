import { useEffect, useState } from "react";

export interface NewsArticle {
  title: string;
  description: string;
  url: string;
  urlToImage: string;
  publishedAt: string;
  source: {
    name: string;
  };
}

export function useNewsFeed(category: string = "all") {
  const [news, setNews] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchNews = async () => {
      try {
        setLoading(true);
        
        const response = await fetch(`/api/news?category=${category}`);

        if (!response.ok) {
          const errorData = await response.json();
          if (response.status === 401) {
            setError("News API key not configured. Please add VITE_NEWS_API_KEY to your environment.");
          } else {
            throw new Error(errorData.message || "Failed to fetch news");
          }
          return;
        }

        const data = await response.json();
        setNews(data.articles || []);
        setError(null);
      } catch (err) {
        console.error("News fetch error:", err);
        setError("Could not load news feed.");
      } finally {
        setLoading(false);
      }
    };

    fetchNews();
    // Refresh every 15 minutes
    const interval = setInterval(fetchNews, 15 * 60 * 1000);
    return () => clearInterval(interval);
  }, [category]);

  return { news, loading, error };
}
