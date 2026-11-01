import { supabase } from './supabase/client'

export type ProjectEnglishTranslation = {
  title_en: string
  description_en: string
}

export async function requestProjectTranslation(
  title: string,
  description: string,
): Promise<ProjectEnglishTranslation> {
  const {
    data: { session },
    error,
  } = await supabase.auth.getSession()

  if (error || !session?.access_token) {
    throw new Error('Please sign in to the Admin Portal first.')
  }

  const response = await fetch('/api/translate-project', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${session.access_token}`,
    },
    body: JSON.stringify({
      title: title.trim(),
      description: description.trim(),
    }),
    signal: AbortSignal.timeout(35000),
  })

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error('Your admin session has expired. Please sign in again.')
    }

    if (response.status === 403) {
      throw new Error('Administrator access is required for translation.')
    }

    throw new Error(
      `Automatic translation failed (HTTP ${response.status}).`,
    )
  }

  const result: unknown = await response.json()

  if (!result || typeof result !== 'object') {
    throw new Error('Invalid translation response.')
  }

  const translation = result as Record<string, unknown>

  if (
    typeof translation.title_en !== 'string' ||
    typeof translation.description_en !== 'string' ||
    !translation.title_en.trim()
  ) {
    throw new Error('Translation response is incomplete.')
  }

  return {
    title_en: translation.title_en.trim(),
    description_en: translation.description_en.trim(),
  }
}