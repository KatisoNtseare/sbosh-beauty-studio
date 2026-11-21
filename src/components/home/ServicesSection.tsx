import { serviceGroups } from "@/lib/data";

export default function ServicesSection() {
  return (
    <section id="services" className="scroll-mt-4 px-6 py-24 md:px-16">
      <span className="text-xs font-semibold uppercase tracking-[0.22em] text-gold">
        What we do
      </span>
      <h2 className="mb-10 mt-3 font-display text-5xl font-medium leading-tight">
        Our services
      </h2>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {serviceGroups.map((group) => (
          <article
            key={group.id}
            className="rounded-[20px] border border-line bg-white p-8"
          >
            <h3 className="mb-3 font-display text-3xl font-semibold">
              {group.title}
            </h3>
            <ul className="space-y-1 leading-relaxed">
              {group.treatments.map((t) => (
                <li key={t.name}>{t.name}</li>
              ))}
            </ul>
          </article>
        ))}
      </div>
    </section>
  );
}