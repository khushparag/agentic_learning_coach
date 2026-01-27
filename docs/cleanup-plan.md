# Codebase Cleanup Plan

## Executive Summary

This document outlines a comprehensive cleanup plan for the Agentic Learning Coach codebase to eliminate duplications, consolidate similar implementations, and improve overall code organization. The analysis identified several categories of duplications and structural issues that need to be addressed.

## Analysis Results

### 1. Duplicate Runner Service Directories

**Issue**: Two nearly identical runner service implementations
- `runner-service/` (hyphenated)
- `runner_service/` (underscored)

**Analysis**: 
- Both contain identical API endpoints and functionality
- Main difference is import path handling (`runner-service.app.api` vs `runner_service.app.api`)
- `runner_service/` has better path resolution with `sys.path.insert(0, str(project_root))`

**Recommendation**: **CONSOLIDATE** - Keep `runner_service/` and remove `runner-service/`
- Reason: Better import path handling and follows Python naming conventions

### 2. Duplicate Content Services

**Issue**: Two content services with overlapping functionality
- `frontend/src/services/contentService.ts` - Basic LLM content generation
- `frontend/src/services/learningContentService.ts` - Enriched structured lessons

**Analysis**:
- `contentService.ts`: Simple content generation, concept explanations, basic caching
- `learningContentService.ts`: Structured lessons, progress tracking, knowledge checks, notes
- Different purposes but some overlap in content generation

**Recommendation**: **KEEP BOTH** but refactor for clear separation
- `contentService.ts` → Basic content generation utilities
- `learningContentService.ts` → Structured lesson management
- Extract common caching logic to shared utility

### 3. Massive Skill Directory Duplication

**Issue**: 25+ duplicate `skills/browser-use/` directories across AI tool folders
- `.agent/skills/browser-use/`
- `.claude/skills/browser-use/`
- `.cursor/skills/browser-use/`
- ... (22 more similar directories)

**Analysis**: Each AI tool has its own copy of identical browser-use skill
**Recommendation**: **CONSOLIDATE** - Keep only `skills/browser-use/` and `.kiro/skills/browser-use/`

### 4. Web UI Directory Duplication

**Issue**: Two frontend directories
- `frontend/` - Full-featured React app with comprehensive functionality
- `web-ui/` - Basic React setup with minimal dependencies

**Analysis**:
- `frontend/` is the main application (comprehensive, 50+ components)
- `web-ui/` appears to be an early prototype or alternative implementation
- No cross-references found in main application

**Recommendation**: **REMOVE** `web-ui/` directory (archive first)

### 5. Task Completion Summary Files

**Issue**: 26 `TASK_*_COMPLETION_SUMMARY.md` files in frontend directory
**Analysis**: Historical documentation that clutters the main codebase
**Recommendation**: **ARCHIVE** - Move to `docs/task-summaries/` directory

### 6. Frontend Component Duplications

**Issue**: Duplicate Toast components in different locations
- `frontend/src/components/notifications/Toast.tsx`
- `frontend/src/components/ui/Toast.tsx`
- `frontend/src/components/notifications/ToastContainer.tsx`
- `frontend/src/components/ui/ToastContainer.tsx`

**Analysis**: Same functionality implemented in two different component directories
**Recommendation**: **CONSOLIDATE** - Keep UI versions, update imports

### 7. API/Types File Confusion

**Issue**: Similar names with different purposes
- `frontend/src/services/api.ts` (API client service)
- `frontend/src/types/api.ts` (API type definitions)

**Analysis**: Different purposes but confusing naming
**Recommendation**: **RENAME** - Rename types file to `apiTypes.ts` for clarity

### 8. Settings File Duplications

**Issue**: Multiple settings.py files with different purposes
- `src/adapters/api/settings.py` (API configuration)
- `src/adapters/api/routers/settings.py` (Settings router)
- `src/adapters/database/settings.py` (Database configuration)

**Analysis**: Different purposes, appropriately separated
**Recommendation**: **KEEP ALL** - These serve different architectural layers

### 9. Docker Configuration Files

**Issue**: Multiple docker-compose override files
- `docker-compose.override.yml`
- `docker-compose.staging.yml` 
- `docker-compose.prod.yml`
- `docker-compose.monitoring.yml`

**Analysis**: These serve different purposes and should be kept
**Recommendation**: **KEEP ALL** - These are environment-specific configurations

## Cleanup Actions Plan

### Phase 1: Safe Removals (Low Risk)

#### 1.1 Remove Duplicate Skill Directories
```bash
# Keep only: skills/browser-use/ and .kiro/skills/browser-use/
# Remove all others:
rm -rf .agent/skills/browser-use/
rm -rf .claude/skills/browser-use/
rm -rf .cursor/skills/browser-use/
# ... (continue for all 22+ duplicates)
```

**Impact**: Reduces repository size, eliminates confusion
**Risk**: Low - these are tool-specific duplicates

#### 1.2 Archive Task Completion Summaries
```bash
mkdir -p docs/task-summaries
mv frontend/TASK_*_COMPLETION_SUMMARY.md docs/task-summaries/
```

**Impact**: Cleaner frontend directory structure
**Risk**: Low - historical documentation

#### 1.3 Remove Web-UI Directory
```bash
# Archive first
mkdir -p archive/
mv web-ui/ archive/web-ui-$(date +%Y%m%d)/
```

**Impact**: Eliminates confusion about which frontend to use
**Risk**: Low - appears to be unused prototype

### Phase 2: Code Consolidation (Medium Risk)

#### 2.1 Consolidate Runner Services
```bash
# Remove the hyphenated version
rm -rf runner-service/
```

**Impact**: Single source of truth for code execution service
**Risk**: Medium - need to verify no references to old path

#### 2.2 Refactor Content Services
- Extract common caching logic to `frontend/src/utils/contentCache.ts`
- Update imports and ensure clear separation of concerns
- Add JSDoc comments to clarify each service's purpose

#### 2.3 Consolidate Toast Components
```bash
# Remove duplicate toast components from notifications directory
rm frontend/src/components/notifications/Toast.tsx
rm frontend/src/components/notifications/ToastContainer.tsx
# Update imports to use UI versions
```

**Impact**: Single source of truth for toast functionality
**Risk**: Medium - need to update all import references

#### 2.4 Rename API Types File
```bash
# Rename for clarity
mv frontend/src/types/api.ts frontend/src/types/apiTypes.ts
```

**Impact**: Clearer distinction between API service and types
**Risk**: Low - simple rename with import updates

### Phase 3: Verification & Testing (Critical)

#### 3.1 Update Import References
- Search for any imports referencing removed paths
- Update docker-compose files if needed
- Update documentation references

#### 3.2 Run Test Suite
- Execute full test suite after each phase
- Verify all services start correctly
- Check that no functionality is broken

## Implementation Strategy

### Step-by-Step Execution

1. **Create Archive Directory**
   ```bash
   mkdir -p archive/$(date +%Y%m%d)
   ```

2. **Phase 1 Execution** (Can be done in parallel)
   - Remove duplicate skills directories
   - Archive task summaries
   - Archive web-ui directory

3. **Verification Checkpoint**
   - Run tests
   - Verify application starts
   - Check for broken imports

4. **Phase 2 Execution** (Sequential)
   - Remove runner-service directory
   - Refactor content services
   - Update any references

5. **Final Verification**
   - Full test suite
   - Manual smoke testing
   - Documentation updates

## Risk Mitigation

### Backup Strategy
- Create full backup before starting: `git tag cleanup-backup-$(date +%Y%m%d)`
- Archive removed directories instead of permanent deletion
- Commit changes in small, logical chunks

### Rollback Plan
- Each phase should be a separate commit
- If issues arise, rollback to previous commit
- Archived directories can be restored if needed

### Testing Requirements
- All existing tests must pass
- Manual verification of key workflows
- Docker containers must build and start successfully

## Expected Benefits

### Immediate Benefits
- **Reduced Repository Size**: ~50MB reduction from duplicate removals
- **Cleaner Directory Structure**: Easier navigation and understanding
- **Reduced Confusion**: Single source of truth for each component

### Long-term Benefits
- **Easier Maintenance**: Fewer duplicate files to maintain
- **Better Developer Experience**: Clear project structure
- **Improved CI/CD**: Faster builds due to smaller codebase

## Files to be Removed/Modified

### Directories to Remove
- `runner-service/` (25 files)
- `web-ui/` (15 files)
- 22+ duplicate `*/skills/browser-use/` directories
- Various empty or minimal AI tool directories

### Files to Archive
- 26 `frontend/TASK_*_COMPLETION_SUMMARY.md` files

### Files to Refactor
- `frontend/src/services/contentService.ts`
- `frontend/src/services/learningContentService.ts`
- `frontend/src/components/notifications/Toast.tsx` (remove)
- `frontend/src/components/notifications/ToastContainer.tsx` (remove)
- `frontend/src/types/api.ts` (rename to `apiTypes.ts`)
- Any files importing from removed paths

## Success Criteria

1. **Functionality Preserved**: All existing features work as before
2. **Tests Pass**: Complete test suite passes
3. **Documentation Updated**: All references to removed files updated
4. **Clean Structure**: Logical, DRY directory organization
5. **No Broken Imports**: All import statements resolve correctly

## Timeline Estimate

- **Phase 1**: 2-3 hours (safe removals and archiving)
- **Phase 2**: 4-6 hours (code consolidation and refactoring)
- **Phase 3**: 2-3 hours (verification and testing)
- **Total**: 8-12 hours of focused work

## Next Steps

1. **User Approval**: Review and approve this cleanup plan
2. **Backup Creation**: Create safety backup of current state
3. **Phase 1 Execution**: Begin with low-risk removals
4. **Iterative Progress**: Execute phases with verification checkpoints
5. **Final Review**: Comprehensive testing and documentation updates

---

*This cleanup plan prioritizes safety and maintainability while eliminating technical debt and improving code organization.*