export async function extractWithLlm(messages, config) {
  if (!config.llm.apiKey) return [];

  const response = await fetch(`${config.llm.baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${config.llm.apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: config.llm.model,
      temperature: 0,
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content:
            'Extract concrete calendar events from Telegram messages. Return strict JSON: {"events":[{"source_message_ids":[],"summary":"","start_date":"YYYY-MM-DD","start_time":"HH:MM","duration_minutes":45,"location":null,"confidence":0.0,"reason":""}]}. Only create events for committed meetings, calls, demos, appointments, or visits. Ignore vague ideas and tasks.',
        },
        {
          role: 'user',
          content: JSON.stringify(messages.map((item) => ({
            id: item.id,
            chat: item.chat,
            from: item.from,
            date: item.date,
            text: item.text,
          }))),
        },
      ],
    }),
  });

  if (!response.ok) {
    throw new Error(`LLM extraction failed: ${response.status} ${await response.text()}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content || '{}';
  const parsed = JSON.parse(content);
  return (parsed.events || []).map((event) => ({
    sourceMessageIds: event.source_message_ids || [],
    sourceChat: event.chat || '',
    summary: event.summary,
    startDate: event.start_date,
    startTime: event.start_time,
    durationMinutes: event.duration_minutes || config.defaultDurationMinutes,
    location: event.location || null,
    confidence: Number(event.confidence || 0),
    reason: event.reason || 'llm extraction',
    extractor: 'llm',
    rawText: '',
  }));
}

