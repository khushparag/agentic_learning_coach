# Detailed Hackathon Demo Script - 4 Minutes

## Pre-Recording Setup Checklist
```bash
# 1. Start all services
docker-compose up -d
sleep 30

# 2. Verify system health
curl http://localhost:8000/health/detailed

# 3. Open required windows/tabs:
# - Terminal (full screen, 16pt font)
# - VS Code with .kiro folder open
# - Browser with README.md
# - Browser with Swagger UI at http://localhost:8000/docs

# 4. Test all demo commands
./scripts/demo-test.sh
```

---

## **0:00 - 0:30** | Opening Hook & Introduction (30 seconds)

### **0:00 - 0:05** | Visual Setup
**SHOW:** README.md file open in browser, scroll to architecture diagram
**SAY:** "Welcome to the Agentic Learning Coach - a revolutionary AI-powered learning platform that's about to change how developers learn."

### **0:05 - 0:15** | Project Overview
**SHOW:** Highlight the multi-agent architecture diagram
**SAY:** "This isn't just another learning app. It's a sophisticated multi-agent system with seven specialized AI agents working together to deliver personalized coding education. Built entirely using Kiro CLI's spec-driven development methodology."

### **0:15 - 0:25** | Impressive Stats
**SHOW:** Scroll to project stats section in README
**SAY:** "We're talking about eighteen thousand lines of production-ready code, forty-seven REST API endpoints, three hundred fifty-six comprehensive tests, and a ninety percent test coverage rate."

### **0:25 - 0:30** | Kiro Integration Hook
**SHOW:** Quick glimpse of .kiro folder structure
**SAY:** "But here's what makes this special - exceptional Kiro CLI integration that demonstrates the future of spec-driven development."

---

## **0:30 - 1:15** | Kiro CLI Integration Excellence (45 seconds)

### **0:30 - 0:45** | Steering Documents
**SHOW:** Open VS Code, navigate to `.kiro/steering/` folder, show all 12 files
**SAY:** "Let me show you what comprehensive Kiro integration looks like. Twelve steering documents govern every aspect of this system - from clean architecture principles and SOLID design patterns to security protocols and testing strategies. This is how professional software development should work."

### **0:45 - 1:00** | Prompts and Hooks
**SHOW:** Navigate to `.kiro/prompts/` folder (14 files), then `.kiro/hooks/` folder (4 files)
**SAY:** "Fourteen specialized AI prompts handle domain-specific operations like exercise generation and code review. Four intelligent agent hooks automate our workflow - from test generation to quality gates and learning path validation. This is automation at its finest."

### **1:00 - 1:15** | Spec-Driven Development
**SHOW:** Navigate to `.kiro/specs/` folder, open one spec to show requirements.md, design.md, tasks.md
**SAY:** "Complete spec-driven development with fourteen feature specifications. Each contains detailed requirements, design documents, and implementation tasks. Every single feature follows the same rigorous development process that Kiro CLI enables."

---

## **1:15 - 2:45** | Live System Demonstration (90 seconds)

### **1:15 - 1:25** | System Health Check
**SHOW:** Switch to terminal, run health check command
**TYPE:** `curl -s http://localhost:8000/health/detailed | jq`
**SAY:** "First, let's verify all seven agents are operational. Perfect - all services are healthy, database connections are active, and our multi-agent system is ready to demonstrate intelligent learning."

### **1:25 - 1:45** | Skill Assessment
**SHOW:** Terminal, run skill assessment API call
**TYPE:** 
```bash
curl -X POST http://localhost:8000/api/v1/agents/orchestrator/route \
  -H "Content-Type: application/json" \
  -d '{"intent": "assess_skill_level", "payload": {"user_id": "demo-user", "target_technology": "React"}}'
```
**SAY:** "Watch this - a new learner wants to learn React but isn't sure of their current level. The Orchestrator routes this to the ProfileAgent, which conducts a skill assessment. Based on the responses, it determines the user is intermediate in JavaScript but a beginner with React components."

### **1:45 - 2:05** | Curriculum Generation
**SHOW:** Terminal, run curriculum creation API call
**TYPE:**
```bash
curl -X POST http://localhost:8000/api/v1/curriculum/create \
  -H "Content-Type: application/json" \
  -d '{"user_id": "demo-user", "goals": ["Build a todo app with React"], "time_constraints": {"hours_per_week": 5}}'
```
**SAY:** "Now the CurriculumPlannerAgent creates a personalized learning path in under ten seconds. Eight topics perfectly sequenced: JSX basics, component lifecycle, state management, event handling, hooks, forms, routing, and deployment. Tailored to their goal and time constraints."

### **2:05 - 2:25** | Exercise Generation & Code Execution
**SHOW:** Terminal, run exercise generation then code submission
**TYPE:**
```bash
curl -X POST http://localhost:8000/api/v1/exercises/generate \
  -H "Content-Type: application/json" \
  -d '{"topic": "JSX basics", "difficulty": 2}'
```
**PAUSE 2 seconds, then TYPE:**
```bash
curl -X POST http://localhost:8000/api/v1/submissions/submit \
  -H "Content-Type: application/json" \
  -d '{"code": "const Welcome = ({name}) => <h1>Hello, {name}!</h1>;", "language": "javascript"}'
```
**SAY:** "The ExerciseGeneratorAgent creates a JSX exercise with clear instructions and test cases. The learner submits their solution - code executes in a secure sandbox within three seconds. The ReviewerAgent provides detailed feedback: 'Great use of destructuring! Consider adding PropTypes for type safety.'"

### **2:25 - 2:45** | Adaptive Learning
**SHOW:** Terminal, simulate consecutive failures and show adaptation
**TYPE:**
```bash
curl -X POST http://localhost:8000/api/v1/progress/update \
  -H "Content-Type: application/json" \
  -d '{"user_id": "demo-user", "consecutive_failures": 2}'
```
**SAY:** "Here's where it gets intelligent. After two consecutive failures, the ProgressTracker detects the pattern and triggers adaptation. The CurriculumPlannerAgent reduces difficulty, and the ExerciseGeneratorAgent creates a recap exercise. This is real-time adaptive learning powered by AI."

---

## **2:45 - 3:30** | Advanced Features & Innovation (45 seconds)

### **2:45 - 3:00** | Gamification System
**SHOW:** Terminal, run gamification API calls
**TYPE:**
```bash
curl -s http://localhost:8000/api/v1/gamification/profile/demo-user | jq '.data.level'
```
**SAY:** "Comprehensive gamification keeps learners engaged. XP tracking, level progression, achievement systems, and learning streaks. Users earn points for completed exercises and unlock badges for milestones."

### **3:00 - 3:15** | Social Learning & Analytics
**SHOW:** Terminal, run social and analytics API calls
**TYPE:**
```bash
curl -s http://localhost:8000/api/v1/social/challenges | jq 'length'
curl -s http://localhost:8000/api/v1/analytics/insights/demo-user | jq '.data.learning_velocity'
```
**SAY:** "Social learning features enable peer challenges and collaborative problem-solving. AI-powered analytics track learning velocity, predict difficulty, and provide personalized recommendations. Every interaction makes the system smarter."

### **3:15 - 3:30** | Technical Excellence
**SHOW:** Terminal, run test command
**TYPE:** `pytest tests/ -v --tb=short | head -10`
**SAY:** "This isn't just a demo - it's production-ready software. Three hundred fifty-six comprehensive tests, property-based testing for correctness, sandboxed code execution for security, and clean architecture following SOLID principles throughout."

---

## **3:30 - 4:00** | Conclusion & Impact (30 seconds)

### **3:30 - 3:45** | Innovation Summary
**SHOW:** Switch back to VS Code showing the complete .kiro folder structure
**SAY:** "What you've just seen is the future of developer education. Seven AI agents collaborating intelligently, real-time adaptation to learning patterns, and comprehensive gamification - all built with exceptional Kiro CLI integration."

### **3:45 - 4:00** | Final Impact Statement
**SHOW:** Display final metrics overlay on screen:
- **Kiro Integration Score:** 100/100
- **Multi-Agent System:** 7 specialized agents
- **API Coverage:** 47+ endpoints  
- **Code Quality:** 90%+ test coverage
- **Production Ready:** Docker, monitoring, security

**SAY:** "The Agentic Learning Coach demonstrates the transformative power of Kiro CLI's spec-driven development. This is how the next generation of intelligent software gets built - and it's ready to revolutionize how developers learn."

---

## Detailed Technical Setup

### Terminal Commands Script
```bash
#!/bin/bash
# Save as demo-commands.sh

echo "=== HEALTH CHECK ==="
curl -s http://localhost:8000/health/detailed | jq '.status'

echo -e "\n=== SKILL ASSESSMENT ==="
curl -s -X POST http://localhost:8000/api/v1/agents/orchestrator/route \
  -H "Content-Type: application/json" \
  -d '{"intent": "assess_skill_level", "payload": {"user_id": "demo-user", "target_technology": "React"}}' | jq '.data.skill_level'

echo -e "\n=== CURRICULUM CREATION ==="
curl -s -X POST http://localhost:8000/api/v1/curriculum/create \
  -H "Content-Type: application/json" \
  -d '{"user_id": "demo-user", "goals": ["Build a todo app with React"], "time_constraints": {"hours_per_week": 5}}' | jq '.data.topics | length'

echo -e "\n=== EXERCISE GENERATION ==="
curl -s -X POST http://localhost:8000/api/v1/exercises/generate \
  -H "Content-Type: application/json" \
  -d '{"topic": "JSX basics", "difficulty": 2}' | jq '.data.title'

echo -e "\n=== CODE SUBMISSION ==="
curl -s -X POST http://localhost:8000/api/v1/submissions/submit \
  -H "Content-Type: application/json" \
  -d '{"code": "const Welcome = ({name}) => <h1>Hello, {name}!</h1>;", "language": "javascript"}' | jq '.data.passed'

echo -e "\n=== ADAPTIVE LEARNING ==="
curl -s -X POST http://localhost:8000/api/v1/progress/update \
  -H "Content-Type: application/json" \
  -d '{"user_id": "demo-user", "consecutive_failures": 2}' | jq '.data.difficulty_adjusted'

echo -e "\n=== GAMIFICATION ==="
curl -s http://localhost:8000/api/v1/gamification/profile/demo-user | jq '.data.level'

echo -e "\n=== SOCIAL FEATURES ==="
curl -s http://localhost:8000/api/v1/social/challenges | jq 'length'

echo -e "\n=== ANALYTICS ==="
curl -s http://localhost:8000/api/v1/analytics/insights/demo-user | jq '.data.learning_velocity'

echo -e "\n=== TESTS ==="
pytest tests/ -v --tb=short | head -10
```

### Screen Recording Setup
1. **Resolution:** 1920x1080 (Full HD)
2. **Frame Rate:** 30 FPS
3. **Audio:** Clear, confident narration at moderate pace
4. **Terminal:** 16pt font, dark theme, full screen when showing commands
5. **VS Code:** Clean workspace, .kiro folder pre-opened
6. **Browser:** README.md and Swagger UI tabs ready

### Timing Practice Notes
- **Practice each section** to hit exact timing
- **Rehearse transitions** between terminal and VS Code
- **Test all commands** before recording to ensure smooth execution
- **Have backup responses** ready if any API calls fail
- **Keep energy high** throughout - this is a hackathon demo!

### Success Criteria
- **All 7 agents demonstrate functionality**
- **Complete learning journey shown end-to-end**
- **Kiro CLI integration prominently featured**
- **Technical excellence clearly demonstrated**
- **Professional presentation throughout**
- **Exactly 4 minutes duration**

This detailed script gives you exact words to say, precise actions to take, and specific timings to follow for a compelling hackathon demo that showcases both the technical sophistication and exceptional Kiro CLI integration of your project.