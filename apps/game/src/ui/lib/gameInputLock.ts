import { useEffect } from 'react';
import Game from '../../scenes/Game';

/**
 * Disable Phaser's global key captures so the browser can deliver key events
 * (including WASD) to focused HTML inputs. Movement suppression while a text
 * input is focused is handled separately in MainPlayerSystem via
 * document.activeElement checks.
 */
export function lockGameInput() {
  Game.getInstance().input.keyboard?.disableGlobalCapture();
}

export function unlockGameInput() {
  Game.getInstance().input.keyboard?.enableGlobalCapture();
}

/** Drop into any component that needs to block game keyboard input while mounted. */
export function useGameInputLock() {
  useEffect(() => {
    lockGameInput();
    return () => unlockGameInput();
  }, []);
}
