type PageIntroProps = {
  eyebrow: string;
  title: string;
  lead: string;
};

export default function PageIntro({ eyebrow, title, lead }: PageIntroProps) {
  return (
    <header className="border-b border-pale-blush pb-9 md:pb-12">
      <p className="mb-5 flex items-center gap-3 text-xs font-semibold text-deep-berry">
        <span aria-hidden="true" className="h-px w-8 bg-soft-pink" />{eyebrow}
      </p>
      <h1 className="max-w-4xl font-display text-[clamp(3.5rem,8vw,6.4rem)] font-semibold leading-[0.9] tracking-[-0.04em] text-deep-berry">
        {title}
      </h1>
      <p className="mt-6 max-w-2xl text-sm leading-7 text-dark-text/75 md:text-base">{lead}</p>
    </header>
  );
}
