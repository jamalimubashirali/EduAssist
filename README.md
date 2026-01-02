# EduAssist

A full-stack educational assistance platform built with modern web technologies to provide intelligent learning support and assessment tools.

## 🏗️ Architecture

This is a monorepo project consisting of two main components:

```
EduAssist/
├── backend/     # NestJS API server
└── frontend/    # Next.js web application
```

## 🚀 Tech Stack

### Backend
- **Framework**: [NestJS](https://nestjs.com/) - A progressive Node.js framework
- **Database**: [MongoDB](https://www.mongodb.com/) with Mongoose ODM
- **AI/ML**: 
  - LangChain for AI orchestration
  - OpenAI & Azure OpenAI integration
- **Authentication**: JWT with Passport.js
- **Language**: TypeScript

### Frontend
- **Framework**: [Next.js 15](https://nextjs.org/) with React 19
- **Styling**:  TailwindCSS v4
- **State Management**: 
  - Redux Toolkit
  - Zustand
  - TanStack Query (React Query)
- **UI Components**: 
  - Radix UI primitives
  - Framer Motion for animations
  - Recharts for data visualization
- **Forms**: React Hook Form with Zod validation
- **Language**: TypeScript

## 📋 Prerequisites

- Node.js (v20 or higher recommended)
- npm or pnpm
- MongoDB instance (local or cloud)
- OpenAI API key (for AI features)

## 🛠️ Installation

### Backend Setup

1. Navigate to the backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file with the following variables:
```env
# Database
MONGODB_URI=your_mongodb_connection_string

# JWT
JWT_SECRET=your_jwt_secret
JWT_EXPIRES_IN=24h

# OpenAI
OPENAI_API_KEY=your_openai_api_key
AZURE_OPENAI_API_KEY=your_azure_key (optional)
```

4. Run the development server:
```bash
npm run start:dev
```

5. (Optional) Seed the database:
```bash
npm run seed
```

### Frontend Setup

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env.local` file:
```env
NEXT_PUBLIC_API_URL=http://localhost:3000
```

4. Set up custom fonts (optional):
```bash
npm run setup-font
```

5. Run the development server:
```bash
npm run dev
```

The application will be available at `http://localhost:3000` (frontend) with the backend API running on port 3001 (or as configured).

## 🧪 Testing

### Backend Tests
```bash
cd backend

# Unit tests
npm test

# Watch mode
npm run test:watch

# Coverage
npm run test:cov

# E2E tests
npm run test:e2e
```

### Frontend Tests
```bash
cd frontend

# Run all tests
npm test

# Integration tests
npm run test:integration

# Specific test suites
npm run test:topic-service
npm run test:quiz-service
npm run test:user-journey
npm run test:algorithms
npm run test:data-flow

# Validate service connectivity
npm run validate:connectivity
```

## 📜 Available Scripts

### Backend Scripts
- `npm run start:dev` - Start development server with hot reload
- `npm run build` - Build the application
- `npm run start:prod` - Run production build
- `npm run lint` - Lint and fix code
- `npm run format` - Format code with Prettier
- `npm run seed` - Seed database with test data

### Frontend Scripts
- `npm run dev` - Start development server with Turbopack
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Lint code
- `npm run test: all-integration` - Run all integration tests

## 🔒 Security Features

- JWT-based authentication
- Password hashing with bcrypt
- Rate limiting with express-rate-limit
- Cookie parsing for secure session management
- Environment variable validation

## 🎨 UI Features

- Dark/Light theme support (next-themes)
- Responsive design with TailwindCSS
- Smooth animations with Framer Motion
- Toast notifications (Sonner)
- Markdown rendering for rich content
- Data visualization with Recharts

## 📦 Key Dependencies

### Backend
- `@nestjs/common`, `@nestjs/core` - Core NestJS framework
- `mongoose` - MongoDB object modeling
- `langchain`, `@langchain/openai` - AI/ML integration
- `passport`, `passport-jwt` - Authentication
- `bcrypt` - Password hashing
- `@faker-js/faker` - Test data generation

### Frontend
- `next` - React framework
- `@tanstack/react-query` - Server state management
- `@reduxjs/toolkit` - Client state management
- `axios` - HTTP client
- `react-hook-form` - Form handling
- `zod` - Schema validation
- `framer-motion` - Animations

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under UNLICENSED - see the backend package.json for details.

## 👤 Author

**jamalimubashirali**

## 🔗 Links

- Repository: [https://github.com/jamalimubashirali/EduAssist](https://github.com/jamalimubashirali/EduAssist)
- Backend README: [backend/README.md](backend/README.md)
- Frontend README: [frontend/README.md](frontend/README.md)

---

Built with ❤️ using NestJS and Next.js
