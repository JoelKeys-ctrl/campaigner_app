import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";

function getGeminiClient(): GoogleGenAI {
  const apiKey = process.env.Campaigner_API_key || process.env.CAMPAIGNER_API_KEY || process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("Campaigner_API_key environment variable is not configured.");
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// Fallback models in priority order to guarantee high availability during demand spikes
const FALLBACK_MODELS = ['gemini-3.7-flash', 'gemini-3.1-pro-preview', 'gemini-3.1-flash-lite'];

async function generateContentWithRetryAndFallback(
  ai: GoogleGenAI,
  params: {
    contents: string;
    config?: any;
  }
) {
  let lastError: any = null;

  for (const model of FALLBACK_MODELS) {
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        const response = await ai.models.generateContent({
          model,
          contents: params.contents,
          config: params.config,
        });
        return response;
      } catch (err: any) {
        lastError = err;
        const errMessage = err?.message || JSON.stringify(err);
        const isTransient = 
          err?.status === 503 || 
          err?.code === 503 ||
          errMessage.includes('503') || 
          errMessage.includes('high demand') || 
          errMessage.includes('UNAVAILABLE') || 
          errMessage.includes('RESOURCE_EXHAUSTED') ||
          errMessage.includes('429');

        console.warn(`[Gemini API] Request failed on ${model} (attempt ${attempt}):`, errMessage);

        if (isTransient && attempt < 2) {
          await new Promise((resolve) => setTimeout(resolve, 700));
          continue;
        }
        break; // Try next fallback model
      }
    }
  }

  throw lastError || new Error("Gemini AI is temporarily experiencing high demand. Please retry in a few moments.");
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Health check endpoint
  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok" });
  });

  // Check if Gemini API is configured
  app.get("/api/gemini/status", (_req, res) => {
    const isConfigured = Boolean(
      process.env.Campaigner_API_key || 
      process.env.CAMPAIGNER_API_KEY || 
      process.env.GEMINI_API_KEY
    );
    res.json({ configured: isConfigured });
  });

  // Generate complete email campaign (Subject + Body)
  app.post("/api/gemini/generate-campaign", async (req, res) => {
    try {
      const { 
        campaignName, 
        tone = 'Professional & Persuasive', 
        targetAudience = 'Customers & Leads',
        keyPoints = '',
        callToAction = '' 
      } = req.body;

      if (!campaignName) {
        return res.status(400).json({ error: "Campaign name is required." });
      }

      const ai = getGeminiClient();

      const prompt = `You are a world-class email marketing specialist and copywriter.
Create a high-converting, engaging marketing email campaign based on these parameters:
- Campaign Name/Topic: "${campaignName}"
- Tone of Voice: "${tone}"
- Target Audience: "${targetAudience}"
${keyPoints ? `- Key Selling Points / Details: "${keyPoints}"` : ''}
${callToAction ? `- Desired Call To Action (CTA): "${callToAction}"` : ''}

Instructions:
1. Subject Line: Write a high-converting, attention-grabbing subject line (under 60 characters).
2. Email Body: Write a complete, polished email with a greeting (using {{name}}), compelling hook, value proposition, bullet points if helpful, clear call to action, and professional sign-off (with {{company}} placeholder where suitable).
3. Personalization: Use {{name}} and {{company}} placeholders naturally.
4. Format: Clean plain text with double linebreaks between paragraphs.

Return a structured JSON with 'subject', 'body', and 'previewSnippet'.`;

      const response = await generateContentWithRetryAndFallback(ai, {
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              subject: { type: Type.STRING, description: "Engaging subject line" },
              body: { type: Type.STRING, description: "Full email body in clean text" },
              previewSnippet: { type: Type.STRING, description: "Short preview snippet (preheader)" },
            },
            required: ["subject", "body"],
          },
        },
      });

      const parsed = JSON.parse(response.text?.trim() || "{}");
      res.json(parsed);
    } catch (error: any) {
      console.error("Gemini campaign generation error:", error);
      res.status(500).json({ 
        error: error.message || "Failed to generate email content with Gemini. Please try again." 
      });
    }
  });

  // Generate Subject Line variations with AI analysis
  app.post("/api/gemini/subject-lines", async (req, res) => {
    try {
      const { campaignName, body = '', goal = 'Increase open rates' } = req.body;

      if (!campaignName && !body) {
        return res.status(400).json({ error: "Campaign name or email body is required." });
      }

      const ai = getGeminiClient();

      const prompt = `Generate 5 diverse, high-performing email subject line options for an email campaign:
Campaign Topic: "${campaignName || 'Marketing Campaign'}"
Email Content Summary/Body: "${body.slice(0, 500)}"
Goal: "${goal}"

Provide 5 variations ranging in style (e.g. Curiosity, Direct Value, Urgency, Question, Personal/Story).
For each, evaluate its predicted engagement style and score.`;

      const response = await generateContentWithRetryAndFallback(ai, {
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                subject: { type: Type.STRING },
                style: { type: Type.STRING, description: "e.g., Curiosity, Value Proposition, Urgency" },
                estimatedImpact: { type: Type.STRING, description: "High / Medium-High / Exceptional" },
                reasoning: { type: Type.STRING, description: "Why this works well" },
              },
              required: ["subject", "style", "estimatedImpact", "reasoning"],
            },
          },
        },
      });

      const parsed = JSON.parse(response.text?.trim() || "[]");
      res.json({ subjectLines: parsed });
    } catch (error: any) {
      console.error("Gemini subject line error:", error);
      res.status(500).json({ 
        error: error.message || "Failed to generate subject lines." 
      });
    }
  });

  // Improve or rewrite existing email copy
  app.post("/api/gemini/improve-copy", async (req, res) => {
    try {
      const { currentText, action = 'improve', targetTone = 'Professional' } = req.body;

      if (!currentText) {
        return res.status(400).json({ error: "Text to improve is required." });
      }

      const ai = getGeminiClient();

      const actionInstructions: Record<string, string> = {
        improve: 'Enhance clarity, persuasiveness, and flow while preserving the core message.',
        shorter: 'Make it concise, punchy, and impactful without losing essential details.',
        casual: 'Make the tone friendly, conversational, and warm.',
        persuasive: 'Make it compelling, focused on benefits and high conversion.',
        formal: 'Make it authoritative, professional, and corporate.',
        fix_grammar: 'Fix grammar, spelling, punctuation, and wording nuances seamlessly.',
      };

      const instruction = actionInstructions[action] || `Adjust tone to ${targetTone}.`;

      const prompt = `You are an elite email editor.
Task: ${instruction}

Original Text:
"${currentText}"

Keep personalization tokens like {{name}} and {{company}} intact.
Return a JSON object with 'improvedText' and 'summaryOfChanges'.`;

      const response = await generateContentWithRetryAndFallback(ai, {
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              improvedText: { type: Type.STRING },
              summaryOfChanges: { type: Type.STRING },
            },
            required: ["improvedText"],
          },
        },
      });

      const parsed = JSON.parse(response.text?.trim() || "{}");
      res.json(parsed);
    } catch (error: any) {
      console.error("Gemini improve copy error:", error);
      res.status(500).json({ 
        error: error.message || "Failed to improve text." 
      });
    }
  });

  // Vite middleware for dev / static serving in production
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Campaigner Pro server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
