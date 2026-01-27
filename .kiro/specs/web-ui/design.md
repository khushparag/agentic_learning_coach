# Design Document: Web UI for Agentic Learning Coach

## Overview

The Web UI provides a modern, responsive interface for the Agentic Learning Coach system. Built with React and TypeScript, it offers an intuitive user experience for goal setting, learning path visualization, progress tracking, and social learning features. The interface seamlessly integrates with the existing FastAPI backend and multi-agent system.

## Technology Stack

### Frontend Framework
- **React 18** with TypeScript for type safety and modern development
- **Vite** for fast development and optimized builds
- **React Router** for client-side routing and navigation
- **React Query (TanStack Query)** for API state management and caching

### UI Components and Styling
- **Tailwind CSS** for utility-first styling and responsive design
- **Headless UI** for accessible, unstyled UI components
- **Heroicons** for consistent iconography
- **Framer Motion** for smooth animations and transitions

### Code Editor and Visualization
- **Monaco Editor** (VS Code editor) for code editing with syntax highlighting
- **D3.js** or **Recharts** for data visualization and progress charts
- **React Flow** for learning path visualization and curriculum roadmaps

### State Management and API Integration
- **Zustand** for lightweight global state management
- **Axios** for HTTP client with interceptors and error handling
- **WebSocket** integration for real-time updates and notifications

## Architecture

### Component Architecture

```
src/
├── components/           # Reusable UI components
│   ├── ui/              # Basic UI components (Button, Input, Modal)
│   ├── forms/           # Form components and validation
│   ├── charts/          # Data visualization components
│   ├── editor/          # Code editor components
│   └── layout/          # Layout and navigation components
├── pages/               # Page-level components
│   ├── onboarding/      # Goal setup and onboarding flow
│   ├── dashboard/       # Main learning dashboard
│   ├── learning-path/   # Curriculum visualization
│   ├── exercises/       # Code exercises and submissions
│   ├── social/          # Social learning and challenges
│   ├── analytics/       # Progress analytics and insights
│   └── settings/        # Configuration and preferences
├── hooks/               # Custom React hooks
├── services/            # API integration and business logic
├── stores/              # Global state management
├── types/               # TypeScript type definitions
└── utils/               # Utility functions and helpers
```

### API Integration Layer

```typescript
// services/api.ts
import axios from 'axios';

const api = axios.create({
  baseURL: process.env.VITE_API_BASE_URL || 'http://localhost:8000',
  timeout: 10000,
});

// API service classes for each domain
export class GoalsService {
  static async createGoal(goal: CreateGoalRequest): Promise<Goal> {
    const response = await api.post('/api/v1/goals', goal);
    return response.data;
  }
  
  static async getGoals(userId: string): Promise<Goal[]> {
    const response = await api.get(`/api/v1/goals?user_id=${userId}`);
    return response.data;
  }
}

export class CurriculumService {
  static async createCurriculum(request: CreateCurriculumRequest): Promise<Curriculum> {
    const response = await api.post('/api/v1/curriculum', request);
    return response.data;
  }
  
  static async getCurriculum(userId: string): Promise<Curriculum> {
    const response = await api.get(`/api/v1/curriculum?user_id=${userId}`);
    return response.data;
  }
}

// Similar services for all 8 API domains
export class GamificationService { /* ... */ }
export class SocialService { /* ... */ }
export class AnalyticsService { /* ... */ }
export class SubmissionsService { /* ... */ }
export class ProgressService { /* ... */ }
export class TasksService { /* ... */ }
```

## User Interface Design

### 1. Onboarding and Goal Setup

```typescript
// pages/onboarding/GoalSetupWizard.tsx
interface GoalSetupWizardProps {
  onComplete: (profile: UserProfile) => void;
}

const GoalSetupWizard: React.FC<GoalSetupWizardProps> = ({ onComplete }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<Partial<UserProfile>>({});
  
  const steps = [
    { id: 1, title: 'Learning Goals', component: GoalSelectionStep },
    { id: 2, title: 'Tech Stack', component: TechStackStep },
    { id: 3, title: 'Experience Level', component: SkillAssessmentStep },
    { id: 4, title: 'Time Constraints', component: TimeConstraintsStep },
    { id: 5, title: 'Preferences', component: PreferencesStep },
  ];
  
  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          {steps.map((step) => (
            <div
              key={step.id}
              className={`flex items-center ${
                step.id <= currentStep ? 'text-blue-600' : 'text-gray-400'
              }`}
            >
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                step.id <= currentStep ? 'bg-blue-600 text-white' : 'bg-gray-200'
              }`}>
                {step.id}
              </div>
              <span className="ml-2 font-medium">{step.title}</span>
            </div>
          ))}
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${(currentStep / steps.length) * 100}%` }}
          />
        </div>
      </div>
      
      <AnimatePresence mode="wait">
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3 }}
        >
          {React.createElement(steps[currentStep - 1].component, {
            data: formData,
            onUpdate: setFormData,
            onNext: () => setCurrentStep(currentStep + 1),
            onPrevious: () => setCurrentStep(currentStep - 1),
            onComplete,
          })}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};
```

### 2. Learning Path Visualization

```typescript
// pages/learning-path/LearningPathViewer.tsx
interface LearningPathViewerProps {
  curriculum: Curriculum;
  progress: Progress;
}

const LearningPathViewer: React.FC<LearningPathViewerProps> = ({ curriculum, progress }) => {
  const [selectedModule, setSelectedModule] = useState<Module | null>(null);
  
  return (
    <div className="flex h-screen">
      {/* Left sidebar - Module list */}
      <div className="w-1/3 bg-gray-50 p-6 overflow-y-auto">
        <h2 className="text-2xl font-bold mb-6">Learning Path</h2>
        <div className="space-y-4">
          {curriculum.modules.map((module, index) => (
            <ModuleCard
              key={module.id}
              module={module}
              progress={progress.moduleProgress[module.id]}
              isSelected={selectedModule?.id === module.id}
              onClick={() => setSelectedModule(module)}
              index={index}
            />
          ))}
        </div>
      </div>
      
      {/* Right content - Module details */}
      <div className="flex-1 p-6">
        {selectedModule ? (
          <ModuleDetails
            module={selectedModule}
            progress={progress.moduleProgress[selectedModule.id]}
          />
        ) : (
          <div className="flex items-center justify-center h-full text-gray-500">
            <div className="text-center">
              <BookOpenIcon className="w-16 h-16 mx-auto mb-4" />
              <p className="text-xl">Select a module to view details</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const ModuleCard: React.FC<ModuleCardProps> = ({ module, progress, isSelected, onClick, index }) => {
  const completionPercentage = (progress.completedTasks / progress.totalTasks) * 100;
  
  return (
    <motion.div
      className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
        isSelected ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
      }`}
      onClick={onClick}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      <div className="flex items-center mb-2">
        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold ${
          completionPercentage === 100 ? 'bg-green-500' : 
          completionPercentage > 0 ? 'bg-blue-500' : 'bg-gray-400'
        }`}>
          {completionPercentage === 100 ? '✓' : index + 1}
        </div>
        <h3 className="ml-3 font-semibold">{module.title}</h3>
      </div>
      
      <p className="text-gray-600 text-sm mb-3">{module.summary}</p>
      
      <div className="flex items-center justify-between">
        <div className="flex-1 mr-4">
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${completionPercentage}%` }}
            />
          </div>
        </div>
        <span className="text-sm text-gray-500">
          {progress.completedTasks}/{progress.totalTasks}
        </span>
      </div>
    </motion.div>
  );
};
```

### 3. Interactive Dashboard

```typescript
// pages/dashboard/LearningDashboard.tsx
const LearningDashboard: React.FC = () => {
  const { data: todaysTasks } = useQuery(['todaysTasks'], TasksService.getTodaysTasks);
  const { data: progress } = useQuery(['progress'], ProgressService.getProgress);
  const { data: achievements } = useQuery(['achievements'], GamificationService.getAchievements);
  
  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Welcome back!</h1>
        <p className="text-gray-600">Ready to continue your learning journey?</p>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Progress Overview */}
        <div className="lg:col-span-2">
          <ProgressOverviewCard progress={progress} />
        </div>
        
        {/* Quick Stats */}
        <div className="space-y-4">
          <StatsCard
            title="Current Streak"
            value={`${progress?.currentStreak || 0} days`}
            icon={<FireIcon className="w-6 h-6 text-orange-500" />}
            trend="+2 from yesterday"
          />
          <StatsCard
            title="XP This Week"
            value={`${progress?.weeklyXP || 0} XP`}
            icon={<StarIcon className="w-6 h-6 text-yellow-500" />}
            trend="+15% from last week"
          />
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Today's Tasks */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Today's Tasks</h2>
          <div className="space-y-3">
            {todaysTasks?.map((task) => (
              <TaskCard key={task.id} task={task} />
            ))}
          </div>
        </div>
        
        {/* Recent Achievements */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Recent Achievements</h2>
          <div className="space-y-3">
            {achievements?.recent.map((achievement) => (
              <AchievementCard key={achievement.id} achievement={achievement} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
```

### 4. Code Editor and Submission Interface

```typescript
// pages/exercises/CodeExercise.tsx
const CodeExercise: React.FC<{ exerciseId: string }> = ({ exerciseId }) => {
  const [code, setCode] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<EvaluationResult | null>(null);
  
  const { data: exercise } = useQuery(['exercise', exerciseId], () =>
    TasksService.getExercise(exerciseId)
  );
  
  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const result = await SubmissionsService.submitCode({
        exerciseId,
        code,
        language: exercise.language,
      });
      setFeedback(result);
    } catch (error) {
      console.error('Submission failed:', error);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <div className="bg-white border-b p-4">
        <h1 className="text-2xl font-bold">{exercise?.title}</h1>
        <p className="text-gray-600">{exercise?.description}</p>
      </div>
      
      <div className="flex-1 flex">
        {/* Instructions Panel */}
        <div className="w-1/3 bg-gray-50 p-6 overflow-y-auto">
          <div className="prose prose-sm">
            <h3>Instructions</h3>
            <div dangerouslySetInnerHTML={{ __html: exercise?.instructions }} />
            
            <h3>Test Cases</h3>
            <div className="space-y-2">
              {exercise?.testCases.map((testCase, index) => (
                <div key={index} className="bg-white p-3 rounded border">
                  <div className="text-sm">
                    <strong>Input:</strong> <code>{testCase.input}</code>
                  </div>
                  <div className="text-sm">
                    <strong>Expected:</strong> <code>{testCase.expected}</code>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        
        {/* Code Editor */}
        <div className="flex-1 flex flex-col">
          <div className="flex-1">
            <MonacoEditor
              height="100%"
              language={exercise?.language || 'javascript'}
              value={code}
              onChange={(value) => setCode(value || '')}
              theme="vs-dark"
              options={{
                minimap: { enabled: false },
                fontSize: 14,
                lineNumbers: 'on',
                roundedSelection: false,
                scrollBeyondLastLine: false,
                automaticLayout: true,
              }}
            />
          </div>
          
          {/* Submit Button */}
          <div className="p-4 bg-white border-t">
            <button
              onClick={handleSubmit}
              disabled={isSubmitting || !code.trim()}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Running Tests...' : 'Submit Solution'}
            </button>
          </div>
        </div>
        
        {/* Results Panel */}
        {feedback && (
          <div className="w-1/3 bg-white border-l p-6 overflow-y-auto">
            <FeedbackPanel feedback={feedback} />
          </div>
        )}
      </div>
    </div>
  );
};
```

### 5. Settings and Configuration

```typescript
// pages/settings/SettingsPanel.tsx
const SettingsPanel: React.FC = () => {
  const [apiKeys, setApiKeys] = useState({
    openai: '',
    anthropic: '',
  });
  const [isSaving, setIsSaving] = useState(false);
  
  const handleSaveApiKeys = async () => {
    setIsSaving(true);
    try {
      await SettingsService.updateApiKeys(apiKeys);
      toast.success('API keys updated successfully');
    } catch (error) {
      toast.error('Failed to update API keys');
    } finally {
      setIsSaving(false);
    }
  };
  
  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-8">Settings</h1>
      
      <div className="space-y-8">
        {/* LLM Configuration */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">LLM Configuration</h2>
          <p className="text-gray-600 mb-6">
            Configure your API keys for AI-powered exercise generation and feedback.
          </p>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                OpenAI API Key
              </label>
              <input
                type="password"
                value={apiKeys.openai}
                onChange={(e) => setApiKeys({ ...apiKeys, openai: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="sk-..."
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Anthropic API Key
              </label>
              <input
                type="password"
                value={apiKeys.anthropic}
                onChange={(e) => setApiKeys({ ...apiKeys, anthropic: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="sk-ant-..."
              />
            </div>
            
            <button
              onClick={handleSaveApiKeys}
              disabled={isSaving}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {isSaving ? 'Saving...' : 'Save API Keys'}
            </button>
          </div>
        </div>
        
        {/* Learning Preferences */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Learning Preferences</h2>
          <LearningPreferencesForm />
        </div>
        
        {/* Notification Settings */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Notifications</h2>
          <NotificationSettingsForm />
        </div>
      </div>
    </div>
  );
};
```

## Integration with Backend

### Real-time Updates

```typescript
// hooks/useWebSocket.ts
export const useWebSocket = (userId: string) => {
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  
  useEffect(() => {
    const ws = new WebSocket(`ws://localhost:8000/ws/${userId}`);
    
    ws.onopen = () => {
      setIsConnected(true);
      setSocket(ws);
    };
    
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      
      switch (data.type) {
        case 'progress_update':
          queryClient.invalidateQueries(['progress']);
          break;
        case 'achievement_unlocked':
          toast.success(`Achievement unlocked: ${data.achievement.name}!`);
          queryClient.invalidateQueries(['achievements']);
          break;
        case 'new_task_available':
          queryClient.invalidateQueries(['todaysTasks']);
          break;
      }
    };
    
    ws.onclose = () => {
      setIsConnected(false);
      setSocket(null);
    };
    
    return () => {
      ws.close();
    };
  }, [userId]);
  
  return { socket, isConnected };
};
```

### API Error Handling

```typescript
// services/apiClient.ts
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Handle authentication errors
      window.location.href = '/login';
    } else if (error.response?.status >= 500) {
      // Handle server errors
      toast.error('Server error. Please try again later.');
    } else if (error.response?.status === 429) {
      // Handle rate limiting
      toast.error('Too many requests. Please wait a moment.');
    }
    
    return Promise.reject(error);
  }
);
```

## Deployment Integration

### Docker Configuration

```dockerfile
# frontend/Dockerfile
FROM node:18-alpine as builder

WORKDIR /app
COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

### Docker Compose Integration

```yaml
# Add to existing docker-compose.yml
services:
  frontend:
    build: ./frontend
    ports:
      - "3000:80"
    environment:
      - VITE_API_BASE_URL=http://localhost:8000
    depends_on:
      - coach-service
    networks:
      - learning-coach-network
```

This comprehensive Web UI design provides:

1. **Complete User Experience**: From onboarding to advanced analytics
2. **Modern Technology Stack**: React, TypeScript, Tailwind CSS
3. **Seamless Backend Integration**: All 47+ API endpoints supported
4. **Real-time Features**: WebSocket integration for live updates
5. **Responsive Design**: Works on all devices
6. **LLM Configuration**: User-configurable API keys
7. **Visual Learning Paths**: Interactive curriculum visualization
8. **Code Editor Integration**: Monaco Editor for coding exercises
9. **Gamification UI**: XP, achievements, streaks, leaderboards
10. **Social Features**: Challenges, sharing, study groups

This would significantly enhance the demo video and user experience, potentially pushing the hackathon score to a perfect 100/100!