"""
main.py
=======
SmartHealthcare FastAPI application entrypoint.

Run with:
    uvicorn main:app --reload
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from database import engine, Base
from routers import auth, patients, doctors, appointments

# NOTE: Tables already exist in the `smarthealthcare` database (Module 1).
# create_all() is a no-op for existing tables and safe to leave in place
# for any models that might not yet exist; it will NOT drop or alter
# existing tables/data.
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="SmartHealthcare Appointment Booking System",
    description="Backend API for the SmartHealthcare multi-city hospital network "
                 "(Tamil Nadu) — appointment booking, queue management, "
                 "AI health assistant, and multi-tier admin analytics.",
    version="1.0.0",
)

# =========================================================
# CORS
# =========================================================
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # tighten in production to the frontend's origin(s)
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# =========================================================
# ROUTERS
# =========================================================
app.include_router(auth.router)
app.include_router(patients.router)
app.include_router(doctors.router)
app.include_router(appointments.router)


# =========================================================
# HEALTH CHECK
# =========================================================
@app.get("/", tags=["Health"])
def root():
    return {
        "status": "ok",
        "service": "SmartHealthcare API",
        "version": "1.0.0",
    }


@app.get("/health", tags=["Health"])
def health_check():
    return {"status": "healthy"}
