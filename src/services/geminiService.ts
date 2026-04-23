import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// Unified caching system
const cache: Record<string, { data: any, timestamp: number }> = {};
const CACHE_TTL = 1000 * 60 * 5; // 5 minutes cache
const SHORT_CACHE_TTL = 1000 * 30; // 30 seconds for highly volatile data

function getCached<T>(key: string, ttl = CACHE_TTL): T | null {
  const entry = cache[key];
  if (entry && (Date.now() - entry.timestamp) < ttl) {
    return entry.data as T;
  }
  return null;
}

function setCache(key: string, data: any) {
  cache[key] = { data, timestamp: Date.now() };
}

// Rate limiting & Queue system
class GeminiQueue {
  private queue: (() => Promise<void>)[] = [];
  private processing = false;
  private lastRequestTime = 0;
  private minInterval = 5000;
  private isExhaustedUntil = 0;

  async add<T>(task: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      this.queue.push(async () => {
        try {
          const now = Date.now();
          
          if (now < this.isExhaustedUntil) {
            const waitTime = this.isExhaustedUntil - now;
            await new Promise(r => setTimeout(r, waitTime));
          }

          const timeSinceLast = Date.now() - this.lastRequestTime;
          if (timeSinceLast < this.minInterval) {
            await new Promise(r => setTimeout(r, this.minInterval - timeSinceLast));
          }
          
          const result = await this.executeWithBackoff(task);
          this.lastRequestTime = Date.now();
          resolve(result);
        } catch (error) {
          reject(error);
        }
      });
      this.process();
    });
  }

  private async process() {
    if (this.processing || this.queue.length === 0) return;
    this.processing = true;
    while (this.queue.length > 0) {
      const task = this.queue.shift();
      if (task) await task();
    }
    this.processing = false;
  }

  private async executeWithBackoff<T>(task: () => Promise<T>, retries = 3): Promise<T> {
    let attempt = 0;
    while (attempt <= retries) {
      try {
        return await task();
      } catch (error: any) {
        const isRateLimit = error?.status === 429 || error?.message?.includes("429") || error?.message?.includes("RESOURCE_EXHAUSTED");
        
        if (isRateLimit && attempt < retries) {
          attempt++;
          // Jittered exponential backoff
          const waitTime = Math.min(30000, Math.pow(2, attempt) * 1000 + Math.random() * 1000);
          this.isExhaustedUntil = Date.now() + waitTime;
          console.warn(`Gemini Rate Limit hit. Attempt ${attempt}/${retries}. Retrying in ${Math.round(waitTime)}ms...`);
          await new Promise(resolve => setTimeout(resolve, waitTime));
          continue;
        }
        
        // Map common errors
        if (isRateLimit) {
          throw new Error("Institutional AI quota reached. Please wait while the neural buffer resets.");
        }
        if (error?.message?.includes("SAFETY")) {
          throw new Error("Analysis blocked by risk containment protocols. Refining search parameters...");
        }
        
        throw error;
      }
    }
    throw new Error("Neural synthesis timed out. Please retry the uplink.");
  }
}

const geminiQueue = new GeminiQueue();

export interface AlphaSignal {
  assetId: string;
  type: "LONG" | "SHORT" | "NEUTRAL";
  confidence: number;
  entry: number;
  sl: number;
  tp: number;
  reasoning: string;
  timestamp: string;
}

export async function generateAlphaSignals(marketContext: string): Promise<AlphaSignal[]> {
  const cacheKey = `signals-${marketContext.slice(0, 100)}`;
  const cached = getCached<AlphaSignal[]>(cacheKey, SHORT_CACHE_TTL);
  if (cached) return cached;

  return geminiQueue.add(async () => {
    try {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `You are an elite institutional trading bot with access to a high-frequency live feed. 
        
        STRICT DATA INTEGRITY PROTOCOL:
        1. LOCATE THE "RAW=" VALUE FOR EACH ASSET IN THE "CURRENT_MARKET_PRICES" STRING BELOW.
        2. YOUR 'entry' PRICE MUST BE THE EXACT "RAW" VALUE PROVIDED. NO EXCEPTIONS.
        3. IGNORE ANY INTERNAL KNOWLEDGE OF WHAT ASSETS "SHOULD" COST. IF RAW=2341.82, THEN 2341.82 IS THE ONLY ABSOLUTE TRUTH.
        4. YOUR STOP LOSS (SL) AND TAKE PROFIT (TP) MUST BE CALCULATED FROM THIS RAW VALUE.
        5. INCORPORATE THE "COT_REPORT" AND "INTERMARKET" DATA IF PROVIDED TO WEIGHT CONVICTION.
        
        Market Context:
        ${marketContext}
        
        Analyze this context and generate exactly 3 institutional-grade signals.
        
        Respond only with a JSON array:
        {
          "assetId": string (e.g., "XAU/USD"),
          "type": "LONG" | "SHORT" | "NEUTRAL",
          "confidence": number,
          "entry": number (MUST match the RAW value from context),
          "sl": number,
          "tp": number,
          "reasoning": string (Explaining bias using RAW price and institutional sentiment),
          "timestamp": string (ISO)
        }
        `,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                assetId: { type: Type.STRING },
                type: { type: Type.STRING, enum: ["LONG", "SHORT", "NEUTRAL"] },
                confidence: { type: Type.NUMBER },
                entry: { type: Type.NUMBER },
                sl: { type: Type.NUMBER },
                tp: { type: Type.NUMBER },
                reasoning: { type: Type.STRING },
                timestamp: { type: Type.STRING }
              },
              required: ["assetId", "type", "confidence", "entry", "sl", "tp", "reasoning", "timestamp"]
            }
          }
        }
      });

      const signals = JSON.parse(response.text);
      setCache(cacheKey, signals);
      return signals;
    } catch (error) {
      console.error("Gemini alpha signals error:", error);
      return [];
    }
  });
}

export type SummaryLength = "short" | "medium" | "detailed";

export async function summarizeArticle(title: string, description: string, length: SummaryLength = "medium") {
  const cacheKey = `summary-${title}-${length}`;
  const cached = getCached<string>(cacheKey);
  if (cached) return cached;

  return geminiQueue.add(async () => {
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

      const text = response.text;
      setCache(cacheKey, text);
      return text;
    } catch (error: any) {
      if (error?.status === 429 || error?.message?.includes("429")) {
        return "Summarization paused due to rate limits. Please try again in a moment.";
      }
      console.error("Gemini summarization error:", error);
      return "Summary unavailable at this time.";
    }
  });
}

export type Sentiment = "positive" | "negative" | "neutral";

export async function getSentiment(title: string, description: string): Promise<Sentiment> {
  const cacheKey = `sentiment-${title}-${description}`.slice(0, 100);
  const cached = getCached<Sentiment>(cacheKey);
  if (cached) return cached;

  return geminiQueue.add(async () => {
    try {
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
      
      setCache(cacheKey, result);
      return result;
    } catch (error: any) {
      if (error?.status === 429 || error?.message?.includes("429")) {
        return "neutral"; 
      }
      console.error("Gemini sentiment analysis error:", error);
      return "neutral";
    }
  });
}

export async function getAssetSentiment(assetId: string, marketContext: string): Promise<Sentiment> {
  const cacheKey = `asset-sentiment-${assetId}-${marketContext.slice(0, 50)}`;
  const cached = getCached<Sentiment>(cacheKey, CACHE_TTL);
  if (cached) return cached;

  return geminiQueue.add(async () => {
    try {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Analyze the current market sentiment for ${assetId} based on the provided institutional context. 
        Respond with ONLY one word: "positive", "negative", or "neutral".
        
        Institutional Context:
        ${marketContext}`,
      });

      const sentimentText = response.text.toLowerCase().trim();
      let result: Sentiment = "neutral";
      if (sentimentText.includes("positive")) result = "positive";
      else if (sentimentText.includes("negative")) result = "negative";
      
      setCache(cacheKey, result);
      return result;
    } catch (error) {
      console.error("Gemini asset sentiment error:", error);
      return "neutral";
    }
  });
}
export async function getDeepMarketAnalysis(
  assetId: string, 
  currentPrice: string, 
  newsHeadlines: string[],
  cotData?: string,
  intermarketData?: string
) {
  const cacheKey = `deep-${assetId}-${currentPrice}`;
  const cached = getCached<string>(cacheKey);
  if (cached) return cached;

  return geminiQueue.add(async () => {
    try {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Provide a professional, deep dive technical and fundamental market analysis for ${assetId}.
        
        MARKET_SNAPSHOT:
        - Price: ${currentPrice}
        ${cotData ? `- COT_DATA: ${cotData}` : ""}
        ${intermarketData ? `- INTERMARKET: ${intermarketData}` : ""}
        
        RECENT_NEWS:
        ${newsHeadlines.join("\n")}
        
        Requirement:
        1. Technical Alpha: Analyze SMC markers and liquidity levels.
        2. Institutional Narrative: Connect COT sentiment and Intermarket drivers.
        3. Strategic Forecast: High-conviction playbook.
        
        Format with Markdown.`,
      });

      const text = response.text;
      setCache(cacheKey, text);
      return text;
    } catch (error: any) {
      console.error("Gemini deep analysis error:", error);
      return "The AI analysis engine is currently over capacity. Please check back shortly for a deep dive report.";
    }
  });
}
