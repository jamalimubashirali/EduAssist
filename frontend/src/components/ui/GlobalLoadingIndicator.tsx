'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { Progress } from './progress'
import { useLoading } from '@/contexts/LoadingContext'
import { Loader2, CheckCircle, AlertCircle } from 'lucide-react'

export function GlobalLoadingIndicator() {
  const { operations, hasActiveOperations } = useLoading()
  
  if (!hasActiveOperations) return null

  const activeOperations = Object.values(operations)
  const primaryOperation = activeOperations[0] // Show the first active operation

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -50 }}
        className="fixed top-4 right-4 z-50 bg-background border rounded-lg shadow-lg p-4 min-w-[300px] max-w-[400px]"
      >
        <div className="flex items-start gap-3">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          >
            <Loader2 className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
          </motion.div>
          
          <div className="flex-1 min-w-0">
            <h4 className="font-medium text-sm truncate">
              {primaryOperation.message}
            </h4>
            
            {primaryOperation.description && (
              <p className="text-xs text-muted-foreground mt-1">
                {primaryOperation.description}
              </p>
            )}
            
            {primaryOperation.stage && (
              <p className="text-xs text-primary mt-1">
                {primaryOperation.stage}
              </p>
            )}
            
            {primaryOperation.progress !== undefined && (
              <div className="mt-2">
                <Progress 
                  value={primaryOperation.progress} 
                  className="h-1.5"
                />
                <div className="flex justify-between items-center mt-1">
                  <span className="text-xs text-muted-foreground">
                    {Math.round(primaryOperation.progress)}%
                  </span>
                  {primaryOperation.estimatedDuration && (
                    <span className="text-xs text-muted-foreground">
                      ~{Math.round(primaryOperation.estimatedDuration / 1000)}s
                    </span>
                  )}
                </div>
              </div>
            )}
            
            {activeOperations.length > 1 && (
              <p className="text-xs text-muted-foreground mt-2">
                +{activeOperations.length - 1} more operation{activeOperations.length > 2 ? 's' : ''}
              </p>
            )}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}

// Compact loading indicator for smaller spaces
export function CompactLoadingIndicator({ 
  operation,
  className = ''
}: { 
  operation?: string
  className?: string 
}) {
  const { getOperation, isOperationActive } = useLoading()
  
  if (!operation || !isOperationActive(operation)) return null
  
  const op = getOperation(operation)
  if (!op) return null

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <Loader2 className="h-4 w-4 animate-spin text-primary" />
      <span className="text-sm text-muted-foreground">
        {op.stage || op.message}
      </span>
      {op.progress !== undefined && (
        <span className="text-xs text-muted-foreground">
          {Math.round(op.progress)}%
        </span>
      )}
    </div>
  )
}

// Loading overlay for full-screen operations
export function LoadingOverlay({
  operation,
  children
}: {
  operation?: string
  children?: React.ReactNode
}) {
  const { getOperation, isOperationActive } = useLoading()
  
  const isActive = operation ? isOperationActive(operation) : false
  const op = operation ? getOperation(operation) : null

  return (
    <div className="relative">
      {children}
      
      <AnimatePresence>
        {isActive && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-10"
          >
            <div className="bg-background border rounded-lg shadow-lg p-6 max-w-sm w-full mx-4">
              <div className="text-center">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                  className="mx-auto mb-4"
                >
                  <Loader2 className="h-8 w-8 text-primary" />
                </motion.div>
                
                <h3 className="font-medium mb-2">
                  {op?.message || 'Loading...'}
                </h3>
                
                {op?.description && (
                  <p className="text-sm text-muted-foreground mb-4">
                    {op.description}
                  </p>
                )}
                
                {op?.stage && (
                  <p className="text-sm text-primary mb-4">
                    {op.stage}
                  </p>
                )}
                
                {op?.progress !== undefined && (
                  <div className="space-y-2">
                    <Progress value={op.progress} />
                    <p className="text-xs text-muted-foreground">
                      {Math.round(op.progress)}% complete
                    </p>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// Status indicator for completed/failed operations
export function OperationStatus({
  success,
  error,
  message,
  className = ''
}: {
  success?: boolean
  error?: boolean
  message?: string
  className?: string
}) {
  if (!success && !error) return null

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`flex items-center gap-2 ${className}`}
    >
      {success && (
        <>
          <CheckCircle className="h-4 w-4 text-green-500" />
          <span className="text-sm text-green-600">
            {message || 'Operation completed successfully'}
          </span>
        </>
      )}
      
      {error && (
        <>
          <AlertCircle className="h-4 w-4 text-red-500" />
          <span className="text-sm text-red-600">
            {message || 'Operation failed'}
          </span>
        </>
      )}
    </motion.div>
  )
}