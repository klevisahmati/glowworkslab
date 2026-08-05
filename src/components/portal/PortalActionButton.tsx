import type { ReactNode } from 'react'

type PortalActionButtonProps = {
  children: ReactNode
  href?: string
  onClick?: () => void
  primary?: boolean
  className?: string
  target?: string
  rel?: string
  download?: boolean | string
}

export function PortalActionButton({ children, href, onClick, primary = false, className = '', target, rel, download }: PortalActionButtonProps) {
  const classes = `customer-action-button${primary ? ' primary' : ''}${className ? ` ${className}` : ''}`.trim()

  if (href) {
    return (
      <a className={classes} href={href} target={target} rel={rel} download={download}>
        {children}
      </a>
    )
  }

  return (
    <button className={classes} type="button" onClick={onClick}>
      {children}
    </button>
  )
}
