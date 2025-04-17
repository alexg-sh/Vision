"use client"

import type React from "react"

import { useState, useEffect, useRef, Suspense } from "react"
import { Skeleton } from "@/components/ui/skeleton"

interface LazyComponentProps {
  children: React.ReactNode
  height?: number | string
  width?: number | string
  className?: string
  placeholder?: React.ReactNode
  threshold?: number
  rootMargin?: string
}

export default function LazyComponent({
  children,
  height = "auto",
  width = "auto",
  className = "",
  placeholder,
  threshold = 0.01,
  rootMargin = "200px",
}: LazyComponentProps) {
  const [isInView, setIsInView] = useState(false)
  const componentRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsInView(true)
            observer.disconnect()
          }
        })
      },
      {
        rootMargin,
        threshold,
      },
    )

    if (componentRef.current) {
      observer.observe(componentRef.current)
    }

    return () => {
      observer.disconnect()
    }
  }, [rootMargin, threshold])

  return (
    <div ref={componentRef} className={className} style={{ height, width, minHeight: height, minWidth: width }}>
      {isInView ? (
        <Suspense fallback={placeholder || <Skeleton className="w-full h-full" />}>{children}</Suspense>
      ) : (
        placeholder || <Skeleton className="w-full h-full" />
      )}
    </div>
  )
}
