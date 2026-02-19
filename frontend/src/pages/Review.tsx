import { useState, useEffect } from 'react';
import { ArrowLeft, Loader2, BookOpen } from 'lucide-react';
import { api, type Phrase } from '../api/client';
import PhraseCard from '../components/PhraseCard';
import LanguageResult from '../components/LanguageResult';

export default function Review() {
  const [phrases, setPhrases] = useState<Phrase[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selected, setSelected] = useState<Phrase | null>(null);

  const loadHistory = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await api.getHistory();
      setPhrases(data);
    } catch (e) {
      setError('Failed to load history.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHistory();
  }, []);

  const handleSelect = (phrase: Phrase) => {
    setSelected(phrase);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBack = () => {
    setSelected(null);
  };

  const handleDetailLoaded = (translationId: string, detail: string) => {
    if (!selected) return;
    const updated = {
      ...selected,
      translations: selected.translations.map((t) =>
        t.id === translationId ? { ...t, detail } : t
      ),
    };
    setSelected(updated);
    setPhrases((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
  };

  // Detail view
  if (selected) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <button
            onClick={handleBack}
            className="p-2 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-700 transition-colors cursor-pointer border-0 bg-transparent"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <p className="text-xs text-slate-400 font-medium uppercase tracking-wide">Saved phrase</p>
            <p className="text-lg font-semibold text-slate-800">"{selected.input_text}"</p>
          </div>
        </div>

        <p className="text-sm font-semibold text-slate-500">Translations:</p>

        <div className="space-y-3">
          {selected.translations.map((translation) => (
            <LanguageResult
              key={translation.id}
              translation={translation}
              originalText={selected.input_text}
              onDetailLoaded={handleDetailLoaded}
            />
          ))}
        </div>
      </div>
    );
  }

  // List view
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-bold text-slate-800">Review</h2>
        <p className="text-sm text-slate-500 mt-0.5">Your past translations</p>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 size={24} className="animate-spin text-indigo-400" />
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <p className="text-sm text-red-700">{error}</p>
          <button
            onClick={loadHistory}
            className="text-sm text-red-600 underline mt-1 cursor-pointer bg-transparent border-0 p-0"
          >
            Try again
          </button>
        </div>
      )}

      {!loading && !error && phrases.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-14 h-14 bg-slate-100 rounded-full flex items-center justify-center mb-3">
            <BookOpen size={24} className="text-slate-400" />
          </div>
          <p className="text-slate-500 font-medium">No translations yet</p>
          <p className="text-sm text-slate-400 mt-1">Head to the Translate tab to get started</p>
        </div>
      )}

      {!loading && phrases.length > 0 && (
        <div className="space-y-2.5">
          {phrases.map((phrase) => (
            <PhraseCard
              key={phrase.id}
              phrase={phrase}
              onClick={() => handleSelect(phrase)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
