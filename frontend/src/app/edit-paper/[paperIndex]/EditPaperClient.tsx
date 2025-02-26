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
    date: paper.date,
    additionalAuthors: paper.additionalAuthors,
    id: paper.id
  })

  const handleChange = (key: keyof Paper, value: string| string[]) => {
    setNewPaper((prev) => ({ ...prev, [key]: value }))
  }
  const [message, setMessage] = useState('')

  const handleSubmit = async () => {
    setMessage('')
  
    try {
      await updatePaper(paper.id!, newPaper)
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
  const handleBack = () => {
    router.back(); // This navigates to the previous page in history
  };

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
        date={newPaper.date}
        setDate={(value) => handleChange('date', value)}
        journal={newPaper.journal}
        setJournal={(value) => handleChange('journal', value)}
        additionalAuthors={newPaper.additionalAuthors}
        setAdditionalAuthors={(value) => handleChange('additionalAuthors', value)}
        onSave={handleSubmit}
        onBack={handleBack}     />
    </div>
  )
  
}
