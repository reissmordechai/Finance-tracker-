import "./globals.css";
import Nav from "./components/Nav";

export const metadata = {
  title: "Finance Tracker",
  description: "Personal finance tracker with auto-updating holdings",
  manifest: "/manifest.json",
  themeColor: "#0F3D2E",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Finance Tracker",
  },
  icons: {
    icon: "/icon-192.png",
    apple: "/icon-192.png",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Nav />
        {children}
      </body>
    </html>
  );
}
