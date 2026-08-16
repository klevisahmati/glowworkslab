import querystring from 'node:querystring'
import nodemailer from 'nodemailer'
import twilio from 'twilio'

function normalizePhone(value) {
  const raw = String(value || '').replace(/\s+/g, '')
  const digits = raw.replace(/\D/g, '')

  if (!digits) return ''
  if (digits.startsWith('0030')) return `+${digits.slice(2)}`
  if (digits.startsWith('30')) return `+${digits}`
  return digits.startsWith('+') ? digits : `+${digits}`
}

async function sendEmail(data) {
  const emailTo = process.env.NOTIFY_EMAIL_TO || 'klevis.ahmati@icloud.com'
  const emailFrom = process.env.NOTIFY_EMAIL_FROM || 'noreply@glowworks.lab'

  if (!emailTo || !emailFrom) {
    return { ok: false, reason: 'missing-email-config' }
  }

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: String(process.env.SMTP_SECURE || 'false') === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  })

  const subject = `Νέο αίτημα Glowworks — ${data.name || 'Άγνωστος'}`
  const html = `
    <h3>Νέο αίτημα ραντεβού</h3>
    <p><strong>Όνομα:</strong> ${data.name || '-'}</p>
    <p><strong>Τηλέφωνο:</strong> ${data.phone || '-'}</p>
    <p><strong>Όχημα:</strong> ${data.vehicle || '-'}</p>
    <p><strong>Υπηρεσία:</strong> ${data.service || '-'}</p>
    <p><strong>Ημερομηνία:</strong> ${data.date || '-'}</p>
    <p><strong>Ώρα:</strong> ${data.time || '-'}</p>
    <p><strong>Σχόλια:</strong> ${data.message || '-'}</p>
  `

  await transporter.sendMail({
    from: emailFrom,
    to: emailTo,
    subject,
    html,
  })

  return { ok: true, channel: 'email' }
}

async function sendWhatsApp(data) {
  const accountSid = process.env.TWILIO_ACCOUNT_SID
  const authToken = process.env.TWILIO_AUTH_TOKEN
  const from = process.env.TWILIO_WHATSAPP_FROM
  const to = normalizePhone(process.env.NOTIFY_WHATSAPP_TO || '00306937153914')

  if (!accountSid || !authToken || !from || !to) {
    return { ok: false, reason: 'missing-whatsapp-config' }
  }

  const client = twilio(accountSid, authToken)

  const message = `Νέο αίτημα Glowworks. Όνομα: ${data.name || '-'} | Τηλέφωνο: ${data.phone || '-'} | Όχημα: ${data.vehicle || '-'} | Υπηρεσία: ${data.service || '-'}`

  await client.messages.create({
    from,
    to: `whatsapp:${to}`,
    body: message,
  })

  return { ok: true, channel: 'whatsapp' }
}

export const handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ok: false, error: 'Method not allowed' }),
    }
  }

  let payload = {}

  try {
    const contentType = event.headers['content-type'] || ''

    if (contentType.includes('application/json')) {
      payload = JSON.parse(event.body || '{}')
    } else if (contentType.includes('application/x-www-form-urlencoded')) {
      payload = querystring.parse(event.body || '')
    } else {
      payload = event.body ? JSON.parse(event.body) : {}
    }
  } catch {
    payload = {}
  }

  const results = []

  try {
    const emailResult = await sendEmail(payload)
    results.push(emailResult)
  } catch (error) {
    results.push({ ok: false, channel: 'email', error: String(error) })
  }

  try {
    const whatsappResult = await sendWhatsApp(payload)
    results.push(whatsappResult)
  } catch (error) {
    results.push({ ok: false, channel: 'whatsapp', error: String(error) })
  }

  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ok: true, results }),
  }
}
