// Loosen Radix UI typings for React 19 compatibility in this workspace.
// The upstream packages target React 18; treating primitives as `any` here
// prevents surface-level prop errors (children/className) during typecheck.
declare module "@radix-ui/react-*" {
  const Component: any;
  export = Component;
}
