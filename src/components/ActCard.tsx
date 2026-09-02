import { motion } from 'motion/react';
import { Act, Language, uiTranslations, getActImage } from '../data/content';

export function ActCard({ act, language }: { act?: Act; language: Language }) {
  const t = uiTranslations[language] || uiTranslations.RU;
  if (!act) {
    return (
      <div className="w-full pt-16 px-6 pb-2 text-center text-text-muted">
        <p>Loading...</p>
      </div>
    );
  }
  const imageUrl = getActImage(act);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
      className="flex flex-col w-full relative"
    >
      {/* Full-width Hero Cover Image with Bottom Fade and Title Overlay */}
      {imageUrl ? (
        <div className="relative w-full h-[320px] sm:h-[380px] overflow-hidden shrink-0">
          <img 
            src={imageUrl} 
            alt={(act.dishName || '').replace(/\n/g, ' ')}
            referrerPolicy="no-referrer"
            className="absolute inset-0 w-full h-full object-cover object-center"
            style={{ 
              transform: 'translateY(calc(var(--scroll-y, 0px) * 0.4)) scale(1.4)',
              transformOrigin: 'bottom'
            }}
            loading="eager"
          />
          {/* Top Subtle Gradient for header readability */}
          <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-bg-main/90 via-bg-main/40 to-transparent pointer-events-none" />
          
          {/* Bottom Fade Gradient into page background */}
          <div className="absolute inset-x-0 bottom-0 h-44 bg-gradient-to-t from-bg-main via-bg-main/80 to-transparent pointer-events-none flex flex-col justify-end items-center px-6 pb-4">
            <h2 className="text-2xl sm:text-3xl font-serif text-text-main tracking-wide text-center drop-shadow-sm">
              {act.title}
            </h2>
          </div>
        </div>
      ) : (
        <div className="w-full pt-16 px-6 pb-2 text-center">
          <h2 className="text-2xl font-serif text-text-main tracking-wide">
            {act.title}
          </h2>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex flex-col w-full max-w-[420px] mx-auto px-6 pt-0 pb-4 text-center">
        {/* Instruction */}
        <div className="flex flex-col justify-center min-h-[100px] mt-1 mb-4 space-y-1.5">
          {(act.instruction || '').split('\n\n').map((paragraph, idx) => (
            <p key={idx} className="text-base sm:text-lg font-serif text-text-sec leading-[1.4] text-center whitespace-pre-wrap">
              {paragraph}
            </p>
          ))}
        </div>

        {/* Dish Info */}
        <div className="mt-8 pt-6 border-t border-border-main text-center flex flex-col items-center">
          <h4 className="text-[10px] font-sans tracking-widest text-text-muted mb-3 uppercase">
            {t.theDish}
          </h4>

          <p className="text-base font-serif text-text-main whitespace-pre-wrap font-medium">
            {act.dishName}
          </p>
          <p className="text-xs font-sans text-text-sub mt-2.5 leading-relaxed max-w-[300px] mx-auto">
            {act.dishDescription}
          </p>
        </div>
      </div>
    </motion.div>
  );
}

