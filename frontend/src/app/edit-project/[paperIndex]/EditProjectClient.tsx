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
    projectName: project.projectName || '-',
    status: project.status|| '-',
    pi: project.pi,
    fundingBody: project.fundingBody,
    documents: project.documents,
    additionalAuthors: project.additionalAuthors,
    amount: project.amount,
  })

  const handleChange = (key: keyof Project, value: string | string[]) => {
    setNewProject((prev) => ({ ...prev, [key]: value }))
  }
  const fundingBodyTypes = ['EU','VR','Vinnova','Formas','Trafikverket','Energimundiheten']

  const [message, setMessage] = useState('')

  const statuses = ['Draft', 'Submitted', 'Approved']

  const handleSave = async () => {
          try {
              const response = await updateProject(project.id!, newProject);
              console.log(response)
              if (response.error) {
                  if (response.error === ("Project already exists")) {
                      setMessage("This Project already exists."); // Set error message
                  }
              } else {
                  triggerRefresh();
                  router.push('/');
              }
          } catch (error) {
              console.error('Error saving paper:', error);
              setMessage('An error occurred while saving.'); // Generic error
          }
      };
  const handleBack = () => {
    router.back(); // This navigates to the previous page in history
  };

  return (
    <div>
      {message && <p style={{ color: 'red', fontWeight: 'bold' }}>{message}</p>}
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
          amount={newProject.amount}
          setAmount={(value) => handleChange('amount', value)}
          fundingbdytypes={fundingBodyTypes}
          additionalAuthors={newProject.additionalAuthors}
          setAdditionalAuthors={(value) => handleChange('additionalAuthors', value)}
          onSave={handleSave}
          onBack={handleBack}
        />
    </div>
  )
  
}
