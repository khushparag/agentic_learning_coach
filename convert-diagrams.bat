@echo off
echo Installing Mermaid CLI...
npm install -g @mermaid-js/mermaid-cli

echo Creating diagrams directory...
mkdir diagrams 2>nul

echo Converting Mermaid diagrams to PNG images...

echo Extracting System Architecture diagram...
echo ```mermaid > temp_system.mmd
echo --->> temp_system.mmd
echo title: Agentic Learning Coach - System Architecture Overview>> temp_system.mmd
echo --->> temp_system.mmd
echo graph TB>> temp_system.mmd
echo     subgraph "Client Layer">> temp_system.mmd
echo         CLI[CLI Interface]>> temp_system.mmd
echo         WEB[Web Frontend^<br/^>React/TypeScript]>> temp_system.mmd
echo         API_CLIENT[API Clients]>> temp_system.mmd
echo     end>> temp_system.mmd
echo.>> temp_system.mmd
echo     subgraph "API Gateway Layer">> temp_system.mmd
echo         FASTAPI[FastAPI REST API^<br/^>Python]>> temp_system.mmd
echo         AUTH[Authentication^<br/^>^& Authorization]>> temp_system.mmd
echo         RATE[Rate Limiting^<br/^>^& Validation]>> temp_system.mmd
echo     end>> temp_system.mmd
echo.>> temp_system.mmd
echo     subgraph "Orchestration Layer">> temp_system.mmd
echo         ORCH[Orchestrator Agent^<br/^>Central Coordinator]>> temp_system.mmd
echo         ROUTER[Intent Router^<br/^>Message Classification]>> temp_system.mmd
echo         CIRCUIT[Circuit Breaker^<br/^>Fault Tolerance]>> temp_system.mmd
echo     end>> temp_system.mmd
echo.>> temp_system.mmd
echo     subgraph "Agent Layer - Specialized AI Agents">> temp_system.mmd
echo         PROF[ProfileAgent^<br/^>User Modeling]>> temp_system.mmd
echo         CURR[CurriculumPlannerAgent^<br/^>Learning Path Design]>> temp_system.mmd
echo         RES[ResourcesAgent^<br/^>Content Discovery]>> temp_system.mmd
echo         EX[ExerciseGeneratorAgent^<br/^>Practice Creation]>> temp_system.mmd
echo         REV[ReviewerAgent^<br/^>Code Evaluation]>> temp_system.mmd
echo         PROG[ProgressTracker^<br/^>Analytics ^& Adaptation]>> temp_system.mmd
echo     end>> temp_system.mmd
echo.>> temp_system.mmd
echo     %% Client connections>> temp_system.mmd
echo     CLI --^> FASTAPI>> temp_system.mmd
echo     WEB --^> FASTAPI>> temp_system.mmd
echo     API_CLIENT --^> FASTAPI>> temp_system.mmd
echo.>> temp_system.mmd
echo     %% API Gateway processing>> temp_system.mmd
echo     FASTAPI --^> AUTH>> temp_system.mmd
echo     AUTH --^> RATE>> temp_system.mmd
echo     RATE --^> ORCH>> temp_system.mmd
echo ```>> temp_system.mmd

mmdc -i temp_system.mmd -o diagrams/system-architecture.png -w 1200 -H 800

echo Cleaning up temporary files...
del temp_system.mmd

echo Done! Check the diagrams folder for PNG images.
pause