// Client Mode layout applies Prompt typeface and client-mode typography tokens
// to all client-facing routes (flow1, flow2, status, summary)
export default function ClientLayout({ children }: { children: React.ReactNode }) {
  return <div className="client-mode">{children}</div>;
}
