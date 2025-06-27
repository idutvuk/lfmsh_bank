import * as TooltipPrimitive from "@radix-ui/react-tooltip"

import * as React from "react"

import { cn } from "@/lib/utils"

function TooltipProvider({
  delayDuration = 0,
  ...props
}: React.ComponentProps<typeof TooltipPrimitive.Provider>) {
  return (
    <TooltipPrimitive.Provider
      data-slot="tooltip-provider"
      delayDuration={delayDuration}
      {...props}
    />
  )
}

function Tooltip({
  ...props
}: React.ComponentProps<typeof TooltipPrimitive.Root>) {
  return <TooltipPrimitive.Root data-slot="tooltip" {...props} />
}

function TooltipTrigger({
  onClick,
  ...props
}: React.ComponentProps<typeof TooltipPrimitive.Trigger> & {
  onClick?: React.MouseEventHandler<HTMLButtonElement>
}) {
  const [isOpen, setIsOpen] = React.useState(false);
  
  // Get closest tooltip component
  const handleClick: React.MouseEventHandler<HTMLButtonElement> = (e) => {
    setIsOpen(!isOpen);
    onClick?.(e);
    
    // Find and update open state
    const tooltip = e.currentTarget.closest('[data-slot="tooltip"]');
    if (tooltip) {
      const openAttr = tooltip.getAttribute('data-state');
      if (openAttr === 'closed') {
        (tooltip as any).dispatchEvent(new Event('mouseenter', { bubbles: true }));
      }
    }
  };

  return (
    <TooltipPrimitive.Trigger 
      data-slot="tooltip-trigger" 
      onClick={handleClick}
      {...props} 
    />
  );
}

function TooltipContent({
  className,
  sideOffset = 4,
  ...props
}: React.ComponentProps<typeof TooltipPrimitive.Content>) {
  return (
    <TooltipPrimitive.Content
      data-slot="tooltip-content"
      sideOffset={sideOffset}
      className={cn(
        "z-50 overflow-hidden rounded-base border-2 border-border bg-main px-3 py-1.5 text-sm font-base text-main-foreground animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 origin-(--radix-tooltip-content-transform-origin)",
        className,
      )}
      {...props}
    />
  )
}

export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider }
