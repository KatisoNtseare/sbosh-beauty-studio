export default function Loading() {
  return <main aria-busy="true" aria-live="polite" className="grid min-h-[55vh] place-items-center bg-pale-blush px-5 py-16">
    <div className="w-full max-w-sm rounded-3xl border border-soft-border bg-surface p-8 text-center shadow-luxe">
      <span aria-hidden="true" className="mx-auto grid size-14 place-items-center rounded-full border-2 border-soft-border border-t-brand-pink motion-safe:animate-spin" />
      <p className="mt-5 font-display text-3xl font-semibold text-deep-berry">A moment, please</p>
      <p className="mt-2 text-sm leading-6 text-dark-text/70">We&rsquo;re getting the studio ready for you.</p>
    </div>
  </main>;
}
