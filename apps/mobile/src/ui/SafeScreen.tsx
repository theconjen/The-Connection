import React from "react";

export function withSafeScreen<T>(Comp: React.ComponentType<T>) {
  return function Safe(props: T) {
    try {
      if (
        typeof Comp !== "function" &&
        !React.isValidElement(React.createElement(Comp, props))
      ) {
        throw new Error("Invalid component: not a function/class");
      }
      return <Comp {...props} />;
    } catch (e) {
      return (
        <div style={{ padding: 16 }}>
          <h3>Render error</h3>
          <pre>{String(e)}</pre>
        </div>
      );
    }
  };
}
