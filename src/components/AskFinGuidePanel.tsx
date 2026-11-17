import { useEffect, useRef, useState } from 'react';
import { Send } from 'lucide-react';
import { PRESET_QUESTIONS } from '../data/financialProducts';
import { AssessmentAnswers } from '../types/finguide';

interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
}

interface AskFinGuidePanelProps {
  profileContext: AssessmentAnswers | null;
}

export function AskFinGuidePanel({ profileContext }: AskFinGuidePanelProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'model',
      text: "Hi! Ask me anything about Indian personal finance—like SIPs, Fixed Deposits, Nifty 50 Index Funds, emergency funds, or term insurance. No question is too basic.",
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const askQuestion = async (rawQuestion: string) => {
    const trimmed = rawQuestion.trim();
    if (!trimmed || isLoading) return;

    setErrorMsg(null);
    const userMsg: ChatMessage = {
      id: `u-${Date.now()}`,
      role: 'user',
      text: trimmed,
    };

    const nextHistory = [...messages, userMsg];
    setMessages(nextHistory);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: trimmed,
          history: messages
            .filter((m) => m.id !== 'welcome')
            .map((m) => ({ role: m.role, text: m.text })),
          profileContext: profileContext ?? undefined,
        }),
      });

      const data = (await response.json()) as { answer?: string; error?: string };
      if (!response.ok || !data.answer) {
        throw new Error(data.error || 'Unable to get an answer from FinGuide AI.');
      }

      setMessages((prev) => [
        ...prev,
        {
          id: `m-${Date.now()}`,
          role: 'model',
          text: data.answer!,
        },
      ]);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Network error reaching FinGuide AI.';
      setErrorMsg(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-6 sm:p-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-5">
        <div>
          <h2 className="text-xl sm:text-2xl font-semibold text-slate-900">
            Ask FinGuide AI
          </h2>
          <p className="text-sm text-slate-600 mt-1">
            Simple-language answers tailored for Indian students and first-time earners.
          </p>
        </div>
        {profileContext && (
          <p className="text-xs text-slate-500">
            Tailored to your ₹{profileContext.savings} · {profileContext.risk} risk profile
          </p>
        )}
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        {PRESET_QUESTIONS.map((q) => (
          <button
            key={q}
            type="button"
            disabled={isLoading}
            onClick={() => askQuestion(q)}
            className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors disabled:opacity-50"
          >
            {q}
          </button>
        ))}
      </div>

      <div
        ref={scrollRef}
        className="h-80 sm:h-96 overflow-y-auto bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col gap-3 mb-4"
      >
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`max-w-[85%] rounded-xl px-4 py-3 text-sm leading-relaxed whitespace-pre-line ${
              msg.role === 'user'
                ? 'self-end bg-blue-700 text-white'
                : 'self-start bg-white border border-slate-200 text-slate-800'
            }`}
          >
            {msg.role === 'model' && (
              <span className="block text-xs font-semibold text-blue-700 mb-1">FinGuide AI</span>
            )}
            {msg.text}
          </div>
        ))}

        {isLoading && (
          <div className="self-start bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-500">
            Thinking through a plain-English explanation...
          </div>
        )}
      </div>

      {errorMsg && (
        <div className="mb-3 px-4 py-2.5 text-xs font-medium text-amber-800 bg-amber-50 border border-amber-200 rounded-lg">
          {errorMsg}
        </div>
      )}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          askQuestion(input);
        }}
        className="flex gap-2"
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="e.g., Should I invest ₹1,000/month in Nifty 50 or keep it in an FD?"
          disabled={isLoading}
          className="flex-1 px-4 py-2.5 text-sm bg-white border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-700"
        />
        <button
          type="submit"
          disabled={isLoading || !input.trim()}
          className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-blue-700 rounded-lg hover:bg-blue-800 transition-colors disabled:opacity-50 whitespace-nowrap shrink-0"
        >
          <Send className="w-4 h-4" />
          Ask
        </button>
      </form>
    </div>
  );
}
