
export interface Project {
  authorName: string
  doi: string
  title: string
  category: string
  status: string
  pi: string
  fundingBody: string
  fundingProgram: string
  fundingCall: string
  topic: string
  link: string
  submissionDeadline: string
  amount: string
  year: string
  period: string
  typeOfEngagement: string
  notes: string
  documents: string
  slug: string
}
export interface Paper{
  authorName:string
  doi:string
  title:string
  journal:string
  date:string
  additionalAuthors: string[]
}

export const paperSchema: Record<keyof Project, { required: boolean }> = {
  authorName: { required: true },
  doi: { required: true },
  title: { required: true },
  category: { required: true },
  status: { required: true },
  pi: { required: false },
  fundingBody: { required: false },
  fundingProgram: { required: false },
  fundingCall: { required: false },
  topic: { required: false },
  link: { required: false },
  submissionDeadline: { required: false },
  amount: { required: false },
  year: { required: false },
  period: { required: false },
  typeOfEngagement: { required: false },
  notes: { required: false },
  documents: { required: false },
  slug: { required: false },
};
export const BASE_URL = `${process.env.REACT_APP_API_BASE_URL}/api/`
