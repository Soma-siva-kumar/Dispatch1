# Dispatch IQ

A comprehensive emergency dispatch management system built with modern web technologies. This application helps coordinate emergency responses, manage incidents, track patrol units, and provide analytics for dispatch operations.

## 🚀 Features

- **Incident Management**: Create, track, and prioritize emergency incidents
- **Dispatch Control Room**: Real-time incident visualization and management
- **Patrol Unit Tracking**: Monitor active patrol units on an interactive map
- **Analytics Dashboard**: View statistics and trends in incident data
- **Citizen Portal**: Allow citizens to report incidents
- **Officer View**: Dedicated interface for law enforcement personnel
- **Real-time Updates**: WebSocket-based live updates using Socket.IO
- **User Authentication**: Secure JWT-based authentication system
- **Role-based Access**: Different views for citizens, officers, and administrators

## 📋 Prerequisites

Before running this project, ensure you have the following installed:

- **Node.js** (v16 or higher)
- **npm** or **yarn**
- **MongoDB** (v4.4 or higher)

## 🛠️ Installation

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/dispatch-iq.git
cd dispatch-iq
```

### 2. Setup Server

```bash
cd server
npm install
```

Create a `.env` file in the server directory:

```bash
cp .env.example .env
```

Edit `.env` and configure your environment variables:

```
PORT=5000
NODE_ENV=development
MONGO_URI=mongodb://127.0.0.1:27017/dispatchiq
JWT_SECRET=your_jwt_secret_key_here
```

**Start MongoDB** (if running locally):

```bash
mongod
```

### 3. Setup Client

```bash
cd ../client
npm install
```

## 🚀 Running the Application

### Development Mode

**Terminal 1 - Start the Server:**

```bash
cd server
npm run dev
```

The server will run on `http://localhost:5000`

**Terminal 2 - Start the Client:**

```bash
cd client
npm run dev
```

The client will run on `http://localhost:5173` (or another port if 5173 is in use)

### Production Build

**Build the Client:**

```bash
cd client
npm run build
```

**Start the Server (Production):**

```bash
cd server
npm start
```

## 📁 Project Structure

```
dispatch-iq/
├── client/                  # React frontend application
│   ├── src/
│   │   ├── components/     # Reusable React components
│   │   ├── pages/          # Page components
│   │   ├── context/        # Context for state management
│   │   ├── api/            # API calls and axios config
│   │   └── assets/         # Static assets
│   ├── public/             # Public files
│   ├── package.json
│   └── vite.config.js
│
└── server/                  # Node.js backend application
    ├── models/             # MongoDB models
    ├── routes/             # API routes
    ├── middleware/         # Express middleware
    ├── services/           # Business logic services
    ├── socket/             # Socket.IO handlers
    ├── server.js           # Main server entry point
    ├── seed.js             # Database seeding script
    ├── package.json
    └── .env.example        # Environment variables template
```

## 🔌 Available API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `GET /api/auth/me` - Get current user

### Incidents
- `GET /api/incidents` - Get all incidents
- `POST /api/incidents` - Create new incident
- `PATCH /api/incidents/:id` - Update incident
- `GET /api/incidents/:id` - Get incident details

### Patrol Units
- `GET /api/units` - Get all patrol units
- `POST /api/units` - Create patrol unit
- `PATCH /api/units/:id` - Update unit location/status

### Analytics
- `GET /api/analytics/stats` - Get overall statistics
- `GET /api/analytics/incidents` - Get incident trends

### Users
- `GET /api/users` - Get all users
- `PATCH /api/users/:id` - Update user

## 🔐 Environment Variables

The server requires the following environment variables (see `.env.example`):

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | 5000 |
| `NODE_ENV` | Environment mode | development |
| `MONGO_URI` | MongoDB connection string | mongodb://127.0.0.1:27017/dispatchiq |
| `JWT_SECRET` | Secret for JWT signing | (required) |
| `SEED_MODE` | Enable custom seed execution | false |
| `SEED_ADMIN_EMAIL` | Initial admin email when seeding | (optional) |
| `SEED_ADMIN_PASSWORD` | Initial admin password when seeding | (optional) |

## 📦 Technologies Used

### Frontend
- **React 19** - UI framework
- **Vite** - Build tool and development server
- **React Router** - Client-side routing
- **Axios** - HTTP client
- **Socket.IO Client** - Real-time communication
- **Leaflet** - Interactive mapping
- **Recharts** - Data visualization
- **Lucide React** - Icon library
- **React Hot Toast** - Notifications

### Backend
- **Express.js** - Web framework
- **Node.js** - JavaScript runtime
- **MongoDB** - NoSQL database
- **Mongoose** - MongoDB ODM
- **Socket.IO** - Real-time bidirectional communication
- **JWT** - Authentication
- **bcryptjs** - Password hashing
- **CORS** - Cross-origin resource sharing
- **dotenv** - Environment variable management

## 📝 Scripts

### Server Scripts
- `npm start` - Start production server
- `npm run dev` - Start development server with auto-reload
- `npm run seed` - Seed database with custom initial data when configured

### Client Scripts
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run lint` - Run linter
- `npm run preview` - Preview production build

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Troubleshooting

### MongoDB Connection Error
- Ensure MongoDB is running: `mongod`
- Verify `MONGO_URI` in `.env` is correct

### Port Already in Use
- Change `PORT` in `.env` or specify a different port
- On Windows: `netstat -ano | findstr :5000` to find and kill process
- On Mac/Linux: `lsof -i :5000` to find and kill process

### Module Not Found Errors
- Delete `node_modules` and `package-lock.json`
- Run `npm install` again

### WebSocket Connection Issues
- Ensure both client and server are running
- Check browser console for connection errors
- Verify CORS settings in `server.js`

## 📞 Support

For issues, questions, or suggestions, please open an issue on the GitHub repository.

## ✨ Future Enhancements

- Mobile app support
- Advanced geofencing capabilities
- Machine learning-based incident prediction
- Integration with emergency services APIs
- Multi-language support
- Two-factor authentication
- Incident history and archival system

---

**Happy Dispatching!** 🚨
