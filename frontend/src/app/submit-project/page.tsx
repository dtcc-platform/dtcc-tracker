'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import ProjectForm from '@/components/ProjectForm'
import { Project } from '../types/FixedTypes'
import { createProject } from '../utils/api'
import { useRefresh } from '@/app/hooks/RefreshContext'

export default function SubmitPaper1Page() {
  const { triggerRefresh } = useRefresh();
  const [error, setError] = useState<string | null>(null); // New state for error message

  const [newProject, setPaper] = useState<Project>({
    projectName: '',
    status: '',
    pi: '',
    fundingBody: '',
    documents: '',
    additionalAuthors: [],
  })
  const handleChange = (key: keyof Project, value: string | string[]) => {
    setPaper((prev) => ({ ...prev, [key]: value }))
  }
  const [message, setMessage] = useState('')
  const router = useRouter()
  const categories = ['Category 1', 'Category 2', 'Category 3']
  const statuses = ['Draft', 'Submitted', 'Approved']
  const typesOfEngagement = ['Type 1', 'Type 2', 'Type 3']
  const fundingBodyTypes = ['EU', 'VR', 'Vinnova', 'Formas', 'Trafikverket', 'Energimundiheten']
  const onBack = () => {
    router.push('/');
  };
  const handleSave = async () => {
    try {
      const response = await createProject(newProject);
      console.log(response)
      if (response.error) {
        if (response.error === ("Project already exists")) {
          setError("This Project Name already exists."); // Set error message
        }
      } else {
        triggerRefresh();
        router.push('/');
      }
    } catch (error) {
      console.error('Error saving paper:', error);
      setError('An error occurred while saving.'); // Generic error
    }
  };


  return (
    <div>
      {error && <p style={{ color: 'red', fontWeight: 'bold' }}>{error}</p>}

      <ProjectForm
        ProjectName={newProject.projectName}
        setProjectName={(value) => handleChange('projectName', value)}
        status={newProject.status}
        setStatus={(value) => handleChange('status', value)}
        statuses={statuses}
        Pi={newProject.pi}
        setPi={(value) => handleChange('pi', value)}
        fundingBody={newProject.fundingBody}
        setFundingBody={(value) => handleChange('fundingBody', value)}
        Documents={newProject.documents}
        setDocuments={(value) => handleChange('documents', value)}
        fundingbdytypes={fundingBodyTypes}
        additionalAuthors={newProject.additionalAuthors}
        setAdditionalAuthors={(value) => handleChange('additionalAuthors', value)}
        onSave={handleSave}
        onBack={onBack}
      />
    </div>
  )
}
