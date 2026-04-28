import { useCallback, useRef, useState } from "react";

/**
 * Simple linear history stack with cap. Supports undo/redo and
 * preserves a single "current" snapshot at the top of the stack.
 */
export function useHistory<T>(initial: T, max = 50) {
  const [present, setPresent] = useState<T>(initial);
  const past = useRef<T[]>([]);
  const future = useRef<T[]>([]);
  const [version, setVersion] = useState(0);

  const bump = () => setVersion((v) => v + 1);

  const push = useCallback((next: T) => {
    setPresent((prev) => {
      // Skip pushing duplicate snapshots (saves slots when streaming).
      if (Object.is(prev, next)) return prev;
      past.current.push(prev);
      if (past.current.length > max) past.current.shift();
      future.current = [];
      bump();
      return next;
    });
  }, [max]);

  /** Replace current value WITHOUT polluting the undo stack. Use during streaming. */
  const replace = useCallback((next: T) => {
    setPresent(next);
  }, []);

  const undo = useCallback(() => {
    if (past.current.length === 0) return;
    setPresent((prev) => {
      const previous = past.current.pop()!;
      future.current.push(prev);
      bump();
      return previous;
    });
  }, []);

  const redo = useCallback(() => {
    if (future.current.length === 0) return;
    setPresent((prev) => {
      const next = future.current.pop()!;
      past.current.push(prev);
      bump();
      return next;
    });
  }, []);

  const reset = useCallback((next: T) => {
    past.current = [];
    future.current = [];
    setPresent(next);
    bump();
  }, []);

  return {
    value: present,
    push,
    replace,
    undo,
    redo,
    reset,
    canUndo: past.current.length > 0,
    canRedo: future.current.length > 0,
    historySize: past.current.length,
    version,
  };
}
