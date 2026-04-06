from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from models import SolverRequest, SolverResponse
from solver import SolverInfeasibleError, solve

app = FastAPI(title="Day Trip Route Solver")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["POST", "GET"],
    allow_headers=["Content-Type"],
)


@app.get("/health")
def health() -> dict:
    return {"status": "ok"}


@app.post("/solve", response_model=SolverResponse)
def solve_route(request: SolverRequest) -> SolverResponse:
    if not request.activities:
        raise HTTPException(status_code=400, detail="At least one activity is required")
    try:
        return solve(request)
    except SolverInfeasibleError as e:
        raise HTTPException(status_code=422, detail=str(e))
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
