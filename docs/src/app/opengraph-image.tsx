import { ImageResponse } from 'next/og';
import {
  BrandCard,
  dmSansFontsArg,
  loadDmSans,
  OG_CACHE_HEADERS,
  OG_CONTENT_TYPE,
  OG_SIZE,
} from '@/lib/og-card';

export const dynamic = 'force-static';
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;
export const alt = 'Open Knowledge — Your knowledge, co-authored by AI';

export default async function OgImage() {
  const fonts = await loadDmSans();
  return new ImageResponse(<BrandCard />, {
    ...OG_SIZE,
    fonts: dmSansFontsArg(fonts),
    headers: OG_CACHE_HEADERS,
  });
}
