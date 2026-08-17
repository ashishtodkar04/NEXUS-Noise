<<<<<<< HEAD
# Nexus Noise - Noise Complaint Tracking System

A comprehensive noise complaint tracking and management system for citizens and authorities. Built with FastAPI (backend) and React (frontend), featuring real-time monitoring, AI-powered noise analysis, and role-based access control.

## 🚀 Features

### For Citizens
- **Submit Noise Complaints**: Upload video evidence with geolocation tagging
- **Track Complaint Status**: Real-time updates on complaint investigation progress
- **Apply for Event Permits**: Request noise permits for events with decibel limits
- **View Nearby Events**: Interactive GIS map showing sanctioned events in your area
- **Receive Notifications**: Real-time alerts about complaint updates

### For Police/Authorities
- **Dashboard**: Comprehensive overview of complaints, events, and applications
- **Complaint Management**: Review, approve, and manage noise complaints
- **Event Approval**: Issue permits with configurable decibel limits
- **Live Monitoring**: Real-time noise level tracking and violation alerts
- **Patrol Integration**: Field officers can log live decibel readings
- **Rule Configuration**: Customize noise limits for different area types
- **Officer Management**: Whitelist approved police officers

### Technical Features
- **AI-Powered Analysis**: Multi-agent system for video/audio analysis
- **Real-Time Communication**: WebSocket support for live updates
- **Temp Cache System**: Pending complaints cached before approval
- **Rate Limiting**: API protection with configurable limits
- **Comprehensive Error Handling**: Structured error responses and logging
- **Input Validation**: Pydantic schemas for request validation
- **File Upload Validation**: Size and format restrictions for security
- **Role-Based Access**: JWT authentication with role-based routing

## 📋 Prerequisites

- **Node.js** >= 18.x
- **Python** >= 3.10
- **MongoDB** >= 5.0
- **FFmpeg** (for audio/video processing)

## 🛠️ Installation

### Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Create .env file from example
cp .env.example .env

# Edit .env with your configuration
# MONGO_URL=mongodb://localhost:27017
# DB_NAME=nexus_noise
# SECRET_KEY=your-secret-key
```

### Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Create .env file
echo "VITE_API_URL=http://localhost:8000/api" > .env
echo "VITE_WS_URL=ws://localhost:8000/ws" >> .env
```

## 🏃 Running the Application

### Start MongoDB
```bash
# Make sure MongoDB is running
mongod
```

### Start Backend
```bash
cd backend
source venv/bin/activate  # On Windows: venv\Scripts\activate
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### Start Frontend
```bash
cd frontend
npm run dev
```

Access the application at:
- Frontend: http://localhost:5173
- Backend API: http://localhost:8000
- API Docs: http://localhost:8000/docs

## 📁 Project Structure

```
TE-MajorProject/
├── backend/
│   ├── main.py                 # FastAPI application entry point
│   ├── database.py             # MongoDB connection setup
│   ├── auth.py                 # JWT authentication
│   ├── models.py               # Pydantic models
│   ├── schemas.py              # Request/response validation schemas
│   ├── requirements.txt        # Python dependencies
│   ├── routes/                 # API route modules
│   │   ├── auth_routes.py      # Authentication endpoints
│   │   ├── complaint_routes.py # Complaint management
│   │   ├── events_routes.py    # Event management
│   │   ├── applications_routes.py # Permit applications
│   │   ├── rules_routes.py     # Noise rule configuration
│   │   ├── notifications_routes.py # Notifications
│   │   ├── patrol_routes.py    # Patrol readings
│   │   └── websocket_routes.py # WebSocket support
│   ├── services/               # Business logic
│   │   ├── video_agents.py     # AI analysis agents
│   │   └── cache_service.py    # Temp complaint cache
│   ├── middleware/             # Custom middleware
│   │   ├── error_handler.py    # Global error handling
│   │   └── request_validation.py # Request validation
│   └── uploads/                # Uploaded video files
├── frontend/
│   ├── src/
│   │   ├── main.jsx            # React entry point
│   │   ├── App.jsx             # Main app component with routing
│   │   ├── components/         # Reusable components
│   │   │   ├── ErrorBoundary.jsx
│   │   │   ├── Navbar.jsx
│   │   │   ├── Sidebar.jsx
│   │   │   ├── NoiseMeter.jsx
│   │   │   ├── StatusBadge.jsx
│   │   │   └── ...
│   │   ├── pages/              # Page components
│   │   │   ├── Landing.jsx     # Landing page
│   │   │   ├── citizen/        # Citizen portal pages
│   │   │   └── police/         # Police portal pages
│   │   ├── services/           # API services
│   │   │   └── api.js          # Axios instance
│   │   ├── store/              # State management
│   │   │   └── useStore.js     # Zustand store
│   │   └── utils/              # Utility functions
│   ├── package.json
│   └── vite.config.js
└── README.md
```

## 🔐 Authentication & Authorization

### User Roles
- **citizen**: Can submit complaints, apply for permits, view their data
- **police**: Full access to complaint management and event approval
- **police_admin**: Additional officer management capabilities
- **police_patrol**: Can submit field readings and view assigned areas

### JWT Tokens
- Access tokens valid for 7 days
- Stored in localStorage as `token` (citizen) or `policeToken` (police)
- Automatically included in API requests via axios interceptor

## 📊 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - Citizen login
- `POST /api/auth/police/login` - Police login
- `GET /api/auth/me` - Get current user

### Complaints
- `POST /api/complaints/` - Submit complaint (with video)
- `GET /api/complaints/` - Get complaints (filtered by role)
- `GET /api/complaints/{id}` - Get complaint details
- `PUT /api/complaints/{id}` - Update complaint status
- `POST /api/complaints/approve/{cache_id}` - Approve cached complaint
- `POST /api/complaints/reject/{cache_id}` - Reject cached complaint

### Events
- `GET /api/events/` - Get all events
- `POST /api/events/` - Create event (admin only)

### Applications
- `POST /api/applications/` - Submit permit application
- `GET /api/applications/` - Get applications
- `PUT /api/applications/{id}/status` - Update application status

### Rules
- `GET /api/rules/` - Get noise rules
- `PUT /api/rules/` - Update noise rules (police only)

### Patrol Readings
- `POST /api/readings/` - Submit field reading
- `GET /api/readings/` - Get all readings

### Notifications
- `GET /api/notifications/` - Get user notifications
- `PUT /api/notifications/read` - Mark as read

## 🔧 Configuration

### Environment Variables (Backend)
```env
MONGO_URL=mongodb://localhost:27017
DB_NAME=nexus_noise
SECRET_KEY=your-super-secret-key-change-in-production
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:4173
RATE_LIMIT_ENABLED=true
```

### Environment Variables (Frontend)
```env
VITE_API_URL=http://localhost:8000/api
VITE_WS_URL=ws://localhost:8000/ws
```

## 🧪 Testing

### Backend Testing
```bash
cd backend
pytest tests/
```

### Frontend Testing
```bash
cd frontend
npm test
```

## 🚀 Deployment

### Backend Deployment
1. Set environment variables
2. Install dependencies: `pip install -r requirements.txt`
3. Run with production server: `uvicorn main:app --host 0.0.0.0 --port 8000`
4. Use Gunicorn for production: `gunicorn main:app -w 4 -k uvicorn.workers.UvicornWorker`

### Frontend Deployment
1. Build: `npm run build`
2. Serve static files with nginx or similar
3. Configure API proxy to backend

## 🔒 Security Features

- **Password Hashing**: bcrypt with salt
- **JWT Authentication**: Secure token-based auth
- **Rate Limiting**: API endpoint protection
- **CORS**: Configurable origin whitelist
- **Input Validation**: Pydantic schemas
- **File Upload Validation**: Size and type restrictions
- **Request Size Limits**: Prevent DoS attacks
- **Error Handling**: No sensitive data in error responses

## 📈 Performance Optimizations

- **Database Indexing**: Optimized queries
- **Response Caching**: Zustand store with TTL
- **Lazy Loading**: React code splitting
- **Debouncing**: API call optimization
- **Connection Pooling**: Motor async MongoDB client
- **Static File Serving**: Efficient file uploads

## 🐛 Troubleshooting

### MongoDB Connection Issues
- Verify MongoDB is running: `mongod`
- Check connection string in .env
- Ensure MongoDB is accessible on configured port

### FFmpeg Not Found
- Install FFmpeg: `sudo apt-get install ffmpeg` (Linux)
- Add to PATH on Windows
- Verify with: `ffmpeg -version`

### Frontend Build Errors
- Clear node_modules: `rm -rf node_modules && npm install`
- Check Node.js version: `node --version` (should be >= 18)
- Clear Vite cache: `rm -rf .vite`

### API Errors
- Check backend logs for error details
- Verify environment variables
- Check MongoDB connection status: `GET /api/health`

## 📝 License

This project is proprietary and confidential.

## 👥 Development Team

Built for noise pollution monitoring and complaint management in urban areas.

## 🤝 Contributing

1. Follow the existing code style
2. Add tests for new features
3. Update documentation
4. Submit pull requests for review
=======
# NEXUS-Noise
>>>>>>> 6396d17432441e755385e4ea7eceefe4abe2f684
