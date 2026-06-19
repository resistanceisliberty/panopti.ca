import { Link } from 'react-router-dom';
import { Map, ArrowLeft } from 'lucide-react';
import { Seo, LegacyMapLink } from '@/components/common';

export function NotFound() {
  return (
    <>
      <Seo
        title="Page Not Found | panopti.ca"
        description="The page you requested could not be found."
        noIndex
      />
      <div className="min-h-screen bg-dark-900 flex items-center justify-center p-4">
        <div className="max-w-lg w-full text-center">
          {/* 404 Icon */}
          <div className="relative mb-8">
            <div className="w-32 h-32 mx-auto rounded-full bg-dark-800 border border-dark-600 flex items-center justify-center">
              <svg className="w-16 h-16 text-danger" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4z" />
              </svg>
            </div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-36 h-36 rounded-full border-2 border-dashed border-danger/30 animate-spin" style={{ animationDuration: '8s' }} />
            </div>
          </div>

          <h1 className="text-6xl font-display font-black text-white mb-4">
            404
          </h1>

          <p className="text-xl text-dark-200 mb-2">
            Page Not Found
          </p>

          <p className="text-dark-400 mb-8">
            Looks like this route doesn't exist.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-md bg-accent hover:bg-accent-hover text-white font-semibold transition-colors"
            >
              <Map className="w-5 h-5" />
              Go to Map
            </Link>
            <LegacyMapLink variant="button" />
          </div>

          <button
            onClick={() => window.history.back()}
            className="mt-6 inline-flex items-center gap-2 text-dark-400 hover:text-dark-200 transition-colors text-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            Go back
          </button>
        </div>
      </div>
    </>
  );
}
