import { CheckCircleIcon, XMarkIcon } from '@heroicons/react/24/outline'

interface SuccessMessageProps {
  message: string
  details?: string[]
  onDismiss?: () => void
  className?: string
}

export function SuccessMessage({ message, details, onDismiss, className = '' }: SuccessMessageProps) {
  return (
    <div className={`p-4 bg-green-50 border border-green-200 rounded-lg ${className}`}>
      <div className="flex items-start">
        <CheckCircleIcon className="w-5 h-5 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
        <div className="flex-1">
          <span className="text-green-700 font-medium">{message}</span>
          {details && details.length > 0 && (
            <ul className="mt-2 ml-0 list-disc text-sm text-green-600 space-y-1">
              {details.map((detail, index) => (
                <li key={index} className="ml-4">{detail}</li>
              ))}
            </ul>
          )}
        </div>
        {onDismiss && (
          <button
            onClick={onDismiss}
            className="text-green-400 hover:text-green-600 ml-2"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        )}
      </div>
    </div>
  )
}


export default SuccessMessage;
