import { useState, useRef } from 'react';
import { Send, Loader2, ArrowLeft } from 'lucide-react';
import { api, type Phrase } from '../api/client';
import LanguageResult from '../components/LanguageResult';

export default function Translate() {
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Phrase | null>(null);
  const [error, setError] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const text = inputText.trim();
    if (!text || loading) return;

    setLoading(true);
    setError('');
    setResult(null);

    try {
      const data = await api.translate(text);
      setResult(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Translation failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleReset = () => {
    setResult(null);
    setInputText('');
    setError('');
    setTimeout(() => textareaRef.current?.focus(), 50);
  };

  const handleDetailLoaded = (translationId: string, detail: string) => {
    if (!result) return;
    setResult({
      ...result,
      translations: result.translations.map((t) =>
        t.id === translationId ? { ...t, detail } : t
      ),
    });
  };

  return (
    <div className="space-y-5">
      {/* Input section */}
      {!result && (
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-sm font-semibold text-slate-600 mb-2">
              What do you want to say?
            </label>
            <textarea
              ref={textareaRef}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Enter a word, phrase, or sentence..."
              rows={3}
              autoFocus
              className="w-full resize-none rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent shadow-sm text-base"
            />
            <p className="text-xs text-slate-400 mt-1.5">Press Enter to translate, Shift+Enter for new line</p>
          </div>

          <button
            type="submit"
            disabled={!inputText.trim() || loading}
            className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white font-semibold rounded-xl py-3 px-4 transition-colors cursor-pointer disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                Translating...
              </>
            ) : (
              <>
                <Send size={18} />
                Translate
              </>
            )}
          </button>
        </form>
      )}

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <p className="text-sm text-red-700">{error}</p>
          <button
            onClick={() => { setError(''); }}
            className="text-sm text-red-600 underline mt-1 cursor-pointer bg-transparent border-0 p-0"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Results */}
      {result && (
        <div className="space-y-4">
          {/* Original phrase header */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleReset}
              className="p-2 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-700 transition-colors cursor-pointer border-0 bg-transparent"
            >
              <ArrowLeft size={18} />
            </button>
            <div>
              <p className="text-xs text-slate-400 font-medium uppercase tracking-wide">Translating</p>
              <p className="text-lg font-semibold text-slate-800">"{result.input_text}"</p>
            </div>
          </div>

          <p className="text-sm font-semibold text-slate-500">
            Here is how to say it in:
          </p>

          {/* Translation cards */}
          <div className="space-y-3">
            {result.translations.map((translation) => (
              <LanguageResult
                key={translation.id}
                translation={translation}
                originalText={result.input_text}
                onDetailLoaded={handleDetailLoaded}
              />
            ))}
          </div>

          {/* Translate another */}
          <button
            onClick={handleReset}
            className="w-full py-3 rounded-xl border-2 border-dashed border-slate-200 text-slate-500 hover:border-indigo-300 hover:text-indigo-600 text-sm font-medium transition-colors cursor-pointer bg-transparent"
          >
            + Translate another phrase
          </button>
        </div>
      )}

      {/* Loading skeleton */}
      {loading && (
        <div className="space-y-3">
          <div className="h-5 bg-slate-100 rounded-full w-1/3 animate-pulse" />
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-xl border border-slate-200 p-4 space-y-2">
              <div className="h-3 bg-slate-100 rounded-full w-1/4 animate-pulse" />
              <div className="h-7 bg-slate-100 rounded-full w-2/3 animate-pulse" />
              <div className="h-3 bg-slate-100 rounded-full w-1/3 animate-pulse" />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
