# Effect.ts MongoDB Application

A comprehensive TypeScript application built with Effect.ts, MongoDB, and modern web development patterns. This application provides a robust account management system with authentication, authorization, and RESTful API endpoints.

## 🚀 Features

- **Effect.ts Integration**: Leverages the powerful Effect.ts library for functional programming and error handling
- **MongoDB Database**: Full MongoDB integration with repositories pattern
- **Authentication & Authorization**: JWT-based authentication with role-based access control
- **Account Management**: Complete user account system with email verification
- **RESTful API**: HTTP API with comprehensive endpoints and middleware
- **Type Safety**: Full TypeScript implementation with strict type checking
- **Email Service**: Integrated email notifications and verification
- **Security**: Password hashing with Argon2, secure token management
- **Validation**: Schema validation using Effect.ts schemas
- **Error Handling**: Comprehensive error handling and validation
- **Development Tools**: ESLint, Prettier, and development tooling

## 📁 Project Structure

```
src/
├── account/
│   ├── api/              # API endpoints and handlers
│   ├── policies/         # Authorization policies
│   ├── repositories/     # Data access layer
│   ├── schemas/          # Account-related schemas
│   └── services/         # Business logic services
├── authentication/
│   ├── schemas/          # Auth-related schemas
│   ├── authentication.ts # Auth middleware
│   └── authorization.ts  # Authorization logic
├── config/
│   ├── db.ts            # Database configuration
│   └── layer.ts         # Effect layers
├── configuration/
│   └── configurationService.ts # App configuration
├── crypto/
│   ├── errors/          # Crypto-related errors
│   ├── schemas/         # Crypto schemas
│   └── services/        # Cryptographic services
├── email/
│   └── emailService.ts  # Email functionality
├── schemas/
│   └── common/          # Shared schemas
├── templates/           # HTML email templates
└── index.ts            # Application entry point
```

## 🛠️ Prerequisites

- Node.js (v18 or higher)
- MongoDB (local or cloud instance)
- npm or yarn package manager

## 📦 Installation

1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd effect-mongodb-app
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up environment variables:**
   Create a `.env` file in the root directory:
   ```env
   # Database
   MONGODB_URI=mongodb://localhost:27017/your-database
   
   # JWT Secrets
   JWT_ACCESS_SECRET=your-access-token-secret
   JWT_REFRESH_SECRET=your-refresh-token-secret
   
   # Email Configuration
   EMAIL_HOST=smtp.gmail.com
   EMAIL_PORT=587
   EMAIL_USER=your-email@gmail.com
   EMAIL_PASS=your-app-password
   
   # App Configuration
   PORT=3000
   NODE_ENV=development
   ```

4. **Start MongoDB:**
   Make sure MongoDB is running on your system or configure a cloud MongoDB connection.

## 🚀 Getting Started

### Development Mode

```bash
npm run dev
```

### Build for Production

```bash
npm run build
```

### Start Production Server

```bash
npm start
```

## 📚 API Endpoints

### Authentication

- `POST /api/people/signup` - Create new account
- `POST /api/people/signin` - Sign in to account
- `POST /api/people/verify-token` - Verify email token
- `POST /api/people/invalidate` - Invalidate refresh token

### Account Management

- `GET /api/people/:accountId` - Get account by ID
- `PATCH /api/people/:accountId` - Update account
- `GET /api/people/verified/:accountId` - Check if account is verified
- `GET /api/people/my-account` - Get current user account
- `GET /api/people/all/:accountId` - Get all accounts (admin)

## 🔧 Configuration

The application uses a layered configuration approach with Effect.ts:

- **Database Layer**: MongoDB connection and configuration
- **Service Layers**: Individual service configurations
- **Authentication Layer**: JWT and security settings
- **Email Layer**: SMTP and email template configuration

## 🛡️ Security Features

- **Password Hashing**: Uses Argon2 for secure password storage
- **JWT Tokens**: Access and refresh token authentication
- **Input Validation**: Comprehensive schema validation
- **Authorization**: Role-based access control
- **Rate Limiting**: Built-in request rate limiting
- **Error Sanitization**: Secure error messages

## 🧪 Testing

```bash
# Run tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

## 📝 Development Scripts

```bash
# Format code with Prettier
npm run format

# Lint code with ESLint
npm run lint

# Fix linting issues
npm run lint:fix

# Type checking
npm run type-check
```

## 🔍 Code Quality

This project uses:

- **ESLint**: For code linting and consistency
- **Prettier**: For code formatting
- **TypeScript**: For type safety
- **Effect.ts**: For functional programming patterns

## 📖 Effect.ts Patterns

This application demonstrates several Effect.ts patterns:

- **Services**: Dependency injection and service layers
- **Repositories**: Data access with Effect.ts
- **Error Handling**: Comprehensive error management
- **Validation**: Schema-based validation
- **Middleware**: HTTP middleware with Effect.ts
- **Authentication**: Effect.ts authentication patterns

## 🚀 Deployment

### Using Docker

```dockerfile
# Build and run with Docker
docker build -t effect-mongodb-app .
docker run -p 3000:3000 effect-mongodb-app
```

### Using PM2

```bash
# Install PM2
npm install -g pm2

# Start with PM2
pm2 start dist/index.js --name "effect-app"
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'feat: add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Effect.ts](https://effect.website/) - For the powerful functional programming library
- [MongoDB](https://www.mongodb.com/) - For the database solution
- [TypeScript](https://www.typescriptlang.org/) - For type safety
- [Node.js](https://nodejs.org/) - For the runtime environment

## 📞 Support

If you have any questions or need help, please:

1. Check the [documentation](./docs)
2. Search existing [issues](./issues)
3. Create a new issue if needed

---

**Happy coding!** 🎉
