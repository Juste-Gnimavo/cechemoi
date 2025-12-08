'use client'

import { useCallback } from 'react'
import confetti from 'canvas-confetti'

type ConfettiType = 'celebration' | 'welcome' | 'reward' | 'success' | 'mini'

interface ConfettiOptions {
  duration?: number
  particleCount?: number
  spread?: number
  colors?: string[]
}

export function useConfetti() {

  // Full celebration - fires from both sides (order confirmation, first purchase)
  const celebration = useCallback((options?: ConfettiOptions) => {
    const duration = options?.duration || 3000
    const animationEnd = Date.now() + duration
    const defaults = {
      startVelocity: 30,
      spread: options?.spread || 360,
      ticks: 60,
      zIndex: 9999,
      colors: options?.colors || ['#ff6b6b', '#ffd93d', '#6bcb77', '#4d96ff', '#9b59b6']
    }

    function randomInRange(min: number, max: number) {
      return Math.random() * (max - min) + min
    }

    const interval = setInterval(() => {
      const timeLeft = animationEnd - Date.now()
      if (timeLeft <= 0) return clearInterval(interval)

      const particleCount = (options?.particleCount || 50) * (timeLeft / duration)

      // Fire from both sides
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 }
      })
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 }
      })
    }, 250)

    return () => clearInterval(interval)
  }, [])

  // Welcome burst - single burst from center (registration)
  const welcome = useCallback((options?: ConfettiOptions) => {
    const count = 200
    const defaults = {
      origin: { y: 0.7 },
      zIndex: 9999,
      colors: options?.colors || ['#ff6b6b', '#ffd93d', '#6bcb77', '#4d96ff']
    }

    function fire(particleRatio: number, opts: confetti.Options) {
      confetti({
        ...defaults,
        ...opts,
        particleCount: Math.floor(count * particleRatio)
      })
    }

    fire(0.25, { spread: 26, startVelocity: 55 })
    fire(0.2, { spread: 60 })
    fire(0.35, { spread: 100, decay: 0.91, scalar: 0.8 })
    fire(0.1, { spread: 120, startVelocity: 25, decay: 0.92, scalar: 1.2 })
    fire(0.1, { spread: 120, startVelocity: 45 })
  }, [])

  // Reward stars - gold/yellow themed (loyalty points, tier upgrade)
  const reward = useCallback((options?: ConfettiOptions) => {
    const duration = options?.duration || 2000
    const animationEnd = Date.now() + duration
    const defaults = {
      startVelocity: 30,
      spread: 360,
      ticks: 60,
      zIndex: 9999,
      colors: options?.colors || ['#ffd700', '#ffb347', '#ff8c00', '#ffa500', '#fff44f'],
      shapes: ['star'] as confetti.Shape[]
    }

    const interval = setInterval(() => {
      const timeLeft = animationEnd - Date.now()
      if (timeLeft <= 0) return clearInterval(interval)

      confetti({
        ...defaults,
        particleCount: 3,
        origin: { x: Math.random(), y: Math.random() - 0.2 }
      })
    }, 100)

    return () => clearInterval(interval)
  }, [])

  // Success checkmark burst - green themed (payment success)
  const success = useCallback((options?: ConfettiOptions) => {
    confetti({
      particleCount: options?.particleCount || 100,
      spread: options?.spread || 70,
      origin: { y: 0.6 },
      zIndex: 9999,
      colors: options?.colors || ['#6bcb77', '#4ade80', '#22c55e', '#16a34a', '#15803d']
    })
  }, [])

  // Mini burst - subtle effect (coupon applied)
  const mini = useCallback((options?: ConfettiOptions) => {
    confetti({
      particleCount: options?.particleCount || 30,
      spread: options?.spread || 50,
      origin: { y: 0.8 },
      zIndex: 9999,
      colors: options?.colors || ['#ff6b6b', '#ffd93d', '#6bcb77'],
      scalar: 0.8,
      gravity: 1.2
    })
  }, [])

  // Fire confetti by type
  const fire = useCallback((type: ConfettiType, options?: ConfettiOptions) => {
    switch (type) {
      case 'celebration':
        return celebration(options)
      case 'welcome':
        return welcome(options)
      case 'reward':
        return reward(options)
      case 'success':
        return success(options)
      case 'mini':
        return mini(options)
      default:
        return celebration(options)
    }
  }, [celebration, welcome, reward, success, mini])

  return {
    fire,
    celebration,
    welcome,
    reward,
    success,
    mini
  }
}
