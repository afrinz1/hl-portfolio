import React, { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ApiError } from '../api/client';
import { hecticApi } from '../api/hecticApi';
import type { FieldErrors, Service, StudioInfo } from '../api/types';
import { CyanFooter } from '../components/CyanFooter';
import { Navbar } from '../components/Navbar';
import { PageShell } from '../components/PageShell';
import { ErrorState } from '../components/StatusStates';

export function InquiryPage() {
  const [searchParams] = useSearchParams();
  const initialServiceId = searchParams.get('service') ?? '';

  const [services, setServices] = useState<Service[]>([]);
  const [servicesLoading, setServicesLoading] = useState(true);
  const [servicesError, setServicesError] = useState<string | null>(null);
  const [studio, setStudio] = useState<StudioInfo | null>(null);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [company, setCompany] = useState('');
  const [serviceId, setServiceId] = useState(initialServiceId);
  const [budget, setBudget] = useState('');
  const [message, setMessage] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  const loadServices = useCallback(async () => {
    setServicesLoading(true);
    setServicesError(null);
    try {
      const res = await hecticApi.getServices({ page: 1 });
      setServices(res.results);
      if (res.results.length > 0 && !initialServiceId) {
        setServiceId((prev) => prev || String(res.results[0].id));
      }
    } catch (err) {
      setServicesError(
        err instanceof Error ? err.message : 'Unable to load available services.'
      );
    } finally {
      setServicesLoading(false);
    }
  }, [initialServiceId]);

  useEffect(() => {
    loadServices();
    hecticApi
      .getStudioInfo({ page: 1 })
      .then((res) => setStudio(res.results[0] ?? null))
      .catch(() => {});
  }, [loadServices]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setSubmitSuccess(false);
    setSubmitError(null);
    setFieldErrors({});

    try {
      await hecticApi.submitInquiry({
        name: name.trim(),
        email: email.trim(),
        service: Number.isFinite(Number(serviceId)) && serviceId !== ''
          ? Number(serviceId)
          : serviceId,
        ...(company.trim() ? { company: company.trim() } : {}),
        ...(budget.trim() ? { budget: budget.trim() } : {}),
        message: message.trim(),
      });

      setSubmitSuccess(true);
      setName('');
      setEmail('');
      setCompany('');
      setBudget('');
      setMessage('');
      setServiceId(services.length > 0 ? String(services[0].id) : '');
    } catch (err) {
      if (err instanceof ApiError) {
        setFieldErrors(err.fieldErrors);
        setSubmitError(err.message);
      } else {
        setSubmitError(
          err instanceof Error ? err.message : 'Failed to submit inquiry.'
        );
      }
    } finally {
      setSubmitting(false);
    }
  };

  const renderFieldError = (field: string) => {
    const errors = fieldErrors[field];
    if (!errors || errors.length === 0) return null;
    return (
      <p role="alert" className="mt-1.5 font-mono-hl text-xs text-red-700">
        {errors.join(' ')}
      </p>
    );
  };

  const knownFields = new Set(['name', 'email', 'company', 'service', 'budget', 'message']);
  const extraFieldErrors = Object.entries(fieldErrors).filter(
    ([key]) => !knownFields.has(key)
  );

  return (
    <div className="min-h-screen bg-[#F3F0E9] text-[#111110]">
      <Navbar />

      <PageShell>
        <div className="grid grid-cols-1 gap-14 lg:grid-cols-12">
          {/* Left editorial prompt */}
          <div className="lg:col-span-5">
            <h1 className="font-display text-[clamp(42px,5.4vw,78px)] font-light leading-[1.02] tracking-[-0.04em] text-balance">
              Got something <strong className="font-semibold">in mind?</strong>
            </h1>
            <p className="mt-4 max-w-md text-[15px] leading-relaxed text-[#0a0a0b]/75">
              Tell us what you&apos;re building, what you want it to feel like, and we&apos;ll
              take it from there.
            </p>

            {studio?.email || studio?.location ? (
              <div className="mt-12 space-y-4 border-t border-[#0a0a0b]/15 pt-6 text-sm">
                {studio.email ? (
                  <div>
                    <p className="font-mono-hl text-[11px] uppercase text-[#0a0a0b]/55">
                      Direct Email
                    </p>
                    <a
                      href={`mailto:${studio.email}`}
                      className="mt-1 inline-block hover:underline underline-offset-4"
                    >
                      {studio.email}
                    </a>
                  </div>
                ) : null}
                {studio.location ? (
                  <div>
                    <p className="font-mono-hl text-[11px] uppercase text-[#0a0a0b]/55">
                      Studio
                    </p>
                    <p className="mt-1">{studio.location}</p>
                  </div>
                ) : null}
              </div>
            ) : null}
          </div>

          {/* Right Form */}
          <div className="lg:col-span-7">
            {servicesError ? (
              <div className="mb-8">
                <ErrorState message={servicesError} onRetry={loadServices} />
              </div>
            ) : null}

            {submitSuccess ? (
              <div
                role="status"
                className="border border-[#0a0a0b]/25 bg-[#2cf5ef]/25 p-8 md:p-10"
              >
                <p className="font-mono-hl text-xs uppercase tracking-wider text-[#0a0a0b]">
                  Inquiry received
                </p>
                <h2 className="mt-2 font-display text-3xl font-normal tracking-tight">
                  Thank you for reaching out.
                </h2>
                <p className="mt-3 text-sm leading-relaxed text-[#0a0a0b]/80">
                  Your project details have been submitted to the Hectic Lab team. We
                  will review your brief and follow up shortly.
                </p>
                <button
                  type="button"
                  onClick={() => setSubmitSuccess(false)}
                  className="mt-6 rounded-full border border-[#0a0a0b]/60 px-6 py-2.5 text-xs font-normal hover:bg-[#0a0a0b] hover:text-[#f3f2ee] transition-colors cursor-pointer"
                >
                  Send another inquiry
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} noValidate className="space-y-8">
                {submitError ? (
                  <div
                    role="alert"
                    className="border border-red-700/40 bg-red-50 p-4 text-sm text-red-800"
                  >
                    <p className="font-medium">{submitError}</p>
                    {extraFieldErrors.length > 0 ? (
                      <ul className="mt-2 list-disc pl-5 text-xs">
                        {extraFieldErrors.map(([field, errs]) => (
                          <li key={field}>
                            <span className="font-mono-hl">{field}</span>: {errs.join(' ')}
                          </li>
                        ))}
                      </ul>
                    ) : null}
                  </div>
                ) : null}

                <div className="grid grid-cols-1 gap-8 sm:grid-cols-2">
                  <div>
                    <label
                      htmlFor="inquiry-name"
                      className="font-mono-hl block text-[11px] uppercase tracking-wider text-[#0a0a0b]/70"
                    >
                      Name *
                    </label>
                    <input
                      id="inquiry-name"
                      name="name"
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Your full name"
                      className="mt-2 w-full border-b border-[#0a0a0b]/30 bg-transparent py-3 text-[15px] text-[#0a0a0b] placeholder:text-[#0a0a0b]/35 focus:border-[#0a0a0b] focus:outline-none"
                    />
                    {renderFieldError('name')}
                  </div>

                  <div>
                    <label
                      htmlFor="inquiry-email"
                      className="font-mono-hl block text-[11px] uppercase tracking-wider text-[#0a0a0b]/70"
                    >
                      Email *
                    </label>
                    <input
                      id="inquiry-email"
                      name="email"
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@brand.com"
                      className="mt-2 w-full border-b border-[#0a0a0b]/30 bg-transparent py-3 text-[15px] text-[#0a0a0b] placeholder:text-[#0a0a0b]/35 focus:border-[#0a0a0b] focus:outline-none"
                    />
                    {renderFieldError('email')}
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-8 sm:grid-cols-2">
                  <div>
                    <label
                      htmlFor="inquiry-service"
                      className="font-mono-hl block text-[11px] uppercase tracking-wider text-[#0a0a0b]/70"
                    >
                      Service *
                    </label>
                    <select
                      id="inquiry-service"
                      name="service"
                      required
                      disabled={servicesLoading || services.length === 0}
                      value={serviceId}
                      onChange={(e) => setServiceId(e.target.value)}
                      className="mt-2 w-full border-b border-[#0a0a0b]/30 bg-transparent py-3 text-[15px] text-[#0a0a0b] focus:border-[#0a0a0b] focus:outline-none disabled:opacity-50"
                    >
                      {servicesLoading ? (
                        <option value="">Loading services...</option>
                      ) : services.length === 0 ? (
                        <option value="">No services available</option>
                      ) : (
                        <>
                          <option value="">Select a service</option>
                          {services.map((srv) => (
                            <option key={srv.id} value={String(srv.id)}>
                              {srv.title || srv.name}
                            </option>
                          ))}
                        </>
                      )}
                    </select>
                    {renderFieldError('service')}
                  </div>

                  <div>
                    <label
                      htmlFor="inquiry-company"
                      className="font-mono-hl block text-[11px] uppercase tracking-wider text-[#0a0a0b]/70"
                    >
                      Brand / Company
                    </label>
                    <input
                      id="inquiry-company"
                      name="company"
                      type="text"
                      value={company}
                      onChange={(e) => setCompany(e.target.value)}
                      placeholder="Optional"
                      className="mt-2 w-full border-b border-[#0a0a0b]/30 bg-transparent py-3 text-[15px] text-[#0a0a0b] placeholder:text-[#0a0a0b]/35 focus:border-[#0a0a0b] focus:outline-none"
                    />
                    {renderFieldError('company')}
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="inquiry-budget"
                    className="font-mono-hl block text-[11px] uppercase tracking-wider text-[#0a0a0b]/70"
                  >
                    Estimated Budget / Timeline
                  </label>
                  <input
                    id="inquiry-budget"
                    name="budget"
                    type="text"
                    value={budget}
                    onChange={(e) => setBudget(e.target.value)}
                    placeholder="Optional"
                    className="mt-2 w-full border-b border-[#0a0a0b]/30 bg-transparent py-3 text-[15px] text-[#0a0a0b] placeholder:text-[#0a0a0b]/35 focus:border-[#0a0a0b] focus:outline-none"
                  />
                  {renderFieldError('budget')}
                </div>

                <div>
                  <label
                    htmlFor="inquiry-message"
                    className="font-mono-hl block text-[11px] uppercase tracking-wider text-[#0a0a0b]/70"
                  >
                    Project Brief *
                  </label>
                  <textarea
                    id="inquiry-message"
                    name="message"
                    rows={5}
                    required
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Tell us about your story, deliverables, and goals..."
                    className="mt-2 w-full border-b border-[#0a0a0b]/30 bg-transparent py-3 text-[15px] text-[#0a0a0b] placeholder:text-[#0a0a0b]/35 focus:border-[#0a0a0b] focus:outline-none resize-y"
                  />
                  {renderFieldError('message')}
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="inline-flex items-center justify-center rounded-full border border-[#0a0a0b] bg-[#0a0a0b] px-10 py-3.5 text-sm font-normal tracking-tight text-[#f3f2ee] transition-colors hover:bg-[#2cf5ef] hover:text-[#0a0a0b] disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
                  >
                    {submitting ? 'Submitting...' : 'submit inquiry'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </PageShell>

      <CyanFooter studio={studio} />
    </div>
  );
}
