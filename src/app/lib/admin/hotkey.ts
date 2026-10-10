import React from 'react';
import { ADMIN_HOTKEY } from '@/app/lib/fyi/config';

/**
 * The chord that opens the admin console.
 *
 * ⌘/Ctrl + Shift + F, anywhere in the site. It is registered once, at the app
 * root, so it works on every route — including the article page — without any
 * page having to know the console exists.
 *
 * Notes on the choice:
 *   - `Shift` + a letter means the chord can never be a plain typing shortcut,
 *     so it does not steal keystrokes from a search field the way `g` would.
 *   - ⌘F, ⌘P, ⌘K are all left alone, and the browsers that claim ⌘⇧F use it for
 *     "search in a new tab" style actions that are irrelevant while reading.
 *   - The handler is skipped for `isContentEditable` and for `Escape`-style
 *     repeats so holding the keys down cannot re-navigate repeatedly.
 */
export function useAdminHotkey(onTrigger: () => void) {
  const handler = React.useRef(onTrigger);
  handler.current = onTrigger;

  React.useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.repeat) return;
      if (event.key.toLowerCase() !== ADMIN_HOTKEY.key.toLowerCase()) return;
      if (!event.shiftKey) return;
      if (!(event.metaKey || event.ctrlKey)) return;

      const target = event.target as HTMLElement | null;
      if (target?.isContentEditable) return;

      event.preventDefault();
      handler.current();
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);
}

/** True when a keydown event is the admin chord. Exported for tests. */
export function isAdminHotkey(event: {
  key: string;
  shiftKey: boolean;
  metaKey: boolean;
  ctrlKey: boolean;
}): boolean {
  return (
    event.key.toLowerCase() === ADMIN_HOTKEY.key.toLowerCase() &&
    event.shiftKey &&
    (event.metaKey || event.ctrlKey)
  );
}
