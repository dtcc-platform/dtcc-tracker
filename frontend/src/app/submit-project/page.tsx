'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import ProjectForm from '@/components/ProjectForm'
import { Paper, Project } from '../types/FixedTypes'
import { fetchProjects, createProject} from '../utils/api'
import { useRefresh } from '@/app/hooks/RefreshContext'

export default function SubmitPaper1Page() {
  const { triggerRefresh } = useRefresh();
  const [newPaper, setPaper] = useState<Project>({
      authorName: '',
      doi: '',
      title: '',
      category: '',
      status: '',
      pi: '',
      fundingBody: '',
      fundingProgram: '',
      fundingCall: '',
      topic: '',
      link: '',
      submissionDeadline: '',
      amount: '',
      year: '',
      period: '',
      typeOfEngagement: '',
      notes: '',
      documents: '',
      slug: '',
    })
  const handleChange = (key: keyof Project, value: string) => {
      setPaper((prev) => ({ ...prev, [key]: value }))
    }
  const [message, setMessage] = useState('')
  const router = useRouter()
  const categories = ['Category 1', 'Category 2', 'Category 3']
  const statuses = ['Draft', 'Submitted', 'Approved']
  const typesOfEngagement = ['Type 1', 'Type 2', 'Type 3']


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setMessage('')

    try {
      
      console.log(newPaper)
      await createProject(newPaper);
    } catch (error: any) {
      setMessage(`Error: ${error.message}`)
    }
    router.push('/')
    router.refresh()
    triggerRefresh()
  }
  

  return (
    <ProjectForm
          authorName={newPaper.authorName}
          setAuthorName={(value) => handleChange('authorName', value)}
          doi={newPaper.doi}
          setDoi={(value) => handleChange('doi', value)}
          title={newPaper.title}
          setTitle={(value) => handleChange('title', value)}
          category={newPaper.category}
          setCategory={(value) => handleChange('category', value)}
          categories={categories}
          status={newPaper.status}
          setStatus={(value) => handleChange('status', value)}
          statuses={statuses}
          pi={newPaper.pi}
          setPi={(value) => handleChange('pi', value)}
          fundingBody={newPaper.fundingBody}
          setFundingBody={(value) => handleChange('fundingBody', value)}
          fundingProgram={newPaper.fundingProgram}
          setFundingProgram={(value) => handleChange('fundingProgram', value)}
          fundingCall={newPaper.fundingCall}
          setFundingCall={(value) => handleChange('fundingCall', value)}
          topic={newPaper.topic}
          setTopic={(value) => handleChange('topic', value)}
          link={newPaper.link}
          setLink={(value) => handleChange('link', value)}
          submissionDeadline={newPaper.submissionDeadline}
          setSubmissionDeadline={(value) => handleChange('submissionDeadline', value)}
          amount={newPaper.amount}
          setAmount={(value) => handleChange('amount', value)}
          year={newPaper.year}
          setYear={(value) => handleChange('year', value)}
          period={newPaper.period}
          setPeriod={(value) => handleChange('period', value)}
          typeOfEngagement={newPaper.typeOfEngagement}
          setTypeOfEngagement={(value) => handleChange('typeOfEngagement', value)}
          typesOfEngagement={typesOfEngagement}
          notes={newPaper.notes}
          setNotes={(value) => handleChange('notes', value)}
          documents={newPaper.documents}
          setDocuments={(value) => handleChange('documents', value)}
          slug={newPaper.slug}
          setSlug={(value) => handleChange('slug', value)}
          onSubmit={handleSubmit}
          message={message}
        />
  )
}
