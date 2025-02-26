
export interface Project {
  id?: number
  projectName: string
  status: string
  pi: string
  fundingBody: string
  documents: string
  additionalAuthors: string[]
}
export interface Paper{
  id?: number
  authorName:string
  doi:string
  title:string
  journal:string
  date:string
  additionalAuthors: string[]
}
export const BASE_URL = `${process.env.REACT_APP_API_BASE_URL}/api/`
