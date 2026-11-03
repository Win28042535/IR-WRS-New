import { useCallback, useEffect, useRef } from "react";

export function useHesitation(ms: number, onHesitate: () => void): void {
  const cbRef    = useRef(onHesitate);
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => { cbRef.current = onHesitate; });

  const reset = useCallback(() => {
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => cbRef.current(), ms);
  }, [ms]);

  useEffect(() => {
    reset();
    const h = () => reset();
    window.addEventListener("mousemove",   h, { passive: true });
    window.addEventListener("keydown",     h, { passive: true });
    window.addEventListener("pointerdown", h, { passive: true });
    window.addEventListener("scroll",      h, { passive: true });
    return () => {
      clearTimeout(timerRef.current);
      window.removeEventListener("mousemove",   h);
      window.removeEventListener("keydown",     h);
      window.removeEventListener("pointerdown", h);
      window.removeEventListener("scroll",      h);
    };
  }, [reset]);
}

