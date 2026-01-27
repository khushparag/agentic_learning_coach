# Onboarding Components

This directory contains the enhanced onboarding components for the Agentic Learning Coach web UI.

## Components

### GoalSetupWizard
- **Purpose**: Allows users to select their learning goals from a curated list
- **Features**: 
  - Search and filter functionality
  - Category-based organization
  - Detailed goal information with prerequisites
  - Estimated time calculations
- **Props**: `selectedGoals`, `onGoalsChange`, `onValidationChange`

### SkillAssessmentInterface
- **Purpose**: Provides skill level assessment through quick selection or interactive quiz
- **Features**:
  - Quick skill level selection (Beginner, Intermediate, Advanced, Expert)
  - Interactive assessment with timed questions
  - Category-based scoring (JavaScript, React, etc.)
  - Detailed results with recommendations
- **Props**: `skillLevel`, `onSkillLevelChange`, `onValidationChange`

### TechStackSelection
- **Purpose**: Enables users to select technologies they want to learn
- **Features**:
  - Search and filter by category/difficulty
  - Technology recommendations based on selections
  - Prerequisites warnings
  - Popularity indicators
  - Comprehensive tech stack coverage
- **Props**: `selectedTechStack`, `onTechStackChange`, `onValidationChange`

## Main Onboarding Flow

The main `Onboarding.tsx` component orchestrates the entire onboarding process:

1. **Goal Setup** - Select learning objectives
2. **Tech Stack** - Choose technologies to focus on
3. **Skill Assessment** - Determine current skill level
4. **Time Constraints** - Set availability and schedule preferences
5. **Learning Preferences** - Configure learning style and pace

## API Integration

The onboarding flow integrates with the backend through:
- `onboardingService.setGoals()` - Save goals and constraints
- `onboardingService.createCurriculum()` - Generate personalized curriculum
- `onboardingService.activateCurriculum()` - Activate the learning path

## Validation

Each step includes comprehensive validation:
- Real-time validation feedback
- Step-by-step validation indicators
- Final validation before completion
- Error handling with user-friendly messages

## TypeScript Types

All components use strict TypeScript types defined in `types/onboarding.ts`:
- `OnboardingData` - Complete onboarding form data
- `SkillAssessmentQuestion` - Assessment question structure
- `TechStackOption` - Technology option with metadata
- `GoalOption` - Learning goal with details
- `ValidationError` - Error handling structure

## Testing

Comprehensive test coverage includes:
- Component rendering tests
- User interaction flows
- API integration mocking
- Validation logic testing
- Complete onboarding flow testing

## Usage

```tsx
import Onboarding from './pages/onboarding/Onboarding'

// The component handles all internal state and navigation
<Onboarding />
```

The onboarding component automatically:
- Manages multi-step form state
- Validates each step before progression
- Integrates with backend APIs
- Navigates to dashboard upon completion
- Handles errors gracefully

## Styling

Components use Tailwind CSS with:
- Responsive design for all screen sizes
- Consistent color scheme and spacing
- Accessible focus states and interactions
- Loading states and animations
- Error and success state styling