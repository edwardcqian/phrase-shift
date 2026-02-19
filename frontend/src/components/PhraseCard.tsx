import { ChevronRight, Clock } from 'lucide-react';
import { type Phrase } from '../api/client';

interface PhraseCardProps {
  phrase: Phrase;
  onClick: () => void;
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays}d ago`;
  return d.toLocaleDateString();
}

export default function PhraseCard({ phrase, onClick }: PhraseCardProps) {
  const langCount = phrase.translations?.length ?? 0;

  return (
    <button
      onClick={onClick}
      className="w-full text-left bg-white rounded-xl border border-slate-200 p-4 shadow-sm hover:border-indigo-200 hover:shadow-md active:scale-[0.99] transition-all cursor-pointer"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-slate-800 truncate text-base">{phrase.input_text}</p>

          {/* Language previews */}
          {phrase.translations && phrase.translations.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {phrase.translations.slice(0, 3).map((t) => (
                <span
                  key={t.id}
                  className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full"
                >
                  {t.language}
                </span>
              ))}
              {langCount > 3 && (
                <span className="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">
                  +{langCount - 3} more
                </span>
              )}
            </div>
          )}

          <div className="mt-2 flex items-center gap-1 text-xs text-slate-400">
            <Clock size={11} />
            {formatDate(phrase.created_at)}
          </div>
        </div>

        <ChevronRight size={16} className="text-slate-400 mt-0.5 flex-shrink-0" />
      </div>
    </button>
  );
}
