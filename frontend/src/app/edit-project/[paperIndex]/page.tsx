import { notFound } from 'next/navigation'
import EditProjectClient from './EditProjectClient'
import { Paper } from '@/app/types/FixedTypes'
import { useRefresh } from '@/app/contexts/RefreshContext'

export default async function EditPaperPage(
  props: {
    params: Promise<{ paperIndex: string }>
  }
) {
  const params = await props.params;
  // Convert paperIndex from string to a number
  const index = parseInt(params.paperIndex, 10)
  if (isNaN(index)) {
    // If invalid index, show 404
    return notFound()
  }

  // The paper we want to edit

  // Pass it down to our client component
  return <EditProjectClient paperIndex={index} />
}
