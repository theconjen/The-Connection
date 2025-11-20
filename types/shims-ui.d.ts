// Temporary shims for third-party UI libraries to keep the repo typecheckable
// while we complete proper typing fixes for the UI package.

declare module 'lucide-react' {
  const anyExport: any;
  export default anyExport;
  export const X: any;
  export const Check: any;
  export const ChevronDown: any;
  export const ChevronUp: any;
}

declare module '@radix-ui/react-dialog' {
  export const Root: any;
  export const Trigger: any;
  export const Portal: any;
  export const Close: any;
  export const Overlay: any;
  export const Content: any;
  export const Title: any;
  export const Description: any;
}

declare module '@radix-ui/react-slot' {
  export const Slot: any;
}

declare module 'react-hook-form' {
  export function useForm(...args: any[]): any;
  export function Controller(...args: any[]): any;
  export const useController: any;
  export const useFieldArray: any;
  export default {} as any;
}
