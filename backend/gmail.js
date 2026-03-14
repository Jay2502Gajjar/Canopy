import { google } from "googleapis"

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  "http://localhost:5000/auth/google/callback"
)

oauth2Client.setCredentials({
  refresh_token: process.env.GOOGLE_REFRESH_TOKEN
})

const gmail = google.gmail({
  version: "v1",
  auth: oauth2Client
})

export async function getRecentEmails() {

  const res = await gmail.users.messages.list({
    userId: "me",
    maxResults: 3
  })

  const messages = res.data.messages

  const emails = []

  for (const msg of messages) {

    const full = await gmail.users.messages.get({
      userId: "me",
      id: msg.id
    })

    const headers = full.data.payload.headers

    const subject = headers.find(h => h.name === "Subject")?.value
    const from = headers.find(h => h.name === "From")?.value

    emails.push({
      from,
      subject
    })
  }

  return emails
}