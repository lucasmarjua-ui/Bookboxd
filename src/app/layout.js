import { Playfair_Display, Lora } from 'next/font/google'
import './globals.css'
import Intro from '@/components/Intro'
import AuthLayout from '@/components/AuthLayout'

const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-playfair',
})

const lora = Lora({
  subsets: ['latin'],
  variable: '--font-lora',
})

export const metadata = {
  title: 'Bookboxd',
  description: 'Track your reading life',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${playfair.variable} ${lora.variable}`}>
      <body className="bg-[#1a1408] text-[#e8dcc8] min-h-screen">
        <Intro />
        <AuthLayout>{children}</AuthLayout>
      </body>
    </html>
  )
}