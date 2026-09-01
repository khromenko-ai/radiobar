export function CardsIcon({ size = 20, className = "" }: { size?: number; className?: string }) {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="1.75" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={className}
    >
      {/* Back card (visible contour peeking behind on the right) */}
      <path d="M 8.8 4.2 C 9.5 2.9 10.9 2.2 12.4 2.4 L 16.2 3.1 C 18.2 3.5 19.5 5.3 19.1 7.3 L 17.5 16.2 C 17.2 17.8 15.8 19 14.2 19 L 13.5 19" />
      
      {/* Front card (rounded card tilted slightly to the left) */}
      <rect 
        x="3.6" 
        y="4.5" 
        width="11" 
        height="15.5" 
        rx="3" 
        transform="rotate(-5 9.1 12.2)" 
      />
    </svg>
  );
}

