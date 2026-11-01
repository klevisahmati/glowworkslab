export type ProjectTranslationInput = {
  title: string
  description: string
}

export type ProjectTranslationResult = {
  title_en: string
  description_en: string
}

export async function translateProjectToEnglish(
  input: ProjectTranslationInput,
): Promise<ProjectTranslationResult> {
  const apiKey = process.env.DEEPL_API_KEY?.trim()

  if (!apiKey) {
    throw new Error('DEEPL_API_KEY is not configured on the server.')
  }

  const title = input.title?.trim()
  const description = input.description?.trim() ?? ''

  if (!title || title.length > 300) {
    throw new Error('Invalid project title.')
  }

  if (description.length > 10000) {
    throw new Error('Project description is too long.')
  }

  const texts = description ? [title, description] : [title]

  const endpoint = apiKey.endsWith(':fx')
    ? 'https://api-free.deepl.com/v2/translate'
    : 'https://api.deepl.com/v2/translate'

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      Authorization: `DeepL-Auth-Key ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      text: texts,
      source_lang: 'EL',
      target_lang: 'EN-GB',
      preserve_formatting: true,
    }),
  })

  if (!response.ok) {
    throw new Error(`DeepL translation failed (HTTP ${response.status}).`)
  }

  const result = (await response.json()) as {
    translations?: Array<{ text?: string }>
  }

  if (
    !Array.isArray(result.translations) ||
    result.translations.length !== texts.length
  ) {
    throw new Error('Invalid DeepL translation response.')
  }

  const translatedTitle = result.translations[0]?.text?.trim()
  const translatedDescription = description
    ? result.translations[1]?.text?.trim()
    : ''

  if (!translatedTitle || (description && !translatedDescription)) {
    throw new Error('DeepL returned an incomplete translation.')
  }

  return {
    title_en: translatedTitle,
    description_en: translatedDescription ?? '',
  }
}