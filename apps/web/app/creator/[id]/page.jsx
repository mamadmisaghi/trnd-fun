import TerminalRoute from "@/components/app/terminal-route";
import CreatorProfile from "@/components/pages/CreatorProfile";
import { creators } from "@/data";

export function generateStaticParams() {
  return creators.map((creator) => ({ id: String(creator.id) }));
}

export default function Page() { return <TerminalRoute><CreatorProfile /></TerminalRoute>; }
