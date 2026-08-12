import "./globals.css";

export const metadata = {
  title: "Finance Tracker",
  description: "Personal finance tracker with auto-updating holdings",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
