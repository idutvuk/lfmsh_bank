import gearIcon from '../assets/gear.svg'

interface LoadingProps {
  text?: string | null
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function Loading({ text = "Загрузка...", size = 'md', className = '' }: LoadingProps) {
  const sizeClasses = {
    sm: 'h-6 w-6',
    md: 'h-8 w-8', 
    lg: 'h-12 w-12'
  }

  return (
    <div className={`flex flex-col items-center justify-center ${className}`}>
      <img 
        src={gearIcon} 
        alt="Loading" 
        className={`${sizeClasses[size]} animate-spin text-primary`}
      />
      {text && (
        <p className="mt-2 text-muted-foreground text-sm">{text}</p>
      )}
    </div>
  )
}

export default Loading
