const Groq = require("groq-sdk")

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY
})

async function employeeInsights(employee){

  const prompt = `
You are Lumina AI HR assistant.

Analyze this employee data and provide HR insights.

${JSON.stringify(employee,null,2)}

Only respond with HR insights.
`

  const completion = await groq.chat.completions.create({
    model:"llama-3.1-8b-instant",
    messages:[
      {role:"system",content:"You are an HR analytics assistant"},
      {role:"user",content:prompt}
    ]
  })

  return completion.choices[0].message.content
}

module.exports = { employeeInsights }