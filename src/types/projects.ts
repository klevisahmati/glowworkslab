export type ProjectMediaType = 'image' | 'video'

export interface ProjectMedia {
  id: string
  projectId: string
  mediaType: ProjectMediaType
  storagePath: string
  publicUrl: string
  altText: string
  sortOrder: number
  isCover: boolean
  createdAt: string
}

export interface ProjectRecord {
  id: string
  slug: string
  serviceId: string
  brand: string
  model: string
  title: string
  description: string
  createdAt: string
  updatedAt: string
  media: ProjectMedia[]
}

export interface ProjectDraft {
  slug?: string
  serviceId: string
  brand: string
  model: string
  title: string
  description: string
}