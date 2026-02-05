import { useEffect, useState, useRef } from 'react'

function TourTooltip({ step, totalSteps, position, targetSelector, onNext, onPrevious, onSkip, onComplete }) {
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 })
  const [arrowPosition, setArrowPosition] = useState('top')
  const tooltipRef = useRef(null)

  useEffect(() => {
    // Position the tooltip relative to the target element
    const targetElement = document.querySelector(`[data-tour-id="${targetSelector}"]`)
    if (!targetElement || !tooltipRef.current) return

    const targetRect = targetElement.getBoundingClientRect()
    const tooltipRect = tooltipRef.current.getBoundingClientRect()
    const spacing = 16

    let top = 0
    let left = 0
    let arrow = 'top'

    // Determine best position based on available space
    if (position === 'bottom') {
      top = targetRect.bottom + spacing
      left = targetRect.left + (targetRect.width / 2) - (tooltipRect.width / 2)
      arrow = 'top'
    } else if (position === 'top') {
      top = targetRect.top - tooltipRect.height - spacing
      left = targetRect.left + (targetRect.width / 2) - (tooltipRect.width / 2)
      arrow = 'bottom'
    } else if (position === 'right') {
      top = targetRect.top + (targetRect.height / 2) - (tooltipRect.height / 2)
      left = targetRect.right + spacing
      arrow = 'left'
    } else if (position === 'left') {
      top = targetRect.top + (targetRect.height / 2) - (tooltipRect.height / 2)
      left = targetRect.left - tooltipRect.width - spacing
      arrow = 'right'
    }

    // Keep tooltip within viewport
    if (left < 10) left = 10
    if (left + tooltipRect.width > window.innerWidth - 10) {
      left = window.innerWidth - tooltipRect.width - 10
    }
    if (top < 10) top = 10
    if (top + tooltipRect.height > window.innerHeight - 10) {
      top = window.innerHeight - tooltipRect.height - 10
    }

    setTooltipPosition({ top, left })
    setArrowPosition(arrow)

    // Highlight the target element
    targetElement.style.position = 'relative'
    targetElement.style.zIndex = '10000'
    targetElement.style.outline = '3px solid #CC785C'
    targetElement.style.outlineOffset = '4px'
    targetElement.style.borderRadius = '8px'

    return () => {
      targetElement.style.position = ''
      targetElement.style.zIndex = ''
      targetElement.style.outline = ''
      targetElement.style.outlineOffset = ''
    }
  }, [targetSelector, position])

  const handleNext = () => {
    if (step.stepNumber === totalSteps) {
      onComplete()
    } else {
      onNext()
    }
  }

  return (
    <>
      {/* Backdrop overlay */}
      <div
        className="fixed inset-0 bg-black/50 z-[9998]"
        onClick={onSkip}
      />

      {/* Tooltip */}
      <div
        ref={tooltipRef}
        className="fixed z-[9999] bg-white dark:bg-gray-800 rounded-lg shadow-2xl p-6 max-w-md"
        style={{
          top: `${tooltipPosition.top}px`,
          left: `${tooltipPosition.left}px`,
        }}
      >
        {/* Arrow */}
        <div
          className={`absolute w-3 h-3 bg-white dark:bg-gray-800 transform rotate-45 ${
            arrowPosition === 'top' ? '-top-1.5 left-1/2 -translate-x-1/2' :
            arrowPosition === 'bottom' ? '-bottom-1.5 left-1/2 -translate-x-1/2' :
            arrowPosition === 'left' ? 'top-1/2 -left-1.5 -translate-y-1/2' :
            'top-1/2 -right-1.5 -translate-y-1/2'
          }`}
        />

        {/* Content */}
        <div className="relative">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-claude-orange">
              Step {step.stepNumber} of {totalSteps}
            </span>
            <button
              onClick={onSkip}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              title="Skip tour"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">
            {step.title}
          </h3>

          <p className="text-gray-600 dark:text-gray-300 mb-6">
            {step.description}
          </p>

          {/* Navigation buttons */}
          <div className="flex items-center justify-between">
            <button
              onClick={onPrevious}
              disabled={step.stepNumber === 1}
              className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
            >
              Previous
            </button>

            <div className="flex gap-1">
              {Array.from({ length: totalSteps }).map((_, i) => (
                <div
                  key={i}
                  className={`w-2 h-2 rounded-full ${
                    i + 1 === step.stepNumber ? 'bg-claude-orange' : 'bg-gray-300 dark:bg-gray-600'
                  }`}
                />
              ))}
            </div>

            <button
              onClick={handleNext}
              className="px-4 py-2 text-sm font-medium bg-claude-orange text-white rounded-lg hover:bg-claude-orange/90"
            >
              {step.stepNumber === totalSteps ? 'Finish' : 'Next'}
            </button>
          </div>
        </div>
      </div>
    </>
  )
}

export default TourTooltip
