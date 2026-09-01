import { Language } from '../data/content';
import { cn } from '../lib/utils';

export function LanguageToggle({ 
  current, 
  onChange 
}: { 
  current: Language, 
  onChange: (l: Language) => void 
}) {
  const langs: Language[] = ['EN', 'ES', 'RU'];

  return (
    <div className="flex space-x-2 text-xs font-sans tracking-widest text-text-muted">
      {langs.map((lang, idx) => (
        <span key={lang} className="flex items-center">
          <button 
            onClick={() => onChange(lang)}
            className={cn(
              "transition-colors duration-500 hover:text-text-main",
              current === lang ? "text-text-main" : ""
            )}
          >
            {lang}
          </button>
          {idx < langs.length - 1 && <span className="mx-2 opacity-50">/</span>}
        </span>
      ))}
    </div>
  );
}
