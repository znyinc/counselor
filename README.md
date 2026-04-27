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