# Agentic Learning Coach - Complete Demo Video Script

## Video Overview
**Total Duration:** 9-10 minutes  
**Target Audience:** Kiro Hackathon judges and technical evaluators  
**Goal:** Comprehensive demonstration of multi-agent learning system with complete learning journey

---

## Timeline Breakdown

### **0:00 - 0:45** | Opening & Project Introduction (45 seconds)

#### Visual Setup
- **Screen:** README.md with architecture diagram
- **Background:** Subtle tech music (optional)

#### Narration Script
> "Welcome to the Agentic Learning Coach - a revolutionary multi-agent system that transforms how developers learn. Built entirely using Kiro CLI's spec-driven development methodology, this intelligent platform features 7 specialized AI agents working in harmony to deliver personalized coding education."

#### Key Visual Elements (0:15 - 0:45)
- Architecture diagram highlighting 7 agents
- Quick stats overlay: "47+ API endpoints, 18,000+ lines of code, 356 tests"
- Kiro CLI integration badges

---

### **0:45 - 2:15** | Kiro CLI Integration Deep Dive (90 seconds)

#### **0:45 - 1:00** | Steering Documents (15 seconds)
**Visual:** `.kiro/steering/` directory structure
> "The foundation of our development process: 12 comprehensive steering documents that govern every aspect of the system - from clean architecture principles and SOLID design patterns to security protocols and testing strategies."

#### **1:00 - 1:25** | Custom Prompts & Automation (25 seconds)
**Visual:** `.kiro/prompts/` and `.kiro/hooks/` directories
> "14 specialized AI prompts handle domain-specific operations like exercise generation and code review. 4 intelligent agent hooks automate our workflow - from test generation to quality gates and learning path validation."

#### **1:25 - 1:45** | Spec-Driven Development (20 seconds)
**Visual:** `.kiro/specs/` directory with multiple feature specs
> "Complete spec-driven development with 14 feature specifications, each containing detailed requirements, design documents, and implementation tasks. Every feature follows the same rigorous development process."

#### **1:45 - 2:15** | Development Workflow (30 seconds)
**Visual:** Live demonstration of spec creation
> "Let me show you how we use Kiro CLI to create new features. Each spec includes EARS-compliant requirements, property-based testing strategies, and detailed implementation plans."

---

### **2:15 - 3:30** | System Architecture & APIs (75 seconds)

#### **2:15 - 2:35** | API Overview (20 seconds)
**Visual:** Swagger UI showing all endpoints
> "The system exposes 47 REST API endpoints organized into logical domains: core learning APIs, advanced analytics, gamification systems, and social learning features."

#### **2:35 - 2:55** | Agent Architecture (20 seconds)
**Visual:** Agent communication diagram
> "7 specialized agents communicate through clean interfaces: ProfileAgent for learner modeling, CurriculumPlannerAgent for adaptive paths, ExerciseGeneratorAgent for practice creation, ReviewerAgent for code evaluation, ResourcesAgent for content curation, ProgressTracker for analytics, and OrchestratorAgent for coordination."

#### **2:55 - 3:15** | Data Architecture (20 seconds)
**Visual:** Database schema and Qdrant integration
> "Robust data architecture with PostgreSQL as the system of record for transactional data, and Qdrant vector database for semantic resource discovery. Clean separation ensures data integrity and performance."

#### **3:15 - 3:30** | Health & Monitoring (15 seconds)
**Visual:** Health check endpoints and monitoring dashboard
> "Comprehensive health monitoring with detailed service status, performance metrics, and automated alerting."

---

### **3:30 - 6:30** | Complete Learning Journey Demo (180 seconds)

#### **3:30 - 4:00** | System Setup & Health Check (30 seconds)
**Visual:** Terminal commands and health status
```bash
# Start all services
docker-compose up -d

# Verify system health
curl http://localhost:8000/health/detailed
```
> "First, let's verify all services are operational. The health check confirms all 7 agents are running, database connections are active, and the code runner service is ready."

#### **4:00 - 5:00** | New Learner Onboarding (60 seconds)

##### **4:00 - 4:30** | Skill Assessment (30 seconds)
**Visual:** API calls for profile assessment
```bash
# Start skill assessment
curl -X POST http://localhost:8000/api/v1/agents/orchestrator/route \
  -H "Content-Type: application/json" \
  -d '{
    "intent": "assess_skill_level",
    "payload": {
      "user_id": "demo-user",
      "target_technology": "React",
      "responses": {
        "javascript_basics": "intermediate",
        "es6_features": "advanced", 
        "component_concepts": "beginner"
      }
    }
  }'
```
> "The ProfileAgent conducts a skill assessment. Based on the responses, it determines the user is intermediate in JavaScript but a beginner with React components."

##### **4:30 - 5:00** | Goal Setting & Curriculum Creation (30 seconds)
**Visual:** Curriculum planning API response
```bash
# Set learning goals and create curriculum
curl -X POST http://localhost:8000/api/v1/curriculum/create \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "demo-user",
    "goals": ["Build a todo app with React"],
    "time_constraints": {"hours_per_week": 5},
    "preferences": {"learning_style": "hands_on"}
  }'
```
> "The CurriculumPlannerAgent creates a personalized 8-topic learning path: JSX basics, component lifecycle, state management, event handling, hooks, forms, routing, and deployment."

#### **5:00 - 5:45** | Exercise Generation & Submission (45 seconds)

##### **5:00 - 5:20** | First Exercise (20 seconds)
**Visual:** Exercise generation API
```bash
# Generate first exercise
curl -X POST http://localhost:8000/api/v1/exercises/generate \
  -H "Content-Type: application/json" \
  -d '{
    "topic": "JSX basics",
    "difficulty": 2,
    "user_context": {"skill_level": "beginner_react"}
  }'
```
> "The ExerciseGeneratorAgent creates a JSX exercise with clear instructions, starter code, and test cases appropriate for a React beginner."

##### **5:20 - 5:45** | Code Submission & Feedback (25 seconds)
**Visual:** Code execution and review
```bash
# Submit solution
curl -X POST http://localhost:8000/api/v1/submissions/submit \
  -H "Content-Type: application/json" \
  -d '{
    "exercise_id": "jsx-001",
    "code": "const Welcome = ({name}) => <h1>Hello, {name}!</h1>;",
    "language": "javascript"
  }'
```
> "Code executes in a sandboxed environment within 3 seconds. The ReviewerAgent provides detailed feedback: 'Great use of destructuring! Consider adding PropTypes for type safety.'"

#### **5:45 - 6:30** | Adaptive Learning & Resource Discovery (45 seconds)

##### **5:45 - 6:10** | Difficulty Adaptation (25 seconds)
**Visual:** Progress tracking and adaptation
```bash
# Simulate consecutive failures
curl -X POST http://localhost:8000/api/v1/progress/update \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "demo-user",
    "exercise_id": "hooks-001", 
    "result": "failed",
    "consecutive_failures": 2
  }'
```
> "After two failures on hooks, the ProgressTracker triggers adaptation. The CurriculumPlannerAgent reduces difficulty and the ExerciseGeneratorAgent creates a recap exercise on useState basics."

##### **6:10 - 6:30** | Resource Discovery (20 seconds)
**Visual:** Semantic search in Qdrant
```bash
# Search for learning resources
curl -X GET "http://localhost:8000/api/v1/resources/search?query=React hooks tutorial&skill_level=beginner"
```
> "The ResourcesAgent searches our Qdrant vector database, returning 5 curated resources: official React docs, interactive tutorials, and code examples, all matched to the user's skill level."

---

### **6:30 - 7:45** | Advanced Features Showcase (75 seconds)

#### **6:30 - 6:55** | Gamification System (25 seconds)
**Visual:** Gamification APIs and responses
```bash
# Check gamification profile
curl http://localhost:8000/api/v1/gamification/profile/demo-user

# Award achievement
curl -X POST http://localhost:8000/api/v1/gamification/achievements/award \
  -d '{"user_id": "demo-user", "achievement": "first_component"}'
```
> "Comprehensive gamification with XP tracking, level progression, achievement system, and learning streaks. Users earn points for completed exercises and unlock badges for milestones."

#### **6:55 - 7:20** | Social Learning Features (25 seconds)
**Visual:** Social APIs and peer challenges
```bash
# Browse peer challenges
curl http://localhost:8000/api/v1/social/challenges

# Create new challenge
curl -X POST http://localhost:8000/api/v1/social/challenges/create \
  -d '{"title": "React Component Challenge", "difficulty": 3}'
```
> "Social learning platform with peer challenges, solution sharing, and collaborative problem-solving. Users can create challenges, share solutions, and learn from the community."

#### **7:20 - 7:45** | Analytics & Insights (25 seconds)
**Visual:** Analytics dashboard and AI insights
```bash
# Get learning analytics
curl http://localhost:8000/api/v1/analytics/insights/demo-user

# Performance predictions
curl http://localhost:8000/api/v1/analytics/predictions/difficulty
```
> "AI-powered analytics provide deep insights: learning velocity tracking, knowledge retention analysis, difficulty predictions, and personalized recommendations for optimal learning paths."

---

### **7:45 - 8:30** | Technical Excellence (45 seconds)

#### **7:45 - 8:05** | Testing & Quality (20 seconds)
**Visual:** Test execution and coverage reports
```bash
# Run comprehensive test suite
pytest tests/ -v --cov=src --cov-report=html

# Property-based testing
pytest tests/property/ -v
```
> "356 comprehensive tests achieve 90%+ coverage. Property-based testing validates system correctness across thousands of generated inputs. Unit, integration, and end-to-end tests ensure reliability."

#### **8:05 - 8:20** | Security & Performance (15 seconds)
**Visual:** Security measures and performance metrics
> "Sandboxed code execution prevents malicious code. Input validation, rate limiting, and comprehensive logging ensure security. Sub-2-second response times and horizontal scalability support concurrent users."

#### **8:20 - 8:30** | Code Quality (10 seconds)
**Visual:** Code structure and architecture
> "Clean architecture following SOLID principles. Dependency injection, proper separation of concerns, and comprehensive error handling throughout the system."

---

### **8:30 - 9:00** | Innovation Highlights (30 seconds)

#### **8:30 - 8:45** | AI-Powered Adaptation (15 seconds)
> "Intelligent adaptation algorithms detect learning patterns and adjust difficulty in real-time. Spaced repetition scheduling optimizes knowledge retention. LLM integration generates contextual exercises and feedback."

#### **8:45 - 9:00** | Scalable Architecture (15 seconds)
> "Microservices architecture with Docker containerization. Horizontal scaling capabilities, comprehensive monitoring, and automated deployment pipelines ensure production readiness."

---

### **9:00 - 9:30** | Conclusion & Impact (30 seconds)

#### **9:00 - 9:15** | Project Metrics (15 seconds)
**Visual:** Final metrics overlay
- **Kiro Integration Score:** 100/100
- **Lines of Code:** 18,000+
- **Test Coverage:** 90%+
- **API Endpoints:** 47+
- **Agents:** 7 specialized
- **Features:** 14 complete specs

#### **9:15 - 9:30** | Closing Statement (15 seconds)
> "The Agentic Learning Coach demonstrates the transformative power of Kiro CLI's spec-driven development. This production-ready platform revolutionizes developer education through intelligent multi-agent collaboration, comprehensive testing, and exceptional code quality. Ready to scale and impact thousands of learners worldwide."

---

## Technical Setup Instructions

### Pre-Recording Checklist
```bash
# 1. Environment Setup
docker-compose down
docker-compose up -d
sleep 30

# 2. Database Seeding
python scripts/init_db.py
python scripts/demo.py --seed-data

# 3. Health Verification
curl http://localhost:8000/health/detailed

# 4. Demo User Creation
curl -X POST http://localhost:8000/api/v1/users/create \
  -d '{"email": "demo@example.com", "username": "demo-user"}'

# 5. Sample Data Population
python scripts/populate_demo_data.py
```

### Recording Configuration
- **Resolution:** 1920x1080 (Full HD)
- **Frame Rate:** 30 FPS
- **Audio Quality:** 48kHz, 16-bit
- **Screen Recording:** OBS Studio with scene transitions
- **Browser:** Chrome with developer tools
- **Terminal:** Clean terminal with readable font (16pt)

### Demo Commands Script
```bash
#!/bin/bash
# Save as demo_commands.sh

echo "=== Health Check ==="
curl -s http://localhost:8000/health/detailed | jq

echo -e "\n=== Skill Assessment ==="
curl -s -X POST http://localhost:8000/api/v1/agents/orchestrator/route \
  -H "Content-Type: application/json" \
  -d '{"intent": "assess_skill_level", "payload": {"user_id": "demo-user", "target_technology": "React"}}' | jq

echo -e "\n=== Curriculum Creation ==="
curl -s -X POST http://localhost:8000/api/v1/curriculum/create \
  -H "Content-Type: application/json" \
  -d '{"user_id": "demo-user", "goals": ["Build a todo app with React"], "time_constraints": {"hours_per_week": 5}}' | jq

echo -e "\n=== Exercise Generation ==="
curl -s -X POST http://localhost:8000/api/v1/exercises/generate \
  -H "Content-Type: application/json" \
  -d '{"topic": "JSX basics", "difficulty": 2, "user_context": {"skill_level": "beginner_react"}}' | jq

echo -e "\n=== Code Submission ==="
curl -s -X POST http://localhost:8000/api/v1/submissions/submit \
  -H "Content-Type: application/json" \
  -d '{"exercise_id": "jsx-001", "code": "const Welcome = ({name}) => <h1>Hello, {name}!</h1>;", "language": "javascript"}' | jq

echo -e "\n=== Gamification Profile ==="
curl -s http://localhost:8000/api/v1/gamification/profile/demo-user | jq

echo -e "\n=== Resource Search ==="
curl -s "http://localhost:8000/api/v1/resources/search?query=React hooks tutorial&skill_level=beginner" | jq

echo -e "\n=== Test Execution ==="
pytest tests/ -v --tb=short | head -20
```

### Visual Assets Preparation
1. **Architecture Diagrams:** High-resolution agent interaction diagrams
2. **API Documentation:** Swagger UI screenshots
3. **Code Examples:** Syntax-highlighted code snippets
4. **Test Results:** Coverage reports and test execution output
5. **Metrics Dashboard:** Performance and analytics visualizations

### Post-Production Checklist
- [ ] Audio levels balanced and clear
- [ ] Visual transitions smooth
- [ ] Code examples readable at full screen
- [ ] API responses properly formatted
- [ ] Timeline matches narration
- [ ] File size optimized for submission
- [ ] Video format: MP4 (H.264)
- [ ] Closed captions added (optional)

---

## Expected Demonstration Outcomes

### Technical Validation
- **All 7 agents operational** and responding within performance benchmarks
- **Complete learning journey** from assessment to adaptive difficulty
- **Real-time code execution** with sandboxed security
- **Semantic resource discovery** with relevant results
- **Gamification and social features** fully functional

### Kiro CLI Integration Showcase
- **Comprehensive steering documents** governing all development aspects
- **Specialized prompts and hooks** automating workflow
- **Spec-driven development** with complete feature specifications
- **Quality gates and testing** ensuring code excellence

### Innovation Demonstration
- **Multi-agent collaboration** with intelligent routing
- **Adaptive learning algorithms** responding to user performance
- **AI-powered content generation** with fallback strategies
- **Production-ready architecture** with monitoring and scaling

### Judge Impact
- **Technical depth** appropriate for hackathon evaluation
- **Clear value proposition** for developer education
- **Exceptional code quality** and testing practices
- **Comprehensive Kiro CLI integration** showcasing platform capabilities

**Target Outcome:** Perfect 100/100 Kiro Integration Score with compelling demonstration of real-world impact and technical excellence.