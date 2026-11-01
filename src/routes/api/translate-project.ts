import { createFileRoute } from '@tanstack/react-router'
import { createClient } from '@supabase/supabase-js'

export const Route = createFileRoute('/api/translate-project')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const json = (data: unknown, status = 200) =>
          Response.json(data, {
            status,
            headers: { 'Cache-Control': 'no-store' },
          })

        const authorization = request.headers.get('authorization') ?? ''

        if (!/^Bearer \S+$/.test(authorization)) {
          return json({ error: 'Authentication required.' }, 401)
        }

        const supabaseUrl = process.env.VITE_SUPABASE_URL
        const supabaseKey =
          process.env.VITE_SUPABASE_ANON_KEY ??
          process.env.VITE_SUPABASE_PUBLISHABLE_KEY

        if (!supabaseUrl || !supabaseKey) {
          return json({ error: 'Server configuration missing.' }, 503)
        }

        const supabase = createClient(supabaseUrl, supabaseKey, {
          auth: {
            persistSession: false,
            autoRefreshToken: false,
          },
        })

        const token = authorization.slice(7)
        const { data, error } = await supabase.auth.getUser(token)

        if (error || !data.user) {
          return json({ error: 'Invalid session.' }, 401)
        }

        const role = data.user.app_metadata?.portal_role
        const isOwner =
          data.user.email?.trim().toLowerCase() ===
          'klevis.ahmati@icloud.com'

        if (role !== 'admin' && !isOwner) {
          return json({ error: 'Administrator access required.' }, 403)
        }

        const contentLength = Number(
          request.headers.get('content-length') ?? 0,
        )

        if (contentLength > 30000) {
          return json({ error: 'Request too large.' }, 413)
        }

        let body: unknown

        try {
          body = await request.json()
        } catch {
          return json({ error: 'Invalid JSON request.' }, 400)
        }

        if (!body || typeof body !== 'object') {
          return json({ error: 'Invalid translation input.' }, 400)
        }

        const input = body as Record<string, unknown>

        if (
          typeof input.title !== 'string' ||
          typeof input.description !== 'string' ||
          !input.title.trim() ||
          input.title.length > 300 ||
          input.description.length > 10000
        ) {
          return json({ error: 'Invalid project title or description.' }, 400)
        }

        try {
          const { translateProjectToEnglish } = await import(
            '../../lib/project-translation.server'
          )

          const translation = await translateProjectToEnglish({
            title: input.title,
            description: input.description,
          })

          return json(translation)
        } catch (error) {
          console.error('Project translation failed:', error)
          return json({ error: 'Translation failed. Please retry.' }, 502)
        }
      },
    },
  },
})