/**
 * Prevents unintended gestures from exiting browser fullscreen:
 * 1. Disables pull-to-refresh on mobile Chrome & Safari
 * 2. Prevents overscroll / swipe-down from top edge triggering browser URL bar drop or fullscreen exit
 * 3. Consumes touch events at the boundaries
 */
export function setupFullscreenProtection() {
  if (typeof window === 'undefined') return;

  let startY = 0;
  let startX = 0;

  window.addEventListener(
    'touchstart',
    (e: TouchEvent) => {
      if (e.touches.length > 0) {
        startY = e.touches[0].clientY;
        startX = e.touches[0].clientX;
      }
    },
    { passive: false }
  );

  window.addEventListener(
    'touchmove',
    (e: TouchEvent) => {
      if (e.touches.length === 0) return;
      const currentY = e.touches[0].clientY;
      const currentX = e.touches[0].clientX;
      const dy = currentY - startY; // positive when dragging DOWN
      const dx = Math.abs(currentX - startX);

      // Find the closest scrollable container if any
      let target = e.target as HTMLElement | null;
      let scrollable: HTMLElement | null = null;
      while (target && target !== document.body && target !== document.documentElement) {
        const style = window.getComputedStyle(target);
        if (
          (style.overflowY === 'auto' || style.overflowY === 'scroll') &&
          target.scrollHeight > target.clientHeight
        ) {
          scrollable = target;
          break;
        }
        target = target.parentElement;
      }

      // If dragging DOWN
      if (dy > 0 && dy > dx) {
        // Case 1: No scrollable container, dragging down on static background/screen
        if (!scrollable) {
          e.preventDefault();
          return;
        }
        // Case 2: In scrollable container, but already at the top (scrollTop <= 0)
        // Prevent rubber-band / pull-to-refresh / system browser bar reveal
        if (scrollable.scrollTop <= 0) {
          e.preventDefault();
          return;
        }
      }

      // If dragging UP
      if (dy < 0 && Math.abs(dy) > dx) {
        if (!scrollable) {
          // If not in a scrollable container, prevent default to lock viewport
          // (Our custom gesture listeners in React handle their own navigation)
          return;
        }
        // If at bottom, prevent browser bounce
        if (scrollable.scrollTop + scrollable.clientHeight >= scrollable.scrollHeight) {
          // e.preventDefault(); // react custom pull will handle it
        }
      }
    },
    { passive: false }
  );
}
