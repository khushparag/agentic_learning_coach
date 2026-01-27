import React from 'react'
import { Link } from 'react-router-dom'
import { HomeIcon, ArrowLeftIcon } from '@heroicons/react/24/outline'
import { Button } from '../components/ui'
import { useNavigation } from '../hooks/useNavigation'

export default function NotFound() {
  const { goBack, goToDashboard } = useNavigation()

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="text-center">
          <div className="mx-auto h-24 w-24 bg-gray-100 rounded-full flex items-center justify-center mb-6">
            <span className="text-4xl font-bold text-gray-400">404</span>
          </div>
          
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Page Not Found
          </h1>
          
          <p className="text-gray-600 mb-8">
            Sorry, we couldn't find the page you're looking for. The page might have been moved, deleted, or you might have entered the wrong URL.
          </p>
          
          <div className="space-y-4 sm:space-y-0 sm:space-x-4 sm:flex sm:justify-center">
            <Button
              onClick={goBack}
              variant="outline"
              className="w-full sm:w-auto flex items-center justify-center"
            >
              <ArrowLeftIcon className="w-4 h-4 mr-2" />
              Go Back
            </Button>
            
            <Button
              onClick={goToDashboard}
              className="w-full sm:w-auto flex items-center justify-center"
            >
              <HomeIcon className="w-4 h-4 mr-2" />
              Go to Dashboard
            </Button>
          </div>
          
          <div className="mt-8 pt-8 border-t border-gray-200">
            <p className="text-sm text-gray-500">
              Need help? Check out our{' '}
              <Link to="/help" className="text-blue-600 hover:text-blue-500">
                help center
              </Link>{' '}
              or{' '}
              <Link to="/contact" className="text-blue-600 hover:text-blue-500">
                contact support
              </Link>
              .
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
