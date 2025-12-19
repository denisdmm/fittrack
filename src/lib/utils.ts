import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function toTitleCase(str: string): string {
  if (!str) return "";

  // Expanded list of Portuguese and English small words
  const smallWords = /^(a|an|the|and|but|or|for|nor|on|at|to|from|by|com|de|do|da|dos|das|e|em|na|no|nas|nos|ou|para|por|sobre)$/i;
  
  return str
    .split(' ')
    .map((word, index) => {
      if (index > 0 && smallWords.test(word)) {
        return word.toLowerCase();
      }
      if (word.length > 0) {
        return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
      }
      return "";
    })
    .join(' ');
}
