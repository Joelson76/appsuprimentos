import Image from 'next/image'
import { cn } from '@/lib/utils'

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl'
  showText?: boolean
  showTagline?: boolean
  className?: string
}

const sizeMap = {
  sm: 32,
  md: 50,
  lg: 70,
  xl: 100,
}

const textSizeMap = {
  sm: 'text-base',
  md: 'text-xl',
  lg: 'text-2xl',
  xl: 'text-3xl',
}

const taglineSizeMap = {
  sm: 'text-[10px]',
  md: 'text-xs',
  lg: 'text-sm',
  xl: 'text-base',
}

export function Logo({
  size = 'md',
  showText = true,
  showTagline = true,
  className
}: LogoProps) {
  const imgSize = sizeMap[size]
  const textSize = textSizeMap[size]
  const taglineSize = taglineSizeMap[size]

  return (
    <div className={cn('flex items-center gap-3', className)}>
      <Image
        src="/logo-jls.png"
        alt="JLS Tecnologia"
        width={imgSize}
        height={imgSize}
        className="object-contain"
        priority
      />
      {showText && (
        <div className="flex flex-col">
          <span className={cn(
            'font-bold bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent',
            textSize
          )}>
            SupriFlow
          </span>
          {showTagline && (
            <span className={cn('text-muted-foreground -mt-1', taglineSize)}>
              by JLS Tecnologia
            </span>
          )}
        </div>
      )}
    </div>
  )
}

export function LogoIcon({ size = 'md', className }: Pick<LogoProps, 'size' | 'className'>) {
  const imgSize = sizeMap[size]

  return (
    <Image
      src="/logo-jls.png"
      alt="JLS Tecnologia"
      width={imgSize}
      height={imgSize}
      className={cn('object-contain', className)}
      priority
    />
  )
}
