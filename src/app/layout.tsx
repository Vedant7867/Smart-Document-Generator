// If you have a globals.css file for Tailwind, uncomment the line below:
import "./globals.css";

export const metadata = {
  title: 'Smart Document Generator',
  description: 'Automated document generation for ACM NIT Surat',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}