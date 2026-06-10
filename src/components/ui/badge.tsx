import { cn } from '@/lib/utils'

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'protein' | 'fat' | 'carbs' | 'calories' | 'success' | 'warning'
}

const variantStyles = {
  default: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
  protein: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  fat: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  carbs: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  calories: 'bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400',
  success: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  warning: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
}

export function Badge({ className, variant = 'default', ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium',
        variantStyles[variant],
        className
      )}
      {...props}
    />
  )
}
