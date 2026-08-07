import type { Metadata } from "next";
import { Inter, Manrope } from "next/font/google";
import "@aws-amplify/ui-react/styles.css";
import "./globals.css";
import { AmplifyProvider } from "@/components/providers/amplify-provider";

const inter = Inter({ subsets: ["latin"], variable: "--font-body" });
const manrope = Manrope({ subsets: ["latin"], variable: "--font-display" });

export const metadata: Metadata = {
  title: {
    default: "InnovaTube",
    template: "%s | InnovaTube",
  },
  description: "Descubre videos y organiza tus favoritos.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es">
      <body className={`${inter.variable} ${manrope.variable}`}>
        <AmplifyProvider>{children}</AmplifyProvider>
      </body>
    </html>
  );
}

