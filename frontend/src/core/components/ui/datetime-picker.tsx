import * as React from "react"
import { Calendar, Clock } from "lucide-react"
import { cn } from "@/core/lib/utils"

export type DateTimePickerMode = 'date' | 'time' | 'datetime' | 'range'

export interface DateTimePickerRangeValue {
  from?: string
  to?: string
}

type BaseInputProps = Omit<React.ComponentProps<"input">, 'type' | 'value' | 'onChange' | 'placeholder'>

export interface DateTimePickerProps extends BaseInputProps {
  mode?: DateTimePickerMode
  type?: "date" | "time" | "datetime-local" // For backward compatibility
  value?: string | DateTimePickerRangeValue
  onChange?: (value: string | DateTimePickerRangeValue) => void
  placeholder?: string | { from?: string; to?: string }
}

// Single input picker component
const SingleDateTimePicker = React.forwardRef<HTMLInputElement, {
  type: "date" | "time" | "datetime-local"
  icon: React.ReactNode
  className?: string
  [key: string]: any
}>(({ type, icon, className, ...props }, ref) => {
  const inputRef = React.useRef<HTMLInputElement>(null)

  React.useImperativeHandle(ref, () => inputRef.current as HTMLInputElement)

  const showPicker = () => {
    if (!inputRef.current) return

    if ('showPicker' in HTMLInputElement.prototype) {
      try {
        inputRef.current.showPicker()
      } catch (error) {
        inputRef.current.focus()
        inputRef.current.click()
      }
    } else {
      inputRef.current.focus()
      inputRef.current.click()
    }
  }

  const handleWrapperClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target !== inputRef.current) {
      showPicker()
    }
  }

  const handleInputClick = (e: React.MouseEvent<HTMLInputElement>) => {
    e.stopPropagation()
    showPicker()
  }

  return (
    <div
      className={cn(
        "relative flex h-10 w-full cursor-pointer items-center rounded-md border border-input bg-background ring-offset-background focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      onClick={handleWrapperClick}
    >
      <input
        type={type}
        ref={inputRef}
        onClick={handleInputClick}
        className={cn(
          "h-full w-full rounded-md bg-transparent px-3 py-2 pr-10 text-base text-foreground outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed md:text-sm cursor-pointer",
          "[&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:right-0 [&::-webkit-calendar-picker-indicator]:w-10 [&::-webkit-calendar-picker-indicator]:h-full [&::-webkit-calendar-picker-indicator]:cursor-pointer",
          "[&::-webkit-inner-spin-button]:hidden",
          "[&::-webkit-outer-spin-button]:hidden"
        )}
        style={{
          WebkitAppearance: 'none',
          MozAppearance: 'textfield',
        } as React.CSSProperties}
        {...props}
      />
      <div className="absolute right-3 pointer-events-none">
        {icon}
      </div>
    </div>
  )
})
SingleDateTimePicker.displayName = "SingleDateTimePicker"

// Range picker component
const RangeDateTimePicker = React.forwardRef<HTMLDivElement, {
  type: "date" | "time" | "datetime-local"
  value?: DateTimePickerRangeValue
  onChange?: (value: DateTimePickerRangeValue) => void
  placeholder?: { from?: string; to?: string }
  className?: string
  disabled?: boolean
  [key: string]: any
}>(({ type, value, onChange, placeholder, className, disabled, ...props }, ref) => {
  const fromRef = React.useRef<HTMLInputElement>(null)
  const toRef = React.useRef<HTMLInputElement>(null)

  const showPicker = (inputRef: React.RefObject<HTMLInputElement>) => {
    if (!inputRef.current) return

    if ('showPicker' in HTMLInputElement.prototype) {
      try {
        inputRef.current.showPicker()
      } catch (error) {
        inputRef.current.focus()
        inputRef.current.click()
      }
    } else {
      inputRef.current.focus()
      inputRef.current.click()
    }
  }

  const handleFromChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange?.({
      ...value,
      from: e.target.value || undefined,
    })
  }

  const handleToChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange?.({
      ...value,
      to: e.target.value || undefined,
    })
  }

  const icon = type === 'time' ? (
    <Clock className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
  ) : (
    <Calendar className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
  )

  return (
    <div ref={ref} className={cn("grid grid-cols-2 gap-2", className)} {...props}>
      <SingleDateTimePicker
        ref={fromRef}
        type={type}
        icon={icon}
        value={value?.from || ''}
        onChange={handleFromChange as any}
        placeholder={typeof placeholder === 'object' ? placeholder.from : undefined}
        disabled={disabled}
      />
      <SingleDateTimePicker
        ref={toRef}
        type={type}
        icon={icon}
        value={value?.to || ''}
        onChange={handleToChange as any}
        placeholder={typeof placeholder === 'object' ? placeholder.to : undefined}
        disabled={disabled}
      />
    </div>
  )
})
RangeDateTimePicker.displayName = "RangeDateTimePicker"

// Main component
const DateTimePicker = React.forwardRef<HTMLInputElement | HTMLDivElement, DateTimePickerProps>(
  ({ mode, type, value, onChange, placeholder, className, ...props }, ref) => {
    // Determine mode from type if mode is not provided (backward compatibility)
    const actualMode: DateTimePickerMode = mode || (type === 'date' ? 'date' : type === 'time' ? 'time' : 'datetime')
    const actualType = type || (actualMode === 'date' ? 'date' : actualMode === 'time' ? 'time' : 'datetime-local')

    // Range picker
    if (actualMode === 'range') {
      return (
        <RangeDateTimePicker
          ref={ref as React.RefObject<HTMLDivElement>}
          type={actualType}
          value={typeof value === 'object' && !('value' in value) ? value : undefined}
          onChange={(val) => onChange?.(val)}
          placeholder={typeof placeholder === 'object' && !('value' in placeholder) ? placeholder : undefined}
          className={className}
          {...props}
        />
      )
    }

    // Single picker
    const icon = actualMode === 'time' ? (
      <Clock className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
    ) : (
      <Calendar className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
    )

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value
      onChange?.(newValue)
    }

    return (
      <SingleDateTimePicker
        ref={ref as React.RefObject<HTMLInputElement>}
        type={actualType}
        icon={icon}
        value={typeof value === 'string' ? value : undefined}
        onChange={handleChange as any}
        placeholder={typeof placeholder === 'string' ? placeholder : undefined}
        className={className}
        {...props}
      />
    )
  }
)
DateTimePicker.displayName = "DateTimePicker"

export { DateTimePicker }
