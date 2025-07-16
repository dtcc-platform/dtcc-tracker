
export interface Project {
  id?: number
  projectName: string
  status: string
  pi: string
  fundingBody: string
  documents: string
  additionalAuthors: string[]
  submittedBy? : string
  amount: string
}
export interface Paper{
  id?: number
  authorName:string
  doi:string
  title:string
  journal:string
  date:string
  additionalAuthors: string[]
  submittedBy? : string
  publicationType: string
  submissionYear?: number
}
export interface User {
  id: number;
  username: string;
  email: string;
  is_superuser: boolean;
  // add other fields if needed
}


export const BASE_URL = `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/`
