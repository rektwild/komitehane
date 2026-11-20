/**
 * Search engines, AI search/answer engines and user-triggered AI fetchers.
 * These drive visibility (classic search, AI Overviews/AI Mode, ChatGPT
 * Search, Perplexity, Claude, Gemini Apps grounding, Siri/Spotlight, Alexa)
 * and are always allowed on public content.
 */
export const searchAndRetrievalCrawlers = [
  "Googlebot",
  "bingbot",
  // Google-Extended is a control token, not a crawler. Allowing it lets
  // Gemini Apps and Vertex AI ground answers in this site (and permits Gemini
  // training); it does not affect Google Search or AI Overviews.
  "Google-Extended",
  "OAI-SearchBot",
  "ChatGPT-User",
  "PerplexityBot",
  "Perplexity-User",
  "Claude-SearchBot",
  "Claude-User",
  "Applebot",
  "Amzn-SearchBot",
  "Amzn-User",
  "DuckAssistBot",
  "meta-externalfetcher",
] as const;

/**
 * Crawlers and control tokens used to collect model-training data. Blocked
 * unless ALLOW_MODEL_TRAINING_CRAWLERS=true. Blocking them does not remove
 * the site from the search/answer products above, which use separate agents.
 */
export const modelTrainingCrawlers = [
  "GPTBot",
  "ClaudeBot",
  "CCBot",
  "Applebot-Extended",
  "meta-externalagent",
  "FacebookBot",
  "Bytespider",
  "Amazonbot",
  "cohere-training-data-crawler",
  "AI2Bot",
  "Ai2Bot-Dolma",
] as const;
