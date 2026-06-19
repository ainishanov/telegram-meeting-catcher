function hasGoogleConfig(config) {
  return Boolean(config.google.clientId && config.google.clientSecret && config.google.refreshToken);
}

export async function createCalendarEvent(event, config) {
  if (!hasGoogleConfig(config)) {
    throw new Error('Google Calendar credentials are missing');
  }

  const token = await getAccessToken(config);
  const duplicate = await findCalendarDuplicate(token, event, config);
  if (duplicate) return { ...duplicate, duplicate: true };

  const calendarId = encodeURIComponent(config.google.calendarId || 'primary');
  const body = buildGoogleEvent(event, config);
  const response = await fetch(`https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error?.message || `Google Calendar failed: ${response.status}`);
  }
  return data;
}

export async function findCalendarDuplicate(token, event, config) {
  if (!event.sourceId) return null;
  const calendarId = encodeURIComponent(config.google.calendarId || 'primary');
  const params = new URLSearchParams({
    privateExtendedProperty: `telegramMeetingCatcherSource=${event.sourceId}`,
    singleEvents: 'true',
    maxResults: '1',
  });
  const response = await fetch(`https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events?${params.toString()}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error?.message || `Google Calendar duplicate check failed: ${response.status}`);
  }
  return data.items?.[0] || null;
}

export function buildGoogleEvent(event, config) {
  const start = `${event.startDate}T${event.startTime}:00`;
  const end = addMinutes(start, event.durationMinutes);
  const body = {
    summary: event.summary,
    description: [
      'Created by Telegram Meeting Catcher.',
      event.sourceChat ? `Chat: ${event.sourceChat}` : '',
      event.sourceMessageIds?.length ? `Messages: ${event.sourceMessageIds.join(', ')}` : '',
      event.reason ? `Reason: ${event.reason}` : '',
      '',
      event.rawText || '',
    ].filter(Boolean).join('\n'),
    start: { dateTime: start, timeZone: config.timezone },
    end: { dateTime: end, timeZone: config.timezone },
    extendedProperties: {
      private: {
        telegramMeetingCatcherSource: event.sourceId || '',
      },
    },
  };
  if (event.location) body.location = event.location;
  return body;
}

async function getAccessToken(config) {
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: config.google.clientId,
      client_secret: config.google.clientSecret,
      refresh_token: config.google.refreshToken,
      grant_type: 'refresh_token',
    }),
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error_description || data.error || `OAuth failed: ${response.status}`);
  }
  return data.access_token;
}

function addMinutes(localDateTime, minutes) {
  const date = new Date(`${localDateTime}+00:00`);
  date.setUTCMinutes(date.getUTCMinutes() + Number(minutes || 45));
  return date.toISOString().slice(0, 19);
}
