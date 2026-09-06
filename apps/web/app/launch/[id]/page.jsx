import TerminalRoute from "@/components/app/terminal-route";
import LaunchStudio from "@/components/pages/LaunchStudio";
import { signals } from "@/data";

export function generateStaticParams() {
  return signals.map((signal) => ({ id: String(signal.id) }));
}

export default function Page() { return <TerminalRoute><LaunchStudio /></TerminalRoute>; }
