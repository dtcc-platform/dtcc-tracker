'use client'
import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Paper } from '@/app/types/FixedTypes'
import { useRefresh } from '@/app/hooks/RefreshContext'
import { updatePaper } from '@/app/utils/api'
import PaperForm from '@/components/PaperForm'

interface EditPaperClientProps {
  paperIndex: number
}

export default function EditPaperClient({ paperIndex}: EditPaperClientProps) {
  const router = useRouter()
  const {papers, triggerRefresh} = useRefresh()
  const paper = papers[paperIndex]
  console.log(paper)
  const [newPaper, setNewPaper] = useState<Paper>({
    authorName: paper.authorName || '-',
    doi: paper.doi|| '-',
    title: paper.title|| '-',
    journal: paper.journal,
    date: paper.date
  })

  const handleChange = (key: keyof Paper, value: string) => {
    setNewPaper((prev) => ({ ...prev, [key]: value }))
  }
  const [message, setMessage] = useState('')

  const categories = ['Category 1', 'Category 2', 'Category 3']
  const statuses = ['Draft', 'Submitted', 'Approved']
  const typesOfEngagement = ['Type 1', 'Type 2', 'Type 3']

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setMessage('')
  
    try {
      await updatePaper(paper.doi, newPaper)
      triggerRefresh()
      router.push('/?paperIndex=' + paperIndex)
    } catch (error: any) {
      console.log(error.message)
      
      // Check if the error is due to DOI already existing
      if (error.message === "DOI already exists") {
        setMessage("Error: DOI already exists. Please enter a unique DOI.")
      } else {
        setMessage("An unexpected error occurred. Please try again.")
      }
    }
  }
  

  return (
    <div>
      {message && <p style={{ color: 'red', fontWeight: 'bold' }}>{message}</p>}
      <PaperForm
        authorName={newPaper.authorName}
        setAuthorName={(value) => handleChange('authorName', value)}
        doi={newPaper.doi}
        setDoi={(value) => handleChange('doi', value)}
        title={newPaper.title}
        setTitle={(value) => handleChange('title', value)}
        message={message}
        date={newPaper.date}
        setDate={(value) => handleChange('authorName', value)}
        journal={newPaper.journal}
        setJournal={(value) => handleChange('doi', value)}
        onSubmit={handleSubmit}      />
    </div>
  )
  
}
