declare module 'cmdk' {
  import * as React from 'react';

  type AnyProps = { [key: string]: any };

  type ComponentWithRef = React.ForwardRefExoticComponent<any> & { displayName?: string };

  interface CommandPrimitiveType extends React.FC<AnyProps> {
    Input: ComponentWithRef;
    List: ComponentWithRef;
    Empty: ComponentWithRef;
    Group: ComponentWithRef;
    Separator: ComponentWithRef;
    Item: ComponentWithRef;
    Shortcut: ComponentWithRef;
  }

  export const Command: CommandPrimitiveType;
  export const CommandInput: ComponentWithRef;
  export const CommandList: ComponentWithRef;
  export const CommandEmpty: ComponentWithRef;
  export const CommandGroup: ComponentWithRef;
  export const CommandSeparator: ComponentWithRef;
  export const CommandItem: ComponentWithRef;
  export const CommandShortcut: ComponentWithRef;

  const _default: CommandPrimitiveType;
  export default _default;
}
