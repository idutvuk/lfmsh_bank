import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Функции для работы с цветами отрядов
export function getPartyBorderClass(party: number): string {
  switch (party) {
    case 0: return "outline outline-2 outline-[var(--lfmsh-0)]";
    case 1: return "outline outline-2 outline-[var(--lfmsh-1)]";
    case 2: return "outline outline-2 outline-[var(--lfmsh-2)]";
    case 3: return "outline outline-2 outline-[var(--lfmsh-3)]";
    case 4: return "outline outline-2 outline-[var(--lfmsh-4)]";
    default: return "outline outline-2 outline-[var(--lfmsh-0)]";
  }
}

export function getPartyTextColorClass(party: number): string {
  switch (party) {
    case 0: return "text-[var(--lfmsh-0)]";
    case 1: return "text-[var(--lfmsh-1)]";
    case 2: return "text-[var(--lfmsh-2)]";
    case 3: return "text-[var(--lfmsh-3)]";
    case 4: return "text-[var(--lfmsh-4)]";
    default: return "text-[var(--lfmsh-0)]";
  }
}

export function getPartyBgColorClass(party: number): string {
  switch (party) {
    case 0: return "bg-[var(--lfmsh-0)]";
    case 1: return "bg-[var(--lfmsh-1)]";
    case 2: return "bg-[var(--lfmsh-2)]";
    case 3: return "bg-[var(--lfmsh-3)]";
    case 4: return "bg-[var(--lfmsh-4)]";
    default: return "bg-[var(--lfmsh-0)]";
  }
}

export function getPartyBgColorLightClass(party: number): string {
  switch (party) {
    case 0: return "bg-[var(--lfmsh-0)]/10";
    case 1: return "bg-[var(--lfmsh-1)]/10";
    case 2: return "bg-[var(--lfmsh-2)]/10";
    case 3: return "bg-[var(--lfmsh-3)]/10";
    case 4: return "bg-[var(--lfmsh-4)]/10";
    default: return "bg-[var(--lfmsh-0)]/10";
  }
}
