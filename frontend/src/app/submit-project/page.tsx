'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import ProjectForm from '@/components/ProjectForm'
import { Project } from '../types/FixedTypes'
import { createProject} from '../utils/api'
import { useRefresh } from '@/app/hooks/RefreshContext'

export default function SubmitPaper1Page() {
  const { triggerRefresh } = useRefresh();
  const [newProject, setPaper] = useState<Project>({
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
      
      console.log(newProject)
      await createProject(newProject);
    } catch (error: any) {
      setMessage(`Error: ${error.message}`)
    }
    router.push('/')
    router.refresh()
    triggerRefresh()
  }
  

  return (
    <ProjectForm
          authorName={newProject.authorName}
          setAuthorName={(value) => handleChange('authorName', value)}
          doi={newProject.doi}
          setDoi={(value) => handleChange('doi', value)}
          title={newProject.title}
          setTitle={(value) => handleChange('title', value)}
          category={newProject.category}
          setCategory={(value) => handleChange('category', value)}
          categories={categories}
          status={newProject.status}
          setStatus={(value) => handleChange('status', value)}
          statuses={statuses}
          pi={newProject.pi}
          setPi={(value) => handleChange('pi', value)}
          fundingBody={newProject.fundingBody}
          setFundingBody={(value) => handleChange('fundingBody', value)}
          fundingProgram={newProject.fundingProgram}
          setFundingProgram={(value) => handleChange('fundingProgram', value)}
          fundingCall={newProject.fundingCall}
          setFundingCall={(value) => handleChange('fundingCall', value)}
          topic={newProject.topic}
          setTopic={(value) => handleChange('topic', value)}
          link={newProject.link}
          setLink={(value) => handleChange('link', value)}
          submissionDeadline={newProject.submissionDeadline}
          setSubmissionDeadline={(value) => handleChange('submissionDeadline', value)}
          amount={newProject.amount}
          setAmount={(value) => handleChange('amount', value)}
          year={newProject.year}
          setYear={(value) => handleChange('year', value)}
          period={newProject.period}
          setPeriod={(value) => handleChange('period', value)}
          typeOfEngagement={newProject.typeOfEngagement}
          setTypeOfEngagement={(value) => handleChange('typeOfEngagement', value)}
          typesOfEngagement={typesOfEngagement}
          notes={newProject.notes}
          setNotes={(value) => handleChange('notes', value)}
          documents={newProject.documents}
          setDocuments={(value) => handleChange('documents', value)}
          slug={newProject.slug}
          setSlug={(value) => handleChange('slug', value)}
          onSubmit={handleSubmit}
          message={message}
        />
  )
}
