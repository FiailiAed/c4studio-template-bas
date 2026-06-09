import type { APIRoute } from 'astro';
import { getAuthedConvex } from '@lib/convex';
import { api } from '@convex/api';

export const POST: APIRoute = async ({ request, locals }) => {
  const { userId } = locals.auth();
  if (!userId) {
    return new Response(null, { status: 401 });
  }

  let stripePriceId: string;
  let successUrl: string;
  let cancelUrl: string;

  const contentType = request.headers.get('content-type') ?? '';
  if (contentType.includes('application/json')) {
    const body = await request.json();
    stripePriceId = body.stripePriceId;
    successUrl = body.successUrl;
    cancelUrl = body.cancelUrl;
  } else {
    const data = await request.formData();
    stripePriceId = data.get('stripePriceId') as string;
    successUrl = data.get('successUrl') as string;
    cancelUrl = data.get('cancelUrl') as string;
  }

  if (!stripePriceId || !successUrl || !cancelUrl) {
    return new Response(JSON.stringify({ error: 'Missing required fields' }), { status: 400 });
  }

  try {
    const token = await locals.auth().getToken({ template: 'convex' });
    const client = getAuthedConvex(token);

    const result = await client.action(api.payments.createPaymentCheckout, {
      priceId: stripePriceId,
      successUrl,
      cancelUrl,
    });

    const checkoutUrl = typeof result === 'string' ? result : (result as { url?: string })?.url;
    if (!checkoutUrl) {
      return new Response(JSON.stringify({ error: 'No checkout URL returned' }), { status: 500 });
    }

    return Response.redirect(checkoutUrl, 303);
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Checkout failed';
    return new Response(JSON.stringify({ error: msg }), { status: 500 });
  }
};
