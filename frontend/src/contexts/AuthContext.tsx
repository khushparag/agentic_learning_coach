import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'

interface User {
  id: string
  email: string
  name: string
  level: number
  isOnboardingComplete: boolean
}

interface AuthContextType {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<void>
  register: (name: string, email: string, password: string) => Promise<void>
  logout: () => void
  updateUser: (updates: Partial<User>) => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

// Alias for backward compatibility
export const useAuthContext = useAuth

interface AuthProviderProps {
  children: ReactNode
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Check for existing session on mount
    const checkAuth = async () => {
      try {
        const token = localStorage.getItem('auth_token')
        const onboardingCompleted = localStorage.getItem('onboarding_completed') === 'true'
        
        if (token) {
          // Get or create a consistent user ID
          let userId = sessionStorage.getItem('demo_user_id')
          if (!userId) {
            userId = crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`
            sessionStorage.setItem('demo_user_id', userId)
          }
          
          // TODO: Validate token with backend
          // For now, simulate a user
          setUser({
            id: userId,
            email: 'user@example.com',
            name: 'Demo User',
            level: 5,
            isOnboardingComplete: onboardingCompleted
          })
        }
      } catch (error) {
        console.error('Auth check failed:', error)
        localStorage.removeItem('auth_token')
      } finally {
        setIsLoading(false)
      }
    }

    checkAuth()
  }, [])

  const login = async (email: string, password: string) => {
    setIsLoading(true)
    try {
      // TODO: Implement actual login API call
      // For now, simulate login
      
      // Generate or retrieve a consistent user ID
      let userId = sessionStorage.getItem('demo_user_id')
      if (!userId) {
        userId = crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`
        sessionStorage.setItem('demo_user_id', userId)
      }
      
      const mockUser: User = {
        id: userId,
        email,
        name: 'Demo User',
        level: 5,
        isOnboardingComplete: email !== 'new@example.com' // New users need onboarding
      }
      
      localStorage.setItem('auth_token', 'mock_token')
      setUser(mockUser)
    } catch (error) {
      throw new Error('Login failed')
    } finally {
      setIsLoading(false)
    }
  }

  const register = async (name: string, email: string, password: string) => {
    setIsLoading(true)
    try {
      // TODO: Implement actual registration API call
      // For now, simulate registration
      
      // Generate a proper UUID for the user that will be used consistently
      const userId = crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`
      
      // Store the user ID in sessionStorage so the API service uses the same ID
      sessionStorage.setItem('demo_user_id', userId)
      
      const mockUser: User = {
        id: userId,
        email,
        name,
        level: 1,
        isOnboardingComplete: false // New users need onboarding
      }
      
      localStorage.setItem('auth_token', 'mock_token')
      setUser(mockUser)
    } catch (error) {
      throw new Error('Registration failed')
    } finally {
      setIsLoading(false)
    }
  }

  const logout = () => {
    localStorage.removeItem('auth_token')
    localStorage.removeItem('onboarding_completed')
    sessionStorage.removeItem('demo_user_id')
    setUser(null)
  }

  const updateUser = (updates: Partial<User>) => {
    if (user) {
      setUser({ ...user, ...updates })
    }
  }

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated: !!user,
    login,
    register,
    logout,
    updateUser
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}