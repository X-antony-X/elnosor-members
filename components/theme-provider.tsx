"use client"

import type React from "react"

import { createContext, useContext, useEffect, useState } from "react"

type Theme = "light" | "dark" | "system"

interface ThemeContextType {
  theme: Theme
  setTheme: (theme: Theme) => void
  primaryColor: string
  setPrimaryColor: (color: string) => void
}

const ThemeContext = createContext<ThemeContextType>({
  theme: "light",
  setTheme: () => {},
  primaryColor: "#0ea5e9",
  setPrimaryColor: () => {},
})

export const useTheme = () => useContext(ThemeContext)

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>("light")
  const [primaryColor, setPrimaryColor] = useState("#0ea5e9")

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") as Theme
    const savedColor = localStorage.getItem("primaryColor")

    if (savedTheme) {
      setTheme(savedTheme)
    }

    if (savedColor) {
      setPrimaryColor(savedColor)
    }
  }, [])

  useEffect(() => {
    localStorage.setItem("theme", theme)

    const applyTheme = () => {
      if (theme === "system") {
        const systemTheme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"
        if (systemTheme === "dark") {
          document.documentElement.classList.add("dark")
        } else {
          document.documentElement.classList.remove("dark")
        }
      } else if (theme === "dark") {
        document.documentElement.classList.add("dark")
      } else {
        document.documentElement.classList.remove("dark")
      }
    }

    applyTheme()

    // Listen for system theme changes when using "system" theme
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)")
    const handleSystemThemeChange = () => {
      if (theme === "system") {
        applyTheme()
      }
    }

    mediaQuery.addEventListener("change", handleSystemThemeChange)
    return () => mediaQuery.removeEventListener("change", handleSystemThemeChange)
  }, [theme])

  useEffect(() => {
    localStorage.setItem("primaryColor", primaryColor)

    // Update CSS custom properties for primary color
    const root = document.documentElement
    const color = primaryColor.replace("#", "")
    const r = Number.parseInt(color.substr(0, 2), 16)
    const g = Number.parseInt(color.substr(2, 2), 16)
    const b = Number.parseInt(color.substr(4, 2), 16)

    root.style.setProperty("--primary-rgb", `${r}, ${g}, ${b}`)
  }, [primaryColor])

  return (
    <ThemeContext.Provider value={{ theme, setTheme, primaryColor, setPrimaryColor }}>{children}</ThemeContext.Provider>
  )
}
