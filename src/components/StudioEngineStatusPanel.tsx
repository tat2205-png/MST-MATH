import React, { useEffect, useState } from "react";

interface EngineStatus {
  id: string;
  name: string;
  status: "READY" | "CORE_READY_RUNTIME_MISSING" | "ROUTER_READY_RUNTIME_MISSING" | "UNAVAILABLE";
  executionEnabled: boolean;
}

interface StatusResponse {
  success: boolean;
  experimental: boolean;
  productionPipelineChanged: boolean;
  executionDefault: "OFF";
  engines: EngineStatus[];
}

export const StudioEngineStatusPanel: React.FC = () => {
  const [status, setStatus] = useState<StatusResponse | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/studio/runtime-status", { signal: controller.signal })
      .then((response) => {
        if (!response.ok) throw new Error("Studio runtime status unavailable");
        return response.json() as Promise<StatusResponse>;
      })
      .then(setStatus)
      .catch((reason: unknown) => {
        if (!(reason instanceof DOMException && reason.name === "AbortError")) setError(true);
      });
    return () => controller.abort();
  }, []);

  if (error) return <p className="text-xs text-rose-700">Studio runtime status is unavailable.</p>;
  if (!status) return <p className="text-xs text-slate-500">Loading Studio engine status…</p>;

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs text-amber-900">
        Experimental developer status only. Execution defaults to OFF; the production pipeline is unchanged.
      </div>
      <div className="space-y-2">
        {status.engines.map((engine) => (
          <div key={engine.id} className="flex items-center justify-between rounded-lg border border-slate-200 bg-white p-3 text-xs">
            <span className="font-semibold text-slate-800">{engine.name}</span>
            <span className={engine.status === "READY" ? "text-emerald-700" : "text-amber-700"}>{engine.status}</span>
          </div>
        ))}
      </div>
    </div>
  );
};
