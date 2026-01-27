# Design Document: Frontend Routing Fixes

## Overview

This design implements a robust routing system for the React frontend that handles route aliasing, deep linking, proper 404 handling, and type-safe route management. The solution uses React Router v6 with custom hooks and utilities to provide a seamless navigation experience.

## Architecture

### Component Structure

```
src/
├── config/
│   ├── routes.ts              # Route definitions and metadata
│   └── routeAliases.ts        # Route alias mappings
├── hooks/
│   ├── useNavigation.ts       # Navigation utilities
│   ├── useRouteGuard.ts       # Permission checking
│   └── usePageMeta.ts         # Page title/meta management
├── components/
│   ├── routing/
│   │   ├── RouteAlias.tsx     # Redirect component for aliases
│   │   ├── ProtectedRoute.tsx # Auth guard component
│   │   ├── RouteGuard.tsx     # Permission guard component
│   │   └── PageTransition.tsx # Transition wrapper
│   └── pages/
│       └── NotFound.tsx       # Enhanced 404 page
└── utils/
    ├── routeUtils.ts          # Route helper functions
    └── routeMatcher.ts        # Fuzzy route matching
```

### Data Models

```typescript
interface RouteConfig {
  path: string
  name: string
  title: string
  description?: string
  requiresAuth: boolean
  requiresOnboarding: boolean
  requiresPermissions?: string[]
  showInNavigation: boolean
  icon?: string
  aliases?: string[]
  meta?: {
    ogTitle?: string
    ogDescription?: string
    ogImage?: string
    canonical?: string
  }
}

interface RouteAlias {
  from: string
  to: string
  permanent: boolean
  preserveQuery: boolean
}

interface NavigationState {
  returnUrl?: string
  fromRoute?: string
  timestamp: number
}
```

## Components and Interfaces

### 1. Route Alias System

```typescript
// routeAliases.ts
export const routeAliases: RouteAlias[] = [
  { from: '/signup', to: '/register', permanent: true, preserveQuery: true },
  { from: '/sign-up', to: '/register', permanent: true, preserveQuery: true },
  { from: '/signin', to: '/login', permanent: true, preserveQuery: true },
  { from: '/sign-in', to: '/login', permanent: true, preserveQuery: true },
  { from: '/home', to: '/', permanent: true, preserveQuery: true },
]

// RouteAlias.tsx
const RouteAlias: React.FC<{ from: string; to: string; preserveQuery?: boolean }> = ({
  from,
  to,
  preserveQuery = true
}) => {
  const location = useLocation()
  const navigate = useNavigate()
  
  useEffect(() => {
    const targetUrl = preserveQuery && location.search
      ? `${to}${location.search}`
      : to
    
    navigate(targetUrl, { replace: true })
  }, [])
  
  return null
}
```

### 2. Enhanced 404 Page

```typescript
// NotFound.tsx
const NotFound: React.FC = () => {
  const location = useLocation()
  const navigate = useNavigate()
  
  // Find similar routes using fuzzy matching
  const suggestions = useMemo(() => {
    return findSimilarRoutes(location.pathname, allRoutes)
  }, [location.pathname])
  
  // Log 404 for analytics
  useEffect(() => {
    logAnalyticsEvent('404_error', {
      path: location.pathname,
      referrer: document.referrer,
      timestamp: new Date().toISOString()
    })
  }, [location.pathname])
  
  return (
    <div className="not-found-container">
      <h1>404 - Page Not Found</h1>
      <p>The page "{location.pathname}" doesn't exist.</p>
      
      {suggestions.length > 0 && (
        <div className="suggestions">
          <h2>Did you mean:</h2>
          <ul>
            {suggestions.map(route => (
              <li key={route.path}>
                <Link to={route.path}>{route.title}</Link>
              </li>
            ))}
          </ul>
        </div>
      )}
      
      <div className="quick-links">
        <Link to="/">Go to Dashboard</Link>
        <Link to="/learning-path">View Learning Path</Link>
        <Link to="/exercises">Browse Exercises</Link>
      </div>
    </div>
  )
}
```

### 3. Deep Linking Support

```typescript
// useNavigation.ts
export const useNavigation = () => {
  const navigate = useNavigate()
  const location = useLocation()
  
  const saveReturnUrl = useCallback((url: string) => {
    sessionStorage.setItem('returnUrl', url)
  }, [])
  
  const getReturnUrl = useCallback(() => {
    const url = sessionStorage.getItem('returnUrl')
    sessionStorage.removeItem('returnUrl')
    return url
  }, [])
  
  const navigateWithReturn = useCallback((to: string) => {
    saveReturnUrl(location.pathname + location.search)
    navigate(to)
  }, [location, navigate, saveReturnUrl])
  
  return {
    navigate,
    navigateWithReturn,
    saveReturnUrl,
    getReturnUrl
  }
}

// ProtectedRoute.tsx
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuth()
  const location = useLocation()
  const { saveReturnUrl } = useNavigation()
  
  if (!isAuthenticated) {
    // Save the intended destination
    saveReturnUrl(location.pathname + location.search)
    return <Navigate to="/login" replace />
  }
  
  return <>{children}</>
}
```

### 4. Page Metadata Management

```typescript
// usePageMeta.ts
export const usePageMeta = (route: RouteConfig) => {
  useEffect(() => {
    // Update document title
    document.title = route.title ? `${route.title} | Learning Coach` : 'Learning Coach'
    
    // Update meta description
    const metaDescription = document.querySelector('meta[name="description"]')
    if (metaDescription && route.description) {
      metaDescription.setAttribute('content', route.description)
    }
    
    // Update Open Graph tags
    if (route.meta) {
      updateMetaTag('og:title', route.meta.ogTitle || route.title)
      updateMetaTag('og:description', route.meta.ogDescription || route.description)
      updateMetaTag('og:image', route.meta.ogImage)
      
      // Update canonical URL
      if (route.meta.canonical) {
        updateLinkTag('canonical', route.meta.canonical)
      }
    }
  }, [route])
}

const updateMetaTag = (property: string, content?: string) => {
  if (!content) return
  
  let tag = document.querySelector(`meta[property="${property}"]`)
  if (!tag) {
    tag = document.createElement('meta')
    tag.setAttribute('property', property)
    document.head.appendChild(tag)
  }
  tag.setAttribute('content', content)
}
```

### 5. Route Guards

```typescript
// useRouteGuard.ts
export const useRouteGuard = (requiredPermissions?: string[]) => {
  const { user } = useAuth()
  const navigate = useNavigate()
  
  useEffect(() => {
    if (!requiredPermissions || requiredPermissions.length === 0) {
      return
    }
    
    const hasPermission = requiredPermissions.every(permission =>
      user?.permissions?.includes(permission)
    )
    
    if (!hasPermission) {
      toast.error('You don\'t have permission to access this page')
      navigate('/', { replace: true })
    }
  }, [requiredPermissions, user, navigate])
  
  return {
    hasPermission: !requiredPermissions || requiredPermissions.every(p =>
      user?.permissions?.includes(p)
    )
  }
}

// RouteGuard.tsx
const RouteGuard: React.FC<{
  children: React.ReactNode
  requiredPermissions?: string[]
}> = ({ children, requiredPermissions }) => {
  const { hasPermission } = useRouteGuard(requiredPermissions)
  
  if (!hasPermission) {
    return null
  }
  
  return <>{children}</>
}
```

### 6. Fuzzy Route Matching

```typescript
// routeMatcher.ts
export const findSimilarRoutes = (
  invalidPath: string,
  allRoutes: RouteConfig[],
  maxResults: number = 3
): RouteConfig[] => {
  const scores = allRoutes.map(route => ({
    route,
    score: calculateSimilarity(invalidPath, route.path)
  }))
  
  return scores
    .filter(({ score }) => score > 0.5) // Threshold for similarity
    .sort((a, b) => b.score - a.score)
    .slice(0, maxResults)
    .map(({ route }) => route)
}

const calculateSimilarity = (str1: string, str2: string): number => {
  // Levenshtein distance algorithm
  const matrix: number[][] = []
  
  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i]
  }
  
  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j
  }
  
  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1]
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        )
      }
    }
  }
  
  const distance = matrix[str2.length][str1.length]
  const maxLength = Math.max(str1.length, str2.length)
  
  return 1 - distance / maxLength
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Route Alias Preservation
*For any* route alias configuration, navigating to the alias path should result in the same rendered component as navigating directly to the target path
**Validates: Requirements 1.1, 1.2, 1.3**

### Property 2: Query Parameter Preservation
*For any* route redirect with preserveQuery=true, all query parameters from the original URL should be present in the redirected URL
**Validates: Requirements 1.4**

### Property 3: Authentication Redirect Round-Trip
*For any* protected route, if an unauthenticated user navigates to it, they should be redirected to login, and after successful authentication, they should be redirected back to the originally requested route
**Validates: Requirements 4.1, 4.2, 4.4**

### Property 4: Route Similarity Scoring
*For any* invalid route path, the fuzzy matching algorithm should return routes with similarity scores between 0 and 1, sorted in descending order
**Validates: Requirements 2.2**

### Property 5: Page Title Updates
*For any* route navigation, the document title should be updated to match the route's title configuration
**Validates: Requirements 5.1, 5.3**

### Property 6: Permission Guard Enforcement
*For any* route with required permissions, users without those permissions should not be able to access the route
**Validates: Requirements 7.1, 7.4**

### Property 7: History State Consistency
*For any* sequence of navigation actions, the browser history should accurately reflect the navigation path, excluding redirect entries
**Validates: Requirements 8.1, 8.2, 8.4**

## Error Handling

### Route Not Found
- Display enhanced 404 page with suggestions
- Log error for analytics
- Provide quick navigation options
- Show search functionality

### Permission Denied
- Redirect to dashboard
- Display toast notification explaining the issue
- Log permission denial for security audit
- Suggest alternative accessible pages

### Deep Link Expired
- Clear stored return URL
- Redirect to login or dashboard
- Display informative message
- Offer to resend link if applicable

### Navigation Failure
- Catch navigation errors in error boundary
- Display user-friendly error message
- Provide retry option
- Log error for debugging

## Testing Strategy

### Unit Tests
- Test route alias redirects
- Test query parameter preservation
- Test fuzzy route matching algorithm
- Test permission checking logic
- Test metadata update functions

### Integration Tests
- Test complete authentication flow with deep linking
- Test route guard behavior
- Test 404 page with various invalid URLs
- Test browser history management
- Test page transition animations

### E2E Tests
- Test user journey from login through protected routes
- Test bookmark and deep link scenarios
- Test permission-based access control
- Test browser back/forward navigation
- Test route alias redirects in real browser

### Property-Based Tests
- Generate random route paths and verify alias resolution
- Generate random query parameters and verify preservation
- Generate random permission sets and verify access control
- Generate random navigation sequences and verify history consistency
