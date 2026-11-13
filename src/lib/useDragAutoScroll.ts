"use client";
// Scrolls the page (or the nearest scrolling panel) while a dragged item is held near its
// top or bottom edge, so a long list can be re-ordered on a phone without letting go.
//   begin(node, onScroll) — at pick-up; finds the scroller that holds `node`
//   move(clientY) — on every pointer move; starts/stops the scroll loop
//   offset()      — how far it has scrolled since pick-up (add it to the drag's dy)
//   stop()        — on drop / cancel
// `onScroll` (given at pick-up) runs after each scroll step so the drag can re-measure its target while the
// pointer itself stays still.
import { useEffect, useRef } from "react";

const EDGE = 72;      // px from the edge where scrolling starts
const MAX_SPEED = 840; // px per second at the very edge (time-based, so 60/120 Hz match)

type Scroller = HTMLElement | Window;

function scrollerOf(node: Element): Scroller {
  for (let el = node.parentElement; el; el = el.parentElement) {
    const oy = getComputedStyle(el).overflowY;
    if ((oy === "auto" || oy === "scroll") && el.scrollHeight > el.clientHeight) return el;
  }
  return window;
}
const pos = (s: Scroller) => (s === window ? window.scrollY : (s as HTMLElement).scrollTop);
const maxOf = (s: Scroller) => s === window
  ? document.documentElement.scrollHeight - innerHeight
  : (s as HTMLElement).scrollHeight - (s as HTMLElement).clientHeight;

export function useDragAutoScroll() {
  const st = useRef<{ el: Scroller; start: number; y: number; raf: number; last: number; max: number; onScroll: () => void } | null>(null);

  const stop = () => {
    if (st.current?.raf) cancelAnimationFrame(st.current.raf);
    st.current = null;
  };
  useEffect(() => stop, []);

  const tick = (now: number) => {
    const s = st.current;
    if (!s) return;
    const dt = s.last ? Math.min(0.05, (now - s.last) / 1000) : 1 / 60;
    s.last = now;
    const box = s.el === window ? { top: 0, bottom: innerHeight } : (s.el as HTMLElement).getBoundingClientRect();
    const top = Math.max(0, box.top), bottom = Math.min(innerHeight, box.bottom);
    const v = s.y < top + EDGE ? -(top + EDGE - s.y) / EDGE : s.y > bottom - EDGE ? (s.y - (bottom - EDGE)) / EDGE : 0;
    if (!v) { s.raf = 0; s.last = 0; return; }
    // Clamp to the length measured at pick-up: the lifted item is transformed past the end
    // of the list, which makes the page taller and would otherwise scroll forever.
    const before = pos(s.el);
    const to = Math.max(0, Math.min(s.max, before + Math.max(-1, Math.min(1, v)) * MAX_SPEED * dt));
    // "instant": the page has scroll-behavior: smooth, which would turn each step into a
    // smooth scroll that the next frame cancels
    if (to !== before) s.el.scrollTo({ top: to, behavior: "instant" });
    // schedule before onScroll so a move() it triggers doesn’t start a second loop
    s.raf = requestAnimationFrame(tick);
    if (pos(s.el) !== before) s.onScroll();
  };

  return {
    begin(node: Element, onScroll: () => void) {
      stop();
      const el = scrollerOf(node);
      st.current = { el, start: pos(el), y: -1, raf: 0, last: 0, max: maxOf(el), onScroll };
    },
    move(clientY: number) {
      const s = st.current;
      if (!s) return;
      s.y = clientY;
      if (!s.raf) s.raf = requestAnimationFrame(tick);
    },
    offset: () => (st.current ? pos(st.current.el) - st.current.start : 0),
    stop,
  };
}
