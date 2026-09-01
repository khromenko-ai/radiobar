import { motion } from 'motion/react';
import { Act, Language, uiTranslations, getActImage } from '../data/content';

export function ActCard({ act, language }: { act: Act; language: Language }) {
  const t = uiTranslations[language];
  const imageUrl = getActImage(act);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
      className="flex flex-col w-full max-w-[400px] mx-auto pt-20 px-6 relative"
    >
      <div className="flex flex-col items-center text-center mb-8">
        <h2 className="text-2xl font-serif text-text-main tracking-wide">
          {act.title}
        </h2>
      </div>

      <div className="flex flex-col justify-center min-h-[140px] my-4">
        <p className="text-base font-serif text-text-sec leading-[1.8] whitespace-pre-wrap text-center">
          {act.instruction}
        </p>
      </div>

      <div className="mt-12 pt-8 border-t border-border-main text-center flex flex-col items-center">
        <h4 className="text-[10px] font-sans tracking-widest text-text-muted mb-4 uppercase">
          {t.theDish}
        </h4>

        {imageUrl && (
          <div className="w-full mb-5 rounded-xl overflow-hidden border border-border-main/50 bg-bg-sec/30 aspect-[4/3] relative flex items-center justify-center shadow-sm">
            <img 
              src={imageUrl} 
              alt={act.dishName.replace(/\n/g, ' ')}
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover transition-transform duration-700 hover:scale-105"
              loading="lazy"
            />
          </div>
        )}

        <p className="text-sm font-serif text-text-sec whitespace-pre-wrap">
          {act.dishName}
        </p>
        <p className="text-xs font-sans text-text-sub mt-3 leading-relaxed max-w-[280px] mx-auto">
          {act.dishDescription}
        </p>
      </div>
    </motion.div>
  );
}
