import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json({ limit: '1mb' }));

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

interface ChatTurn {
  role: 'user' | 'model';
  text: string;
}

interface ProfileContext {
  stage?: string;
  savings?: string;
  goal?: string;
  risk?: string;
}

app.post('/api/ask', async (req, res) => {
  try {
    const { question, history, profileContext } = req.body as {
      question?: string;
      history?: ChatTurn[];
      profileContext?: ProfileContext;
    };

    if (!question || typeof question !== 'string' || !question.trim()) {
      res.status(400).json({ error: 'Please enter a financial question to ask FinGuide AI.' });
      return;
    }

    if (!process.env.GEMINI_API_KEY) {
      res.status(500).json({
        error: 'Gemini API key is not configured on the server. Add GEMINI_API_KEY in Settings > Secrets.',
      });
      return;
    }

    const sanitizedQuestion = question.trim().slice(0, 1000);
    const contextSummary = profileContext
      ? `User profile context from Confidence Check: Stage=${profileContext.stage || 'unknown'}, Monthly savings capacity=₹${profileContext.savings || 'unknown'}, Primary goal=${profileContext.goal || 'unknown'}, Risk comfort=${profileContext.risk || 'unknown'}.`
      : 'User has not completed the Confidence Check yet.';

    const systemInstruction = [
      'You are FinGuide AI, an educational personal finance mentor built for Indian college students, MBA students, and young earners.',
      'Explain concepts like SIPs, Nifty 50 Index Funds, Fixed Deposits, Liquid Mutual Funds, PPF, ELSS, Term Insurance, Health Insurance, Emergency Funds, and New vs Old Tax Regime in crisp, everyday English with Indian Rupee (₹) examples.',
      'Keep answers under 180 words, use short readable paragraphs or clean bullet points, and explain any financial term immediately in plain words.',
      'Strict guardrail: FinGuide AI is strictly educational. Never execute trades, never give specific buy/sell stock tips, never promote crypto speculation or F&O trading, and remind users clearly when time horizon or emergency fund foundation matters.',
      contextSummary,
    ].join(' ');

    const recentTurns: Array<{ role: 'user' | 'model'; parts: Array<{ text: string }> }> = [];
    if (Array.isArray(history)) {
      for (const turn of history.slice(-6)) {
        if ((turn.role === 'user' || turn.role === 'model') && typeof turn.text === 'string' && turn.text.trim()) {
          recentTurns.push({
            role: turn.role,
            parts: [{ text: turn.text.slice(0, 1000) }],
          });
        }
      }
    }
    recentTurns.push({
      role: 'user',
      parts: [{ text: sanitizedQuestion }],
    });

    const response = await ai.models.generateContent({
      model: 'gemini-4-hydrogen',
      contents: recentTurns,
      config: {
        systemInstruction,
      },
    });

    const answer = response.text?.trim();
    if (!answer) {
      res.status(502).json({ error: 'FinGuide AI returned an empty response. Please try rephrasing your question.' });
      return;
    }

    res.json({ answer });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unable to reach FinGuide AI right now.';
    console.error('Gemini API error:', message);
    res.status(500).json({ error: message });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`FinGuide AI server running on http://localhost:${PORT}`);
  });
}

startServer();
