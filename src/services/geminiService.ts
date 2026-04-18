import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// Simple in-memory cache to avoid redundant API calls
const sentimentCache: Record<string, Sentiment> = {};

export type SummaryLength = "short" | "medium" | "detailed";

export async function summarizeArticle(title: string, description: string, length: SummaryLength = "medium") {
  const lengthPrompts = {
    short: "Summarize the following financial news article in 1 concise sentence focusing on the most critical market impact.",
    medium: "Summarize the following financial news article in 2-3 concise bullet points focusing on market impact and key takeaways.",
    detailed: "Provide a detailed summary of the following financial news article. Include a brief overview, 3-5 key bullet points on market impact, and a concluding thought on potential volatility."
  };

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `${lengthPrompts[length]}
      
      Title: ${title}
      Description: ${description}`,
    });

    return response.text;
  } catch (error: any) {
    if (error?.status === 429 || error?.message?.includes("429")) {
      console.warn("Gemini Rate Limit hit during summarization.");
      return "Summarization paused due to rate limits. Please try again in a moment.";
    }
    console.error("Gemini summarization error:", error);
    return "Summary unavailable at this time.";
  }
}

export type Sentiment = "positive" | "negative" | "neutral";

export async function getSentiment(title: string, description: string): Promise<Sentiment> {
  const cacheKey = `${title}-${description}`.slice(0, 100);
  if (sentimentCache[cacheKey]) return sentimentCache[cacheKey];

  try {
    // Add a small artificial delay to spread out requests and avoid 429s
    await new Promise(resolve => setTimeout(resolve, Math.random() * 2000));

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Analyze the sentiment of the following financial news article towards market trends. 
      Respond with ONLY one word: "positive", "negative", or "neutral".
      
      Title: ${title}
      Description: ${description}`,
    });

    const sentimentText = response.text.toLowerCase().trim();
    let result: Sentiment = "neutral";
    if (sentimentText.includes("positive")) result = "positive";
    else if (sentimentText.includes("negative")) result = "negative";
    
    sentimentCache[cacheKey] = result;
    return result;
  } catch (error: any) {
    if (error?.status === 429 || error?.message?.includes("429")) {
      console.warn("Gemini Rate Limit hit during sentiment analysis.");
      return "neutral"; // Fail gracefully
    }
    console.error("Gemini sentiment analysis error:", error);
    return "neutral";
  }
}

export async function getDeepMarketAnalysis(assetId: string, currentPrice: string, newsHeadlines: string[]) {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Provide a professional, deep dive technical and fundamental market analysis for ${assetId}.
      Current Market Price: ${currentPrice}
      Recent News Context:
      ${newsHeadlines.join("\n")}
      
      Structure your response with:
      1. Technical Bias (Bullish/Bearish/Neutral)
      2. Key Institutional Levels (Support/Resistance)
      3. Fundamental Narrative (Explain global drivers)
      4. Prediction & Strategy (High probability scenario)
      
      Format with Markdown, using bold headers and concise bullet points. Avoid fluff.`,
    });

    return response.text;
  } catch (error: any) {
    console.error("Gemini deep analysis error:", error);
    return "The AI analysis engine is currently over capacity. Please check back shortly for a deep dive report.";
  }
}
