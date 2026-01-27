/**
 * NavigationLoadingOverlay Component
 * 
 * Provides clear feedback during navigation and content loading operations.
 * Shows animated spinner, optional progress bar, and elapsed time tracking.
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface NavigationLoadingOverlayProps {
  isLoading: boolean;
  message?: string;
  progress?: number; // 0-100
  showElapsedTime?: boolean;
}

export const NavigationLoadingOverlay: React.FC<NavigationLoadingOverlayProps> = ({
  isLoading,
  message = 'Loading...',
  progress,
  showElapsedTime = true,
}) => {
  const [elapsedTime, setElapsedTime] = useState(0);

  // Track elapsed time
  useEffect(() => {
    if (!isLoading) {
      setElapsedTime(0);
      return;
    }

    const interval = setInterval(() => {
      setElapsedTime(prev => prev + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [isLoading]);

  if (!isLoading) return null;

  const showSlowWarning = elapsedTime > 5;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center"
        role="dialog"
        aria-modal="true"
        aria-labelledby="loading-title"
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-white rounded-lg p-8 max-w-md w-full mx-4 shadow-2xl"
        >
          {/* Animated spinner */}
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"
            aria-hidden="true"
          />
          
          {/* Loading message */}
          <h3 
            id="loading-title"
            className="text-lg font-semibold text-gray-900 mb-2 text-center"
          >
            {message}
          </h3>
          
          {/* Progress bar */}
          {progress !== undefined && (
            <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.3 }}
                className="bg-blue-600 h-2 rounded-full"
                role="progressbar"
                aria-valuenow={progress}
                aria-valuemin={0}
                aria-valuemax={100}
              />
            </div>
          )}
          
          {/* Elapsed time */}
          {showElapsedTime && elapsedTime > 0 && (
            <p className="text-sm text-gray-500 text-center mb-2">
              {elapsedTime}s elapsed
            </p>
          )}
          
          {/* Slow loading warning */}
          {showSlowWarning && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg"
            >
              <p className="text-sm text-yellow-800 text-center">
                ⏱️ This is taking longer than usual. Please wait...
              </p>
            </motion.div>
          )}
          
          {/* Accessibility: Screen reader announcement */}
          <div className="sr-only" role="status" aria-live="polite">
            {message}
            {showSlowWarning && ' This is taking longer than usual.'}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default NavigationLoadingOverlay;
