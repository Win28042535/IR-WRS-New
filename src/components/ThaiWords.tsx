import { Fragment } from "react";
import { thaiUnits } from "@/lib/thaiUnits";

/** Thai text that wraps only between word units ("น่าเชื่อ|ถือ" no longer splits). */
export function ThaiWords({ text }: { text: string }) {
  return <>{thaiUnits(text).map((u, k) => <Fragment key={k}>{k ? <wbr /> : null}<span className="whitespace-nowrap">{u}</span></Fragment>)}</>;
}
