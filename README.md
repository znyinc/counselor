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

### Access the Application

- **Frontend (Student Interface)**: http://localhost:3000
- **Backend API**: http://localhost:3001
- **API Health Check**: http://localhost:3001/health

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

## ☁️ Cloud Deployment & Scaling Strategy

### Why the Counselor App Needs LLMs

- **Natural-language intake & Q&A** on curricula, careers, exams
- **Personalized guidance** from student context & local datasets
- **RAG over trusted content** to minimize hallucinations
- **Multilingual support** + structured outputs for reports
- **Human-in-the-loop escalation** for low-confidence responses

### AWS Deployment Strategy

#### Accounts & Network
- **Three accounts** (dev/stage/prod) under Control Tower org
- **VPC-only Bedrock** via VPC endpoints; no public egress
- **Private S3, OpenSearch Serverless, Aurora Serverless v2**

#### Data Layer
- **S3 data lake** (raw/clean/curated) with Lake Formation
- **Aurora** for app data; **DynamoDB** for session state
- **KMS CMKs** for all data; Lake Formation tags for fine-grained access

#### Retrieval (RAG)
- **Curate** NCERT/CBSE/state, ASER/NSSO, policy docs
- **Chunk + embed** with Titan Embeddings; vectors in OpenSearch
- **Automated refresh** with Glue jobs + Step Functions

#### Orchestration
- **API Gateway** → Lambda/ECS backend
- **Step Functions**: intent → profile → RAG → LLM → validate → redact → persist
- **Bedrock Agents** for tool use (calendar, CRM, reporting)

#### Inference
- **Claude 3.5/Opus** for reasoning; fallback Llama 3; Titan for simple tasks
- **Policy-based router** (latency/cost/complexity/PII)
- **Prompt templates** in SSM Parameter Store
- **Prefer RAG**; fine-tune only approved tasks

#### Safety & Compliance
- **Bedrock Guardrails**: blocklists, topic filters, PII redaction
- **Pre-prompt** hash/redact; **post-prompt** validator (schema, toxicity, citations)
- **A2I human review** for low-confidence/high-risk
- **CloudTrail, Config, Audit Manager**; DPR/DSR workflows

#### Observability
- **CloudWatch/X-Ray** for tracing
- **Prompt/response metadata** to OpenSearch; QuickSight KPIs
- **Canary tests** with Synthetics; drift detection via Config

#### CI/CD & IaC
- **CDK/Terraform** mono-repo; CodePipeline with unit/contract/red-team tests
- **Feature flags** via AppConfig; blue/green or canary deployments

#### Tenancy & Access
- **Multi-tenant** via Cognito + org IdP
- **Row/column security** in Lake Formation; ABAC in IAM

#### Resilience & DR
- **Cross-AZ HA**; cross-Region S3 replication, Aurora global DB
- **RTO 15m / RPO ≤1m**; quarterly game-day tests

### Azure Deployment Strategy

#### Subscriptions & Network
- **Separate subscriptions** for dev/test/prod under Azure Management Groups
- **Private networking** with VNets, Private Link, and no public data-plane exposure
- **Azure Storage, Azure AI Search, Azure Database for PostgreSQL Flexible Server** in private subnets

#### Data Layer
- **Azure Data Lake Storage Gen2** for raw/clean/curated data zones
- **PostgreSQL** for application data; **Cosmos DB** for session/profile state where needed
- **Customer-managed keys** in Key Vault and RBAC-based access controls

#### Retrieval (RAG)
- **Curate** NCERT/CBSE/state, ASER/NSSO, policy docs
- **Chunk + embed** with Azure OpenAI embeddings; vectors in Azure AI Search
- **Automated refresh** with Data Factory, Functions, and Logic Apps

#### Orchestration
- **Azure API Management** → Azure Functions / Container Apps backend
- **Durable Functions**: intent → profile → RAG → LLM → validate → redact → persist
- **Azure AI Agents / tool orchestration** for integrations such as CRM, scheduling, and reporting

#### Inference
- **Azure OpenAI** for GPT-based reasoning and generation; model routing by workload type
- **Policy-based router** for latency, cost, complexity, and PII sensitivity
- **Prompt templates** in App Configuration or Key Vault-backed settings
- **Prefer RAG**; fine-tune only for approved and well-governed use cases

#### Safety & Compliance
- **Azure AI Content Safety** and prompt shields for harmful content and prompt injection defense
- **Pre-prompt** redaction; **post-prompt** validation for schema, toxicity, and citations
- **Human review workflows** with Logic Apps / ticketing integrations for low-confidence or high-risk cases
- **Azure Policy, Monitor, Defender for Cloud, and Purview** for governance and compliance

#### Observability
- **Azure Monitor, Application Insights, and Log Analytics** for tracing and telemetry
- **Prompt/response metadata** to Log Analytics or Data Explorer; Power BI dashboards for KPIs
- **Synthetic monitoring** with Application Insights availability tests and policy drift checks

#### CI/CD & IaC
- **Bicep/Terraform** mono-repo; GitHub Actions or Azure DevOps pipelines with unit/contract/red-team tests
- **Feature flags** via App Configuration; blue/green or canary deployments with deployment slots or revision-based rollout

#### Tenancy & Access
- **Multi-tenant** identity via Microsoft Entra ID / External ID
- **RBAC/ABAC** controls and scoped data access for districts, schools, and counselors

#### Resilience & DR
- **Availability zones**, geo-redundant storage, and cross-region failover patterns
- **RTO 15m / RPO ≤1m** targets with regular disaster recovery drills

### Phased Rollout Strategy

#### Phase 0 (2–4 weeks, one board)
- **RAG Q&A** + report generator
- Deploy on either **AWS** or **Azure** with baseline observability and guardrails

#### Phase 1
- Add **profiles, multilingual, counseling workflows, A2I / human review**

#### Phase 2
- **Analytics, career simulations, cost router**

#### Phase 3
- **District scale, offline batch packs, partner integrations**

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

**Built with ❤️ for Indian students and educators**.