import { useState } from 'react'

/**
 * Smooth animated tooltip component with proper positioning
 * Shows on hover with fade-in animation
 */
function Tooltip({ children, text, position = 'top' }) {
  const [isVisible, setIsVisible] = useState(false)

  if (!text) return children

  const positionClasses = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2'
  }

  const arrowClasses = {
    top: 'top-full left-1/2 -translate-x-1/2 border-l-transparent border-r-transparent border-b-transparent',
    bottom: 'bottom-full left-1/2 -translate-x-1/2 border-l-transparent border-r-transparent border-t-transparent',
    left: 'left-full top-1/2 -translate-y-1/2 border-t-transparent border-b-transparent border-r-transparent',
    right: 'right-full top-1/2 -translate-y-1/2 border-t-transparent border-b-transparent border-l-transparent'
  }

  return (
    <div
      className="relative inline-block"
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
    >
      {children}
      {isVisible && (
        <div
          className={`absolute ${positionClasses[position]} z-50 pointer-events-none tooltip-appear`}
        >
          <div className="bg-gray-900 dark:bg-gray-700 text-white text-sm px-3 py-1.5 rounded-lg shadow-lg whitespace-nowrap">
            {text}
            {/* Arrow */}
            <div
              className={`absolute w-0 h-0 border-4 ${arrowClasses[position]}`}
              style={{
                borderTopColor: position === 'bottom' ? 'transparent' : 'rgb(17, 24, 39)',
                borderBottomColor: position === 'top' ? 'transparent' : 'rgb(17, 24, 39)',
                borderLeftColor: position === 'right' ? 'transparent' : 'rgb(17, 24, 39)',
                borderRightColor: position === 'left' ? 'transparent' : 'rgb(17, 24, 39)'
              }}
            ></div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Tooltip
