# Requirements: Exercise Code Editor Bug Fixes

## Overview

This spec addresses bugs discovered in the exercises page where the problem statement is missing in the code editor and users cannot run or test code. These issues were found after tasks 14-16 of the web-ui spec were marked complete.

## Problem Statement

When users navigate to the exercises page and try to work on coding exercises:
1. The problem statement/instructions are not properly displayed in the code editor interface
2. The "Test Code" and "Submit Solution" buttons do not execute code against the backend
3. The code execution relies on mock implementations instead of the actual runner service

## User Stories

### Story 1: View Complete Problem Statement
**As a** learner  
**I want to** see the complete problem statement and requirements when I open an exercise  
**So that** I understand what I need to implement

**Acceptance Criteria:**
- [ ] Exercise title and description are prominently displayed
- [ ] Requirements list is clearly visible
- [ ] Code examples are shown with proper syntax highlighting
- [ ] Starter code is pre-populated in the editor with helpful comments
- [ ] Hints are accessible but not immediately visible

### Story 2: Test Code Against Backend
**As a** learner  
**I want to** test my code and see real execution results  
**So that** I can verify my solution works before submitting

**Acceptance Criteria:**
- [ ] "Test Code" button sends code to `/api/v1/code/execute` endpoint
- [ ] Execution results show actual output, errors, and execution time
- [ ] Test case results are displayed with pass/fail status
- [ ] Fallback to local syntax validation when backend is unavailable
- [ ] Loading state is shown during code execution

### Story 3: Submit Code for Evaluation
**As a** learner  
**I want to** submit my solution and receive detailed feedback  
**So that** I can learn from my mistakes and improve

**Acceptance Criteria:**
- [ ] "Submit Solution" button sends code to `/api/v1/submissions` endpoint
- [ ] Evaluation results show overall score and test results
- [ ] Feedback includes correctness, code quality, and suggestions
- [ ] Progress is updated after successful submission
- [ ] Fallback to local evaluation when backend is unavailable

### Story 4: Seamless Backend Integration
**As a** developer  
**I want** the frontend to properly integrate with the code execution backend  
**So that** users get real code execution results

**Acceptance Criteria:**
- [ ] Code execution router is registered in FastAPI main.py
- [ ] Router proxies requests to runner service at `CODE_RUNNER_URL`
- [ ] Proper error handling when runner service is unavailable
- [ ] Response format matches frontend expectations
- [ ] CORS is properly configured for frontend requests

## Technical Requirements

### Frontend Changes (Exercises.tsx)
1. **convertTaskToExercise function**: Generate meaningful exercise content
   - Create proper starter code with JSDoc comments
   - Generate examples from task requirements
   - Create test cases from requirements
   - Include helpful hints

2. **handleSubmit function**: Connect to backend API
   - POST to `/api/v1/submissions` endpoint
   - Transform response to Evaluation format
   - Fallback to local evaluation if backend unavailable

3. **handleTest function**: Connect to code execution API
   - POST to `/api/v1/code/execute` endpoint
   - Display actual execution results
   - Fallback to local syntax validation if backend unavailable

### Backend Changes (code_execution.py)
1. Create new router at `/api/v1/code`
2. Implement `/execute` endpoint that proxies to runner service
3. Implement `/languages` endpoint for supported languages
4. Add fallback execution with basic syntax validation
5. Register router in main.py

### Environment Configuration
- `VITE_API_URL`: Frontend API base URL
- `CODE_RUNNER_URL`: Backend runner service URL (default: http://localhost:8001)

## Dependencies

- Runner service must be running at port 8001
- Backend API must be running at configured URL
- Frontend must have correct `VITE_API_URL` environment variable

## Testing Requirements

### Unit Tests
- [ ] Test convertTaskToExercise generates valid exercise structure
- [ ] Test handleSubmit with mock API responses
- [ ] Test handleTest with mock API responses
- [ ] Test fallback behavior when backend unavailable

### Integration Tests
- [ ] Test code execution endpoint with runner service
- [ ] Test submission endpoint with evaluation
- [ ] Test frontend-to-backend communication

### E2E Tests
- [ ] Complete exercise flow: view → code → test → submit
- [ ] Verify feedback is displayed correctly
- [ ] Test error handling and fallback behavior

## Success Metrics

- Code execution responds within 5 seconds
- Problem statement is visible within 1 second of page load
- Test results display within 2 seconds of clicking "Test Code"
- Submission feedback displays within 3 seconds of clicking "Submit"
- Fallback mode activates gracefully when backend unavailable

## References

- Steering: `04_workflows_intents_routing.md` - Exercise submission workflow
- Steering: `05_tools_mcp_discipline.md` - Code runner service integration
- Steering: `11_demo_script_acceptance.md` - Demo success criteria
- Existing: `runner_service/app/api.py` - Runner service API
- Existing: `src/adapters/api/routers/submissions.py` - Submissions router
