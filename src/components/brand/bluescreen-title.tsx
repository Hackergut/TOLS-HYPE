import type { ElementType } from "react"
import { cn } from "cn"

/**
 * TT Bluescreens display title. The O is a tall oval, matching the official
 * TOLS wordmark (narrower, slightly taller than a round O).
 */
export function BluescreenTitle({
  children,
  as: Tag = "h2",
  className,
}: {
  children: string
  as?: ElementType
  className?: string
}) {
  return (
    <Tag className={cn("font-bluescreens tracking-[0.1em] uppercase", className)}>
      <span className="sr-only">{children}</span>
      <span aria-hidden="true">
        {Array.from(children).map((ch, i) =>
          ch === "O" || ch === "o" ? (
            <span key={`${ch}-${i}`} className="inline-block origin-center scale-x-[0.78] scale-y-[1.12]">
              {ch}
            </span>
          ) : (
            <span key={`${ch}-${i}`}>{ch}</span>
          ),
        )}
      </span>
    </Tag>
  )
}
