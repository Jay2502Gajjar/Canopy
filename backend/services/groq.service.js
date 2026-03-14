const Groq = require('groq-sdk');
const logger = require('../utils/logger');

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

const SYSTEM_PROMPT = `You are Canopy AI, an intelligent HR analytics assistant for a company's HR team.
You have access to employee data, meeting transcripts, HR notes, and organizational metrics.
You help HR leaders by:
- Answering questions about employees, departments, and organizational health
- Preparing meeting briefs with relevant context
- Analyzing transcripts for sentiment, concerns, and action items
- Identifying burnout risk and retention concerns
- Suggesting HR actions and interventions

Always be professional, empathetic, and data-driven in your responses.
Use bullet points and structured formatting when presenting information.
When referencing employees, mention their name, department, and relevant context.`;

/**
 * Chat with the AI assistant
 */
async function chat(message, context = {}, employeeData = null, memoryContext = null) {
  try {
    let enrichedPrompt = SYSTEM_PROMPT;

    if (employeeData) {
      enrichedPrompt += `\n\nEmployee Database:\n${JSON.stringify(employeeData, null, 2)}`;
    }

    if (memoryContext) {
      enrichedPrompt += `\n\nRelevant Context from Memory:\n${memoryContext}`;
    }

    if (context.role) {
      enrichedPrompt += `\n\nThe user's HR role is: ${context.role}`;
    }

    const completion = await groq.chat.completions.create({
      model: 'llama-3.1-8b-instant',
      messages: [
        { role: 'system', content: enrichedPrompt },
        { role: 'user', content: message },
      ],
      temperature: 0.7,
      max_tokens: 1024,
    });

    const response = completion.choices[0].message.content;
    logger.info('AI chat completed', { messageLength: message.length, responseLength: response.length });
    return response;
  } catch (error) {
    logger.error('Groq chat failed', { error: error.message });
    throw error;
  }
}

/**
 * Analyze a meeting transcript
 */
async function analyzeTranscript(transcript) {
  try {
    const prompt = `Analyze this HR meeting transcript and provide a JSON response with the following structure:
{
  "keyHighlights": ["string array of key points from the conversation"],
  "sentimentScore": number between 0-100,
  "sentimentLabel": "brief description of overall sentiment",
  "keyTopics": ["string array of main topics discussed"],
  "careerGoals": ["string array of career aspirations mentioned"],
  "concerns": ["string array of concerns raised"],
  "actionItems": ["string array of follow-up actions needed"]
}

Transcript:
${transcript}

Return ONLY valid JSON, no additional text.`;

    const completion = await groq.chat.completions.create({
      model: 'llama-3.1-8b-instant',
      messages: [
        { role: 'system', content: 'You are an HR transcript analysis tool. Return only valid JSON.' },
        { role: 'user', content: prompt },
      ],
      temperature: 0.3,
      max_tokens: 1024,
    });

    const text = completion.choices[0].message.content;
    // Extract JSON from response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('No JSON in response');

    const analysis = JSON.parse(jsonMatch[0]);
    logger.info('Transcript analysis completed');
    return analysis;
  } catch (error) {
    logger.error('Transcript analysis failed', { error: error.message });
    throw error;
  }
}

/**
 * Generate a meeting preparation brief
 */
async function generateMeetingBrief(employee, transcripts, notes, commitments) {
  try {
    const prompt = `Generate a meeting preparation brief for an upcoming HR meeting with the following employee.

Employee Info:
${JSON.stringify(employee, null, 2)}

Recent Transcripts Summary:
${transcripts ? JSON.stringify(transcripts, null, 2) : 'No recent transcripts'}

HR Notes:
${notes ? JSON.stringify(notes, null, 2) : 'No notes'}

Open Commitments:
${commitments ? JSON.stringify(commitments, null, 2) : 'No open commitments'}

Provide a structured brief with:
1. Key Context & Background
2. Current Sentiment & Risk Assessment
3. Open Commitments to Follow Up
4. Suggested Discussion Topics
5. Recommended Actions`;

    const completion = await groq.chat.completions.create({
      model: 'llama-3.1-8b-instant',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: prompt },
      ],
      temperature: 0.5,
      max_tokens: 1500,
    });

    return completion.choices[0].message.content;
  } catch (error) {
    logger.error('Meeting brief generation failed', { error: error.message });
    throw error;
  }
}

/**
 * Generate employee insights
 */
async function employeeInsights(employee) {
  try {
    const prompt = `Analyze this employee profile and provide actionable HR insights:
${JSON.stringify(employee, null, 2)}

Provide insights on:
1. Flight risk assessment
2. Engagement recommendations
3. Career development suggestions
4. Manager talking points`;

    const completion = await groq.chat.completions.create({
      model: 'llama-3.1-8b-instant',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: prompt },
      ],
      temperature: 0.5,
      max_tokens: 1024,
    });

    return completion.choices[0].message.content;
  } catch (error) {
    logger.error('Employee insights failed', { error: error.message });
    throw error;
  }
}

module.exports = { chat, analyzeTranscript, generateMeetingBrief, employeeInsights };
