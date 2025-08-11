# OnTourly App

A comprehensive tour management application built with Laravel backend API and React Native frontend.

## 🏗️ Project Structure

```
ontourly-app/
├── backend/          # Laravel 12 API backend
├── frontend/         # React Native + Expo frontend
└── tour-sync/        # Additional Laravel application
```

## 🚀 Features

### Backend (Laravel 12)
- **Modern API**: RESTful API with Laravel 12
- **Authentication**: Laravel Sanctum for API authentication
- **Real-time**: Laravel Reverb for WebSocket support
- **Database**: Comprehensive database with migrations and seeders
- **Models**: Artists, Venues, Bookings, Agencies, Stages
- **API Endpoints**: Full CRUD operations for all entities

### Frontend (React Native + Expo)
- **Cross-platform**: iOS and Android support
- **Navigation**: React Navigation with drawer and tab navigation
- **State Management**: TanStack Query for server state
- **UI Components**: Modern, responsive design
- **Features**: Calendar integration, image picker, notifications

## 🛠️ Tech Stack

### Backend
- **Framework**: Laravel 12
- **PHP**: 8.2+
- **Database**: MySQL/PostgreSQL
- **Authentication**: Laravel Sanctum
- **Real-time**: Laravel Reverb
- **Testing**: PHPUnit

### Frontend
- **Framework**: React Native 0.79.5
- **Expo**: SDK 53
- **Navigation**: React Navigation 7
- **State Management**: TanStack Query
- **Language**: TypeScript
- **Styling**: React Native StyleSheet

## 📋 Prerequisites

- **PHP**: 8.2 or higher
- **Composer**: Latest version
- **Node.js**: 18+ (for frontend)
- **npm**: Latest version
- **Expo CLI**: Latest version
- **Database**: MySQL 8.0+ or PostgreSQL 13+

## 🚀 Quick Start

### 1. Clone the Repository
```bash
git clone https://gitlab.com/IA-Events/ontourly-app.git
cd ontourly-app
```

### 2. Backend Setup
```bash
cd backend

# Install PHP dependencies
composer install

# Copy environment file
cp .env.example .env

# Generate application key
php artisan key:generate

# Configure database in .env file
# DB_CONNECTION=mysql
# DB_HOST=127.0.0.1
# DB_PORT=3306
# DB_DATABASE=ontourly
# DB_USERNAME=your_username
# DB_PASSWORD=your_password

# Run migrations
php artisan migrate

# Seed database (optional)
php artisan db:seed

# Start development server
php artisan serve
```

### 3. Frontend Setup
```bash
cd frontend

# Install dependencies
npm install

# Start Expo development server
npm start
```

## 🌐 API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `POST /api/auth/logout` - User logout

### Artists
- `GET /api/artists` - List all artists
- `POST /api/artists` - Create artist
- `GET /api/artists/{id}` - Get artist details
- `PUT /api/artists/{id}` - Update artist
- `DELETE /api/artists/{id}` - Delete artist

### Venues
- `GET /api/venues` - List all venues
- `POST /api/venues` - Create venue
- `GET /api/venues/{id}` - Get venue details
- `PUT /api/venues/{id}` - Update venue
- `DELETE /api/venues/{id}` - Delete venue

### Bookings
- `GET /api/bookings` - List all bookings
- `POST /api/bookings` - Create booking
- `GET /api/bookings/{id}` - Get booking details
- `PUT /api/bookings/{id}` - Update booking
- `DELETE /api/bookings/{id}` - Delete booking

## 📱 Mobile App Features

- **Authentication**: Secure login and registration
- **Dashboard**: Overview of tours and bookings
- **Calendar**: Tour scheduling and management
- **Chat**: Real-time communication
- **Profile Management**: User and artist profiles
- **Booking System**: Tour booking and management

## 🔧 Development Commands

### Backend
```bash
cd backend

# Start development server
php artisan serve

# Run tests
php artisan test

# Clear cache
php artisan cache:clear

# Generate API documentation
php artisan l5-swagger:generate
```

### Frontend
```bash
cd frontend

# Start Expo development server
npm start

# Run on iOS simulator
npm run ios

# Run on Android emulator
npm run android

# Build for production
expo build:android
expo build:ios
```

## 📊 Database Schema

The application includes comprehensive database models:

- **Users**: Authentication and user management
- **Artists**: Artist profiles and information
- **Venues**: Venue details and locations
- **Bookings**: Tour bookings and scheduling
- **Agencies**: Agency management
- **Stages**: Stage and performance area details
- **Chat System**: Real-time messaging

## 🧪 Testing

### Backend Testing
```bash
cd backend
php artisan test
```

### Frontend Testing
```bash
cd frontend
npm test
```

## 🚀 Deployment

### Backend Deployment
1. Set up production environment variables
2. Configure production database
3. Run `composer install --optimize-autoloader --no-dev`
4. Set up web server (Nginx/Apache)
5. Configure SSL certificates

### Frontend Deployment
1. Build production app: `expo build:android` / `expo build:ios`
2. Upload to app stores
3. Configure production API endpoints

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 📞 Support

For support and questions:
- Create an issue in the GitLab repository
- Contact the development team

## 🔄 Version History

- **v1.0.0**: Initial release with basic tour management
- **v1.1.0**: Added real-time chat and notifications
- **v1.2.0**: Enhanced booking system and calendar integration

---

**Built with ❤️ by the OnTourly Team**
