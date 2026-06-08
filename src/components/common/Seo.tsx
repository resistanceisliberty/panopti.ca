import { Helmet } from 'react-helmet-async';
import { useLocation } from 'react-router-dom';

type SeoProps = {
  title: string;
  description: string;
  path?: string;
  image?: string;
  noIndex?: boolean;
};

export function Seo({
  title,
  description,
  path,
  image = '/og-panoptica.png',
  noIndex = false,
}: SeoProps) {
  const location = useLocation();
  const origin =
    typeof window !== 'undefined'
      ? window.location.origin
      : (import.meta.env.VITE_SITE_URL as string | undefined) || '';

  const resolvedPath = path ?? `${location.pathname}${location.search}`;
  const canonical = origin ? `${origin}${resolvedPath}` : resolvedPath;
  const absoluteImage =
    image.startsWith('http') || !origin ? image : `${origin}${image}`;
  const robots = noIndex ? 'noindex,nofollow' : 'index,follow';

  return (
    <Helmet>
      <title>{title}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={canonical} />
      <meta name="robots" content={robots} />

      <meta property="og:type" content="website" />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={canonical} />
      <meta property="og:image" content={absoluteImage} />

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={absoluteImage} />
    </Helmet>
  );
}

