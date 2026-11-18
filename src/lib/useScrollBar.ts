// Pairs with `.ir-scroll` (globals.css): flags a scroll area as "scrolling" for a moment
// after each scroll event, so its thin bar shows only while it moves.
import type { UIEvent } from "react";

const timers = new WeakMap<HTMLElement, ReturnType<typeof setTimeout>>();

export function onScrollShowBar(e: UIEvent<HTMLElement>) {
  const el = e.currentTarget;
  el.dataset.scrolling = "";
  clearTimeout(timers.get(el));
  timers.set(el, setTimeout(() => { delete el.dataset.scrolling; }, 900));
}
