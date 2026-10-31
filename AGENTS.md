# TNEA.ai Development Guide

## Project Overview
TNEA.ai is an engineering admissions assistant platform for Tamil Nadu Engineering Admissions (TNEA). It offers college discovery, cutoff analytics, rank predictions, choice filling sequences, and AI recommendations.

## Architecture
- **Frontend** (`main` branch): React 19, TanStack Router & TanStack Start, TypeScript, Tailwind CSS v4, Lucide icons, Motion, Recharts.
- **Backend** (`backend` branch): Python 3.12, Flask, SQLAlchemy ORM, JWT authentication, SQLite / PostgreSQL (`pg8000`), Alembic migrations.

## Key Routes
- `/`: Home page with statistics and feature highlights.
- `/colleges`: College explorer with filters (district, autonomous, fees, placement, branch).
- `/colleges/:code`: College profile with multi-year cutoff trends and institutional metrics.
- `/counselling`: Smart suggestion engine (Dream, Target, Safe categories).
- `/rank-predictor`: Estimate general and community rank based on cutoff score.
- `/choice-filling`: Choice list sequencing with duplicate prevention and export.
- `/cutoffs`: Interactive cutoff history charts.
- `/compare`: Side-by-side comparison for up to 4 colleges.
- `/ai-chat`: Streaming conversational admissions assistant.
- `/dashboard`: Saved institutions and query logs.
