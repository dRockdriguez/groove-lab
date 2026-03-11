from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routes import health, imports

app = FastAPI(
    title="GrooveLab API",
    description="Intelligent music practice platform API",
    version="0.1.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:4321"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router, prefix="/health", tags=["health"])
app.include_router(imports.router, prefix="/import", tags=["import"])


@app.get("/", tags=["root"])
async def root() -> dict:
    return {"message": "GrooveLab API", "version": "0.1.0"}
