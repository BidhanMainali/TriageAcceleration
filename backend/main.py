from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import init_db
from routers import patients, intake, history

app = FastAPI(title="Triage Acceleration API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def startup():
    init_db()


app.include_router(patients.router)
app.include_router(intake.router)
app.include_router(history.router)


@app.get("/health")
def health():
    return {"status": "ok"}
