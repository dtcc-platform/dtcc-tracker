'use client'
import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import ProjectForm from '@/components/ProjectForm'
import { Project } from '@/app/types/FixedTypes'
import { useRefresh } from '@/app/hooks/RefreshContext'
import { updateProject } from '@/app/utils/api'

interface EditProjectClientProps {
  paperIndex: number
}

export default function EditProjectClient({ paperIndex}: EditProjectClientProps) {
  const router = useRouter()
  const {projects, triggerRefresh} = useRefresh()
  const project = projects[paperIndex]
  const [newProject, setNewProject] = useState<Project>({
    authorName: project.authorName || '-',
    doi: project.doi|| '-',
    title: project.title|| '-',
    category: project.category|| '-',
    status: project.status|| '-',
    pi: project.pi,
    fundingBody: project.fundingBody,
    fundingProgram: project.fundingProgram,
    fundingCall: project.fundingCall,
    topic: project.topic,
    link: project.link,
    submissionDeadline: project.submissionDeadline,
    amount: project.amount,
    year: project.year,
    period: project.period,
    typeOfEngagement: project.typeOfEngagement,
    notes: project.notes,
    documents: project.documents,
    slug: project.slug,
  })

  const handleChange = (key: keyof Project, value: string) => {
    setNewProject((prev) => ({ ...prev, [key]: value }))
  }
  const [message, setMessage] = useState('')

  const categories = ['Category 1', 'Category 2', 'Category 3']
  const statuses = ['Draft', 'Submitted', 'Approved']
  const typesOfEngagement = ['Type 1', 'Type 2', 'Type 3']

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setMessage('')
  
    try {
      await updateProject(project.doi, newProject)
      triggerRefresh()
      router.push('/?projectIndex=' + paperIndex)
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
        typeOfEngagement={project.typeOfEngagement}
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
    </div>
  )
  
}
