// Cloudflare Worker — interview.sim proxy
// Deploy at: https://dash.cloudflare.com → Workers & Pages → Create Worker
// Then: Settings → Variables → Add secret: GROQ_API_KEY = your key

export default {
  async fetch(request, env) {
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
        },
      });
    }

    if (request.method !== 'POST') {
      return new Response('Method not allowed', { status: 405 });
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return new Response('Invalid JSON', { status: 400 });
    }

    const groqBody = {
      model: 'llama-3.3-70b-versatile',
      messages: body.messages,
      max_tokens: body.max_tokens || 1000,
      temperature: 0.7,
    };

    if (body.json_mode) {
      groqBody.response_format = { type: 'json_object' };
    }

    const upstream = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${env.GROQ_API_KEY}`,
      },
      body: JSON.stringify(groqBody),
    });

    const data = await upstream.json();

    return new Response(JSON.stringify(data), {
      status: upstream.status,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  },
};
