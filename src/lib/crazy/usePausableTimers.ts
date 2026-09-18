import { useCallback, useEffect, useRef } from "react";

// One clock keeps transitions in sync and prevents callbacks from an old run.
export function usePausableTimers(paused: boolean) {
  const pausedRef = useRef(paused);
  pausedRef.current = paused;
  const tasks = useRef(new Map<number, { remaining: number; callback: () => void }>());
  const sequence = useRef(0);
  const schedule = useCallback((callback: () => void, delay: number) => {
    const id = ++sequence.current;
    tasks.current.set(id, { remaining: delay, callback });
    return id;
  }, []);
  const cancel = useCallback((id: number) => { tasks.current.delete(id); }, []);
  const clear = useCallback(() => { tasks.current.clear(); }, []);

  useEffect(() => {
    let frame = 0;
    let last = performance.now();
    const tick = (now: number) => {
      const delta = Math.min(80, now - last);
      last = now;
      if (!pausedRef.current && !document.hidden) {
        const due: (() => void)[] = [];
        for (const [id, task] of tasks.current) {
          task.remaining -= delta;
          if (task.remaining <= 0) { tasks.current.delete(id); due.push(task.callback); }
        }
        due.forEach((callback) => callback());
      }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => { cancelAnimationFrame(frame); tasks.current.clear(); };
  }, []);
  return { schedule, cancel, clear };
}