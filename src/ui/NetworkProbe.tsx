import React from "react";

type NetworkProbeState =
  | {
      ok: boolean;
      status: number;
      headers: Record<string, string>;
      body: string;
      API_BASE: string;
    }
  | {
      error: string;
      API_BASE: string;
    }
  | {
      error: string;
    }
  | {};

export function NetworkProbe() {
  const [out, setOut] = React.useState<NetworkProbeState>({});

  React.useEffect(() => {
    if (typeof window === "undefined") {
      setOut({ error: "NetworkProbe requires a browser environment" });
      return;
    }

    const API_BASE: string = (window as any).__API_BASE ?? "";

    fetch(`${API_BASE}/health`, { credentials: "include" })
      .then(async (response) => {
        const headers = Object.fromEntries(response.headers.entries());
        const body = await response.text();

        setOut({
          ok: response.ok,
          status: response.status,
          headers,
          body,
          API_BASE,
        });
      })
      .catch((error) => {
        setOut({ error: String(error), API_BASE });
      });
  }, []);

  return (
    <pre style={{ fontSize: 12, whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
      {JSON.stringify(out, null, 2)}
    </pre>
  );
}
