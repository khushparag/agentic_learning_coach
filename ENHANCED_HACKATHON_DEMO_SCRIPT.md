# Enhanced Hackathon Demo Script - 4 Minutes
## Full-Stack Showcase: Backend + Frontend

## Pre-Recording Setup Checklist
```bash
# 1. Start all services (backend + frontend)
docker-compose up -d
sleep 30

# 2. Start frontend development server
cd frontend && npm run dev &
cd ..

# 3. Verify system health
curl http://localhost:8002/health/detailed

# 4. Open required windows/tabs:
# - Terminal (full screen, 16pt font)
# - VS Code with .kiro folder open
# - Browser with README.md
# - Browser with Frontend at http://localhost:3000
# - Browser with Swagger UI at http://localhost:8000/docs

# 5. Test all demo commands
./scripts/demo-test.sh
```

---

## **0:00 - 0:30** | Opening Hook & Full-Stack Introduction (30 seconds)

### **0:00 - 0:05** | Visual Setup
**SHOW:** README.md file open in browser, scroll to architecture diagram
**SAY:** "Welcome to the Agentic Learning Coach - a revolutionary full-stack AI-powered learning platform that's about to change how developers learn."

### **0:05 - 0:15** | Project Overview
**SHOW:** Highlight the multi-agent architecture diagram
**SAY:** "This isn't just another learning app. It's a sophisticated multi-agent system with seven specialized AI agents working together, plus a comprehensive React frontend - all built using Kiro CLI's spec-driven development methodology."

### **0:15 - 0:25** | Impressive Stats
**SHOW:** Scroll to project stats section in README
**SAY:** "We're talking about twenty-five thousand lines of production-ready code, forty-seven REST API endpoints, a complete React TypeScript frontend, and comprehensive testing across the entire stack."

### **0:25 - 0:30** | Kiro Integration Hook
**SHOW:** Quick glimpse of .kiro folder structure
**SAY:** "But here's what makes this special - exceptional Kiro CLI integration that demonstrates the future of full-stack spec-driven development."

---

## **0:30 - 1:00** | Kiro CLI Integration Excellence (30 seconds)

### **0:30 - 0:45** | Comprehensive Kiro Integration
**SHOW:** Open VS Code, navigate to `.kiro/` folder, show structure
**SAY:** "Let me show you what comprehensive Kiro integration looks like. Twelve steering documents, fourteen specialized prompts, four automation hooks, and complete spec-driven development covering both backend agents and frontend components."

### **0:45 - 1:00** | Full-Stack Specs
**SHOW:** Navigate to `.kiro/specs/` folder, show multiple specs including web-ui
**SAY:** "Every feature follows the same rigorous development process - from multi-agent backend systems to React frontend components. This is how professional full-stack development should work."

---

## **1:00 - 2:30** | Live Full-Stack Demonstration (90 seconds)

### **1:00 - 1:10** | System Health & Frontend Launch
**SHOW:** Switch to terminal, run health check, then open frontend
**TYPE:** `curl -s http://localhost:8000/health/detailed | jq`
**THEN SHOW:** Browser with frontend at http://localhost:3000
**SAY:** "All seven agents are operational. Now let's see the complete user experience through our React frontend."

### **1:10 - 1:30** | Onboarding Flow Demo
**SHOW:** Frontend onboarding interface
**ACTION:** Click through onboarding steps - goal selection, tech stack, skill assessment
**SAY:** "Watch this seamless onboarding experience. Users select their learning goals, choose their tech stack, and complete a skill assessment. The frontend communicates with our ProfileAgent to create a personalized learning profile."

### **1:30 - 1:50** | Dashboard & Learning Path
**SHOW:** Navigate to dashboard, show learning path visualization
**ACTION:** Show dashboard with stats, progress analytics, and learning path
**SAY:** "The dashboard displays real-time learning analytics powered by our ProgressTracker agent. Users can see their XP progression, learning velocity, and personalized curriculum created by the CurriculumPlannerAgent."

### **1:50 - 2:10** | Interactive Code Editor
**SHOW:** Navigate to exercises, open code editor interface
**ACTION:** Show Monaco editor, write some code, submit for evaluation
**SAY:** "Here's our professional-grade code editor with Monaco integration. Users write code, and it's evaluated by our ReviewerAgent in a secure sandbox. The frontend provides instant feedback with syntax highlighting and real-time linting."

### **2:10 - 2:30** | Real-time Features & Gamification
**SHOW:** Show gamification dashboard, social features, real-time updates
**ACTION:** Display achievements, leaderboards, and social learning features
**SAY:** "The platform includes comprehensive gamification with XP tracking, achievements, and social learning features. Real-time WebSocket connections keep everything synchronized across the multi-agent backend."

---

## **2:30 - 3:15** | Backend API Power Demonstration (45 seconds)

### **2:30 - 2:45** | Agent Orchestration
**SHOW:** Switch to terminal, demonstrate API calls
**TYPE:** 
```bash
curl -X POST http://localhost:8000/api/v1/agents/orchestrator/route \
  -H "Content-Type: application/json" \
  -d '{"intent": "assess_skill_level", "payload": {"user_id": "demo-user", "target_technology": "React"}}'
```
**SAY:** "Behind this beautiful frontend is a powerful multi-agent system. The Orchestrator routes requests to specialized agents - here we're conducting a skill assessment."

### **2:45 - 3:00** | Curriculum Generation
**SHOW:** Terminal, run curriculum creation API call
**TYPE:**
```bash
curl -X POST http://localhost:8000/api/v1/curriculum/create \
  -H "Content-Type: application/json" \
  -d '{"user_id": "demo-user", "goals": ["Build a React app"], "time_constraints": {"hours_per_week": 5}}'
```
**SAY:** "The CurriculumPlannerAgent creates personalized learning paths in seconds. Eight topics perfectly sequenced based on the user's goals and time constraints."

### **3:00 - 3:15** | Code Execution & Adaptive Learning
**SHOW:** Terminal, demonstrate code submission and adaptive learning
**TYPE:**
```bash
curl -X POST http://localhost:8000/api/v1/submissions/submit \
  -H "Content-Type: application/json" \
  -d '{"code": "const Welcome = ({name}) => <h1>Hello, {name}!</h1>;", "language": "javascript"}'
```
**SAY:** "Code executes in our secure sandbox, and the system adapts in real-time. After consecutive failures, the ProgressTracker triggers difficulty reduction - this is intelligent, adaptive learning."

---

## **3:15 - 3:45** | Technical Excellence & Innovation (30 seconds)

### **3:15 - 3:30** | Full-Stack Quality
**SHOW:** Switch between frontend (showing responsive design) and terminal (showing tests)
**TYPE:** `pytest tests/ -v --tb=short | head -10`
**SAY:** "This is production-ready software. The React frontend is fully responsive with 90%+ test coverage, accessibility compliance, and the backend has comprehensive property-based testing for correctness."

### **3:30 - 3:45** | Innovation Highlights
**SHOW:** Quick montage of frontend features - mobile responsive, accessibility, real-time updates
**SAY:** "Key innovations include: AI-powered exercise generation, real-time collaborative features, comprehensive gamification, adaptive difficulty with spaced repetition, and a PWA-ready frontend with offline support."

---

## **3:45 - 4:00** | Conclusion & Impact (15 seconds)

### **3:45 - 4:00** | Final Impact Statement
**SHOW:** Split screen showing frontend dashboard and VS Code with .kiro folder
**SAY:** "The Agentic Learning Coach demonstrates the transformative power of Kiro CLI's spec-driven development. Seven AI agents, a comprehensive React frontend, and exceptional Kiro integration - this is the future of intelligent software development."

**SHOW:** Display final metrics overlay:
- **Full-Stack Application:** React + Python + 7 AI Agents
- **Lines of Code:** 25,000+ (Backend + Frontend)
- **API Endpoints:** 47+ REST APIs
- **Frontend Components:** 50+ React Components
- **Test Coverage:** 90%+ across the stack
- **Kiro Integration:** 12 steering docs, 14 prompts, 4 hooks

---

## Enhanced Technical Setup

### Frontend Preparation
```bash
# Ensure frontend is running
cd frontend
npm install
npm run dev &
cd ..

# Verify frontend is accessible
curl http://localhost:3000
```

### Demo Flow Commands
```bash
#!/bin/bash
# Enhanced demo commands with frontend integration

echo "=== SYSTEM HEALTH ==="
curl -s http://localhost:8000/health/detailed | jq '.status'

echo -e "\n=== FRONTEND STATUS ==="
curl -s http://localhost:3000 | head -5

echo -e "\n=== SKILL ASSESSMENT ==="
curl -s -X POST http://localhost:8000/api/v1/agents/orchestrator/route \
  -H "Content-Type: application/json" \
  -d '{"intent": "assess_skill_level", "payload": {"user_id": "demo-user", "target_technology": "React"}}' | jq '.data.skill_level'

echo -e "\n=== CURRICULUM CREATION ==="
curl -s -X POST http://localhost:8000/api/v1/curriculum/create \
  -H "Content-Type: application/json" \
  -d '{"user_id": "demo-user", "goals": ["Build a React app"], "time_constraints": {"hours_per_week": 5}}' | jq '.data.topics | length'

echo -e "\n=== CODE SUBMISSION ==="
curl -s -X POST http://localhost:8000/api/v1/submissions/submit \
  -H "Content-Type: application/json" \
  -d '{"code": "const Welcome = ({name}) => <h1>Hello, {name}!</h1>;", "language": "javascript"}' | jq '.data.passed'

echo -e "\n=== FRONTEND TESTS ==="
cd frontend && npm test -- --coverage --watchAll=false | head -10
cd ..

echo -e "\n=== BACKEND TESTS ==="
pytest tests/ -v --tb=short | head -10
```

### Browser Setup for Recording
1. **Frontend Tab**: http://localhost:3000 (main demo interface)
2. **README Tab**: Project documentation and architecture
3. **Swagger UI Tab**: http://localhost:8000/docs (API documentation)
4. **VS Code**: .kiro folder structure

### Frontend Demo Flow
1. **Onboarding**: Show goal selection, tech stack, skill assessment
2. **Dashboard**: Display learning analytics, progress tracking, XP system
3. **Learning Path**: Interactive curriculum visualization
4. **Code Editor**: Monaco editor with syntax highlighting and linting
5. **Exercises**: Code submission and real-time feedback
6. **Gamification**: Achievements, leaderboards, social features
7. **Mobile View**: Responsive design demonstration

### Success Criteria - Enhanced
- **Full-Stack Demonstration**: Both backend APIs and frontend UI
- **Complete User Journey**: From onboarding to code execution
- **Kiro CLI Integration**: Comprehensive spec-driven development
- **Technical Excellence**: Testing, security, performance across the stack
- **Innovation Showcase**: AI agents + modern React frontend
- **Professional Presentation**: Smooth transitions, clear narration
- **Exactly 4 minutes**: Perfect timing for hackathon requirements

This enhanced script showcases the complete full-stack application, demonstrating both the sophisticated multi-agent backend and the beautiful, functional React frontend - all built with exceptional Kiro CLI integration! 🚀