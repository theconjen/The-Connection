/**
 * Clergy Badge Component
 * Displays a shepherd's staff badge for verified clergy members
 * Shows next to clergy names throughout the app
 */

import * as React from "react"
import { cn } from "../../lib/utils"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./tooltip"

// Shepherd's Staff SVG Icon
function ShepherdStaffIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      className={className}
    >
      {/* Staff body */}
      <path
        d="M12 22V8"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
      />
      {/* Curved crook at top */}
      <path
        d="M12 8C12 8 12 4 8 2C4 0 4 4 4 6C4 8 6 10 8 10C10 10 12 8 12 8"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  )
}

export interface ClergyBadgeProps {
  size?: "sm" | "md" | "lg"
  showTooltip?: boolean
  className?: string
}

const sizeClasses = {
  sm: "h-3 w-3",
  md: "h-4 w-4",
  lg: "h-5 w-5",
}

const containerSizeClasses = {
  sm: "h-4 w-4 p-0.5",
  md: "h-5 w-5 p-0.5",
  lg: "h-6 w-6 p-0.5",
}

export function ClergyBadge({
  size = "md",
  showTooltip = true,
  className,
}: ClergyBadgeProps) {
  const badge = (
    <span
      className={cn(
        "inline-flex items-center justify-center rounded-full bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400",
        containerSizeClasses[size],
        className
      )}
      aria-label="Verified Clergy"
    >
      <ShepherdStaffIcon className={sizeClasses[size]} />
    </span>
  )

  if (!showTooltip) {
    return badge
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>{badge}</TooltipTrigger>
        <TooltipContent>
          <p>Verified Clergy</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

export { ShepherdStaffIcon }
