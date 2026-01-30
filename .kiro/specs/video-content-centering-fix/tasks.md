# Video Content Centering Fix - Tasks

## Task 1: Fix UserJourneySection Centering
Apply centered container structure to all sub-components in UserJourneySection.

### Subtasks:
- [ ] 1.1 Fix OnboardingDemo centering (2-30s)
- [ ] 1.2 Fix CurriculumDemo centering (30-60s)
- [ ] 1.3 Fix InteractiveLearningDemo centering (60-90s)
- [ ] 1.4 Fix ProgressGamificationDemo centering (90-110s)
- [ ] 1.5 Fix JourneyConclusion centering (110-120s)
- [ ] 1.6 Run TypeScript diagnostics on UserJourneySection.tsx
- [ ] 1.7 Verify JSX structure (matching tags)

**Details**:
- File: `video-project/src/sections/UserJourneySection.tsx`
- Pattern: Apply outer absolute container + inner centered container (maxWidth: 1600px)
- Each sub-component needs the two-layer container structure
- Preserve existing content and animations
- Add opacity interpolation for fade-in/fade-out

## Task 2: Fix DevelopmentExcellenceSection Centering
Apply centered container structure to all sub-components in DevelopmentExcellenceSection.

### Subtasks:
- [ ] 2.1 Fix CleanArchitectureDemo centering (2-27s)
- [ ] 2.2 Fix QualityProcessesDemo centering (27-54s)
- [ ] 2.3 Fix SpecDrivenDevelopmentDemo centering (54-81s)
- [ ] 2.4 Fix ExcellenceSummary centering (81-90s)
- [ ] 2.5 Run TypeScript diagnostics on DevelopmentExcellenceSection.tsx
- [ ] 2.6 Verify JSX structure (matching tags)

**Details**:
- File: `video-project/src/sections/DevelopmentExcellenceSection.tsx`
- Pattern: Apply outer absolute container + inner centered container (maxWidth: 1600px)
- Each sub-component already has some opacity interpolation - preserve it
- Ensure proper z-index isolation between sequences
- Add centered container wrapper to existing content

## Task 3: Fix OpenSourceImpactSection Centering
Apply centered container structure to all content sections in OpenSourceImpactSection.

### Subtasks:
- [ ] 3.1 Fix Introduction section centering (0-8s)
- [ ] 3.2 Fix Documentation Showcase centering (8-18s)
- [ ] 3.3 Fix Testing Infrastructure centering (18-28s)
- [ ] 3.4 Fix Modular Architecture centering (28-38s)
- [ ] 3.5 Fix Educational Value centering (38-48s)
- [ ] 3.6 Fix Community Impact Conclusion centering (48-60s)
- [ ] 3.7 Run TypeScript diagnostics on OpenSourceImpactSection.tsx
- [ ] 3.8 Verify JSX structure (matching tags)

**Details**:
- File: `video-project/src/sections/OpenSourceImpactSection.tsx`
- Pattern: Wrap AbsoluteFill content with centered container
- Each section uses AbsoluteFill - add centered wrapper inside
- Preserve existing grid layouts and styling
- Ensure content doesn't overflow on left/right sides

## Task 4: Validation and Testing
Verify all fixes are working correctly.

### Subtasks:
- [ ] 4.1 Run TypeScript diagnostics on all three files
- [ ] 4.2 Verify no compilation errors
- [ ] 4.3 Test video rendering at timestamp 5:10
- [ ] 4.4 Test video rendering at timestamp 6:00
- [ ] 4.5 Test video rendering at timestamp 7:30
- [ ] 4.6 Test video rendering at timestamp 9:00
- [ ] 4.7 Verify content is centered and visible at all timestamps
- [ ] 4.8 User acceptance testing

**Details**:
- Use `getDiagnostics` tool to check for TypeScript errors
- Visually inspect rendered video frames
- Confirm no content is cut off on left or right sides
- Verify consistent centering across all sections

## Implementation Notes

### Centering Pattern Template
```typescript
<div style={{
  position: 'absolute',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: `${Spacing.xl}px ${Spacing.xxxl}px`
}}>
  <div style={{
    display: 'flex',
    gap: Spacing.xxxl,
    width: '100%',
    maxWidth: '1600px',
    alignItems: 'flex-start',
    opacity: interpolate(
      relativeFrame,
      [0, 30, endFrame - 30, endFrame],
      [0, 1, 1, 0],
      { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
    )
  }}>
    {/* Existing content here */}
  </div>
</div>
```

### JSX Structure Checklist
For each sub-component:
1. Count opening `<div>` tags
2. Count closing `</div>` tags
3. Ensure they match
4. Verify all JSX elements are properly closed
5. Check for any syntax errors

### Testing Commands
```bash
# Run TypeScript diagnostics
npm run type-check

# Test video rendering (if available)
npm run preview
```

## Success Criteria
- All tasks and subtasks completed
- No TypeScript compilation errors
- Content is centered and fully visible from timestamp 5:10 onwards
- User confirms the fix resolves the issue
- Video renders successfully without errors
