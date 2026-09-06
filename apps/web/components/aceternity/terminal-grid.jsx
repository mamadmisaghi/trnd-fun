import { cn } from "@/lib/utils";

/** Local Aceternity-style grid wrapper; visual tokens match the original terminal exactly. */
export function TerminalGrid({ children, className }) {
  return <div className={cn("page-terminal-surface", className)}>{children}</div>;
}
