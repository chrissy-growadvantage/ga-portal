import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { corsResponse, jsonResponse } from '../_shared/cors.ts';
import { validateToken } from '../_shared/validate-token.ts';
import { getServiceClient } from '../_shared/supabase.ts';

serve(async (req) => {
  if (req.method === 'OPTIONS') return corsResponse();

  if (req.method !== 'POST') {
    return jsonResponse({ error: { code: 'METHOD_NOT_ALLOWED', message: 'POST only' } }, 405);
  }

  try {
    const body = await req.json();
    const { token, task_id } = body as { token: string; task_id: string };

    if (!token || !task_id) {
      return jsonResponse({ error: { code: 'BAD_REQUEST', message: 'token and task_id are required' } }, 400);
    }

    const result = await validateToken(token);
    if (!result.ok) {
      return jsonResponse({ error: { code: result.code, message: 'Invalid token' } }, result.status);
    }

    const { client } = result;
    const supabase = getServiceClient();

    // Verify the task belongs to this client
    const { data: task, error: taskError } = await supabase
      .from('client_tasks')
      .select('id, client_id')
      .eq('id', task_id)
      .eq('client_id', client.id)
      .single();

    if (taskError || !task) {
      return jsonResponse({ error: { code: 'NOT_FOUND', message: 'Task not found' } }, 404);
    }

    // Mark task as completed
    const { error: updateError } = await supabase
      .from('client_tasks')
      .update({ completed_at: new Date().toISOString(), updated_at: new Date().toISOString() })
      .eq('id', task_id);

    if (updateError) {
      return jsonResponse({ error: { code: 'SERVER_ERROR', message: 'Failed to update task' } }, 500);
    }

    return jsonResponse({ ok: true });
  } catch {
    return jsonResponse({ error: { code: 'SERVER_ERROR', message: 'Internal server error' } }, 500);
  }
});
