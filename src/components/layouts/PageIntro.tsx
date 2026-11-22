type PageIntroProps = {
  eyebrow: string;
  title: string;
  lead: string;
};

export default function PageIntro({ eyebrow, title, lead }: PageIntroProps) {
  return (
    <header className="pb-10 md:pb-14">
      <p className="eyebrow mb-6 text-brand-pink">{eyebrow}</p>
      <h1 className="max-w-4xl font-display text-[clamp(3.5rem,8vw,6.4rem)] font-semibold leading-[0.9] tracking-[-0.04em] text-deep-berry">
        {title}
      </h1>
      <p className="mt-6 max-w-2xl text-base leading-8 text-dark-text/75">{lead}</p>
      <div aria-hidden="true" className="gold-rule mt-10" />
    </header>
  );
}