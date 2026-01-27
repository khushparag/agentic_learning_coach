# Implementation Plan: Property-Based Tests and Docker Execution

## Overview

This implementation plan addresses the two minor gaps in the Agentic Learning Coach system by implementing property-based tests for all 30 defined correctness properties and completing the Docker-based code execution functionality. The tasks are organized to deliver incremental value, starting with the most critical Docker execution features, followed by comprehensive property-based testing.

## Tasks

- [x] 1. Set up property-based testing infrastructure
  - Install Hypothesis library and pytest-hypothesis plugin
  - Create property test directory structure (tests/property/)
  - Configure Hypothesis profiles for dev, CI, and production
  - Create shared fixtures and custom strategies in conftest.py
  - _Requirements: 1.1, 1.2_

- [x] 1.1 Write property test for test configuration
  - **Property: Test Configuration Validation**
  - Verify that all property tests are configured with minimum 100 iterations
  - **Validates: Requirements 1.2**

- [ ] 2. Complete Docker Runner implementation
  - [x] 2.1 Implement Docker client initialization with error handling
    - Add Docker availability check with clear error messages
    - Implement fallback to static analysis when Docker unavailable
    - Create DockerNotAvailableError exception class
    - _Requirements: 2.6, 6.3_

  - [x] 2.2 Write property test for Docker initialization
    - **Property 1: Container Isolation for All Code**
    - **Validates: Requirements 2.1**

  - [x] 2.3 Implement container execution with resource limits
    - Configure memory limits (256MB default)
    - Configure CPU limits (50% of one CPU)
    - Configure timeout limits (10 seconds default)
    - Disable network access by default
    - _Requirements: 2.1, 2.3, 2.4, 2.5_
    - **VERIFIED**: Already implemented in `_execute_in_container` method

  - [x] 2.4 Write property tests for resource limits
    - **Property 2: Timeout Enforcement**
    - **Property 3: Memory Limit Enforcement**
    - **Property 4: Network Access Blocking**
    - **Validates: Requirements 2.3, 2.4, 2.5**

  - [x] 2.5 Implement security configuration for containers
    - Add security options (no-new-privileges:true)
    - Drop all capabilities (cap-drop ALL)
    - Configure read-only root filesystem
    - Set up tmpfs for /tmp with size limits
    - Run as non-root user (nobody)
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_
    - **VERIFIED**: Already implemented in container_config in `_execute_in_container`

  - [x] 2.6 Write property tests for container security
    - **Property 9: Container Security Configuration**
    - **Property 10: Read-Only Volume Mounting**
    - **Property 11: Tmpfs Configuration**
    - **Property 12: Non-Root User Execution**
    - **Validates: Requirements 5.2, 5.3, 5.4, 5.5**

- [ ] 3. Implement language-specific test runners
  - [x] 3.1 Create Python test runner generator
    - Generate test harness that imports user code
    - Execute test cases and capture results
    - Return JSON-formatted test results
    - Handle exceptions and provide error details
    - _Requirements: 2.2_
    - **VERIFIED**: Already implemented in `_generate_python_test_runner`

  - [x] 3.2 Create JavaScript/TypeScript test runner generator
    - Generate test harness for Node.js
    - Execute test cases and capture results
    - Return JSON-formatted test results
    - Handle exceptions and provide error details
    - _Requirements: 2.2_
    - **VERIFIED**: Already implemented in `_generate_js_test_runner`

  - [x] 3.3 Write unit tests for test runner generation
    - Test Python test runner generation
    - Test JavaScript test runner generation
    - Verify JSON output format
    - _Requirements: 2.2_

- [ ] 4. Integrate security validation with Docker execution
  - [x] 4.1 Update SecureCodeRunner to use Security Validator before execution
    - Call security validator before creating container
    - Reject execution if critical violations found
    - Return violation details in result
    - _Requirements: 3.1, 3.2_
    - **VERIFIED**: Already implemented in `execute_code` method

  - [x] 4.2 Write property tests for security integration
    - **Property 5: Security Scanning Before Execution**
    - **Property 6: Critical Violation Rejection**
    - **Property 7: Security Violation Logging**
    - **Validates: Requirements 3.1, 3.2, 3.4**

  - [x] 4.3 Add security violation logging
    - Log all detected violations with timestamp
    - Include user ID, code snippet, and violation type
    - Store logs for audit purposes
    - _Requirements: 3.4_

- [x] 5. Checkpoint - Docker execution is working
  - Docker containers execute code with proper isolation
  - Resource limits are enforced
  - Security validation prevents malicious code execution
  - Test runners work for Python, JavaScript, and TypeScript
  - **STATUS**: All Docker execution features implemented and tested

- [x] 6. Implement property tests for agent operations
  - [x] 6.1 Create custom strategies for domain objects
    - UserProfile strategy with valid skill levels and goals
    - LearningPlan strategy with modules and tasks
    - CodeSubmission strategy with valid code and test cases
    - _Requirements: 4.1, 4.2_

  - [x] 6.2 Implement ProfileAgent property tests
    - **Property 1: Goal Intent Extraction Completeness** (from main design)
    - **Property 2: Clarifying Question Generation** (from main design)
    - Test with randomly generated user inputs
    - _Requirements: 4.2_

  - [x] 6.3 Implement CurriculumPlannerAgent property tests
    - **Property 4: Curriculum Generation Consistency** (from main design)
    - **Property 5: Mini-project Inclusion** (from main design)
    - **Property 6: Progressive Difficulty Ordering** (from main design)
    - Test with randomly generated user profiles
    - _Requirements: 4.3_

  - [x] 6.4 Implement ExerciseGeneratorAgent property tests
    - **Property 10: Task Metadata Completeness** (from main design)
    - Test with randomly generated topics and difficulty levels
    - _Requirements: 4.2_

  - [x] 6.5 Implement ReviewerAgent property tests
    - **Property 11: Code Submission Validation** (from main design)
    - Test with randomly generated code submissions
    - _Requirements: 4.2_

- [x] 7. Implement property tests for database operations
  - [x] 7.1 Implement database round-trip property tests
    - **Property 3: Profile Data Persistence Round-trip** (from main design)
    - **Property 13: Evaluation Result Persistence** (from main design)
    - Test with randomly generated domain entities
    - _Requirements: 4.2_

  - [x] 7.2 Implement database integrity property tests
    - **Property 7: Database Normalization Integrity** (from main design)
    - **Property 24: Database Constraint Enforcement** (from main design)
    - Test foreign key relationships and constraints
    - _Requirements: 4.2_

  - [x] 7.3 Implement progress tracking property tests
    - **Property 14: Progress Update Consistency** (from main design)
    - **Property 19: Progress Calculation Accuracy** (from main design)
    - Test with randomly generated progress data
    - _Requirements: 4.2_

- [x] 8. Implement property tests for orchestration and routing
  - [x] 8.1 Implement intent routing property tests
    - **Property 20: Intent Routing Correctness** (from main design)
    - Test with randomly generated user intents
    - Verify correct agent selection
    - _Requirements: 4.2_

  - [x] 8.2 Implement multi-agent workflow property tests
    - **Property 21: Multi-agent Workflow Coordination** (from main design)
    - Test complex workflows with multiple agents
    - _Requirements: 4.2_

  - [x] 8.3 Implement error recovery property tests
    - **Property 22: Agent Failure Recovery** (from main design)
    - Test with simulated agent failures
    - Verify graceful degradation
    - _Requirements: 4.2_

- [x] 9. Implement property tests for resource discovery
  - [x] 9.1 Implement resource discovery property tests
    - **Property 17: Resource Discovery and Prioritization** (from main design)
    - Test with randomly generated topic queries
    - Verify resource ranking and quality
    - _Requirements: 4.2_

  - [x] 9.2 Implement resource caching property tests
    - **Property 18: Resource Caching Behavior** (from main design)
    - Test cache hit/miss behavior
    - Verify cache freshness
    - _Requirements: 4.2_

  - [x] 9.3 Implement resource attachment property tests
    - **Property 9: Resource Attachment Completeness** (from main design)
    - Test that all tasks have resources attached
    - _Requirements: 4.2_

- [x] 10. Implement property tests for curriculum adaptation
  - [x] 10.1 Implement adaptation trigger property tests
    - **Property 15: Adaptation Trigger Detection** (from main design)
    - Test with sequences of performance data
    - Verify correct pattern detection
    - _Requirements: 4.2_

  - [x] 10.2 Implement curriculum adaptation property tests
    - **Property 16: Curriculum Adaptation Logic** (from main design)
    - Test difficulty adjustments
    - Verify curriculum coherence maintained
    - _Requirements: 4.2_

  - [x] 10.3 Implement daily task retrieval property tests
    - **Property 8: Daily Task Retrieval Accuracy** (from main design)
    - Test with various day offsets
    - Verify correct task filtering
    - _Requirements: 4.2_

- [x] 11. Implement property tests for security and validation
  - [x] 11.1 Implement code validation property tests
    - **Property 26: Code Validation and Sanitization** (from main design)
    - Test with randomly generated code containing dangerous patterns
    - Verify all patterns are detected
    - _Requirements: 3.3, 4.4_

  - [x] 11.2 Implement container isolation property tests
    - **Property 27: Container Security Isolation** (from main design)
    - Test that containers cannot access system resources
    - Verify isolation between executions
    - _Requirements: 4.4_

  - [x] 11.3 Implement secure execution property tests
    - **Property 12: Secure Code Execution Isolation** (from main design)
    - Test resource limits and isolation
    - Verify no cross-contamination between executions
    - _Requirements: 4.4_

- [x] 12. Implement property tests for API layer
  - [x] 12.1 Implement API validation property tests
    - **Property 29: API Input Validation and Response Structure** (from main design)
    - Test with randomly generated API requests
    - Verify input validation and response format
    - _Requirements: 4.2_

  - [x] 12.2 Implement API compatibility property tests
    - **Property 30: Multi-client API Compatibility** (from main design)
    - Test API endpoints with different client types
    - _Requirements: 4.2_

- [x] 13. Implement property tests for configuration and deployment
  - [x] 13.1 Implement environment configuration property tests
    - **Property 28: Environment Configuration Usage** (from main design)
    - Test that all configuration uses environment variables
    - Verify no hardcoded secrets
    - _Requirements: 4.2_

  - [x] 13.2 Implement database migration property tests
    - **Property 25: Database Migration Functionality** (from main design)
    - Test migration application and rollback
    - Verify data integrity maintained
    - _Requirements: 4.2_

  - [x] 13.3 Implement data storage architecture property tests
    - **Property 23: Data Storage Architecture Compliance** (from main design)
    - Test that transactional data goes to Postgres
    - Verify no transactional data in vector store
    - _Requirements: 4.2_

- [x] 14. Checkpoint - All property tests implemented
  - All 30 properties from main design have tests
  - All 12 properties from this design have tests
  - All tests run with minimum 100 iterations
  - Tests are properly tagged and documented

- [ ] 15. Add CI/CD integration for property tests
  - [ ] 15.1 Create GitHub Actions workflow for property tests
    - Configure property test job with Hypothesis CI profile
    - Set up Docker for container execution tests
    - Configure test result uploads
    - _Requirements: 6.1_

  - [ ] 15.2 Add property test reporting
    - Generate test coverage reports
    - Track property test execution times
    - Report counterexamples for failures
    - _Requirements: 1.4_

  - [ ] 15.3 Configure test environments
    - Set up development environment with fast iterations
    - Set up CI environment with comprehensive iterations
    - Document environment setup in README
    - _Requirements: 6.2, 6.5_

- [ ] 16. Create documentation and examples
  - [ ] 16.1 Document property-based testing approach
    - Explain property-based testing concepts
    - Provide examples of property tests
    - Document custom strategies
    - _Requirements: 6.5_

  - [ ] 16.2 Document Docker execution setup
    - Provide Docker installation instructions
    - Document container configuration
    - Explain security measures
    - _Requirements: 6.5_

  - [ ] 16.3 Create troubleshooting guide
    - Document common Docker issues
    - Provide solutions for property test failures
    - Include debugging tips
    - _Requirements: 6.3, 6.5_

- [ ] 17. Add health checks and monitoring
  - [ ] 17.1 Implement Docker availability health check
    - Check Docker daemon is running
    - Verify required images are available
    - Return clear status and error messages
    - _Requirements: 6.4_

  - [ ] 17.2 Add property test metrics
    - Track property test execution times
    - Monitor failure rates
    - Alert on unexpected failures
    - _Requirements: 4.5_

- [ ] 18. Final checkpoint - Complete system validation
  - All property tests passing with 100+ iterations
  - Docker execution working for Python, JavaScript, TypeScript
  - Security validation preventing malicious code
  - CI/CD pipeline running all tests
  - Documentation complete and accurate

## Notes

- Tasks marked with `*` are property-based tests that validate the implementation
- Each property test references its corresponding design property number
- Property tests should run with minimum 100 iterations (configurable via Hypothesis profiles)
- Docker execution tests require Docker to be installed and running
- Checkpoints ensure incremental validation and provide opportunities for user feedback
- All property tests should be tagged with feature name and property number for traceability

## Current Implementation Status

### Completed Components:
- Security Validator with malicious code detection
- Basic Docker Runner structure (currently mocked)
- Language configurations for Python, JavaScript, TypeScript
- Test runner generation framework

### Remaining Tasks:
1. **Docker Execution**: Replace mocked execution with actual Docker container execution
2. **Property Tests**: Implement all 42 property-based tests (30 from main design + 12 from this design)
3. **CI/CD Integration**: Add property tests to GitHub Actions workflow
4. **Documentation**: Complete setup guides and troubleshooting documentation

### Priority Order:
1. Complete Docker execution (Tasks 2-4) - Enables real code execution
2. Implement core property tests (Tasks 6-8) - Validates agent operations
3. Implement security property tests (Task 11) - Ensures system security
4. Complete remaining property tests (Tasks 9-10, 12-13) - Comprehensive validation
5. Add CI/CD and documentation (Tasks 15-17) - Production readiness
