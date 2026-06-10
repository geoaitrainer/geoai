import { cn } from '@/lib/utils'

type CardProps = React.HTMLAttributes<HTMLDivElement>

function Card({ className, ...props }: CardProps) {
  return <div className={cn('card p-6', className)} {...props} />
}

function CardHeader({ className, ...props }: CardProps) {
  return <div className={cn('mb-4', className)} {...props} />
}

function CardTitle({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return <h3 className={cn('text-lg font-semibold', className)} {...props} />
}

function CardContent({ className, ...props }: CardProps) {
  return <div className={cn('', className)} {...props} />
}

export { Card, CardHeader, CardTitle, CardContent }
