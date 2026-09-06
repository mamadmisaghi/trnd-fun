import TerminalRoute from "@/components/app/terminal-route";
import TokenMarket from "@/components/pages/TokenMarket";
import { tokens } from "@/data";

export function generateStaticParams() {
  return tokens.map((token) => ({ id: String(token.id) }));
}

export default function Page() { return <TerminalRoute><TokenMarket /></TerminalRoute>; }
