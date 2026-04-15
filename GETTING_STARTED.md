# Getting Started with Sidequest

This guide will help new team members set up and run the Sidequest application locally or using Docker.

## Prerequisites

Choose one of the following setup methods:

### Option A: Local Development (Recommended for Development)
- Python 3.11+
- Node.js 18+
- Git

### Option B: Docker (Recommended for Quick Start)
- Docker Desktop (Windows/Mac) or Docker Engine (Linux)
- Docker Compose v2.0+
- Git

## Setup Instructions

### 1. Clone the Repository

```bash
git clone <repository-url>
cd sidequest
```

### 2. Configure Environment Variables

```bash
# Copy the example environment file
cp .env.example .env
```

Edit `.env` and add your API keys. See [GOOGLE_MAPS_SETUP.md](./GOOGLE_MAPS_SETUP.md) for detailed instructions on getting API keys.

**Minimum required configuration:**

```env
# Google Cloud / Vertex AI (Required)
GOOGLE_API_KEY=your-google-api-key-here
GOOGLE_CLOUD_PROJECT=your-project-id
GOOGLE_CLOUD_LOCATION=us-central1

# Google Maps (Required for frontend)
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your-maps-api-key-here

# Backend Configuration
BACKEND_PORT=8000
BACKEND_HOST=0.0.0.0

# Frontend Configuration
NEXT_PUBLIC_API_URL=http://localhost:8000
```

## Option A: Local Development Setup

### Backend Setup

```bash
# Navigate to backend directory
cd backend

# Create virtual environment
python -m venv .venv

# Activate virtual environment
# Windows:
.venv\Scripts\activate
# Mac/Linux:
source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run the backend server
python main.py
```

Backend will be available at: http://localhost:8000

Test it: http://localhost:8000/health

### Frontend Setup

Open a new terminal:

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Run development server
npm run dev
```

Frontend will be available at: http://localhost:3000

## Option B: Docker Setup

### Quick Start with Docker Compose

```bash
# Build and start all services
docker-compose up --build

# Or run in detached mode (background)
docker-compose up -d --build
```

That's it! The application will be available at:
- Frontend: http://localhost:3000
- Backend: http://localhost:8000

### Stop Docker Services

```bash
# Stop services
docker-compose down

# Stop and remove all data
docker-compose down -v
```

For more Docker options, see [DOCKER_SETUP.md](./DOCKER_SETUP.md)

## Verifying Your Setup

### 1. Check Backend Health

Open browser or use curl:
```bash
curl http://localhost:8000/health
```

Expected response:
```json
{
  "status": "healthy",
  "timestamp": "2024-01-01T00:00:00.000000"
}
```

### 2. Check Frontend

1. Open http://localhost:3000
2. You should see the Sidequest homepage
3. Select a city from the dropdown
4. Explore section should show curated experiences

### 3. Test Google Maps

1. Create an itinerary or view an existing one
2. Check that the map loads without errors
3. Open browser console (F12) - should see no Google Maps errors

## Common Issues

### Google Maps Not Loading

**Error**: `ApiProjectMapError` or map shows only gray tiles

**Solution**: 
1. Follow [GOOGLE_MAPS_SETUP.md](./GOOGLE_MAPS_SETUP.md) to configure your API key
2. Ensure billing is enabled in Google Cloud Console
3. Enable Maps JavaScript API and Places API
4. Add `http://localhost:*` to API key restrictions
5. Restart your development server

### Backend Won't Start

**Error**: `ModuleNotFoundError` or import errors

**Solution**:
```bash
# Make sure you're in the backend directory
cd backend

# Activate virtual environment
# Windows:
.venv\Scripts\activate
# Mac/Linux:
source .venv/bin/activate

# Reinstall dependencies
pip install -r requirements.txt
```

### Frontend Build Errors

**Error**: `Module not found` or dependency errors

**Solution**:
```bash
# Delete node_modules and reinstall
cd frontend
rm -rf node_modules package-lock.json
npm install
```

### Port Already in Use

**Error**: `Port 3000/8000 is already in use`

**Solution**:
```bash
# Windows - Find and kill process
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Mac/Linux - Find and kill process
lsof -ti:3000 | xargs kill -9
```

Or change the port in your configuration.

### Environment Variables Not Loading

**Solution**:
1. Ensure `.env` file is in the root directory (not in backend/ or frontend/)
2. Restart your development servers after changing `.env`
3. For Next.js, environment variables must start with `NEXT_PUBLIC_` to be available in browser

## Project Structure

```
sidequest/
├── backend/                    # Python FastAPI backend
│   ├── agents/                # AI agents (discovery, cultural, etc.)
│   ├── config/                # Configuration (cities, settings)
│   ├── data/                  # Curated experiences data
│   ├── data_sources/          # External data sources (Reddit, etc.)
│   ├── services/              # Business logic services
│   ├── state/                 # Agent state schemas
│   ├── tools/                 # Utility tools
│   ├── main.py               # FastAPI entry point
│   └── requirements.txt      # Python dependencies
│
├── frontend/                  # Next.js React frontend
│   ├── src/
│   │   ├── app/              # Next.js app router pages
│   │   ├── components/       # React components
│   │   ├── hooks/            # Custom React hooks
│   │   └── lib/              # Utilities and API clients
│   ├── public/               # Static assets
│   └── package.json          # Node dependencies
│
├── docs/                      # Documentation
├── .env                       # Environment variables (create from .env.example)
├── .env.example              # Example environment configuration
├── docker-compose.yml        # Docker Compose configuration
├── Dockerfile.backend        # Backend Docker image
├── Dockerfile.frontend       # Frontend Docker image
└── README.md                 # Main project README
```

## Development Workflow

### Making Changes

1. **Backend changes**: Edit files in `backend/`, server auto-reloads
2. **Frontend changes**: Edit files in `frontend/src/`, page auto-refreshes
3. **Environment changes**: Update `.env`, restart servers

### Running Tests

```bash
# Backend tests
cd backend
pytest

# Frontend tests (if configured)
cd frontend
npm test
```

### Adding a New City

1. Edit `backend/config/cities.py`
2. Add new `CityConfig` to `SUPPORTED_CITIES`
3. Restart backend server
4. City will appear in frontend dropdown

Example:
```python
"mumbai": CityConfig(
    id="mumbai",
    display_name="Mumbai",
    country="India",
    default_coordinates={"lat": 19.0760, "lng": 72.8777},
    timezone="Asia/Kolkata",
    currency="INR",
    enabled=True,
    known_places=["Gateway of India", "Marine Drive", ...]
)
```

### Adding New Experiences

1. Edit `backend/data/curated_experiences.py`
2. Add experiences to the appropriate city
3. Restart backend server

## Useful Commands

### Backend

```bash
# Run backend
cd backend
python main.py

# Run with auto-reload (development)
uvicorn main:app --reload --host 0.0.0.0 --port 8000

# Run tests
pytest

# Check code style
flake8 .
black .
```

### Frontend

```bash
# Run development server
cd frontend
npm run dev

# Build for production
npm run build

# Run production build
npm start

# Lint code
npm run lint
```

### Docker

```bash
# Start services
docker-compose up

# Start in background
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down

# Rebuild images
docker-compose up --build

# Remove all containers and volumes
docker-compose down -v
```

## Next Steps

1. **Explore the codebase**: Start with `backend/main.py` and `frontend/src/app/page.tsx`
2. **Read the architecture**: Check [architecture.md](./architecture.md)
3. **Review documentation**: See files in `docs/` directory
4. **Try the API**: Use the API endpoints documented in backend
5. **Customize**: Add your own cities, experiences, or features

## Getting Help

- Check existing documentation in `docs/` folder
- Review [GOOGLE_MAPS_SETUP.md](./GOOGLE_MAPS_SETUP.md) for Maps issues
- Review [DOCKER_SETUP.md](./DOCKER_SETUP.md) for Docker issues
- Check the project's issue tracker
- Ask team members in your communication channel

## Contributing

1. Create a feature branch: `git checkout -b feature/your-feature`
2. Make your changes
3. Test locally
4. Commit with clear messages: `git commit -m "Add feature X"`
5. Push and create a pull request

## Resources

- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [Next.js Documentation](https://nextjs.org/docs)
- [Google Maps JavaScript API](https://developers.google.com/maps/documentation/javascript)
- [Vertex AI Documentation](https://cloud.google.com/vertex-ai/docs)
- [Docker Documentation](https://docs.docker.com/)
