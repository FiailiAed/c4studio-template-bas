import type { APIRoute } from 'astro';
import { convex } from '@lib/convex';
import { api } from '@convex/api';
import { verifyToken } from '@lib/tokens';
import type { Id } from '@convex/dataModel';

export const GET: APIRoute = async ({ request }) => {
  const url = new URL(request.url);
  const contactId = url.searchParams.get('contactId');
  const token = url.searchParams.get('token');
  const r = url.searchParams.get('r'); // "yes" or "no"

  const redirect = (path: string) =>
    new Response(null, { status: 302, headers: { Location: path } });

  if (!contactId || !token || !['yes', 'no'].includes(r ?? '')) {
    return redirect('/reactivation/responded?error=invalid');
  }

  const valid = verifyToken(`reac:${contactId}:${r}`, token);
  if (!valid) {
    return redirect('/reactivation/responded?error=invalid');
  }

  try {
    const messageKey = r === 'yes' ? 'yes_handler' : 'no_handler';
    await convex.mutation(api.reactivation.triggerMessageForContact, {
      contactId: contactId as Id<'contacts'>,
      messageKey,
    });
    return redirect(`/reactivation/responded?r=${r}`);
  } catch {
    return redirect('/reactivation/responded?error=failed');
  }
};
