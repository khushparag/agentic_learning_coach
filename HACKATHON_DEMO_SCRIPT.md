# Agentic Learning Coach - Hackathon Demo Script

## Video Overview
**Duration:** 4 minutes  
**Target:** Hackathon judges  
**Goal:** Showcase multi-agent learning system with exceptional Kiro CLI integration

---

## Timeline Breakdown

### **0:00 - 0:30** | Hook & Project Introduction (30 seconds)

#### Visual Setup
- **Screen:** README.md with architecture diagram
- **Overlay:** Project stats

#### Narration Script
> "Meet the Agentic Learning Coach - a revolutionary AI-powered learning platform built entirely with Kiro CLI. Seven specialized agents work together to deliver personalized coding education that adapts in real-time to each learner's needs."

#### Key Visual Elements
- Multi-agent architecture diagram
- Stats overlay: "7 AI Agents • 47+ APIs • 18K+ Lines of Code • 356 Tests"
- Kiro CLI integration badges

---

### **0:30 - 1:15** | Kiro CLI Integration Excellence (45 seconds)

#### **0:30 - 0:45** | Comprehensive Integration (15 seconds)
**Visual:** `.kiro/` directory structure
> "This project showcases the full power of Kiro CLI with 12 steering documents governing every aspect of development, 14 specialized AI prompts, 4 intelligent automation hooks, and complete spec-driven development for 14 features."

#### **0:45 - 1:00** | Spec-Driven Development (15 seconds)
**Visual:** Live spec creation workflow
> "Every feature follows rigorous spec-driven development: EARS-compliant requirements, property-based testing strategies, and detailed implementation plans. This is how professional software gets built."

#### **1:00 - 1:15** | Quality & Automation (15 seconds)
**Visual:** Agent hooks and quality gates
> "Intelligent automation handles test generation, code quality gates, and learning path validation. The result? 90% test coverage and production-ready code quality."

---

### **1:15 - 3:00** | Live Learning Journey Demo (105 seconds)

#### **1:15 - 1:30** | System Health & Setup (15 seconds)
**Visual:** Health check and system status
```bash
curl http://localhost:8000/health/detailed
```
> "All seven agents are operational. Let's watch a complete learning journey unfold."

#### **1:30 - 2:00** | Intelligent Onboarding (30 seconds)
**Visual:** API calls showing agent orchestration
```bash
# Skill assessment
curl -X POST http://localhost:8000/api/v1/agents/orchestrator/route \
  -d '{"intent": "assess_skill_level", "payload": {"target": "React"}}'

# Curriculum creation  
curl -X POST http://localhost:8000/api/v1/curriculum/create \
  -d '{"goals": ["Build todo app"], "time_constraints": {"hours_per_week": 5}}'
```
> "The ProfileAgent assesses skill level in under 30 seconds. The CurriculumPlannerAgent instantly creates a personalized 8-topic learning path tailored to the user's goals and time constraints."

#### **2:00 - 2:30** | Adaptive Exercise Generation (30 seconds)
**Visual:** Exercise generation and code execution
```bash
# Generate exercise
curl -X POST http://localhost:8000/api/v1/exercises/generate \
  -d '{"topic": "JSX basics", "difficulty": 2}'

# Submit and evaluate code
curl -X POST http://localhost:8000/api/v1/submissions/submit \
  -d '{"code": "const Welcome = ({name}) => <h1>Hello, {name}!</h1>;"}'
```
> "The ExerciseGeneratorAgent creates contextual exercises with starter code and test cases. Code executes in a secure sandbox within 3 seconds. The ReviewerAgent provides specific, actionable feedback."

#### **2:30 - 3:00** | Real-Time Adaptation (30 seconds)
**Visual:** Difficulty adaptation and resource discovery
```bash
# Trigger adaptation after failures
curl -X POST http://localhost:8000/api/v1/progress/update \
  -d '{"consecutive_failures": 2}'

# Semantic resource search
curl "http://localhost:8000/api/v1/resources/search?query=React hooks&skill_level=beginner"
```
> "After two failures, the system automatically reduces difficulty and provides recap exercises. The ResourcesAgent searches our vector database to find perfectly matched learning materials. This is adaptive learning in action."

---

### **3:00 - 3:45** | Advanced Features & Innovation (45 seconds)

#### **3:00 - 3:15** | Gamification & Social Learning (15 seconds)
**Visual:** Gamification APIs and social features
```bash
curl http://localhost:8000/api/v1/gamification/profile/demo-user
curl http://localhost:8000/api/v1/social/challenges
```
> "Comprehensive gamification with XP, achievements, and learning streaks. Social features enable peer challenges and collaborative learning."

#### **3:15 - 3:30** | AI-Powered Analytics (15 seconds)
**Visual:** Analytics dashboard and insights
```bash
curl http://localhost:8000/api/v1/analytics/insights/demo-user
```
> "AI-powered analytics track learning velocity, predict difficulty, and provide personalized recommendations. Every interaction makes the system smarter."

#### **3:30 - 3:45** | Technical Excellence (15 seconds)
**Visual:** Test results and architecture
> "356 comprehensive tests, property-based testing, sandboxed code execution, and clean architecture following SOLID principles. This isn't just a demo - it's production-ready software."

---

### **3:45 - 4:00** | Impact & Conclusion (15 seconds)

#### **3:45 - 4:00** | Final Impact Statement (15 seconds)
**Visual:** Project metrics and Kiro CLI integration score
> "The Agentic Learning Coach demonstrates the transformative power of Kiro CLI's spec-driven development. Seven AI agents, 47 APIs, exceptional code quality, and comprehensive Kiro integration - ready to revolutionize how developers learn."

#### Final Metrics Display
- **Kiro Integration Score:** 100/100
- **Multi-Agent System:** 7 specialized agents
- **API Coverage:** 47+ endpoints
- **Code Quality:** 90%+ test coverage
- **Production Ready:** Docker, monitoring, security

---

## Technical Setup for Recording

### Pre-Recording Checklist
```bash
# 1. Start all services
docker-compose up -d
sleep 30

# 2. Verify system health
curl http://localhost:8000/health/detailed

# 3. Seed demo data
python scripts/init_db.py
python scripts/demo.py --seed-data

# 4. Prepare demo user
curl -X POST http://localhost:8000/api/v1/users/create \
  -d '{"email": "demo@example.com", "username": "demo-user"}'
```

### Recording Configuration
- **Resolution:** 1920x1080 (Full HD)
- **Frame Rate:** 30 FPS
- **Audio:** Clear, professional narration
- **Screen Recording:** OBS Studio with smooth transitions
- **Terminal:** Clean setup with readable font (16pt)

### Demo Commands Script
```bash
#!/bin/bash
# Quick demo commands for smooth recording

echo "=== Health Check ==="
curl -s http://localhost:8000/health/detailed | jq '.status'

echo -e "\n=== Skill Assessment ==="
curl -s -X POST http://localhost:8000/api/v1/agents/orchestrator/route \
  -H "Content-Type: application/json" \
  -d '{"intent": "assess_skill_level", "payload": {"user_id": "demo-user", "target_technology": "React"}}' | jq '.data.skill_level'

echo -e "\n=== Curriculum Creation ==="
curl -s -X POST http://localhost:8000/api/v1/curriculum/create \
  -H "Content-Type: application/json" \
  -d '{"user_id": "demo-user", "goals": ["Build a todo app with React"], "time_constraints": {"hours_per_week": 5}}' | jq '.data.topics | length'

echo -e "\n=== Exercise Generation ==="
curl -s -X POST http://localhost:8000/api/v1/exercises/generate \
  -H "Content-Type: application/json" \
  -d '{"topic": "JSX basics", "difficulty": 2, "user_context": {"skill_level": "beginner_react"}}' | jq '.data.title'

echo -e "\n=== Code Submission ==="
curl -s -X POST http://localhost:8000/api/v1/submissions/submit \
  -H "Content-Type: application/json" \
  -d '{"exercise_id": "jsx-001", "code": "const Welcome = ({name}) => <h1>Hello, {name}!</h1>;", "language": "javascript"}' | jq '.data.passed'

echo -e "\n=== Gamification ==="
curl -s http://localhost:8000/api/v1/gamification/profile/demo-user | jq '.data.level'

echo -e "\n=== Resource Search ==="
curl -s "http://localhost:8000/api/v1/resources/search?query=React hooks tutorial&skill_level=beginner" | jq '.data | length'
```

### Visual Assets Needed
1. **Architecture Diagram:** Clean, professional multi-agent system diagram
2. **Kiro Directory Structure:** Well-organized `.kiro/` folder view
3. **API Documentation:** Swagger UI screenshots
4. **Test Results:** Coverage reports and test execution
5. **Metrics Dashboard:** Performance and analytics visualizations

---

## Success Criteria

### Technical Demonstration
- **All 7 agents operational** and responding within performance benchmarks
- **Complete learning journey** from assessment to adaptive difficulty
- **Real-time code execution** with secure sandboxing
- **Semantic resource discovery** with relevant results
- **Gamification and social features** fully functional

### Kiro CLI Integration Showcase
- **Comprehensive steering documents** visible and explained
- **Specialized prompts and hooks** demonstrated in action
- **Spec-driven development** process clearly shown
- **Quality gates and automation** working seamlessly

### Judge Impact Goals
- **Clear value proposition** for developer education
- **Technical excellence** appropriate for hackathon level
- **Innovation demonstration** with multi-agent collaboration
- **Production readiness** with comprehensive testing and monitoring

### Expected Outcome
**Perfect 100/100 Kiro Integration Score** with compelling demonstration of:
- Multi-agent system architecture
- Adaptive learning algorithms
- Comprehensive Kiro CLI integration
- Production-ready code quality
- Real-world educational impact

---

## Recording Tips

### Pacing & Flow
- **Keep energy high** - this is a hackathon demo
- **Smooth transitions** between sections
- **Clear, confident narration** at moderate pace
- **Visual focus** on key elements during narration

### Technical Execution
- **Test all commands** before recording
- **Have backup plans** for any API failures
- **Clean terminal output** with proper formatting
- **Smooth screen transitions** between different views

### Hackathon Judge Appeal
- **Lead with innovation** - multi-agent AI system
- **Emphasize Kiro integration** - this is the key differentiator
- **Show real functionality** - not just mockups
- **Demonstrate scale** - production-ready system

**Target Result:** A compelling 4-minute demo that showcases technical excellence, innovation, and exceptional Kiro CLI integration to win the hackathon.