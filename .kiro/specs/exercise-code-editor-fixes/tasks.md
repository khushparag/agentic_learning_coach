# Tasks: Exercise Code Editor Bug Fixes

## Overview

Implementation tasks to fix the exercise code editor issues where problem statements are missing and code execution doesn't work.

## Tasks

### Phase 1: Backend Code Execution Endpoint

- [x] 1. Create code execution router
  - Create `src/adapters/api/routers/code_execution.py`
  - Implement `POST /api/v1/code/execute` endpoint
  - Implement `GET /api/v1/code/languages` endpoint
  - Add request/response models with validation
  - Proxy requests to runner service at `CODE_RUNNER_URL`
  - Add fallback execution with basic syntax validation
  - _Requirements: Story 4_

- [x] 2. Register code execution router
  - Import router in `src/adapters/api/main.py`
  - Add `app.include_router(code_execution_router)`
  - Verify router is accessible at `/api/v1/code/*`
  - _Requirements: Story 4_

### Phase 2: Frontend Exercise Content Generation

- [x] 3. Improve convertTaskToExercise function
  - Generate meaningful starter code with JSDoc comments
  - Create examples from task requirements
  - Generate test cases from requirements
  - Add helpful hints array
  - Include `starter_code` property with `main.js` file
  - _Requirements: Story 1_

### Phase 3: Frontend API Integration

- [x] 4. Update handleSubmit to call backend API
  - POST to `/api/v1/submissions` endpoint
  - Transform backend response to Evaluation format
  - Handle API errors gracefully
  - Fall back to local evaluation if backend unavailable
  - _Requirements: Story 3_

- [x] 5. Update handleTest to call backend API
  - POST to `/api/v1/code/execute` endpoint
  - Display actual execution results
  - Handle API errors gracefully
  - Fall back to local syntax validation if backend unavailable
  - _Requirements: Story 2_

### Phase 4: Testing and Verification

- [ ] 6. Test code execution endpoint
  - Start runner service on port 8001
  - Start backend API
  - Test `/api/v1/code/execute` with sample code
  - Verify response format matches frontend expectations
  - Test fallback when runner unavailable
  - _Requirements: Story 2, Story 4_

- [ ] 7. Test frontend integration
  - Start frontend with correct `VITE_API_URL`
  - Navigate to exercises page
  - Verify problem statement is displayed
  - Test "Test Code" button
  - Test "Submit Solution" button
  - Verify feedback is displayed correctly
  - _Requirements: Story 1, Story 2, Story 3_

- [ ] 8. Test fallback behavior
  - Stop runner service
  - Verify backend returns fallback response
  - Verify frontend shows local validation results
  - Stop backend API
  - Verify frontend falls back to local evaluation
  - _Requirements: Story 2, Story 3_

### Phase 5: Documentation and Cleanup

- [ ] 9. Update API documentation
  - Add code execution endpoints to `docs/API_REFERENCE.md`
  - Document request/response formats
  - Document environment variables
  - _Requirements: Story 4_

- [ ] 10. Add integration tests
  - Test code execution router with mock runner
  - Test frontend API calls with mock backend
  - Test complete exercise flow E2E
  - _Requirements: All Stories_

## Implementation Status

### Completed
- ✅ Task 1: Code execution router created
- ✅ Task 2: Router registered in main.py
- ✅ Task 3: convertTaskToExercise improved with JSDoc, examples, test cases
- ✅ Task 4: handleSubmit updated to call `/api/v1/submissions` with fallback
- ✅ Task 5: handleTest updated to call `/api/v1/code/execute` with fallback
- ✅ Task 5.1: Fixed environment variable name (VITE_API_URL → VITE_API_BASE_URL)

### Ready for Testing
- ⏳ Task 6: Test code execution endpoint
- ⏳ Task 7: Test frontend integration
- ⏳ Task 8: Test fallback behavior

### Documentation & Tests (Optional)
- ⏳ Task 9: Update API documentation
- ⏳ Task 10: Add integration tests

## Files Modified

### Backend
- `src/adapters/api/routers/code_execution.py` - NEW
- `src/adapters/api/main.py` - MODIFIED

### Frontend
- `frontend/src/pages/exercises/Exercises.tsx` - MODIFIED

## Environment Setup for Testing

### Start Services

```bash
# Terminal 1: Start runner service
cd runner_service
python -m uvicorn app.api:app --host 0.0.0.0 --port 8001

# Terminal 2: Start backend API
python -m uvicorn src.adapters.api.main:app --host 0.0.0.0 --port 8000

# Terminal 3: Start frontend
cd frontend
npm run dev
```

### Environment Variables

```bash
# Backend (.env)
CODE_RUNNER_URL=http://localhost:8001

# Frontend (.env.development)
VITE_API_BASE_URL=http://localhost:8000
```

## How to Start Services

### Option 1: Start All Services Manually

```bash
# Terminal 1: Start runner service (port 8001)
cd runner_service
python -m uvicorn app.api:app --host 0.0.0.0 --port 8001 --reload

# Terminal 2: Start backend API (port 8000)
python -m uvicorn src.adapters.api.main:app --host 0.0.0.0 --port 8000 --reload

# Terminal 3: Start frontend (port 3000)
cd frontend
npm run dev
```

### Option 2: Using Docker Compose

```bash
# Start all services
docker-compose up

# Or start specific services
docker-compose up runner backend frontend
```

### Option 3: Using Make (if available)

```bash
make dev
```

## Success Criteria

- [ ] Problem statement visible when opening exercise
- [ ] "Test Code" executes code and shows results
- [ ] "Submit Solution" evaluates code and shows feedback
- [ ] Fallback works when backend unavailable
- [ ] No console errors during normal operation
- [ ] Response times within acceptable limits

## Notes

- The runner service must be running for full code execution
- The backend provides fallback syntax validation when runner unavailable
- The frontend provides fallback local evaluation when backend unavailable
- All changes are backward compatible with existing functionality
