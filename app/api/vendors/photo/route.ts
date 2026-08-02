import { NextRequest } from 'next/server';

export const dynamic = 'force-dynamic';

/** Place IDs are opaque Google tokens — bound the shape to keep this paid-call
 *  proxy from being abused with arbitrary input. */
const PLACE_ID_RE = /^[A-Za-z0-9_-]{10,300}$/;

/** Place Details (New) — only the `photos` field. Returns the first photo's
 *  resource name (`places/{id}/photos/{ref}`) or null when there are none. */
interface PlaceDetailsResponse {
  photos?: Array<{ name?: string }>;
}

const CACHE_HEADER = 'public, max-age=86400, s-maxage=604800, stale-while-revalidate=86400';

/**
 * Server-side proxy for a vendor's own Google Places photo. The right-pane
 * venue cards hit `/api/vendors/photo?placeId=<id>` and we fetch the image from
 * Google here so `GOOGLE_PLACES_API_KEY` never reaches the browser.
 *
 * Any miss (no key, no photo, upstream error) returns 404 so the card falls
 * back to its gradient placeholder — we never 500 on a missing photo and never
 * surface the key in a response body.
 */
export async function GET(req: NextRequest): Promise<Response> {
  const placeId = req.nextUrl.searchParams.get('placeId');
  if (!placeId || !PLACE_ID_RE.test(placeId)) {
    return new Response('Invalid placeId', { status: 400 });
  }

  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  if (!apiKey) {
    return new Response('Photo lookup unavailable', { status: 500 });
  }

  try {
    // Step A — Place Details (New): ask only for the photos field mask.
    const detailsRes = await fetch(
      `https://places.googleapis.com/v1/places/${encodeURIComponent(placeId)}`,
      {
        headers: {
          'X-Goog-Api-Key': apiKey,
          'X-Goog-FieldMask': 'photos',
        },
      }
    );
    if (!detailsRes.ok) {
      return new Response('No photo', { status: 404 });
    }

    const details = (await detailsRes.json()) as PlaceDetailsResponse;
    const photoName = details.photos?.[0]?.name;
    if (!photoName) {
      return new Response('No photo', { status: 404 });
    }

    // Step B — Photo media (New): 302-redirects to the actual image; fetch
    // follows the redirect and we stream the bytes back.
    const mediaRes = await fetch(
      `https://places.googleapis.com/v1/${photoName}/media?maxWidthPx=800&key=${encodeURIComponent(
        apiKey
      )}`,
      { redirect: 'follow' }
    );
    if (!mediaRes.ok) {
      return new Response('No photo', { status: 404 });
    }

    const contentType = mediaRes.headers.get('content-type') ?? 'image/jpeg';
    const bytes = await mediaRes.arrayBuffer();

    return new Response(bytes, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': CACHE_HEADER,
      },
    });
  } catch {
    // Network/parse failure — degrade to the card's gradient placeholder.
    return new Response('No photo', { status: 404 });
  }
}
