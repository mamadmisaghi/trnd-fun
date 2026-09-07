import "./globals.css";

export const metadata = {
  title: "TRND.fun",
  icons: { icon: "/brand/trnd-icon.svg" },
  description: "AI-powered viral intelligence and market launch terminal."
};

export default function RootLayout({ children }) {
  return <html lang="en" className="dark"><body>{children}</body></html>;
}
