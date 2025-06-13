"use client"

import { useEffect, useRef } from "react"
import { cn } from "@/lib/utils"

interface AnimatedBackgroundProps {
  className?: string
  variant?: "default" | "subtle" | "vibrant"
}

export function AnimatedBackground({ 
  className, 
  variant = "default" 
}: AnimatedBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const resizeCanvas = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }

    resizeCanvas()
    window.addEventListener("resize", resizeCanvas)

    const particles: Array<{
      x: number
      y: number
      radius: number
      vx: number
      vy: number
      opacity: number
    }> = []

    // Create floating orbs
    const orbs = variant === "subtle" ? 3 : variant === "vibrant" ? 8 : 5
    for (let i = 0; i < orbs; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        radius: Math.random() * 200 + 100,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
        opacity: variant === "subtle" ? 0.02 : variant === "vibrant" ? 0.05 : 0.03
      })
    }

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      particles.forEach((particle) => {
        particle.x += particle.vx
        particle.y += particle.vy

        if (particle.x < -particle.radius) particle.x = canvas.width + particle.radius
        if (particle.x > canvas.width + particle.radius) particle.x = -particle.radius
        if (particle.y < -particle.radius) particle.y = canvas.height + particle.radius
        if (particle.y > canvas.height + particle.radius) particle.y = -particle.radius

        const gradient = ctx.createRadialGradient(
          particle.x,
          particle.y,
          0,
          particle.x,
          particle.y,
          particle.radius
        )

        // Premium color scheme
        if (variant === "vibrant") {
          gradient.addColorStop(0, `oklch(0.55 0.20 265 / ${particle.opacity})`)
          gradient.addColorStop(0.5, `oklch(0.65 0.15 280 / ${particle.opacity * 0.7})`)
          gradient.addColorStop(1, `oklch(0.85 0.10 25 / 0)`)
        } else {
          gradient.addColorStop(0, `oklch(0.35 0.15 265 / ${particle.opacity})`)
          gradient.addColorStop(0.5, `oklch(0.45 0.12 280 / ${particle.opacity * 0.7})`)
          gradient.addColorStop(1, `oklch(0.50 0.15 200 / 0)`)
        }

        ctx.fillStyle = gradient
        ctx.beginPath()
        ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2)
        ctx.fill()
      })

      requestAnimationFrame(animate)
    }

    animate()

    return () => {
      window.removeEventListener("resize", resizeCanvas)
    }
  }, [variant])

  return (
    <>
      <canvas
        ref={canvasRef}
        className={cn(
          "fixed inset-0 pointer-events-none",
          className
        )}
        style={{ zIndex: 0 }}
      />
      <div className="fixed inset-0 bg-gradient-to-br from-background/5 via-background/10 to-background/20 pointer-events-none" style={{ zIndex: 1 }} />
    </>
  )
} 