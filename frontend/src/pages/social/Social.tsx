import { useState } from 'react'
import { Card, Button } from '../../components/ui'
import { UserGroupIcon, TrophyIcon, ChatBubbleLeftIcon, PlusIcon } from '@heroicons/react/24/outline'
import { RealTimeLeaderboard } from '../../components/leaderboard'
import { StudyGroupCollaboration } from '../../components/collaboration'
import { 
  PeerChallengesBrowser,
  SolutionSharingInterface,
  CreateChallengeModal,
} from '../../components/social'
import { useAuth } from '../../contexts/AuthContext'

export default function Social() {
  useAuth() // Keep auth context available for future use
  const [activeTab, setActiveTab] = useState<'overview' | 'challenges' | 'groups' | 'leaderboard'>('overview')
  const [showCreateChallenge, setShowCreateChallenge] = useState(false)
  const [selectedStudyGroup, setSelectedStudyGroup] = useState<string | null>(null)

  const tabs = [
    { id: 'overview', label: 'Overview', icon: UserGroupIcon },
    { id: 'challenges', label: 'Challenges', icon: TrophyIcon },
    { id: 'groups', label: 'Study Groups', icon: UserGroupIcon },
    { id: 'leaderboard', label: 'Leaderboard', icon: TrophyIcon }
  ]

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <div className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              <Card className="p-6">
                <UserGroupIcon className="w-8 h-8 text-blue-600 mb-4" />
                <h3 className="text-lg font-semibold mb-2">Study Groups</h3>
                <p className="text-gray-600 text-sm mb-4">
                  Join study groups to learn together with peers
                </p>
                <Button 
                  variant="ghost" 
                  onClick={() => setActiveTab('groups')}
                  className="text-blue-600 hover:text-blue-700 p-0"
                >
                  Browse Groups →
                </Button>
              </Card>

              <Card className="p-6">
                <TrophyIcon className="w-8 h-8 text-yellow-600 mb-4" />
                <h3 className="text-lg font-semibold mb-2">Challenges</h3>
                <p className="text-gray-600 text-sm mb-4">
                  Compete in coding challenges and climb the leaderboard
                </p>
                <Button 
                  variant="ghost" 
                  onClick={() => setActiveTab('challenges')}
                  className="text-blue-600 hover:text-blue-700 p-0"
                >
                  View Challenges →
                </Button>
              </Card>

              <Card className="p-6">
                <ChatBubbleLeftIcon className="w-8 h-8 text-green-600 mb-4" />
                <h3 className="text-lg font-semibold mb-2">Leaderboard</h3>
                <p className="text-gray-600 text-sm mb-4">
                  See how you rank against other learners
                </p>
                <Button 
                  variant="ghost" 
                  onClick={() => setActiveTab('leaderboard')}
                  className="text-blue-600 hover:text-blue-700 p-0"
                >
                  View Rankings →
                </Button>
              </Card>
            </div>

            {/* Quick Stats */}
            <div className="grid gap-4 md:grid-cols-4">
              <Card className="p-4 text-center">
                <div className="text-2xl font-bold text-blue-600">12</div>
                <div className="text-sm text-gray-600">Active Groups</div>
              </Card>
              <Card className="p-4 text-center">
                <div className="text-2xl font-bold text-yellow-600">8</div>
                <div className="text-sm text-gray-600">Challenges Won</div>
              </Card>
              <Card className="p-4 text-center">
                <div className="text-2xl font-bold text-green-600">#15</div>
                <div className="text-sm text-gray-600">Global Rank</div>
              </Card>
              <Card className="p-4 text-center">
                <div className="text-2xl font-bold text-purple-600">247</div>
                <div className="text-sm text-gray-600">Solutions Shared</div>
              </Card>
            </div>

            {/* Recent Activity */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Recent Activity</h3>
              <div className="space-y-3">
                <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                  <TrophyIcon className="w-5 h-5 text-yellow-500" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">Won "React Hooks Challenge"</p>
                    <p className="text-xs text-gray-500">2 hours ago</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                  <UserGroupIcon className="w-5 h-5 text-blue-500" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">Joined "Advanced TypeScript" study group</p>
                    <p className="text-xs text-gray-500">1 day ago</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                  <ChatBubbleLeftIcon className="w-5 h-5 text-green-500" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">Shared solution for "Binary Tree Traversal"</p>
                    <p className="text-xs text-gray-500">3 days ago</p>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        )

      case 'challenges':
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Coding Challenges</h2>
                <p className="text-gray-600 mt-1">Compete with other developers and improve your skills</p>
              </div>
              <Button onClick={() => setShowCreateChallenge(true)}>
                <PlusIcon className="w-4 h-4 mr-2" />
                Create Challenge
              </Button>
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
              <div className="lg:col-span-2">
                <PeerChallengesBrowser />
              </div>
              <div>
                {/* Challenge stats card instead of leaderboard modal */}
                <Card className="p-6">
                  <h3 className="text-lg font-semibold mb-4">Challenge Stats</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Challenges Won</span>
                      <span className="font-semibold">8</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Win Rate</span>
                      <span className="font-semibold">67%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Current Streak</span>
                      <span className="font-semibold">3</span>
                    </div>
                  </div>
                </Card>
              </div>
            </div>

            <SolutionSharingInterface />
          </div>
        )

      case 'groups':
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Study Groups</h2>
                <p className="text-gray-600 mt-1">Collaborate with peers in real-time</p>
              </div>
              <Button>
                <PlusIcon className="w-4 h-4 mr-2" />
                Create Group
              </Button>
            </div>

            {selectedStudyGroup ? (
              <StudyGroupCollaboration
                roomId={selectedStudyGroup}
                studyGroupId={selectedStudyGroup}
                onParticipantUpdate={(participants) => {
                  console.log('Participants updated:', participants)
                }}
              />
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {/* Mock study groups */}
                {[
                  { id: '1', name: 'React Fundamentals', members: 12, active: 5 },
                  { id: '2', name: 'Algorithm Practice', members: 8, active: 3 },
                  { id: '3', name: 'System Design', members: 15, active: 7 }
                ].map((group) => (
                  <Card key={group.id} className="p-4 hover:shadow-md transition-shadow cursor-pointer">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold text-gray-900">{group.name}</h3>
                      <div className="flex items-center space-x-1">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span className="text-xs text-gray-500">{group.active} active</span>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 mb-3">{group.members} members</p>
                    <Button 
                      size="sm" 
                      className="w-full"
                      onClick={() => setSelectedStudyGroup(group.id)}
                    >
                      Join Group
                    </Button>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )

      case 'leaderboard':
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Global Leaderboard</h2>
              <p className="text-gray-600 mt-1">See how you rank against other learners worldwide</p>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              <RealTimeLeaderboard
                leaderboardId="global"
                showUserHighlight={true}
                maxEntries={10}
              />
              
              <RealTimeLeaderboard
                leaderboardId="weekly"
                showUserHighlight={true}
                maxEntries={10}
              />
            </div>

            {/* Competition Stats */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Your Competition Stats</h3>
              <div className="grid gap-4 md:grid-cols-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">#15</div>
                  <div className="text-sm text-gray-600">Global Rank</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">1,247</div>
                  <div className="text-sm text-gray-600">Total Points</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-yellow-600">8</div>
                  <div className="text-sm text-gray-600">Challenges Won</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">23</div>
                  <div className="text-sm text-gray-600">Streak Days</div>
                </div>
              </div>
            </Card>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Social Learning</h1>
        <p className="text-gray-600 mt-2">
          Connect with other learners and participate in challenges
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`
                  flex items-center space-x-2 py-2 px-1 border-b-2 font-medium text-sm
                  ${activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }
                `}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            )
          })}
        </nav>
      </div>

      {/* Tab Content */}
      {renderTabContent()}

      {/* Create Challenge Modal */}
      {showCreateChallenge && (
        <CreateChallengeModal
          isOpen={showCreateChallenge}
          onClose={() => setShowCreateChallenge(false)}
          onSuccess={() => {
            console.log('Challenge created successfully')
            setShowCreateChallenge(false)
          }}
        />
      )}
    </div>
  )
}