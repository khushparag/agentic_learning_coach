import { ExclamationCircleIcon, XMarkIcon, ArrowPathIcon } from '@heroicons/react/24/outline'

export interface ErrorMessageProps {
  message: string
  details?: string[]
  onDismiss?: () => void
  onRetry?: () => void
  className?: string
}

export function ErrorMessage({ message, details, onDismiss, onRetry, className = '' }: ErrorMessageProps) {
  return (
    <div className={`p-4 bg-red-50 border border-red-200 rounded-lg ${className}`}>
      <div className="flex items-start">
        <ExclamationCircleIcon className="w-5 h-5 text-red-600 mr-2 mt-0.5 flex-shrink-0" />
        <div className="flex-1">
          <span className="text-red-700 font-medium">{message}</span>
          {details && details.length > 0 && (
            <ul className="mt-2 ml-0 list-disc text-sm text-red-600 space-y-1">
              {details.map((detail, index) => (
                <li key={index} className="ml-4">{detail}</li>
              ))}
            </ul>
          )}
          {onRetry && (
            <button
              onClick={onRetry}
              className="mt-2 flex items-center text-sm text-red-600 hover:text-red-800"
            >
              <ArrowPathIcon className="w-4 h-4 mr-1" />
              Try again
            </button>
          )}
        </div>
        {onDismiss && (
          <button
            onClick={onDismiss}
            className="text-red-400 hover:text-red-600 ml-2"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        )}
      </div>
    </div>
  )
}


export default ErrorMessage;
