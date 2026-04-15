# Quick Start Guide

Get Sidequest running in 5 minutes.

## Prerequisites

- Docker Desktop installed
- Git installed

## Steps

### 1. Clone & Configure

```bash
git clone <repo-url>
cd sidequest
cp .env.example .env
```

### 2. Add API Keys to .env

Edit `.env` and add these required keys:

```env
GOOGLE_API_KEY=your-key-here
GOOGLE_CLOUD_PROJECT=your-project-id
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your-maps-key-here
```

**Get API Keys:**
- Google Cloud: https://console.cloud.google.com/apis/credentials
- Enable: Vertex AI API, Maps JavaScript API, Places API
- See [GOOGLE_MAPS_SETUP.md](./GOOGLE_MAPS_SETUP.md) for detailed instructions

### 3. Run with Docker

```bash
docker-compose up --build
```

### 4. Access Application

- Frontend: http://localhost:3000
- Backend: http://localhost:8000
- Health: http://localhost:8000/health

## Without Docker

### Backend
```bash
cd backend
python -m venv .venv
.venv\Scripts\activate  # Windows
source .venv/bin/activate  # Mac/Linux
pip install -r requirements.txt
python main.py
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

## Troubleshooting

### Maps not loading?
1. Check `.env` has `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`
2. Enable billing in Google Cloud Console
3. Enable Maps JavaScript API and Places API
4. Add `http://localhost:*` to API key restrictions
5. Restart servers

### Port in use?
```bash
# Change ports in docker-compose.yml or kill process
docker-compose down
```

### Still stuck?
See [GETTING_STARTED.md](./GETTING_STARTED.md) for detailed instructions.

## Common Commands

```bash
# Start
docker-compose up -d

# Stop
docker-compose down

# View logs
docker-compose logs -f

# Rebuild
docker-compose up --build

# Clean everything
docker-compose down -v
```

## What's Next?

- Read [GETTING_STARTED.md](./GETTING_STARTED.md) for full setup
- Check [DOCKER_SETUP.md](./DOCKER_SETUP.md) for Docker details
- Review [architecture.md](./architecture.md) for system design
- Explore `backend/config/cities.py` to add cities
- Check `backend/data/curated_experiences.py` for experiences
