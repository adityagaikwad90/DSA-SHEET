import { useState, useMemo } from 'react';
import { motion as Motion, AnimatePresence } from 'framer-motion';
import { useSearchParams } from 'react-router-dom';
import {
  Search, BookOpen, CheckCircle, Clock, CircleDot, ChevronRight,
  Filter, Sparkles, Building2, Code2, ExternalLink, ArrowRight,
  RefreshCw, Check, Layers, Flame, Award, Cpu, Globe, Network,
  Activity, Database, Server, HardDrive, Terminal, SlidersHorizontal,
  Copy, ShieldAlert, Zap, ArrowUpRight, CheckCircle2, ChevronDown,
  Layers as LayersIcon, BookCheck, Radar
} from 'lucide-react';
import interviewArchiveSummary from '../data/interviewArchiveSummary.json';
import systemDesignData from '../data/systemDesignData.json';
import networkingData from '../data/networkingData.json';
import './InterviewHub.css';

const HUB_TABS = [
  { id: 'career-roadmaps', label: 'Career Roadmaps', icon: Layers, badge: '19 Job Paths' },
  { id: 'tech-radar', label: 'Emerging Tech Radar', icon: Radar, badge: '8 Tools to Explore' },
  { id: 'system-design', label: 'System Design', icon: Cpu, badge: 'Awesome Guide' },
  { id: 'networking', label: 'Networking', icon: Globe, badge: '7-Layer OSI' },
  { id: 'archive', label: 'Company Archive', icon: Building2, badge: '500+ Solutions' }
];

const CAREER_ROADMAPS = [
  {
    id: 'devops', title: 'DevOps Engineer', level: 'Core path', summary: 'Build, deploy, operate, and improve reliable software delivery systems.',
    stages: [
      ['Linux & shell', 'Ubuntu, Bash', 'Use the command line, manage processes and permissions, inspect logs, and automate routine server tasks.'],
      ['Networking fundamentals', 'TCP/IP, DNS, HTTP/S, SSH, TLS', 'Understand how requests travel, how services discover each other, and how to diagnose connectivity and name resolution.'],
      ['Git & collaboration', 'Git, GitHub', 'Track changes, work with branches and pull requests, and keep infrastructure and application code reviewable.'],
      ['Scripting', 'Python or Bash', 'Automate repetitive operational work and write small utilities. Choose one language first; Python is a flexible default.'],
      ['Cloud foundations', 'AWS, Azure, or GCP', 'Learn identity and access, virtual networks, compute, storage, load balancing, and managed services in one cloud first.'],
      ['Containers', 'Docker, OCI images', 'Package an application and its runtime consistently, then run it locally and in a server environment.'],
      ['Infrastructure as Code', 'Terraform', 'Provision repeatable cloud infrastructure from version-controlled configuration; learn state and modules.'],
      ['CI/CD', 'GitHub Actions; Jenkins where used', 'Automate build, test, security checks, and releases. Start with one CI platform and learn deployment strategies.'],
      ['Kubernetes', 'Kubernetes, Helm', 'Run and scale containerized workloads; understand deployments, services, config, secrets, ingress, and resource limits.'],
      ['Observability', 'Prometheus, Grafana, Loki/OpenTelemetry', 'Collect metrics, logs, and traces; build dashboards and alerts that help diagnose service health.'],
      ['GitOps & delivery', 'Argo CD', 'Keep desired Kubernetes state in Git and reconcile deployments automatically. Learn after basic Kubernetes and CI/CD.'],
      ['Reliability & security', 'SLOs, incident response, IAM, secrets management', 'Practice safe releases, least privilege, backups, rollback, and clear incident runbooks. These are ongoing practices.']
    ]
  },
  {
    id: 'cloud', title: 'Cloud Engineer', level: 'Core path', summary: 'Design and operate secure, reliable cloud infrastructure.',
    stages: [
      ['Linux & networking', 'Linux, TCP/IP, DNS, HTTP/S', 'Build the foundation for troubleshooting servers and cloud connectivity.'],
      ['Choose one cloud', 'AWS, Azure, or GCP', 'Learn IAM, virtual networks, compute, storage, DNS, load balancers, and managed databases in one provider.'],
      ['Cloud security', 'IAM, KMS, security groups', 'Apply least privilege, encryption, network boundaries, and audit logging.'],
      ['Infrastructure as Code', 'Terraform', 'Create repeatable environments and manage changes through review.'],
      ['Containers & platform basics', 'Docker; Kubernetes is role-dependent', 'Understand application packaging and learn orchestration when the target role uses it.'],
      ['Operations & cost', 'Cloud monitoring, budgets, backups', 'Monitor availability and spend, test recovery, and document operational procedures.']
    ]
  },
  {
    id: 'backend', title: 'Backend Engineer', level: 'Core path', summary: 'Build APIs and services that store data and serve product features reliably.',
    stages: [
      ['Programming foundations', 'Java, Python, Go, JavaScript/TypeScript, or C#', 'Choose one language used in your target market and learn testing, error handling, and concurrency basics.'],
      ['Web & API fundamentals', 'HTTP, REST, JSON, authentication', 'Design endpoints, validate input, handle errors, and understand sessions and tokens.'],
      ['Databases', 'PostgreSQL; Redis as needed', 'Model relational data, write SQL, use indexes and transactions, and learn caching when useful.'],
      ['Testing & code quality', 'Unit, integration, API tests', 'Catch regressions and make service changes safer to review and release.'],
      ['Deployment basics', 'Git, Docker, CI/CD, one cloud', 'Ship a service, configure environments and secrets, and understand logs and health checks.'],
      ['Scale & system design', 'Queues, caching, load balancing', 'Learn reliability and scaling patterns as your projects and target roles require them.']
    ]
  },
  {
    id: 'frontend', title: 'Frontend Engineer', level: 'Core path', summary: 'Create accessible, responsive web applications that work well across devices.',
    stages: [
      ['Web foundations', 'HTML, CSS, JavaScript', 'Build semantic pages, responsive layouts, and interactions before adding a framework.'],
      ['Type-safe application code', 'TypeScript', 'Catch common errors and make larger interfaces easier to change.'],
      ['UI framework', 'React; Next.js where appropriate', 'Build reusable components, manage state, and learn routing and data loading.'],
      ['Browser & accessibility', 'DOM, DevTools, WCAG basics', 'Debug rendering and network issues and make interfaces usable with keyboards and assistive technology.'],
      ['Testing & delivery', 'Vitest/Jest, Playwright, GitHub Actions', 'Test behavior in components and browsers, then automate checks and deployment.'],
      ['Performance & APIs', 'Web Vitals, HTTP, REST/GraphQL', 'Keep pages fast and connect the UI to services safely.']
    ]
  },
  {
    id: 'data', title: 'Data Engineer', level: 'Core path', summary: 'Build dependable systems that collect, transform, and serve data.',
    stages: [
      ['Programming & SQL', 'Python, SQL', 'Use Python for data tasks and SQL to query and model relational data.'],
      ['Data modeling & storage', 'PostgreSQL, warehouse concepts', 'Learn schemas, partitions, dimensional modeling, and data quality checks.'],
      ['Pipelines & orchestration', 'Airflow or a managed equivalent', 'Schedule, retry, monitor, and backfill data workflows.'],
      ['Distributed processing', 'Spark; Kafka for streaming roles', 'Process larger datasets or event streams when the use case needs distributed systems.'],
      ['Cloud data platform', 'AWS, Azure, or GCP; warehouse such as BigQuery/Snowflake', 'Learn the services and warehouse used by your target employers.'],
      ['Testing & operations', 'Git, CI/CD, data observability', 'Version pipelines, validate data contracts, and alert on freshness or quality failures.']
    ]
  },
  {
    id: 'security', title: 'Cybersecurity Engineer', level: 'Core path', summary: 'Protect systems by understanding infrastructure, threats, and practical defensive controls.',
    stages: [
      ['IT foundations', 'Linux, Windows, networking, DNS, HTTP/S', 'Understand the systems and protocols that security teams need to protect.'],
      ['Scripting & Git', 'Python or Bash, Git', 'Automate investigation tasks and safely manage scripts and configuration.'],
      ['Security fundamentals', 'Identity, encryption, threat modeling', 'Learn access control, common attack patterns, secure configuration, and risk-based thinking.'],
      ['Defensive tooling', 'SIEM, endpoint detection, vulnerability scanners', 'Collect and investigate events, prioritize findings, and document response steps.'],
      ['Cloud & application security', 'One cloud IAM model, OWASP Top 10', 'Review permissions and configurations and understand common web application risks.'],
      ['Practice & response', 'Labs, incident runbooks, basic forensics', 'Build hands-on investigation skills in authorized practice environments and learn clear incident handling.']
    ]
  },
  {
    id: 'ai-ml', title: 'AI / Machine Learning Engineer', level: 'AI path', summary: 'Turn data and trained models into tested, useful software features.',
    resources: [{ label: 'PyTorch: Learn the Basics', url: 'https://docs.pytorch.org/tutorials/beginner/basics/intro.html' }],
    stages: [
      ['Programming & math foundations', 'Python, NumPy, linear algebra, probability', 'Write clear Python and build enough statistics and linear algebra to understand model behavior.'],
      ['Data work', 'SQL, pandas, notebooks', 'Collect, clean, explore, and split data carefully; check for leakage and biased samples.'],
      ['Classical machine learning', 'scikit-learn', 'Learn regression, classification, feature engineering, evaluation metrics, and validation before deep learning.'],
      ['Deep learning', 'PyTorch', 'Build and train neural networks; understand tensors, loss functions, optimizers, and GPU basics.'],
      ['Model evaluation', 'Precision/recall, calibration, error analysis', 'Compare models against a simple baseline and inspect failures across important data groups.'],
      ['Serving & monitoring', 'FastAPI, Docker, cloud, model monitoring', 'Expose a model through an API, version it, measure latency and quality, and monitor changing input data.']
    ]
  },
  {
    id: 'genai', title: 'Generative AI Application Engineer', level: 'AI path', summary: 'Build reliable applications around language and multimodal models.',
    resources: [{ label: 'Hugging Face LLM Course', url: 'https://huggingface.co/learn/llm-course/en/chapter1/1' }],
    stages: [
      ['Application programming', 'Python or TypeScript, APIs, Git', 'Build a small service or web app and learn request handling, authentication, and error handling.'],
      ['LLM foundations', 'Tokens, context windows, prompting, model APIs', 'Understand model inputs and outputs, latency, cost, and the limits of generated answers.'],
      ['Retrieval & data grounding', 'Embeddings, vector search, chunking, RAG', 'Connect responses to trusted source material and return citations or retrieved context where appropriate.'],
      ['Tool use & workflows', 'Structured outputs, function calling, agent workflows', 'Let a model call narrowly scoped application functions and validate every action and result.'],
      ['Evaluation & safety', 'Test sets, tracing, prompt injection defenses, PII controls', 'Measure answer quality and failures, protect data, and require human approval for consequential actions.'],
      ['Production delivery', 'Caching, rate limits, observability, cloud deployment', 'Control cost and latency, monitor model and retrieval behavior, and provide fallbacks when providers fail.']
    ]
  },
  {
    id: 'data-scientist', title: 'Data Scientist', level: 'AI & analytics path', summary: 'Use statistics and machine learning to answer questions and support decisions.',
    stages: [
      ['Statistics & Python', 'Python, probability, experimentation', 'Learn distributions, uncertainty, sampling, and how to reason from data rather than anecdotes.'],
      ['Data querying', 'SQL, pandas, notebooks', 'Extract, clean, join, and document datasets; check data quality before analysis.'],
      ['Exploratory analysis', 'Visualization, cohort analysis', 'Find patterns and explain them clearly with charts, assumptions, and limitations.'],
      ['Modeling', 'scikit-learn, supervised and unsupervised learning', 'Build interpretable baselines, select metrics tied to the use case, and avoid data leakage.'],
      ['Experimentation', 'A/B testing, causal inference basics', 'Design experiments, estimate effects, and distinguish correlation from evidence of impact.'],
      ['Communication & delivery', 'Jupyter, dashboards, version control', 'Turn findings into recommendations and collaborate with engineers to operationalize useful models.']
    ]
  },
  {
    id: 'data-analyst', title: 'Data Analyst / BI Analyst', level: 'Analytics path', summary: 'Turn business data into clear metrics, dashboards, and useful decisions.',
    stages: [
      ['Spreadsheet & data basics', 'Excel or Google Sheets, data types, data quality', 'Clean and validate tabular data and learn how business metrics are defined.'],
      ['Querying', 'SQL, joins, aggregations, window functions', 'Retrieve and summarize data from relational databases with repeatable queries.'],
      ['Analysis & statistics', 'Descriptive statistics, cohorts, funnels', 'Compare segments and trends carefully and explain what the data does and does not show.'],
      ['Visualization & BI', 'Power BI or Tableau', 'Build dashboards with clear definitions, useful filters, and charts that answer specific questions.'],
      ['Automation & reproducibility', 'Python/pandas optional, scheduled refreshes', 'Automate repeated reporting and document data sources and transformation steps.'],
      ['Communication & portfolio', 'Business writing, stakeholder questions', 'Present findings with assumptions, recommendations, and measurable next steps.']
    ]
  },
  {
    id: 'mlops', title: 'MLOps Engineer', level: 'AI operations path', summary: 'Automate the lifecycle of training, validating, deploying, and monitoring machine learning systems.',
    resources: [{ label: 'Google Cloud: MLOps architecture', url: 'https://cloud.google.com/architecture/mlops-continuous-delivery-and-automation-pipelines-in-machine-learning' }],
    stages: [
      ['Engineering foundations', 'Python, Git, Linux, testing', 'Write modular code and understand environments, source control, and automated checks.'],
      ['Cloud & containers', 'AWS, Azure, or GCP; Docker', 'Package repeatable training and serving environments and learn one cloud provider’s storage, compute, and identity services.'],
      ['ML workflow basics', 'Datasets, experiments, model evaluation', 'Understand how data, training code, metrics, and model artifacts move through a real ML project.'],
      ['Pipelines & orchestration', 'Kubeflow, MLflow, or managed platform tools', 'Automate repeatable data preparation, training, validation, and model registration. Pick tools used by target employers.'],
      ['CI/CD/CT for ML', 'GitHub Actions, Jenkins, pipeline runners', 'Test code, data schemas, and models; automate pipeline releases and scheduled or triggered retraining.'],
      ['Serving & observability', 'Model registry, API serving, Prometheus/Grafana', 'Deploy approved models and watch latency, errors, input drift, and model quality over time.'],
      ['Governance & rollback', 'Lineage, access controls, approval gates', 'Track which data and code produced each model and make promotion or rollback auditable.']
    ]
  },
  {
    id: 'qa-sdet', title: 'QA Automation Engineer / SDET', level: 'Testing path', summary: 'Design automated checks that give teams fast, trustworthy feedback about software quality.',
    resources: [
      { label: 'Playwright: Getting started', url: 'https://playwright.dev/docs/intro' },
      { label: 'Selenium: Test automation overview', url: 'https://www.selenium.dev/documentation/en/introduction/on_test_automation/' }
    ],
    stages: [
      ['Testing foundations', 'Test design, risk, exploratory testing', 'Learn what to test, how to prioritize risk, and how to write clear reproducible defect reports.'],
      ['Programming & version control', 'Java, JavaScript/TypeScript, or Python; Git', 'Choose one language used by your target teams and build maintainable test code.'],
      ['Unit & API testing', 'JUnit/pytest/Jest, Postman, REST', 'Test business rules and service contracts at layers that run quickly and fail with useful messages.'],
      ['Web end-to-end automation', 'Playwright or Selenium', 'Automate a small set of critical user journeys across browsers; favor stable user-visible checks.'],
      ['Test data & environments', 'Fixtures, mocks, containers', 'Make tests isolated and repeatable, and control dependencies that cause flaky results.'],
      ['CI & reporting', 'GitHub Actions/Jenkins, test reports', 'Run checks on pull requests, publish results, and help teams diagnose failures quickly.']
    ]
  },
  {
    id: 'performance-test', title: 'Performance Test Engineer', level: 'Testing path', summary: 'Find capacity, latency, and reliability limits before users encounter them.',
    resources: [{ label: 'Grafana k6: Load testing websites', url: 'https://grafana.com/docs/k6/latest/testing-guides/load-testing-websites/' }],
    stages: [
      ['Testing & web foundations', 'HTTP, APIs, SQL, Linux basics', 'Understand request flows and how to inspect application and server behavior.'],
      ['Performance concepts', 'Latency percentiles, throughput, concurrency', 'Learn how to define realistic workloads and interpret p95/p99 latency and error rates.'],
      ['Load test scripting', 'k6 or JMeter', 'Write repeatable smoke, average-load, stress, and soak tests with clear pass thresholds.'],
      ['Workload modeling', 'User journeys, test data, ramp patterns', 'Model realistic traffic and use test systems you are authorized to load.'],
      ['Observability & diagnosis', 'Grafana, Prometheus, logs, traces', 'Correlate test results with service metrics to find bottlenecks rather than just report slowdowns.'],
      ['Automation & communication', 'CI pipelines, dashboards, reports', 'Run safe baseline checks in delivery pipelines and explain capacity risks and next steps.']
    ]
  },
  {
    id: 'rpa', title: 'RPA / Business Automation Developer', level: 'Automation path', summary: 'Automate repeatable business processes across desktop apps, web apps, and APIs.',
    resources: [{ label: 'UiPath Studio: Automation projects', url: 'https://docs.uipath.com/studio/standalone/latest/user-guide/about-automation-projects' }],
    stages: [
      ['Process analysis', 'Process maps, exception cases, business rules', 'Understand the full workflow and identify where automation is safe and worthwhile.'],
      ['Workflow programming', 'UiPath, Power Automate, or Python', 'Choose a platform used by target employers and create small, readable automations.'],
      ['UI & API automation', 'Selectors, browser automation, REST APIs', 'Prefer supported APIs when available; use robust selectors and handle changing interfaces carefully.'],
      ['Data & documents', 'Excel/CSV, SQL, OCR where needed', 'Validate inputs and outputs and use document extraction only where the process requires it.'],
      ['Reliability & exceptions', 'Retries, queues, logging, human review', 'Handle timeouts and unexpected cases explicitly; send uncertain or sensitive cases to a person.'],
      ['Deploy & operate', 'Orchestrator, credentials vault, monitoring', 'Publish versioned workflows, protect credentials, and track failures and business outcomes.']
    ]
  },
  {
    id: 'mobile', title: 'Mobile App Engineer', level: 'Application path', summary: 'Build, test, and ship applications for Android and iOS.',
    resources: [{ label: 'Flutter: Learn and build apps', url: 'https://docs.flutter.dev/learn' }],
    stages: [
      ['Choose a platform', 'Kotlin/Android, Swift/iOS, or Dart/Flutter', 'Start with native development for a single platform or Flutter when cross-platform roles fit your goals.'],
      ['Programming & UI basics', 'Language fundamentals, layouts, navigation', 'Build screens that adapt to device sizes and follow platform interaction patterns.'],
      ['App architecture & state', 'MVVM or similar, state management', 'Separate UI, domain logic, and data access so features are testable and maintainable.'],
      ['Networking & local storage', 'HTTP APIs, SQLite, secure storage', 'Handle offline states, loading and errors, and protect sensitive local data.'],
      ['Testing & device quality', 'Unit/UI tests, emulator, Appium', 'Test important flows across devices and OS versions; automate device tests where valuable.'],
      ['Release & monitoring', 'CI, app signing, store release, crash reporting', 'Build signed release artifacts, manage staged rollouts, and learn from crash and performance data.']
    ]
  },
  {
    id: 'sre', title: 'Site Reliability Engineer (SRE)', level: 'Reliability path', summary: 'Improve service reliability through measurement, automation, and operational engineering.',
    stages: [
      ['Systems foundations', 'Linux, networking, DNS, HTTP', 'Troubleshoot services, operating systems, and network paths methodically.'],
      ['Programming & automation', 'Python or Go, Bash, Git', 'Automate recurring operational work and build tools that reduce manual toil.'],
      ['Distributed systems & cloud', 'One cloud, databases, queues, caching', 'Understand failure modes, dependencies, capacity, and how services behave under load.'],
      ['Observability', 'Metrics, logs, traces, Prometheus/Grafana', 'Instrument services and use signals to find user-facing problems quickly.'],
      ['Reliability practices', 'SLIs, SLOs, error budgets, incident response', 'Set measurable reliability targets, respond to incidents, and turn findings into system improvements.'],
      ['Delivery & resilience', 'CI/CD, Terraform, Kubernetes as needed', 'Make safe releases routine and practice rollback, backups, and recovery scenarios.']
    ]
  },
  {
    id: 'platform', title: 'Platform Engineer', level: 'Infrastructure path', summary: 'Build internal tools and self-service platforms that help product teams ship safely.',
    resources: [{ label: 'CNCF: Platform engineering glossary', url: 'https://tag-app-delivery.cncf.io/wgs/platforms/glossary/' }],
    stages: [
      ['Software & operations foundations', 'Linux, Git, scripting, networking', 'Build enough application and infrastructure knowledge to understand developer workflows.'],
      ['Cloud & IaC', 'AWS/Azure/GCP, Terraform', 'Create reusable, reviewed infrastructure building blocks for teams.'],
      ['Containers & orchestration', 'Docker, Kubernetes, Helm', 'Operate a platform for deploying and managing workloads with clear security boundaries.'],
      ['Developer experience', 'Service templates, CLI, Backstage or similar', 'Offer self-service workflows and documentation that reduce setup and handoff work.'],
      ['Platform delivery', 'GitOps, CI/CD, Argo CD', 'Automate consistent build and deployment paths while keeping teams able to understand and control releases.'],
      ['Security & operations', 'IAM, secrets, observability, SLOs', 'Provide secure defaults, platform health signals, support paths, and ongoing improvements based on developer needs.']
    ]
  },
  {
    id: 'devsecops', title: 'DevSecOps Engineer', level: 'Security & delivery path', summary: 'Build security checks and controls into software delivery and cloud operations.',
    stages: [
      ['Engineering foundations', 'Linux, Git, scripting, networking', 'Understand code, operating systems, and common service communication paths.'],
      ['Cloud & identity security', 'One cloud IAM model, secrets, encryption', 'Learn least privilege, secure defaults, key handling, and audit trails.'],
      ['Secure development', 'OWASP Top 10, threat modeling, code review', 'Identify common application risks early and recommend practical mitigations.'],
      ['Pipeline security', 'SAST, dependency scanning, secret scanning, IaC scanning', 'Add actionable checks to CI and manage findings without overwhelming developers.'],
      ['Container & runtime controls', 'Docker, Kubernetes, admission policies', 'Reduce image risk, limit workload permissions, and apply appropriate runtime policies.'],
      ['Response & governance', 'SIEM, vulnerability management, incident runbooks', 'Prioritize remediation, track exceptions, and support a clear response process.']
    ]
  },
  {
    id: 'industrial-automation', title: 'Industrial Automation Engineer', level: 'Automation path', summary: 'Automate machines and production processes using control systems and industrial networks.',
    stages: [
      ['Electrical & control foundations', 'Sensors, actuators, relays, control loops', 'Understand how physical signals are measured and how control decisions affect equipment.'],
      ['PLC programming', 'IEC 61131-3 concepts, ladder logic, structured text', 'Write and test control logic for programmable controllers using the platform common in your industry.'],
      ['Industrial communication', 'Modbus, PROFINET, OPC UA', 'Connect controllers, drives, sensors, and supervisory systems safely and reliably.'],
      ['HMI & SCADA', 'HMI screens, alarms, historian systems', 'Give operators clear process visibility and useful alarms without overwhelming them.'],
      ['Safety & commissioning', 'Risk assessment, interlocks, test plans', 'Validate behavior in a controlled environment and follow site safety and change procedures.'],
      ['Data & maintenance', 'Historian data, Python/SQL, predictive maintenance basics', 'Use production data to identify downtime patterns and support maintenance decisions.']
    ]
  }
];

const TECH_RADAR_CATEGORIES = ['All topics', 'Automation', 'AI building', 'Agent connections', 'Local AI', 'AI quality'];

const TRENDING_TOOLS = [
  {
    name: 'n8n', category: 'Automation', signal: 'Hands-on workflow automation',
    summary: 'Visual workflow automation that connects APIs and apps, with code steps and AI nodes when needed. Good for learning how to combine deterministic steps with a model call.',
    explore: 'Build an email or form triage flow: validate input → classify with an LLM → require human approval → write the result to a test table.',
    links: [
      { label: 'Official docs', url: 'https://docs.n8n.io/' },
      { label: 'Reddit: n8n AI workflow discussion', url: 'https://www.reddit.com/r/n8n/comments/1xq8e68/how_have_you_been_using_ai_while_building_in_n8n/' }
    ]
  },
  {
    name: 'Workato', category: 'Automation', signal: 'Enterprise integration & governance',
    summary: 'Enterprise integration and automation platform for connecting business systems, APIs, and governed AI agent workflows. Explore it to understand how automation changes when permissions, audit trails, and approvals matter.',
    explore: 'Map one business process across two systems, then identify required access controls, approval points, retries, and audit events.',
    links: [
      { label: 'Official Agentic docs', url: 'https://docs.workato.com/agentic/agentic.html' },
      { label: 'Official MCP FAQ', url: 'https://docs.workato.com/en/agentic/faqs.html' }
    ]
  },
  {
    name: 'Model Context Protocol (MCP)', category: 'Agent connections', signal: 'An open integration protocol',
    summary: 'A standard way for AI applications to connect to tools and data sources. Learn clients, servers, tool permissions, authentication, and how to keep tool access narrow.',
    explore: 'Create a read-only MCP server for a small local dataset, connect one client, and inspect exactly what data and actions the server exposes.',
    links: [
      { label: 'Official introduction', url: 'https://modelcontextprotocol.io/docs/getting-started/intro' },
      { label: 'Reddit: MCP use cases', url: 'https://www.reddit.com/r/AI_Agents/comments/1rvjo5i/anyone_using_mcp_servers_for_anything_beyond_chat/' }
    ]
  },
  {
    name: 'Emergent', category: 'AI building', signal: 'AI app prototyping',
    summary: 'An AI app builder that turns a written product idea into a working app preview. Useful for exploring rapid prototyping, while still reviewing generated code, permissions, data handling, and deployment before real use.',
    explore: 'Prototype a small CRUD app with login and a database; inspect the generated code and test validation, access control, and failure cases.',
    links: [
      { label: 'Official help center', url: 'https://help.emergent.sh/' },
      { label: 'Reddit: lessons from AI app builders', url: 'https://www.reddit.com/r/nocode/comments/1xhqmwa/i_stopped_asking_ai_to_build_my_app_for_4_weeks/' }
    ]
  },
  {
    name: 'AI coding agents', category: 'AI building', signal: 'Active developer-tool discussion',
    summary: 'Tools such as Claude Code, Cursor, and other IDE or terminal agents can inspect a project and help make multi-file changes. The durable skill is directing, reviewing, and validating changes—not memorizing one product.',
    explore: 'Give an agent a small issue in a sample repository, ask it to explain its plan, review the diff, run checks, and reject changes you cannot explain.',
    links: [
      { label: 'Claude Code docs', url: 'https://docs.anthropic.com/en/docs/claude-code/overview' },
      { label: 'Reddit: coding tool discussion', url: 'https://www.reddit.com/r/vibecoding/comments/1revk82/what_ai_toolsplatforms_are_you_actually_using_for/' }
    ]
  },
  {
    name: 'Ollama + local models', category: 'Local AI', signal: 'Local inference experimentation',
    summary: 'Run supported open models on your own machine and connect them to local apps. This is useful for learning model serving and privacy trade-offs; speed and quality depend on model size and hardware.',
    explore: 'Run a small local model and build a private document Q&A demo with a few non-sensitive sample files; compare its latency and answer quality with a hosted model.',
    links: [
      { label: 'Ollama docs', url: 'https://docs.ollama.com/' },
      { label: 'Reddit: local model setups', url: 'https://www.reddit.com/r/LocalLLaMA/comments/1smeyc6/using_locally_hosted_llms_for_the_workplace/' }
    ]
  },
  {
    name: 'LangGraph', category: 'Agent connections', signal: 'Stateful agent workflows',
    summary: 'A framework for defining multi-step, stateful AI workflows with explicit nodes, transitions, and human input. Explore it when a simple prompt chain is not enough and the process needs controlled branching.',
    explore: 'Build a support-ticket workflow with classify → retrieve → draft response → human review, and make each state and transition visible.',
    links: [
      { label: 'LangGraph learning docs', url: 'https://docs.langchain.com/oss/python/learn' },
      { label: 'Reddit: agent workflow discussion', url: 'https://www.reddit.com/r/AI_Agents/comments/1rvjo5i/anyone_using_mcp_servers_for_anything_beyond_chat/' }
    ]
  },
  {
    name: 'Langfuse', category: 'AI quality', signal: 'Testing and observing AI apps',
    summary: 'Open platform for tracing AI application steps and evaluating outputs. Useful because AI features need checks for answer quality, cost, and latency in addition to normal software tests.',
    explore: 'Trace a small RAG or chatbot demo, create a fixed set of test questions, and compare output quality and latency after a prompt or model change.',
    links: [
      { label: 'Official evaluation docs', url: 'https://langfuse.com/docs/evaluation/overview' },
      { label: 'Official docs', url: 'https://langfuse.com/docs' }
    ]
  }
];

const InterviewHub = ({ defaultTab = 'career-roadmaps' }) => {
  const [searchParams, setSearchParams] = useSearchParams();

  // Active Main Hub Tab
  const tabFromQuery = searchParams.get('tab');
  const getInitialTab = () => {
    if (tabFromQuery === 'archive') return 'archive';
    if (tabFromQuery === 'dsa' || tabFromQuery === 'patterns') return 'career-roadmaps';
    if (['career-roadmaps', 'tech-radar', 'system-design', 'networking', 'archive'].includes(tabFromQuery)) return tabFromQuery;
    return ['system-design', 'networking', 'archive'].includes(defaultTab) ? defaultTab : 'career-roadmaps';
  };
  const [activeTab, setActiveTab] = useState(getInitialTab());
  const [selectedRoadmap, setSelectedRoadmap] = useState('devops');
  const [radarCategory, setRadarCategory] = useState('All topics');

  // 2. System Design Tab state
  const [sysCategory, setSysCategory] = useState('all');
  const [sysDifficulty, setSysDifficulty] = useState('all');
  const [activeCodeModal, setActiveCodeModal] = useState(null);

  // 3. Networking Tab state
  const [activeOsiLayer, setActiveOsiLayer] = useState(7);

  // 4. Archive Tab state
  const [archiveSearch, setArchiveSearch] = useState('');
  const [selectedCompany, setSelectedCompany] = useState(
    interviewArchiveSummary?.companies?.[0]?.name || 'google'
  );
  const [activeSolutionModal, setActiveSolutionModal] = useState(null);

  // Tab change handler
  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    setSearchParams({ tab: tabId });
  };

  // Filtered Company solutions
  const companySolutionsList = useMemo(() => {
    const list = interviewArchiveSummary?.companySolutions?.[selectedCompany] || [];
    if (!archiveSearch.trim()) return list;
    const q = archiveSearch.toLowerCase();
    return list.filter((s) => s.title.toLowerCase().includes(q) || s.fileName.toLowerCase().includes(q));
  }, [selectedCompany, archiveSearch]);

  // Filtered System Design Problems
  const filteredSysProblems = useMemo(() => {
    let list = systemDesignData.interviewProblems || [];
    if (sysDifficulty !== 'all') {
      list = list.filter((p) => p.difficulty.toLowerCase() === sysDifficulty.toLowerCase());
    }
    return list;
  }, [sysDifficulty]);

  return (
    <div className="interview-hub-container">
      {/* Hero Header */}
      <Motion.section
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="interview-hub-hero"
      >
        <div className="hero-content">
          <div className="hero-badge">
            <Sparkles size={16} />
            <span>Complete Engineering Interview Suite</span>
          </div>
          <h1 className="hero-title">
            Interview <span className="gradient-highlight">Mastery Hub</span>
          </h1>
          <p className="hero-subtitle">
            Explore practical role roadmaps, interview system design, networking fundamentals, and company interview solutions in one place.
          </p>

          {/* Quick Metrics Bar */}
          <div className="hero-metrics">
            <div className="metric-item">
              <span className="metric-number">{CAREER_ROADMAPS.length}</span>
              <span className="metric-label">Career Paths</span>
            </div>
            <div className="metric-divider" />
            <div className="metric-item">
              <span className="metric-number">50+</span>
              <span className="metric-label">Tools & Skills</span>
            </div>
            <div className="metric-divider" />
            <div className="metric-item">
              <span className="metric-number">7</span>
              <span className="metric-label">OSI Layers</span>
            </div>
            <div className="metric-divider" />
            <div className="metric-item">
              <span className="metric-number">{interviewArchiveSummary.totalCompanies || 15}</span>
              <span className="metric-label">Companies</span>
            </div>
          </div>
        </div>

      </Motion.section>

      {/* Main Hub Tabs Navigation */}
      <div className="hub-tabs-container">
        {HUB_TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              className={`hub-tab-btn ${isActive ? 'active' : ''}`}
              onClick={() => handleTabChange(tab.id)}
            >
              <Icon size={18} />
              <span>{tab.label}</span>
              <span className="tab-pill-badge">{tab.badge}</span>
            </button>
          );
        })}
      </div>

      {/* Career roadmaps */}
      {activeTab === 'career-roadmaps' && (
        <Motion.div
          key="career-roadmaps-tab"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
          className="career-roadmaps-section"
        >
          <div className="roadmap-intro">
            <div>
              <span className="roadmap-kicker">Choose a role</span>
              <h2>Career Roadmaps</h2>
              <p>Follow the foundations first, then add the tools commonly used in that role. Pick one cloud provider and one tool in each category to start.</p>
            </div>
          </div>
          <div className="roadmap-role-list" role="tablist" aria-label="Career roles">
            {CAREER_ROADMAPS.map((roadmap) => (
              <button key={roadmap.id} role="tab" aria-selected={selectedRoadmap === roadmap.id}
                className={`roadmap-role-btn ${selectedRoadmap === roadmap.id ? 'active' : ''}`}
                onClick={() => setSelectedRoadmap(roadmap.id)}>
                {roadmap.title}
              </button>
            ))}
          </div>
          {CAREER_ROADMAPS.filter((roadmap) => roadmap.id === selectedRoadmap).map((roadmap) => (
            <section className="roadmap-detail" key={roadmap.id}>
              <div className="roadmap-detail-heading">
                <div><span className="roadmap-kicker">{roadmap.level}</span><h3>{roadmap.title}</h3></div>
                <p>{roadmap.summary}</p>
              </div>
              <ol className="roadmap-flow">
                {roadmap.stages.map(([name, tools, description], index) => (
                  <li className="roadmap-step" key={name}>
                    <span className="roadmap-step-number">{String(index + 1).padStart(2, '0')}</span>
                    <div className="roadmap-step-content">
                      <div className="roadmap-step-title"><h4>{name}</h4><span>{tools}</span></div>
                      <p>{description}</p>
                    </div>
                  </li>
                ))}
              </ol>
              {roadmap.resources?.length > 0 && (
                <div className="roadmap-resources">
                  <h4>Official learning resources</h4>
                  <div>
                    {roadmap.resources.map((resource) => (
                      <a key={resource.url} href={resource.url} target="_blank" rel="noreferrer">
                        {resource.label}<ExternalLink size={14} />
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </section>
          ))}
        </Motion.div>
      )}

      {activeTab === 'tech-radar' && (
        <Motion.div
          key="tech-radar-tab"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
          className="tech-radar-section"
        >
          <div className="tech-radar-heading">
            <div>
              <span className="roadmap-kicker">Explore what’s gaining attention</span>
              <h2>Emerging Tech Radar</h2>
              <p>Tools and ideas worth trying, with a small project to help you learn by building. This is a discovery list, not a ranking of job demand.</p>
            </div>
            <span className="radar-updated">Web + Reddit scan · Nov 21, 2026</span>
          </div>

          <aside className="community-pulse">
            <div><strong>Community pulse</strong><p>Recent Reddit threads discuss using n8n with AI and MCP, experimenting with coding agents, and keeping AI-built apps manageable by shipping in small steps. Treat these as practitioner anecdotes; verify tools against official docs and your own experiments.</p></div>
            <div className="community-pulse-links">
              <a href="https://www.reddit.com/r/n8n/comments/1xq8e68/how_have_you_been_using_ai_while_building_in_n8n/" target="_blank" rel="noreferrer">n8n + AI <ExternalLink size={13} /></a>
              <a href="https://www.reddit.com/r/vibecoding/comments/1revk82/what_ai_toolsplatforms_are_you_actually_using_for/" target="_blank" rel="noreferrer">Coding agents <ExternalLink size={13} /></a>
              <a href="https://www.reddit.com/r/nocode/comments/1xhqmwa/i_stopped_asking_ai_to_build_my_app_for_4_weeks/" target="_blank" rel="noreferrer">AI app building lessons <ExternalLink size={13} /></a>
            </div>
          </aside>

          <div className="radar-category-list" aria-label="Filter emerging technology topics">
            {TECH_RADAR_CATEGORIES.map((category) => (
              <button key={category} className={`radar-category-btn ${radarCategory === category ? 'active' : ''}`} onClick={() => setRadarCategory(category)}>
                {category}
              </button>
            ))}
          </div>

          <div className="tech-radar-grid">
            {TRENDING_TOOLS.filter((tool) => radarCategory === 'All topics' || tool.category === radarCategory).map((tool) => (
              <article className="tech-radar-card" key={tool.name}>
                <div className="tech-radar-card-top">
                  <span className="radar-category-tag">{tool.category}</span>
                  <span className="radar-signal-tag">{tool.signal}</span>
                </div>
                <h3>{tool.name}</h3>
                <p className="radar-summary">{tool.summary}</p>
                <div className="radar-explore"><strong>Try this</strong><p>{tool.explore}</p></div>
                <div className="radar-links">
                  {tool.links.map((link) => (
                    <a key={link.url} href={link.url} target="_blank" rel="noreferrer">{link.label}<ExternalLink size={13} /></a>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </Motion.div>
      )}

      {/* =========================================================================
          SECTION 2: SYSTEM DESIGN MASTERY (From awesome-system-design-resources)
          ========================================================================= */}
      {activeTab === 'system-design' && (
        <Motion.div
          key="system-design-tab"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
          className="system-design-hub"
        >
          {/* Framework Banner */}
          <div className="framework-hero-card">
            <div className="framework-header">
              <div className="framework-badge">
                <Sparkles size={15} />
                <span>Interview Blueprint</span>
              </div>
              <h2 className="framework-title">{systemDesignData.framework.title}</h2>
              <p className="framework-subtitle">
                Master this structured 4-step blueprint during your technical architecture interviews to ensure clarity, thoroughness, and seniority signals.
              </p>
            </div>

            <div className="framework-steps-grid">
              {systemDesignData.framework.steps.map((st) => (
                <div key={st.step} className="framework-step-card">
                  <span className="step-num-badge">STEP 0{st.step}</span>
                  <h4 className="step-title">{st.title}</h4>
                  <p className="step-desc">{st.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Controls & Filter Bar */}
          <div className="sys-controls-bar">
            <div className="sys-category-pills">
              {[
                { id: 'all', label: 'All Resources', icon: Layers },
                { id: 'core', label: 'Core Concepts', icon: Cpu },
                { id: 'databases', label: 'Databases', icon: Database },
                { id: 'caching', label: 'Caching & CDN', icon: Zap },
                { id: 'async', label: 'Async & Queues', icon: Activity },
                { id: 'problems', label: 'Classic Problems', icon: Code2 },
                { id: 'case-studies', label: 'Engineering Reads', icon: BookOpen }
              ].map((c) => {
                const PillIcon = c.icon;
                return (
                  <button
                    key={c.id}
                    onClick={() => setSysCategory(c.id)}
                    className={`sys-pill-btn ${sysCategory === c.id ? 'active' : ''}`}
                  >
                    <PillIcon size={14} className="sys-pill-icon" aria-hidden="true" />
                    <span>{c.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2A: Core Architectural Concepts */}
          {(sysCategory === 'all' || sysCategory === 'core') && (
            <section className="sys-section-block">
              <div className="section-title-wrap">
                <Cpu size={20} className="section-icon text-teal" />
                <h3>Core Distributed Architecture Concepts</h3>
              </div>
              <div className="sys-concepts-grid">
                {systemDesignData.coreConcepts.map((item) => (
                  <div key={item.id} className="sys-concept-card">
                    <div className="concept-card-top">
                      <span className="concept-badge">{item.badge}</span>
                      {item.hasCode && (
                        <button
                          onClick={() =>
                            setActiveCodeModal({
                              title: `${item.title} - Implementation`,
                              code: item.codeSnippet,
                              lang: 'python'
                            })
                          }
                          className="code-preview-pill"
                        >
                          <Code2 size={13} /> View Code
                        </button>
                      )}
                    </div>
                    <h4 className="concept-title">{item.title}</h4>
                    <p className="concept-summary">{item.summary}</p>
                    <p className="concept-details">{item.details}</p>

                    <div className="concept-key-points">
                      {item.keyPoints.map((kp, idx) => (
                        <div key={idx} className="kp-row">
                          <CheckCircle2 size={14} className="kp-check" />
                          <span>{kp}</span>
                        </div>
                      ))}
                    </div>

                    <a
                      href={item.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="concept-external-link"
                    >
                      <span>Deep Dive Article</span>
                      <ArrowUpRight size={14} />
                    </a>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* 2B: Database & Storage Fundamentals */}
          {(sysCategory === 'all' || sysCategory === 'databases') && (
            <section className="sys-section-block">
              <div className="section-title-wrap">
                <Database size={20} className="section-icon text-amber" />
                <h3>Database Scaling & Storage Architectures</h3>
              </div>
              <div className="sys-concepts-grid">
                {systemDesignData.databaseFundamentals.map((item) => (
                  <div key={item.id} className="sys-concept-card">
                    <span className="concept-badge db-badge">{item.category}</span>
                    <h4 className="concept-title">{item.title}</h4>
                    <p className="concept-summary">{item.summary}</p>
                    <p className="concept-details">{item.details}</p>

                    <div className="concept-key-points">
                      {item.keyPoints.map((kp, idx) => (
                        <div key={idx} className="kp-row">
                          <CheckCircle2 size={14} className="kp-check" />
                          <span>{kp}</span>
                        </div>
                      ))}
                    </div>

                    <a
                      href={item.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="concept-external-link"
                    >
                      <span>Read Guide</span>
                      <ArrowUpRight size={14} />
                    </a>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* 2C: Caching & Content Delivery */}
          {(sysCategory === 'all' || sysCategory === 'caching') && (
            <section className="sys-section-block">
              <div className="section-title-wrap">
                <Zap size={20} className="section-icon text-cyan" />
                <h3>Caching Fundamentals & Global CDNs</h3>
              </div>
              <div className="sys-concepts-grid">
                {systemDesignData.cachingFundamentals.map((item) => (
                  <div key={item.id} className="sys-concept-card">
                    <span className="concept-badge cache-badge">{item.category}</span>
                    <h4 className="concept-title">{item.title}</h4>
                    <p className="concept-summary">{item.summary}</p>
                    <p className="concept-details">{item.details}</p>

                    <div className="concept-key-points">
                      {item.keyPoints.map((kp, idx) => (
                        <div key={idx} className="kp-row">
                          <CheckCircle2 size={14} className="kp-check" />
                          <span>{kp}</span>
                        </div>
                      ))}
                    </div>

                    <a
                      href={item.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="concept-external-link"
                    >
                      <span>Read Guide</span>
                      <ArrowUpRight size={14} />
                    </a>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* 2D: Async, Queues & Microservices */}
          {(sysCategory === 'all' || sysCategory === 'async') && (
            <section className="sys-section-block">
              <div className="section-title-wrap">
                <Server size={20} className="section-icon text-purple" />
                <h3>Asynchronous Systems & Microservice Resilience</h3>
              </div>
              <div className="sys-concepts-grid">
                {systemDesignData.asyncAndMicroservices.map((item) => (
                  <div key={item.id} className="sys-concept-card">
                    <div className="concept-card-top">
                      <span className="concept-badge async-badge">{item.category}</span>
                      {item.hasCode && (
                        <button
                          onClick={() =>
                            setActiveCodeModal({
                              title: `${item.title} - Implementation`,
                              code: item.codeSnippet,
                              lang: 'python'
                            })
                          }
                          className="code-preview-pill"
                        >
                          <Code2 size={13} /> View Code
                        </button>
                      )}
                    </div>
                    <h4 className="concept-title">{item.title}</h4>
                    <p className="concept-summary">{item.summary}</p>
                    <p className="concept-details">{item.details}</p>

                    <div className="concept-key-points">
                      {item.keyPoints.map((kp, idx) => (
                        <div key={idx} className="kp-row">
                          <CheckCircle2 size={14} className="kp-check" />
                          <span>{kp}</span>
                        </div>
                      ))}
                    </div>

                    <a
                      href={item.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="concept-external-link"
                    >
                      <span>Read Guide</span>
                      <ArrowUpRight size={14} />
                    </a>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* 2E: Classic System Design Interview Problems */}
          {(sysCategory === 'all' || sysCategory === 'problems') && (
            <section className="sys-section-block">
              <div className="section-title-wrap">
                <Layers size={20} className="section-icon text-orange" />
                <h3>Classic System Design Problems Library</h3>
              </div>

              {/* Problem Difficulty Filter */}
              <div className="problem-difficulty-filter">
                {['all', 'Easy', 'Medium', 'Hard'].map((diff) => (
                  <button
                    key={diff}
                    onClick={() => setSysDifficulty(diff)}
                    className={`diff-filter-btn ${sysDifficulty === diff ? 'active' : ''}`}
                  >
                    {diff === 'all' ? 'All Difficulties' : diff}
                  </button>
                ))}
              </div>

              <div className="sys-problems-grid">
                {filteredSysProblems.map((prob) => (
                  <div key={prob.id} className="sys-problem-card">
                    <div className="problem-top-row">
                      <span className={`diff-pill diff-${prob.difficulty.toLowerCase()}`}>
                        {prob.difficulty}
                      </span>
                      <span className="scale-metric">Scale: {prob.scale.split(',')[0]}</span>
                    </div>

                    <h4 className="problem-title">{prob.title}</h4>
                    <p className="problem-desc">{prob.description}</p>

                    <div className="problem-topics-wrap">
                      {prob.topics.map((t, idx) => (
                        <span key={idx} className="topic-tag">{t}</span>
                      ))}
                    </div>

                    <div className="key-components-box">
                      <span className="components-label">KEY ARCHITECTURE BLOCKS:</span>
                      <ul>
                        {prob.keyComponents.map((kc, idx) => (
                          <li key={idx}>{kc}</li>
                        ))}
                      </ul>
                    </div>

                    <a
                      href={prob.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="design-solution-btn"
                    >
                      <span>Study System Architecture</span>
                      <ArrowUpRight size={15} />
                    </a>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* 2F: Must-Read Real-World Engineering Case Studies */}
          {(sysCategory === 'all' || sysCategory === 'case-studies') && (
            <section className="sys-section-block">
              <div className="section-title-wrap">
                <BookOpen size={20} className="section-icon text-teal" />
                <h3>Must-Read Production Engineering Case Studies</h3>
              </div>

              <div className="engineering-articles-grid">
                {systemDesignData.mustReadEngineering.map((art, idx) => (
                  <a
                    key={idx}
                    href={art.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="engineering-article-card"
                  >
                    <div className="article-company-badge">{art.company}</div>
                    <h4 className="article-title">{art.title}</h4>
                    <p className="article-desc">{art.desc}</p>
                    <span className="read-article-action">
                      Read Engineering Blog <ExternalLink size={13} />
                    </span>
                  </a>
                ))}
              </div>
            </section>
          )}

          {/* Code Viewer Modal */}
          {activeCodeModal && (
            <div className="code-modal-overlay" onClick={() => setActiveCodeModal(null)}>
              <div className="code-modal-container" onClick={(e) => e.stopPropagation()}>
                <div className="code-modal-header">
                  <div>
                    <span className="modal-company-tag">SYSTEM DESIGN ALGORITHM</span>
                    <h3 className="modal-title">{activeCodeModal.title}</h3>
                  </div>
                  <button className="modal-close-btn" onClick={() => setActiveCodeModal(null)}>
                    ×
                  </button>
                </div>
                <div className="code-modal-body">
                  <pre className="java-code-pre">
                    <code>{activeCodeModal.code}</code>
                  </pre>
                </div>
                <div className="code-modal-footer">
                  <button
                    className="copy-code-action-btn"
                    onClick={() => {
                      navigator.clipboard.writeText(activeCodeModal.code);
                      alert('Code copied to clipboard!');
                    }}
                  >
                    <Copy size={16} /> Copy Implementation
                  </button>
                </div>
              </div>
            </div>
          )}
        </Motion.div>
      )}

      {/* =========================================================================
          SECTION 3: COMPUTER NETWORKING MASTERY
          ========================================================================= */}
      {activeTab === 'networking' && (
        <Motion.div
          key="networking-tab"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
          className="networking-hub"
        >
          {/* 3A: Interactive 7-Layer OSI Model */}
          <section className="network-section-block">
            <div className="section-title-wrap">
              <Network size={20} className="section-icon text-cyan" />
              <h3>The 7-Layer OSI Model vs TCP/IP Stack</h3>
            </div>
            <p className="section-intro">
              Click any layer to inspect its Packet Data Unit (PDU), foundational protocols, and exact role in network traversal.
            </p>

            <div className="osi-interactive-layout">
              {/* Left: Layer Selector Stack */}
              <div className="osi-stack-column">
                {networkingData.osiLayers.map((layer) => {
                  const isSelected = activeOsiLayer === layer.layer;
                  return (
                    <button
                      key={layer.layer}
                      onClick={() => setActiveOsiLayer(layer.layer)}
                      className={`osi-layer-pill ${isSelected ? 'active' : ''}`}
                    >
                      <span className="osi-layer-num">L{layer.layer}</span>
                      <span className="osi-layer-name">{layer.name}</span>
                      <span className="osi-pdu-badge">{layer.pdu}</span>
                    </button>
                  );
                })}
              </div>

              {/* Right: Selected Layer Deep Dive Card */}
              <div className="osi-detail-card">
                {(() => {
                  const layer = networkingData.osiLayers.find((l) => l.layer === activeOsiLayer);
                  if (!layer) return null;
                  return (
                    <div>
                      <div className="osi-card-top">
                        <span className="osi-layer-badge">LAYER {layer.layer}</span>
                        <h2 className="osi-card-title">{layer.name} Layer</h2>
                        <span className="osi-pdu-large">PDU: {layer.pdu}</span>
                      </div>

                      <p className="osi-card-summary">{layer.summary}</p>
                      <p className="osi-card-details">{layer.details}</p>

                      <div className="osi-protocols-box">
                        <span className="protocols-title">PRIMARY PROTOCOLS:</span>
                        <div className="protocols-tags">
                          {layer.protocols.map((p, idx) => (
                            <span key={idx} className="proto-pill">{p}</span>
                          ))}
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>
          </section>

          {/* 3B: Transport Layer Arena (TCP vs UDP) */}
          <section className="network-section-block">
            <div className="section-title-wrap">
              <Activity size={20} className="section-icon text-purple" />
              <h3>Transport Layer: TCP vs UDP Deep Dive</h3>
            </div>

            <div className="tcp-udp-comparison-grid">
              {/* TCP Card */}
              <div className="protocol-arena-card tcp-card">
                <div className="arena-card-header">
                  <span className="proto-name">TCP</span>
                  <span className="proto-sub">Connection-Oriented & Reliable</span>
                </div>
                <ul className="proto-features-list">
                  {networkingData.transportProtocols[0].tcp.features.map((f, idx) => (
                    <li key={idx}>
                      <CheckCircle2 size={15} className="feature-check text-teal" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* UDP Card */}
              <div className="protocol-arena-card udp-card">
                <div className="arena-card-header">
                  <span className="proto-name">UDP</span>
                  <span className="proto-sub">Connectionless & Ultra-Fast</span>
                </div>
                <ul className="proto-features-list">
                  {networkingData.transportProtocols[0].udp.features.map((f, idx) => (
                    <li key={idx}>
                      <CheckCircle2 size={15} className="feature-check text-amber" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Handshake & Termination Flow */}
            <div className="handshake-flow-card">
              <h4 className="flow-card-title">TCP 3-Way Handshake & 4-Way Termination</h4>
              <div className="handshake-steps-columns">
                <div className="flow-step-col">
                  <span className="flow-col-heading">ESTABLISHMENT (3-Way):</span>
                  <ol>
                    {networkingData.transportProtocols[1].handshakeSteps.map((st, idx) => (
                      <li key={idx}>{st}</li>
                    ))}
                  </ol>
                </div>
                <div className="flow-step-col">
                  <span className="flow-col-heading">TERMINATION (4-Way):</span>
                  <ol>
                    {networkingData.transportProtocols[1].terminationSteps.map((st, idx) => (
                      <li key={idx}>{st}</li>
                    ))}
                  </ol>
                </div>
              </div>
            </div>
          </section>

          {/* 3C: DNS Resolution Journey */}
          <section className="network-section-block">
            <div className="section-title-wrap">
              <Globe size={20} className="section-icon text-teal" />
              <h3>The Step-by-Step DNS Resolution Process</h3>
            </div>
            <p className="section-intro">{networkingData.dnsJourney.summary}</p>

            <div className="dns-steps-timeline">
              {networkingData.dnsJourney.steps.map((st) => (
                <div key={st.step} className="dns-step-card">
                  <div className="dns-step-num">{st.step}</div>
                  <h4 className="dns-step-name">{st.name}</h4>
                  <p className="dns-step-desc">{st.desc}</p>
                </div>
              ))}
            </div>
          </section>

          {/* 3D: Web Protocols & Real-Time Communication */}
          <section className="network-section-block">
            <div className="section-title-wrap">
              <Zap size={20} className="section-icon text-amber" />
              <h3>Web Protocols (HTTP/1.1 vs HTTP/2 vs HTTP/3) & Real-time APIs</h3>
            </div>

            {/* HTTP Evolution Cards */}
            <div className="http-versions-grid">
              {networkingData.webProtocols[0].items.map((it, idx) => (
                <div key={idx} className="http-version-card">
                  <span className="http-badge">{it.version.split(' ')[0]}</span>
                  <h4 className="http-ver-title">{it.version}</h4>
                  <p className="http-ver-desc">{it.details}</p>
                </div>
              ))}
            </div>

            {/* Real-Time Communication Table */}
            <div className="realtime-table-card">
              <h4 className="table-title">Real-Time Web Mechanisms: Polling vs SSE vs WebSockets</h4>
              <div className="realtime-table-wrap">
                <table className="realtime-table">
                  <thead>
                    <tr>
                      <th>Technology</th>
                      <th>Mechanism</th>
                      <th>Overhead</th>
                      <th>Ideal Use Case</th>
                    </tr>
                  </thead>
                  <tbody>
                    {networkingData.webProtocols[2].comparisons.map((c, idx) => (
                      <tr key={idx}>
                        <td className="tech-col"><strong>{c.tech}</strong></td>
                        <td>{c.mechanism}</td>
                        <td className="overhead-col">{c.overhead}</td>
                        <td>{c.useCase}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </section>

          {/* 3E: Proxies & Load Balancing */}
          <section className="network-section-block">
            <div className="section-title-wrap">
              <Server size={20} className="section-icon text-cyan" />
              <h3>Proxies & Load Balancing Architecture</h3>
            </div>

            <div className="proxies-grid">
              {networkingData.proxiesAndLoadBalancing.slice(0, 2).map((item) => (
                <div key={item.id} className="proxy-card">
                  <span className="concept-badge">{item.badge}</span>
                  <h4 className="proxy-title">{item.title}</h4>
                  <p className="proxy-summary">{item.summary}</p>
                  <p className="proxy-details">{item.details}</p>
                </div>
              ))}
            </div>

            {/* Load Balancing Algorithms */}
            <div className="lb-algorithms-box">
              <h4 className="box-title">Core Load Balancing Algorithms</h4>
              <div className="algorithms-subgrid">
                {networkingData.proxiesAndLoadBalancing[2].algorithms.map((algo, idx) => (
                  <div key={idx} className="lb-algo-card">
                    <span className="algo-name">{algo.name}</span>
                    <p className="algo-desc">{algo.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </Motion.div>
      )}

      {/* =========================================================================
          SECTION 4: COMPANY SOLUTIONS ARCHIVE (From interviews)
          ========================================================================= */}
      {activeTab === 'archive' && (
        <Motion.div
          key="archive-tab"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
          className="archive-section"
        >
          {/* Company Selector Ribbon */}
          <div className="companies-pills-scroll">
            {interviewArchiveSummary.companies.map((comp) => {
              const isSelected = selectedCompany === comp.name;
              return (
                <button
                  key={comp.name}
                  className={`company-pill-btn ${isSelected ? 'active' : ''}`}
                  onClick={() => setSelectedCompany(comp.name)}
                >
                  <span>{comp.displayName}</span>
                  <span className="company-count">{comp.solutionsCount}</span>
                </button>
              );
            })}
          </div>

          {/* Search bar inside company */}
          <div className="archive-controls-row">
            <div className="search-box">
              <Search size={18} className="search-icon" />
              <input
                type="text"
                value={archiveSearch}
                onChange={(e) => setArchiveSearch(e.target.value)}
                placeholder={`Search ${selectedCompany.toUpperCase()} solutions (e.g. Two Sum, LRU Cache, Binary Search)...`}
                className="search-input"
              />
              {archiveSearch && (
                <button
                  className="search-clear-btn"
                  onClick={() => setArchiveSearch('')}
                  aria-label="Clear search"
                >
                  ×
                </button>
              )}
            </div>
            <span className="archive-results-count">
              Showing <strong>{companySolutionsList.length}</strong> solutions for <strong>{selectedCompany.toUpperCase()}</strong>
            </span>
          </div>

          {/* Solutions List */}
          <div className="company-solutions-grid">
            {companySolutionsList.length > 0 ? (
              companySolutionsList.map((sol, idx) => (
                <div key={idx} className="archive-solution-card">
                  <div className="archive-card-top">
                    <span className="company-tag">{selectedCompany.toUpperCase()}</span>
                    <span className="lines-tag">{sol.linesCount} lines</span>
                  </div>
                  <h4 className="solution-title">{sol.title}</h4>
                  <p className="solution-filename">{sol.fileName}</p>

                  <div className="archive-card-actions">
                    <button
                      className="view-code-btn"
                      onClick={() => setActiveSolutionModal(sol)}
                    >
                      <Code2 size={15} /> View Java Code
                    </button>
                    <a
                      href={`https://leetcode.com/problemset/all/?search=${encodeURIComponent(sol.title)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="practice-link-btn"
                      title="Practice on LeetCode"
                    >
                      <ExternalLink size={15} />
                    </a>
                  </div>
                </div>
              ))
            ) : (
              <div className="archive-empty-state">
                <p>No solutions matched "{archiveSearch}" for {selectedCompany}.</p>
              </div>
            )}
          </div>

          {/* Java Code Lightbox Modal */}
          {activeSolutionModal && (
            <div className="code-modal-overlay" onClick={() => setActiveSolutionModal(null)}>
              <div className="code-modal-container" onClick={(e) => e.stopPropagation()}>
                <div className="code-modal-header">
                  <div>
                    <span className="modal-company-tag">{selectedCompany.toUpperCase()} INTERVIEW</span>
                    <h3 className="modal-title">{activeSolutionModal.title}</h3>
                  </div>
                  <button
                    className="modal-close-btn"
                    onClick={() => setActiveSolutionModal(null)}
                  >
                    ×
                  </button>
                </div>
                <div className="code-modal-body">
                  <pre className="java-code-pre">
                    <code>{activeSolutionModal.code}</code>
                  </pre>
                </div>
                <div className="code-modal-footer">
                  <button
                    className="copy-code-action-btn"
                    onClick={() => {
                      navigator.clipboard.writeText(activeSolutionModal.code);
                      alert('Java solution copied to clipboard!');
                    }}
                  >
                    <Code2 size={16} /> Copy Java Solution
                  </button>
                  <a
                    href={`https://leetcode.com/problemset/all/?search=${encodeURIComponent(activeSolutionModal.title)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="modal-practice-btn"
                  >
                    Practice on LeetCode <ExternalLink size={14} />
                  </a>
                </div>
              </div>
            </div>
          )}
        </Motion.div>
      )}
    </div>
  );
};

export default InterviewHub;
