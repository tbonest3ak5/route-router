import { SolverRequest, SolverResponse } from "@/types";

const SOLVER_URL =
  process.env.NEXT_PUBLIC_SOLVER_URL ?? "http://localhost:8000";

export async function callSolver(
  request: SolverRequest
): Promise<SolverResponse> {
  const res = await fetch(`${SOLVER_URL}/solve`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(request),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(
      (err as { detail?: string }).detail ?? `Solver error ${res.status}`
    );
  }
  return res.json() as Promise<SolverResponse>;
}
