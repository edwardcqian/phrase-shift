import { useState, useEffect } from 'react';
import { Loader2, Check, Plus, X, Save } from 'lucide-react';
import { api } from '../api/client';

const SUGGESTED_LANGUAGES = [
  'Spanish', 'French', 'Mandarin Chinese', 'Japanese', 'Korean',
  'German', 'Italian', 'Portuguese', 'Arabic', 'Russian',
  'Hindi', 'Thai', 'Vietnamese', 'Indonesian', 'Turkish',
  'Polish', 'Dutch', 'Swedish', 'Greek', 'Hebrew',
];

export default function Config() {
  const [languages, setLanguages] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const [customInput, setCustomInput] = useState('');

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    setLoading(true);
    try {
      const config = await api.getConfig();
      setLanguages(config.languages);
    } catch {
      setError('Failed to load config.');
    } finally {
      setLoading(false);
    }
  };

  const toggleLanguage = (lang: string) => {
    setSaved(false);
    setLanguages((prev) =>
      prev.includes(lang) ? prev.filter((l) => l !== lang) : [...prev, lang]
    );
  };

  const addCustom = () => {
    const lang = customInput.trim();
    if (!lang) return;
    if (!languages.includes(lang)) {
      setLanguages((prev) => [...prev, lang]);
      setSaved(false);
    }
    setCustomInput('');
  };

  const removeLanguage = (lang: string) => {
    setLanguages((prev) => prev.filter((l) => l !== lang));
    setSaved(false);
  };

  const handleSave = async () => {
    if (languages.length === 0) {
      setError('Select at least one language.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      await api.updateConfig(languages);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch {
      setError('Failed to save config.');
    } finally {
      setSaving(false);
    }
  };

  const handleCustomKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addCustom();
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 size={24} className="animate-spin text-indigo-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold text-slate-800">Language Settings</h2>
        <p className="text-sm text-slate-500 mt-0.5">
          Choose which languages to translate into
        </p>
      </div>

      {/* Selected languages */}
      {languages.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
            Selected ({languages.length})
          </p>
          <div className="flex flex-wrap gap-2">
            {languages.map((lang) => (
              <span
                key={lang}
                className="flex items-center gap-1.5 bg-indigo-50 text-indigo-700 border border-indigo-200 text-sm font-medium px-3 py-1.5 rounded-full"
              >
                {lang}
                <button
                  onClick={() => removeLanguage(lang)}
                  className="hover:text-red-500 transition-colors cursor-pointer bg-transparent border-0 p-0 flex items-center"
                >
                  <X size={13} />
                </button>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Suggested languages */}
      <div>
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
          Suggested
        </p>
        <div className="flex flex-wrap gap-2">
          {SUGGESTED_LANGUAGES.map((lang) => {
            const selected = languages.includes(lang);
            return (
              <button
                key={lang}
                onClick={() => toggleLanguage(lang)}
                className={`flex items-center gap-1.5 text-sm font-medium px-3 py-1.5 rounded-full border transition-all cursor-pointer
                  ${selected
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                    : 'bg-white text-slate-600 border-slate-200 hover:border-indigo-300 hover:text-indigo-600'
                  }`}
              >
                {selected && <Check size={12} />}
                {lang}
              </button>
            );
          })}
        </div>
      </div>

      {/* Custom language input */}
      <div>
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
          Add custom language
        </p>
        <div className="flex gap-2">
          <input
            value={customInput}
            onChange={(e) => setCustomInput(e.target.value)}
            onKeyDown={handleCustomKeyDown}
            placeholder="e.g. Swahili, Latin, Klingon..."
            className="flex-1 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
          <button
            onClick={addCustom}
            disabled={!customInput.trim()}
            className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 disabled:opacity-40 text-slate-700 font-medium rounded-xl px-4 py-2.5 text-sm transition-colors cursor-pointer disabled:cursor-not-allowed border-0"
          >
            <Plus size={16} />
            Add
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-3">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Save button */}
      <button
        onClick={handleSave}
        disabled={saving || languages.length === 0}
        className={`w-full flex items-center justify-center gap-2 font-semibold rounded-xl py-3 px-4 transition-all cursor-pointer disabled:cursor-not-allowed
          ${saved
            ? 'bg-green-500 text-white'
            : 'bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white'
          }`}
      >
        {saving ? (
          <>
            <Loader2 size={18} className="animate-spin" />
            Saving...
          </>
        ) : saved ? (
          <>
            <Check size={18} />
            Saved!
          </>
        ) : (
          <>
            <Save size={18} />
            Save Settings
          </>
        )}
      </button>
    </div>
  );
}
