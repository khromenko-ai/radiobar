import { useState, useEffect } from 'react';
import { Maximize, Minimize } from 'lucide-react';

export function isStandaloneMode(): boolean {
  if (typeof window === 'undefined') return false;
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    window.matchMedia('(display-mode: fullscreen)').matches ||
    (window.navigator as any).standalone === true ||
    document.referrer.includes('android-app://')
  );
}

export function FullscreenToggle() {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    setIsStandalone(isStandaloneMode());

    const checkState = () => {
      const isNative = !!(
        document.fullscreenElement ||
        (document as any).webkitFullscreenElement ||
        (document as any).mozFullScreenElement ||
        (document as any).msFullscreenElement
      );
      const isCss = document.body.classList.contains('is-css-fullscreen');
      setIsFullscreen(isNative || isCss);
    };

    document.addEventListener('fullscreenchange', checkState);
    document.addEventListener('webkitfullscreenchange', checkState);
    document.addEventListener('mozfullscreenchange', checkState);
    document.addEventListener('MSFullscreenChange', checkState);

    // Initial check
    checkState();

    return () => {
      document.removeEventListener('fullscreenchange', checkState);
      document.removeEventListener('webkitfullscreenchange', checkState);
      document.removeEventListener('mozfullscreenchange', checkState);
      document.removeEventListener('MSFullscreenChange', checkState);
    };
  }, []);

  if (isStandalone) {
    return null;
  }

  const toggleFullscreen = async () => {
    const doc = document as any;
    const docEl = document.documentElement as any;

    const isNative = !!(
      doc.fullscreenElement ||
      doc.webkitFullscreenElement ||
      doc.mozFullScreenElement ||
      doc.msFullscreenElement
    );
    const isCss = document.body.classList.contains('is-css-fullscreen');

    if (isNative || isCss) {
      // Exit Fullscreen
      if (isNative) {
        try {
          if (doc.exitFullscreen) await Promise.resolve(doc.exitFullscreen());
          else if (doc.webkitExitFullscreen) await Promise.resolve(doc.webkitExitFullscreen());
          else if (doc.mozCancelFullScreen) await Promise.resolve(doc.mozCancelFullScreen());
          else if (doc.msExitFullscreen) await Promise.resolve(doc.msExitFullscreen());
        } catch (e) {
          console.warn("Failed to exit native fullscreen", e);
        }
      }
      document.documentElement.classList.remove('is-css-fullscreen');
      document.body.classList.remove('is-css-fullscreen');
      setIsFullscreen(false);
    } else {
      // Enter Fullscreen
      let nativeSuccess = false;
      try {
        if (docEl.requestFullscreen) {
          await Promise.resolve(docEl.requestFullscreen());
          nativeSuccess = true;
        } else if (docEl.webkitRequestFullscreen) {
          await Promise.resolve(docEl.webkitRequestFullscreen());
          nativeSuccess = true;
        } else if (docEl.mozRequestFullScreen) {
          await Promise.resolve(docEl.mozRequestFullScreen());
          nativeSuccess = true;
        } else if (docEl.msRequestFullscreen) {
          await Promise.resolve(docEl.msRequestFullscreen());
          nativeSuccess = true;
        }
      } catch (error) {
        console.warn('Native fullscreen blocked or failed (e.g., iframe policy or iOS iPhone). Falling back to CSS fullscreen.', error);
      }

      // If native fullscreen was blocked (iframe) or unsupported (iOS iPhone Safari), fallback to CSS fullscreen
      if (!nativeSuccess) {
        document.documentElement.classList.add('is-css-fullscreen');
        document.body.classList.add('is-css-fullscreen');
        setIsFullscreen(true);
      }
    }
  };

  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        toggleFullscreen();
      }}
      className="text-text-sub hover:text-text-main transition-colors p-1 flex items-center justify-center cursor-pointer select-none"
      title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
      aria-label="Toggle Fullscreen"
    >
      {isFullscreen ? (
        <Minimize size={15} strokeWidth={1.75} />
      ) : (
        <Maximize size={15} strokeWidth={1.75} />
      )}
    </button>
  );
}
