import { clsx } from 'clsx';

type ClassValue = string | number | boolean | null | undefined | ClassValue[] | Record<string, any>;

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}
