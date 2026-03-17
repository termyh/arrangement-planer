import { getStore } from "@netlify/blobs";

export default async (req, context) => {
  // Enable CORS
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST",
        "Access-Control-Allow-Headers": "Content-Type"
      }
    });
  }

  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Content-Type": "application/json"
  };

  try {
    const store = getStore("arrangement-rsvps");

    if (req.method === "POST") {
      // Save or update RSVP
      const body = await req.json();
      const { eventId, name, status } = body;

      if (!eventId || !name) {
        return new Response(JSON.stringify({ error: "Missing eventId or name" }), { 
          status: 400, 
          headers 
        });
      }

      const key = `event_${eventId}`;
      let rsvps = {};

      try {
        const existing = await store.get(key);
        if (existing) {
          rsvps = JSON.parse(existing);
        }
      } catch (e) {
        // Key doesn't exist yet, that's fine
      }

      if (status === "none") {
        delete rsvps[name];
      } else {
        rsvps[name] = status;
      }

      await store.set(key, JSON.stringify(rsvps));

      return new Response(JSON.stringify({ 
        success: true, 
        rsvps 
      }), { 
        status: 200, 
        headers 
      });
    }

    if (req.method === "GET") {
      // Get all RSVPs for an event
      const url = new URL(req.url);
      const eventId = url.searchParams.get("eventId");

      if (!eventId) {
        return new Response(JSON.stringify({ error: "Missing eventId" }), { 
          status: 400, 
          headers 
        });
      }

      const key = `event_${eventId}`;
      let rsvps = {};

      try {
        const existing = await store.get(key);
        if (existing) {
          rsvps = JSON.parse(existing);
        }
      } catch (e) {
        // Key doesn't exist, return empty
      }

      return new Response(JSON.stringify({ rsvps }), { 
        status: 200, 
        headers 
      });
    }

    return new Response(JSON.stringify({ error: "Method not allowed" }), { 
      status: 405, 
      headers 
    });
  } catch (error) {
    console.error("RSVP function error:", error);
    return new Response(JSON.stringify({ error: error.message }), { 
      status: 500, 
      headers 
    });
  }
};
