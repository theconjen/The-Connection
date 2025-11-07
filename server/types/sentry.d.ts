declare module '@sentry/node' {
  import type { RequestHandler, ErrorRequestHandler } from 'express';

  // Minimal config options used in this project
  export interface InitOptions {
    dsn?: string;
    environment?: string;
    tracesSampleRate?: number;
  }

  // Add a lightweight declaration for the Handlers namespace used in this project
  export const Handlers: {
    requestHandler: () => RequestHandler;
    errorHandler: () => ErrorRequestHandler;
    tracingHandler?: () => RequestHandler;
  };

  export function init(options?: InitOptions): void;

  const _default: {
    init: typeof init;
    Handlers: typeof Handlers;
  };

  export default _default;
}
