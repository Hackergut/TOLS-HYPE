import { cn } from "cn"

/** Section titles in Oswald. No per-letter scale — that stretched the O. */
export function BluescreenTitle({
  children,
  as: Tag = "h2",
  className,
}: {
  children: string
  as?: "h1" | "h2" | "h3" | "h4" | "p" | "span"
  className?: string
}) {
  return (
    <Tag className={cn("font-bluescreens font-semibold uppercase tracking-[0.04em]", className)}>
      {children}
    </Tag>
  )
}
