from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

from database import init_db
from routers import intake, patients, departments, staff, routing

load_dotenv()


@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    yield


app = FastAPI(title="TriageAcceleration API", version="1.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


app.include_router(intake.router, tags=["intake"])
app.include_router(patients.router, tags=["patients"])
app.include_router(departments.router, tags=["departments"])
app.include_router(staff.router, tags=["staff"])
app.include_router(routing.router, tags=["routing"])


@app.get("/health")
def health():
    return {"status": "ok"}
