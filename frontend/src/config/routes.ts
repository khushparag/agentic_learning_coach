export interface RouteConfig {
  path: string
  name: string
  title: string
  description?: string
  requiresAuth: boolean
  requiresOnboarding: boolean
  showInNavigation: boolean
  icon?: string
}

export const routes: Record<string, RouteConfig> = {
  // Public routes
  login: {
    path: '/login',
    name: 'login',
    title: 'Sign In',
    requiresAuth: false,
    requiresOnboarding: false,
    showInNavigation: false,
  },
  
  register: {
    path: '/register',
    name: 'register',
    title: 'Create Account',
    description: 'Create a new learning account',
    requiresAuth: false,
    requiresOnboarding: false,
    showInNavigation: false,
  },
  
  // Onboarding
  onboarding: {
    path: '/onboarding',
    name: 'onboarding',
    title: 'Get Started',
    description: 'Set up your learning profile and goals',
    requiresAuth: true,
    requiresOnboarding: false,
    showInNavigation: false,
  },
  
  // Main application routes
  dashboard: {
    path: '/',
    name: 'dashboard',
    title: 'Dashboard',
    description: 'Your learning overview and daily tasks',
    requiresAuth: true,
    requiresOnboarding: true,
    showInNavigation: true,
    icon: 'HomeIcon',
  },
  
  learningPath: {
    path: '/learning-path',
    name: 'learning-path',
    title: 'Learning Path',
    description: 'Your personalized curriculum and progress',
    requiresAuth: true,
    requiresOnboarding: true,
    showInNavigation: true,
    icon: 'MapIcon',
  },
  
  exercises: {
    path: '/exercises',
    name: 'exercises',
    title: 'Exercises',
    description: 'Practice coding with hands-on challenges',
    requiresAuth: true,
    requiresOnboarding: true,
    showInNavigation: true,
    icon: 'CodeBracketIcon',
  },
  
  tasks: {
    path: '/tasks',
    name: 'tasks',
    title: 'Tasks',
    description: 'Manage and track your learning tasks',
    requiresAuth: true,
    requiresOnboarding: true,
    showInNavigation: true,
    icon: 'ListBulletIcon',
  },
  
  social: {
    path: '/social',
    name: 'social',
    title: 'Social',
    description: 'Connect with other learners and join challenges',
    requiresAuth: true,
    requiresOnboarding: true,
    showInNavigation: true,
    icon: 'UserGroupIcon',
  },
  
  analytics: {
    path: '/analytics',
    name: 'analytics',
    title: 'Analytics',
    description: 'Track your learning progress and performance',
    requiresAuth: true,
    requiresOnboarding: true,
    showInNavigation: true,
    icon: 'ChartBarIcon',
  },
  
  achievements: {
    path: '/achievements',
    name: 'achievements',
    title: 'Achievements',
    description: 'View your badges and learning milestones',
    requiresAuth: true,
    requiresOnboarding: true,
    showInNavigation: true,
    icon: 'TrophyIcon',
  },
  
  gamification: {
    path: '/gamification',
    name: 'gamification',
    title: 'Gamification',
    description: 'Track XP, streaks, achievements, and compete with others',
    requiresAuth: true,
    requiresOnboarding: true,
    showInNavigation: true,
    icon: 'StarIcon',
  },
  
  leaderboard: {
    path: '/leaderboard',
    name: 'leaderboard',
    title: 'Leaderboard',
    description: 'Global rankings, competitions, and competitive analytics',
    requiresAuth: true,
    requiresOnboarding: true,
    showInNavigation: true,
    icon: 'TrophyIcon',
  },
  
  settings: {
    path: '/settings',
    name: 'settings',
    title: 'Settings',
    description: 'Configure your preferences and API keys',
    requiresAuth: true,
    requiresOnboarding: true,
    showInNavigation: true,
    icon: 'CogIcon',
  },
  
  admin: {
    path: '/admin',
    name: 'admin',
    title: 'Admin',
    description: 'System administration and monitoring',
    requiresAuth: true,
    requiresOnboarding: true,
    showInNavigation: false, // Only show for admin users
    icon: 'ShieldCheckIcon',
  },
  
  // Development routes
  uiShowcase: {
    path: '/ui-showcase',
    name: 'ui-showcase',
    title: 'UI Showcase',
    description: 'Component library and design system',
    requiresAuth: false,
    requiresOnboarding: false,
    showInNavigation: false,
  },
}

export const getRouteByPath = (path: string): RouteConfig | undefined => {
  return Object.values(routes).find(route => route.path === path)
}

export const getNavigationRoutes = (): RouteConfig[] => {
  return Object.values(routes).filter(route => route.showInNavigation)
}

export const getPublicRoutes = (): RouteConfig[] => {
  return Object.values(routes).filter(route => !route.requiresAuth)
}

export const getProtectedRoutes = (): RouteConfig[] => {
  return Object.values(routes).filter(route => route.requiresAuth)
}