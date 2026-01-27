/**
 * Gamification Page - Complete gamification interface with XP, achievements, badges, and streaks
 */

import React from 'react'
import { motion } from 'framer-motion'
import { useAuth } from '../../contexts/AuthContext'
import { GamificationDashboard } from '../../components/gamification'

const GamificationPage: React.FC = () => {
  const { user } = useAuth()

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="min-h-screen bg-gray-50"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <GamificationDashboard userId={user?.id} />
      </div>
    </motion.div>
  )
}

export default GamificationPage
