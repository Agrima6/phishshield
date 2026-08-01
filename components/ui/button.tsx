import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cn } from "@/lib/utils"

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  asChild?: boolean
  variant?: "primary" | "secondary" | "outline" | "ghost" | "destructive" | "success"
  size?: "sm" | "md" | "lg" | "icon"
  loading?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", asChild = false, loading, children, disabled, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    
    const baseStyles = "inline-flex items-center justify-center gap-2 rounded-md font-medium transition-all duration-150 active:scale-[0.98] focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50 disabled:pointer-events-none cursor-pointer"
    
    const variants = {
      primary: "bg-primary text-primary-foreground hover:bg-primary-hover shadow-sm",
      secondary: "bg-secondary text-secondary-foreground hover:bg-slate-100 border border-border shadow-sm",
      outline: "bg-transparent border border-border text-foreground hover:bg-secondary",
      ghost: "bg-transparent text-foreground hover:bg-secondary",
      destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-sm",
      success: "bg-success text-success-foreground hover:bg-success/90 shadow-sm"
    }

    const sizes = {
      sm: "h-8 px-3 text-xs",
      md: "h-10 px-4 py-2 text-sm",
      lg: "h-11 px-8 text-base",
      icon: "h-10 w-10 p-0"
    }

    return (
      <Comp
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        ref={ref}
        disabled={disabled || loading}
        {...props}
      >
        {loading ? (
          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-current" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
        ) : null}
        {children}
      </Comp>
    )
  }
)
Button.displayName = "Button"

export { Button }
