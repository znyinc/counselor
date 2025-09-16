# AI Career Counseling Tool

A comprehensive AI-powered career counseling platform designed specifically for Indian students, aligned with NEP 2020 guidelines. The system provides personalized career recommendations based on academic performance, interests, socioeconomic factors, and educational aspirations.

## 🌟 Features

### Core Functionality
- **AI-Powered Recommendations**: GPT-4 integration for intelligent career suggestions
- **NEP 2020 Aligned**: Recommendations follow National Education Policy 2020 guidelines
- **Bilingual Support**: Complete Hindi and English interface
- **Comprehensive Data Collection**: Academic, personal, and socioeconomic information
- **Visual Analytics**: Interactive charts and graphs for career insights
- **Webhook Notifications**: Real-time alerts for parents and counselors

### Student Experience
- **Multi-Step Form**: Intuitive 5-step profile creation process
- **Real-Time Validation**: Immediate feedback on form inputs
- **Personalized Results**: Detailed career recommendations with salary trends
- **Educational Pathways**: Clear guidance on entrance exams and college options
- **Scholarship Information**: Relevant financial aid opportunities

### Administrative Features
- **Analytics Dashboard**: Comprehensive insights into career choice trends
- **Privacy Compliant**: GDPR-compliant data handling and anonymization
- **Performance Monitoring**: Real-time system performance tracking
- **Webhook Integration**: n8n workflow automation support

## 🚀 Quick Start

### Prerequisites
- Node.js 16+ and npm
- OpenAI API key

### Installation

1. **Clone and install dependencies:**
```bash
git clone <repository-url>
cd ai-career-counseling-tool
npm install
cd backend && npm install
cd ../frontend && npm install
cd ..
```

2. **Set up environment variables:**
```bash
# Backend configuration
cp backend/.env.example backend/.env
# Edit backend/.env and add your OpenAI API key
```

3. **Start the application:**
```bash
npm run dev
```

## 🚀 Deployment Options

### Local Development
- **Frontend**: http://localhost:3000
- **Backend**: http://localhost:3001
- **Development Server**: `npm run dev`

### AWS Cloud Production
- **Scalable Infrastructure**: ECS Fargate, RDS, ElastiCache
- **Managed Services**: Load balancer, auto-scaling, monitoring
- **Security**: VPC, secrets management, encryption
- **Cost Optimized**: Starting from ~$158/month

See the [AWS Deployment Guide](docs/AWS_DEPLOYMENT.md) for complete instructions.

### Docker Local Testing
```bash
# Test AWS-like environment locally
docker-compose -f docker-compose.aws.yml up
```

## 📋 Available Scripts

### Development
```bash
npm run dev              # Start both frontend and backend
npm run dev:frontend     # Start React development server
npm run dev:backend      # Start Node.js API server
```

### Testing
```bash
npm test                 # Run all tests
npm run test:frontend    # Run frontend tests
npm run test:backend     # Run backend tests
npm run test:integration # Run end-to-end integration tests
npm run test:coverage    # Generate coverage reports
```

### Production
```bash
npm run build            # Build both frontend and backend
npm run build:frontend   # Build React app for production
npm run build:backend    # Compile TypeScript backend
```

### AWS Cloud Deployment
```bash
# Quick deployment to AWS
./aws/deploy.sh deploy

# Or use Docker Compose for local AWS-like environment
docker-compose -f docker-compose.aws.yml up
```

### Code Quality
```bash
npm run lint             # Lint all code
npm run lint:fix         # Fix linting issues
```

## 🏗️ Architecture

### Technology Stack
- **Frontend**: React 18+ with TypeScript, Chart.js, i18next
- **Backend**: Node.js with Express.js, TypeScript
- **AI Integration**: OpenAI GPT-4 API
- **Data Storage**: JSON-based databases for static data
- **Testing**: Jest, React Testing Library, Supertest

### Project Structure
```
├── frontend/              # React frontend application
│   ├── src/
│   │   ├── components/    # React components
│   │   ├── hooks/         # Custom React hooks
│   │   ├── i18n/          # Internationalization
│   │   ├── services/      # API and business logic
│   │   └── types/         # TypeScript definitions
│   └── public/            # Static assets
├── backend/               # Node.js backend API
│   ├── src/
│   │   ├── controllers/   # API route handlers
│   │   ├── middleware/    # Express middleware
│   │   ├── services/      # Business logic services
│   │   ├── types/         # TypeScript definitions
│   │   └── utils/         # Utility functions
│   └── data/              # JSON databases
└── docs/                  # Documentation
```

## 🔧 Configuration

### Environment Variables

**Backend (.env):**
```bash
# Required
OPENAI_API_KEY=your_openai_api_key_here

# Optional (with defaults)
PORT=3001
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
WEBHOOK_URL=http://localhost:8080/webhook
WEBHOOK_SECRET=your_webhook_secret_here
```

**Frontend (.env):**
```bash
REACT_APP_API_URL=http://localhost:3001
REACT_APP_ENABLE_SERVICE_WORKER=true
```

## 📊 API Documentation

### Core Endpoints

#### Student Profile Processing
- `POST /api/profile` - Submit student profile and get AI recommendations
- `GET /api/profile/stats` - Get profile processing statistics
- `GET /api/profile/health` - Check AI service health

#### Data Queries
- `GET /api/colleges` - Get all colleges
- `GET /api/careers` - Get all career options
- `GET /api/scholarships` - Get scholarship information
- `GET /api/colleges/search` - Search colleges with filters
- `GET /api/careers/search` - Search careers with filters

#### Analytics
- `GET /api/analytics` - Get career choice analytics
- `GET /api/analytics/dashboard` - Get dashboard data
- `GET /api/analytics/export` - Export analytics data

#### Notifications
- `POST /api/notify` - Send webhook notifications
- `GET /api/notify/test` - Test webhook connectivity
- `GET /api/notify/stats` - Get notification statistics

### Response Format
All API responses follow a consistent structure:
```json
{
  "success": true,
  "data": { ... },
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

## 🌐 Internationalization

The application supports both Hindi and English:

- **Language Detection**: Automatic browser language detection
- **Persistent Preference**: Language choice saved in localStorage
- **Complete Translation**: All UI elements, error messages, and content
- **Cultural Adaptation**: Indian educational context and terminology

## 🔒 Security Features

- **Input Sanitization**: XSS and injection attack prevention
- **Rate Limiting**: API endpoint protection (100 req/15min)
- **CORS Protection**: Environment-based origin control
- **Security Headers**: Comprehensive HTTP security headers
- **Data Privacy**: GDPR-compliant data handling
- **Webhook Security**: HMAC signature validation

## 📈 Performance

### Optimization Features
- **Code Splitting**: Lazy loading for optimal bundle size
- **Caching**: Intelligent caching for database queries and API responses
- **Service Worker**: Offline functionality for static content
- **React Optimizations**: Memoization and performance hooks

### Performance Targets
- **Initial Load**: < 2 seconds
- **API Response**: < 200ms for data queries
- **AI Processing**: < 10 seconds for recommendations
- **Bundle Size**: < 2MB total

## 🧪 Testing

### Test Coverage
- **Unit Tests**: Component and service testing
- **Integration Tests**: End-to-end user journey validation
- **Performance Tests**: Load and response time testing
- **Security Tests**: Vulnerability and penetration testing

### Running Tests
```bash
# Run all tests
npm test

# Run specific test categories
npm run test:unit
npm run test:integration
npm run test:performance

# Generate coverage report
npm run test:coverage
```

## 📚 Documentation

- **[Development Guide](DEVELOPMENT_GUIDE.md)**: Detailed implementation documentation
- **[AWS Deployment Guide](docs/AWS_DEPLOYMENT.md)**: Complete AWS cloud deployment instructions
- **[Performance Guide](docs/PERFORMANCE.md)**: Performance optimization details
- **[Webhook Integration](backend/docs/WEBHOOK_INTEGRATION.md)**: Notification system setup
- **[Error Handling](frontend/src/docs/error-handling-implementation.md)**: Error handling implementation
- **[Integration Tests](frontend/src/tests/integration/README.md)**: End-to-end testing guide

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines
- Follow TypeScript best practices
- Write comprehensive tests for new features
- Maintain code coverage above 80%
- Follow the existing code style and conventions
- Update documentation for significant changes

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👥 Authors

- **Ashish Ranjan Tiwary** - Initial development and architecture

## 🙏 Acknowledgments

- OpenAI for GPT-4 API integration
- National Education Policy 2020 guidelines
- Indian educational institutions for data and insights
- Open source community for tools and libraries

## 📞 Support

For support, questions, or feature requests:
- Create an issue in the GitHub repository
- Check the documentation in the `docs/` directory
- Review the troubleshooting sections in individual guides

---

**Built with ❤️ for Indian students and educators**
