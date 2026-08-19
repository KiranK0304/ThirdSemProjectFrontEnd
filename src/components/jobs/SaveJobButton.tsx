import React from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui'
import { useAuth } from '@/context/AuthContext'
import { useSaveJob, useSavedJobs, useUnsaveJob } from '@/hooks/queries/useJobQueries'

interface SaveJobButtonProps {
  jobId: number
  stopPropagation?: boolean
}

export function SaveJobButton({ jobId, stopPropagation = false }: SaveJobButtonProps) {
  const { user } = useAuth()
  const navigate = useNavigate()
  const isSeeker = user?.account_type === 'SEEKER'
  const { data: savedJobs = [] } = useSavedJobs(isSeeker)
  const saveJob = useSaveJob()
  const unsaveJob = useUnsaveJob()
  const isSaved = savedJobs.some((savedJob) => savedJob.job.id === jobId)
  const isPending = saveJob.isPending || unsaveJob.isPending

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    if (stopPropagation) event.stopPropagation()

    if (!user) {
      navigate('/login')
      return
    }
    if (!isSeeker) return

    if (isSaved) {
      unsaveJob.mutate(jobId)
    } else {
      saveJob.mutate(jobId)
    }
  }

  if (user && !isSeeker) return null

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      onClick={handleClick}
      loading={isPending}
      disabled={isPending}
    >
      {isSaved ? 'Saved' : 'Save Job'}
    </Button>
  )
}
