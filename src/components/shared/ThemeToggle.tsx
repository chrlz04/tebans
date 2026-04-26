'use client'

import * as React from 'react'
import { Moon, Sun } from 'lucide-react'
import { useTheme } from 'next-themes'
import clsx from 'clsx'

export function ThemeToggle({ className }: { className?: string }) {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = React.useState(false)

  // Avoid hydration mismatch by waiting for mount
  React.useEffect(() => setMounted(true), [])
  if (!mounted) {
    return <div className={clsx("w-8 h-8 rounded-lg", className)} />
  }

  return (
    <button
      onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
      className={clsx(
        "flex items-center justify-center w-8 h-8 rounded-lg hover:bg-muted transition-colors focus:outline-none text-muted-foreground hover:text-foreground",
        className
      )}
      aria-label="Toggle theme"
    >
      {theme === 'dark' ? (
        <Sun size={18} />
      ) : (
        <Moon size={18} />
      )}
    </button>
  )
}
