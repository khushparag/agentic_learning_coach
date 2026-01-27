import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useBadgeShowcase, useAchievements } from '../../hooks/api/useGamification';
import { useAuth } from '../../contexts/AuthContext';

interface BadgeCollectionProps {
  userId?: string;
  showStats?: boolean;
  compact?: boolean;
  className?: string;
}

export const BadgeCollection: React.FC<BadgeCollectionProps> = ({ userId, showStats = true, compact = false, className = '' }) => {
  const { user } = useAuth();
  const targetUserId = userId || user?.id || null;
  const { data: badgeShowcase, isLoading } = useBadgeShowcase(targetUserId);
  const { data: achievements = [] } = useAchievements(targetUserId);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const allBadges = useMemo(() => {
    if (!badgeShowcase) return [];
    const badges: Array<{ badge: string; name: string; rarity: string; category: string; isUnlocked: boolean; unlocked_at?: string }> = [];
    Object.entries(badgeShowcase.badges_by_category).forEach(([category, categoryBadges]) => {
      categoryBadges.forEach(b => badges.push({ ...b, category, isUnlocked: true }));
    });
    achievements.filter(a => !a.unlocked).forEach(a => badges.push({ badge: a.badge, name: a.name, rarity: a.rarity, category: a.category, isUnlocked: false }));
    return badges;
  }, [badgeShowcase, achievements]);

  const filteredBadges = useMemo(() => selectedCategory === 'all' ? allBadges : allBadges.filter(b => b.category === selectedCategory), [allBadges, selectedCategory]);

  if (isLoading) return <div className="animate-pulse">Loading badges...</div>;
  if (!badgeShowcase) return <div className="text-gray-500">Unable to load badges</div>;

  return (
    <div className={className}>
      <h2 className="text-2xl font-bold mb-4">Badge Collection</h2>
      {showStats && (
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow p-4 text-center">
            <div className="text-2xl font-bold">{badgeShowcase.total_badges}</div>
            <div className="text-sm text-gray-600">Total</div>
          </div>
        </div>
      )}
      <div className="flex gap-2 mb-4">
        {['all', 'milestone', 'skill', 'streak', 'social'].map(cat => (
          <button key={cat} onClick={() => setSelectedCategory(cat)} className={selectedCategory === cat ? 'bg-blue-100 text-blue-700 px-3 py-1 rounded' : 'bg-gray-100 px-3 py-1 rounded'}>{cat}</button>
        ))}
      </div>
      <div className={compact ? 'grid grid-cols-6 gap-2' : 'grid grid-cols-4 gap-3'}>
        <AnimatePresence>
          {filteredBadges.map((badge, i) => (
            <motion.div key={i} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} className={badge.isUnlocked ? 'bg-white shadow rounded-lg p-3 text-center' : 'bg-gray-50 rounded-lg p-3 text-center opacity-60'}>
              <div className="text-3xl mb-2">{badge.badge}</div>
              <div className="text-xs font-semibold">{badge.name}</div>
              <div className="text-xs text-gray-500 capitalize">{badge.rarity}</div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
      {filteredBadges.length === 0 && <div className="text-center py-8 text-gray-500">No badges found</div>}
    </div>
  );
};

export default BadgeCollection;
