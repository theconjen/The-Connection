declare module "wouter" {
  import * as React from "react";

  export const Router: React.FC<any>;
  export const Route: React.FC<any>;
  export const Switch: React.FC<any>;
  export const Redirect: React.FC<any>;
  export const Link: React.FC<any>;
  export function useLocation(): [string, (path: string, opts?: any) => void];
  export function useNavigate(): (path: string, opts?: any) => void;
  export function useRoute<T extends string = string>(pattern: T): [boolean, Record<string, string>];
  export function useParams<T extends Record<string, string | undefined> = Record<string, string | undefined>>(): T;
}
