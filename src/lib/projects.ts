import { supabase } from './supabase/client'
import type {
  ProjectDraft,
  ProjectMedia,
  ProjectRecord,
} from '../types/projects'

const PROJECT_MEDIA_BUCKET = 'project-media'
const MAX_IMAGE_SIZE = 15 * 1024 * 1024

type ProjectMediaRow = {
  id: string
  project_id: string
  media_type: 'image' | 'video'
  storage_path: string
  alt_text: string
  sort_order: number
  is_cover: boolean
  created_at: string
}

type ProjectRow = {
  id: string
  service_id: string
  brand: string
  model: string
  title: string
  description: string
  created_at: string
  updated_at: string
  project_media?: ProjectMediaRow[] | null
}

function getPublicMediaUrl(storagePath: string) {
  return supabase.storage
    .from(PROJECT_MEDIA_BUCKET)
    .getPublicUrl(storagePath).data.publicUrl
}

function mapProjectMedia(row: ProjectMediaRow): ProjectMedia {
  return {
    id: row.id,
    projectId: row.project_id,
    mediaType: row.media_type,
    storagePath: row.storage_path,
    publicUrl: getPublicMediaUrl(row.storage_path),
    altText: row.alt_text,
    sortOrder: row.sort_order,
    isCover: row.is_cover,
    createdAt: row.created_at,
  }
}

function mapProject(row: ProjectRow): ProjectRecord {
  const media = (row.project_media ?? [])
    .map(mapProjectMedia)
    .sort((a, b) => {
      if (a.isCover !== b.isCover) {
        return a.isCover ? -1 : 1
      }

      return a.sortOrder - b.sortOrder
    })

  return {
    id: row.id,
    serviceId: row.service_id,
    brand: row.brand,
    model: row.model,
    title: row.title,
    description: row.description,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    media,
  }
}

export async function fetchProjects() {
  const { data, error } = await supabase
    .from('projects')
    .select(`
      id,
      service_id,
      brand,
      model,
      title,
      description,
      created_at,
      updated_at,
      project_media (
        id,
        project_id,
        media_type,
        storage_path,
        alt_text,
        sort_order,
        is_cover,
        created_at
      )
    `)
    .order('created_at', { ascending: false })

  if (error) {
    throw error
  }

  return ((data ?? []) as ProjectRow[]).map(mapProject)
}

export async function createProject(draft: ProjectDraft) {
  const payload = {
    service_id: draft.serviceId.trim(),
    brand: draft.brand.trim(),
    model: draft.model.trim(),
    title: draft.title.trim(),
    description: draft.description.trim(),
  }

  if (
    !payload.service_id ||
    !payload.brand ||
    !payload.model ||
    !payload.title
  ) {
    throw new Error('Service, brand, model and title are required.')
  }

  const { data, error } = await supabase
    .from('projects')
    .insert(payload)
    .select('id')
    .single()

  if (error) {
    throw error
  }

  return data.id as string
}

export async function updateProject(
  projectId: string,
  draft: ProjectDraft,
) {
  const payload = {
    service_id: draft.serviceId.trim(),
    brand: draft.brand.trim(),
    model: draft.model.trim(),
    title: draft.title.trim(),
    description: draft.description.trim(),
  }

  if (
    !payload.service_id ||
    !payload.brand ||
    !payload.model ||
    !payload.title
  ) {
    throw new Error('Service, brand, model and title are required.')
  }

  const { error } = await supabase
    .from('projects')
    .update(payload)
    .eq('id', projectId)

  if (error) {
    throw error
  }
}
function safeFileName(fileName: string) {
  return fileName
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export async function uploadProjectImages(
  projectId: string,
  files: File[],
  makeFirstImageCover = true,
) {
  if (!files.length) {
    return
  }

  for (const [index, file] of files.entries()) {
    if (!file.type.startsWith('image/')) {
      throw new Error(`${file.name} is not an image.`)
    }

    if (file.size > MAX_IMAGE_SIZE) {
      throw new Error(`${file.name} is larger than 15 MB.`)
    }

    const storagePath =
      `${projectId}/${crypto.randomUUID()}-${safeFileName(file.name)}`

    const { error: uploadError } = await supabase.storage
      .from(PROJECT_MEDIA_BUCKET)
      .upload(storagePath, file, {
        cacheControl: '3600',
        contentType: file.type,
        upsert: false,
      })

    if (uploadError) {
      throw uploadError
    }

    const { error: mediaError } = await supabase
      .from('project_media')
      .insert({
        project_id: projectId,
        media_type: 'image',
        storage_path: storagePath,
        alt_text: '',
        sort_order: index,
        is_cover: makeFirstImageCover && index === 0,
      })

    if (mediaError) {
      await supabase.storage
        .from(PROJECT_MEDIA_BUCKET)
        .remove([storagePath])

      throw mediaError
    }
  }
}

export async function setProjectCover(
  projectId: string,
  mediaId: string,
) {
  const { error: clearError } = await supabase
    .from('project_media')
    .update({ is_cover: false })
    .eq('project_id', projectId)

  if (clearError) {
    throw clearError
  }

  const { error } = await supabase
    .from('project_media')
    .update({ is_cover: true })
    .eq('project_id', projectId)
    .eq('id', mediaId)

  if (error) {
    throw error
  }
}

export async function deleteProjectMedia(media: ProjectMedia) {
  const { error: storageError } = await supabase.storage
    .from(PROJECT_MEDIA_BUCKET)
    .remove([media.storagePath])

  if (storageError) {
    throw storageError
  }

  const { error } = await supabase
    .from('project_media')
    .delete()
    .eq('id', media.id)

  if (error) {
    throw error
  }

  if (media.isCover) {
    const { data: remainingMedia, error: remainingError } = await supabase
      .from('project_media')
      .select('id')
      .eq('project_id', media.projectId)
      .order('sort_order', { ascending: true })
      .limit(1)
      .maybeSingle()

    if (remainingError) {
      throw remainingError
    }

    if (remainingMedia) {
      await setProjectCover(media.projectId, remainingMedia.id as string)
    }
  }
}
export async function deleteProject(project: ProjectRecord) {
  const paths = project.media.map((item) => item.storagePath)

  if (paths.length) {
    const { error: storageError } = await supabase.storage
      .from(PROJECT_MEDIA_BUCKET)
      .remove(paths)

    if (storageError) {
      throw storageError
    }
  }

  const { error } = await supabase
    .from('projects')
    .delete()
    .eq('id', project.id)

  if (error) {
    throw error
  }
}