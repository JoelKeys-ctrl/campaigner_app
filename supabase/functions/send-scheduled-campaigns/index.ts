// DEPRECATED: This function is no longer in use.
// Campaign scheduling is now handled on the client-side.
// FIX: Removed the triple-slash directive for type definitions which was causing an error. This function is deprecated and does not require it.

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

serve(async (_req) => {
  console.log('Scheduled campaign function called, but it is deprecated. No action taken.');
  return new Response(JSON.stringify({ message: 'This function is deprecated. Scheduling is handled client-side.' }), {
    headers: { 'Content-Type': 'application/json' },
    status: 200,
  });
});
