import { useCallback, useEffect, useRef, useState } from "react";
import type { GuideActions, GuideMode, ExpertId } from "@/components/AIJourneyGuide";

interface ShowOpts {
  mode?:     GuideMode;
  actions?:  GuideActions;
  expert?:   ExpertId;   // switch expert as part of the message
  autohide?: number;
}

export interface GuideState {
  message:   string;
  mode:      GuideMode;
  expert:    ExpertId;
  actions?:  GuideActions;
  visible:   boolean;
  show:      (message: string, opts?: ShowOpts) => void;
  setExpert: (expert: ExpertId) => void;  // silent switch โ€” no message change
  hide:      () => void;
}

export function useGuide(defaultExpert: ExpertId = "analyst"): GuideState {
  const [message, setMessage] = useState("");
  const [mode,    setMode]    = useState<GuideMode>("insight");
  const [expert,  setExpert]  = useState<ExpertId>(defaultExpert);
  const [actions, setActions] = useState<GuideActions | undefined>();
  const [visible, setVisible] = useState(false);

  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  const show = useCallback((msg: string, opts: ShowOpts = {}) => {
    clearTimeout(timer.current);
    setMessage(msg);
    setMode(opts.mode ?? "insight");
    if (opts.expert) setExpert(opts.expert);
    setActions(opts.actions);
    setVisible(true);
    if (opts.autohide) {
      timer.current = setTimeout(() => setVisible(false), opts.autohide);
    }
  }, []);

  const hide = useCallback(() => {
    clearTimeout(timer.current);
    setVisible(false);
  }, []);

  useEffect(() => () => clearTimeout(timer.current), []);

  return { message, mode, expert, actions, visible, show, setExpert, hide };
}

