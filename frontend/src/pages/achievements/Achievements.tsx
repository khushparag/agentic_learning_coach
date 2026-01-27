import React, { useState, useEffect } from 'react'
import { Card } from '../../components/ui'
import { TrophyIcon, StarIcon, FireIcon, AcademicCapIcon, BookOpenIcon, CodeBracketIcon, RocketLaunchIcon, CheckBadgeIcon } from '@heroicons/react/24/outline'
import { learningPathService } from '../../services/learningPathService'

interface Achievement {
  id: string
  title: string
  description: string
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>
  unlocked: boolean
  unlockedAt?: string
  progress?: number
  maxProgress?: number
  rarity: 'common' | 'rare' | 'epic' | 'legendary'
}

// Generate achievements based on user's actual progress
function generateAchievements(completedTasks: number, totalTasks: number, completedModules: number, totalModules: number): Achievement[] {
  const now = new Date().toISOString()
  
  return [
    {
      id: '1',
      title: 'First Steps',
      description: 'Complete your first learning task',
      icon: AcademicCapIcon,
      unlocked: completedTasks >= 1,
      unlockedAt: completedTasks >= 1 ? now : undefined,
      progress: Math.min(completedTasks, 1),
      maxProgress: 1,
      rarity: 'common'
    },
    {
      id: '2',
      title: 'Getting Started',
      description: 'Complete 5 learning tasks',
      icon: BookOpenIcon,
      unlocked: completedTasks >= 5,
      unlockedAt: completedTasks >= 5 ? now : undefined,
      progress: Math.min(completedTasks, 5),
      maxProgress: 5,
      rarity: 'common'
    },
    {
      id: '3',
      title: 'Module Master',
      description: 'Complete your first module',
      icon: CheckBadgeIcon,
      unlocked: completedModules >= 1,
      unlockedAt: completedModules >= 1 ? now : undefined,
      progress: Math.min(completedModules, 1),
      maxProgress: 1,
      rarity: 'rare'
    },
    {
      id: '4',
      title: 'Code Warrior',
      description: 'Complete 25 learning tasks',
      icon: CodeBracketIcon,
      unlocked: completedTasks >= 25,
      unlockedAt: completedTasks >= 25 ? now : undefined,
      progress: Math.min(completedTasks, 25),
      maxProgress: 25,
      rarity: 'rare'
    },
    {
      id: '5',
      title: 'Dedicated Learner',
      description: 'Complete 50 learning tasks',
      icon: TrophyIcon,
      unlocked: completedTasks >= 50,
      unlockedAt: completedTasks >= 50 ? now : undefined,
      progress: Math.min(completedTasks, 50),
      maxProgress: 50,
      rarity: 'epic'
    },
    {
      id: '6',
      title: 'Path Pioneer',
      description: 'Complete 3 modules',
      icon: RocketLaunchIcon,
      unlocked: completedModules >= 3,
      unlockedAt: completedModules >= 3 ? now : undefined,
      progress: Math.min(completedModules, 3),
      maxProgress: 3,
      rarity: 'epic'
    },
    {
      id: '7',
      title: 'Knowledge Seeker',
      description: 'Complete 100 learning tasks',
      icon: StarIcon,
      unlocked: completedTasks >= 100,
      unlockedAt: completedTasks >= 100 ? now : undefined,
      progress: Math.min(completedTasks, 100),
      maxProgress: 100,
      rarity: 'legendary'
    },
    {
      id: '8',
      title: 'Curriculum Champion',
      description: 'Complete all modules in your learning path',
      icon: FireIcon,
      unlocked: totalModules > 0 && completedModules >= totalModules,
      unlockedAt: totalModules > 0 && completedModules >= totalModules ? now : undefined,
      progress: completedModules,
      maxProgress: totalModules || 1,
      rarity: 'legendary'
    }
  ]
}

export default function Achievements() {
  const [achievements, setAchievements] = useState<Achievement[]>([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    completedTasks: 0,
    totalTasks: 0,
    completedModules: 0,
    totalModules: 0,
    xpEarned: 0,
    level: 1
  })

  useEffect(() => {
    const loadAchievements = async () => {
      try {
        setLoading(true)
        const learningPath = await learningPathService.getLearningPath()
        
        // Calculate stats from learning path
        let completedTasks = 0
        let totalTasks = 0
        let completedModules = 0
        
        learningPath.modules.forEach(module => {
          const moduleCompletedTasks = module.tasks.filter(t => t.status === 'completed').length
          completedTasks += moduleCompletedTasks
          totalTasks += module.tasks.length
          
          // Module is complete if all tasks are done
          if (module.tasks.length > 0 && moduleCompletedTasks === module.tasks.length) {
            completedModules++
          }
        })
        
        // Calculate XP (50 points per completed task)
        const xpEarned = completedTasks * 50
        
        // Calculate level (every 500 XP = 1 level)
        const level = Math.max(1, Math.floor(xpEarned / 500) + 1)
        
        setStats({
          completedTasks,
          totalTasks,
          completedModules,
          totalModules: learningPath.modules.length,
          xpEarned,
          level
        })
        
        // Generate achievements based on progress
        const generatedAchievements = generateAchievements(
          completedTasks,
          totalTasks,
          completedModules,
          learningPath.modules.length
        )
        
        setAchievements(generatedAchievements)
      } catch (error) {
        console.error('Failed to load achievements:', error)
        // Set default achievements for new users
        setAchievements(generateAchievements(0, 0, 0, 0))
      } finally {
        setLoading(false)
      }
    }
    
    loadAchievements()
  }, [])

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'common': return 'border-gray-300 bg-gray-50'
      case 'rare': return 'border-blue-300 bg-blue-50'
      case 'epic': return 'border-purple-300 bg-purple-50'
      case 'legendary': return 'border-yellow-300 bg-yellow-50'
      default: return 'border-gray-300 bg-gray-50'
    }
  }

  const getRarityTextColor = (rarity: string) => {
    switch (rarity) {
      case 'common': return 'text-gray-600'
      case 'rare': return 'text-blue-600'
      case 'epic': return 'text-purple-600'
      case 'legendary': return 'text-yellow-600'
      default: return 'text-gray-600'
    }
  }

  const unlockedAchievements = achievements.filter(a => a.unlocked)
  const lockedAchievements = achievements.filter(a => !a.unlocked)

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading achievements...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Achievements</h1>
        <p className="text-gray-600 mt-2">
          Track your learning milestones and unlock new badges
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4 text-center">
          <div className="text-2xl font-bold text-blue-600">{unlockedAchievements.length}</div>
          <div className="text-sm text-gray-500">Unlocked</div>
        </Card>
        <Card className="p-4 text-center">
          <div className="text-2xl font-bold text-gray-600">{achievements.length}</div>
          <div className="text-sm text-gray-500">Total</div>
        </Card>
        <Card className="p-4 text-center">
          <div className="text-2xl font-bold text-yellow-600">{stats.xpEarned.toLocaleString()}</div>
          <div className="text-sm text-gray-500">XP Earned</div>
        </Card>
        <Card className="p-4 text-center">
          <div className="text-2xl font-bold text-green-600">Level {stats.level}</div>
          <div className="text-sm text-gray-500">Current Level</div>
        </Card>
      </div>

      {/* Unlocked Achievements */}
      {unlockedAchievements.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Unlocked Achievements</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {unlockedAchievements.map((achievement) => (
              <Card 
                key={achievement.id} 
                className={`p-6 border-2 ${getRarityColor(achievement.rarity)}`}
              >
                <div className="flex items-start justify-between mb-4">
                  <achievement.icon className={`w-8 h-8 ${getRarityTextColor(achievement.rarity)}`} />
                  <span className={`px-2 py-1 rounded text-xs font-medium ${getRarityTextColor(achievement.rarity)} bg-white border`}>
                    {achievement.rarity}
                  </span>
                </div>
                
                <h3 className="font-semibold text-gray-900 mb-2">{achievement.title}</h3>
                <p className="text-gray-600 text-sm mb-3">{achievement.description}</p>
                
                {achievement.unlockedAt && (
                  <p className="text-xs text-gray-500">
                    Unlocked on {new Date(achievement.unlockedAt).toLocaleDateString()}
                  </p>
                )}
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Locked Achievements */}
      {lockedAchievements.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">In Progress</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {lockedAchievements.map((achievement) => (
              <Card 
                key={achievement.id} 
                className="p-6 border-2 border-gray-200 bg-gray-50 opacity-75"
              >
                <div className="flex items-start justify-between mb-4">
                  <achievement.icon className="w-8 h-8 text-gray-400" />
                  <span className="px-2 py-1 rounded text-xs font-medium text-gray-500 bg-white border">
                    {achievement.rarity}
                  </span>
                </div>
                
                <h3 className="font-semibold text-gray-700 mb-2">{achievement.title}</h3>
                <p className="text-gray-500 text-sm mb-3">{achievement.description}</p>
                
                {achievement.progress !== undefined && achievement.maxProgress && (
                  <div>
                    <div className="flex justify-between text-sm text-gray-500 mb-1">
                      <span>Progress</span>
                      <span>{achievement.progress}/{achievement.maxProgress}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${(achievement.progress / achievement.maxProgress) * 100}%` }}
                      />
                    </div>
                  </div>
                )}
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
