import TerminalRoute from "@/components/app/terminal-route";
import SignalDetail from "@/components/pages/SignalDetail";
import { signals } from "@/data";

export function generateStaticParams() {
  return signals.map((signal) => ({ id: String(signal.id) }));
}

export default function Page() { return <TerminalRoute><SignalDetail /></TerminalRoute>; }
