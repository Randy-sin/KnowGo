import * as React from "react"
import { cn } from "@/lib/utils"
import { Search, Eye, EyeOff } from "lucide-react"

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  hint?: string
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
  variant?: 'default' | 'search' | 'floating'
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, label, error, hint, leftIcon, rightIcon, variant = 'default', ...props }, ref) => {
    const [showPassword, setShowPassword] = React.useState(false)
    const [isFocused, setIsFocused] = React.useState(false)
    const isPassword = type === 'password'
    const inputType = isPassword && showPassword ? 'text' : type

    const handleTogglePassword = () => {
      setShowPassword(!showPassword)
    }

    const inputClasses = cn(
      // Base styles
      "flex w-full rounded-xl border border-gray-200 bg-white/70 backdrop-blur-sm text-sm ring-offset-background transition-all duration-200",
      "file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-gray-400",
      "focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-100 focus:outline-none",
      "disabled:cursor-not-allowed disabled:opacity-50",
      
      // Variants
      variant === 'search' && "pl-10",
      variant === 'floating' && "peer",
      
      // With icons
      leftIcon && !variant?.includes('search') && "pl-10",
      (rightIcon || isPassword) && "pr-10",
      
      // Error state
      error && "border-red-300 focus:border-red-400 focus:ring-red-100",
      
      // Size
      "h-12 px-4 py-3",
      
      className
    )

    const containerClasses = cn(
      "relative w-full",
      variant === 'floating' && "relative"
    )

    const labelClasses = cn(
      "text-sm font-medium text-gray-700 mb-2 block",
      variant === 'floating' && [
        "absolute left-4 transition-all duration-200 pointer-events-none",
        "peer-placeholder-shown:top-3.5 peer-placeholder-shown:text-gray-400 peer-placeholder-shown:text-base",
        "peer-focus:top-1 peer-focus:text-xs peer-focus:text-blue-600",
        isFocused || props.value ? "top-1 text-xs text-blue-600" : "top-3.5 text-gray-400",
      ]
    )

    return (
      <div className={containerClasses}>
        {label && variant !== 'floating' && (
          <label className={labelClasses}>
            {label}
          </label>
        )}
        
        <div className="relative">
          {/* Left Icon */}
          {leftIcon && !variant?.includes('search') && (
            <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
              {leftIcon}
            </div>
          )}
          
          {/* Search Icon */}
          {variant === 'search' && (
            <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
              <Search className="h-4 w-4" />
            </div>
          )}
          
          <input
            type={inputType}
            className={inputClasses}
            ref={ref}
            onFocus={(e) => {
              setIsFocused(true)
              props.onFocus?.(e)
            }}
            onBlur={(e) => {
              setIsFocused(false)
              props.onBlur?.(e)
            }}
            {...props}
          />
          
          {/* Floating Label */}
          {label && variant === 'floating' && (
            <label className={labelClasses}>
              {label}
            </label>
          )}
          
          {/* Right Icon */}
          {rightIcon && !isPassword && (
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400">
              {rightIcon}
            </div>
          )}
          
          {/* Password Toggle */}
          {isPassword && (
            <button
              type="button"
              onClick={handleTogglePassword}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          )}
        </div>
        
        {/* Error Message */}
        {error && (
          <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
            <span className="h-1 w-1 bg-red-600 rounded-full" />
            {error}
          </p>
        )}
        
        {/* Hint Message */}
        {hint && !error && (
          <p className="mt-2 text-sm text-gray-500">
            {hint}
          </p>
        )}
      </div>
    )
  }
)
Input.displayName = "Input"

export { Input } 