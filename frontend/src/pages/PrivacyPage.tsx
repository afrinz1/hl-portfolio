import { useEffect, useState } from 'react';
import { hecticApi } from '../api/hecticApi';
import type { StudioInfo } from '../api/types';
import { CyanFooter } from '../components/CyanFooter';
import { InquiryCta } from '../components/InquiryCta';
import { Navbar } from '../components/Navbar';
import { PageShell } from '../components/PageShell';

export function PrivacyPage() {
  const [studio, setStudio] = useState<StudioInfo | null>(null);

  useEffect(() => {
    hecticApi
      .getStudioInfo({ page: 1 })
      .then((res) => setStudio(res.results[0] ?? null))
      .catch(() => {});
  }, []);

  return (
    <div className="min-h-screen bg-[#F3F0E9] text-[#111110]">
      <Navbar />

      <PageShell>
        <div className="max-w-3xl">
          <h1 className="font-display text-[clamp(44px,6vw,88px)] font-light uppercase leading-[0.94] tracking-[-0.05em]">
            PRIVACY
          </h1>
          <p className="mt-2 font-mono-hl text-[11px] font-medium uppercase tracking-[-0.02em] text-[#111110]/70">
            POLICY &amp; DATA HANDLING.
          </p>

          <div className="mt-12 space-y-6 text-[15px] leading-[1.7] text-[#111110]/80">
            <p>
              Hectic Lab collects only the contact and project brief information
              that you voluntarily submit through our inquiry form so our production
              team can respond to your request.
            </p>
            <p>
              Submitted details are never sold, rented, or shared with third-party
              marketers. To request updates or deletion of an inquiry record, contact
              our studio directly{studio?.email ? ` at ${studio.email}` : ''}.
            </p>
          </div>
        </div>
      </PageShell>

      <InquiryCta variant="dark" />
      <CyanFooter studio={studio} />
    </div>
  );
}
