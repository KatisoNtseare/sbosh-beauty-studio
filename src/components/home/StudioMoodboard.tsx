import { businessProfile } from "@/lib/brand";

const studies = [
  { name: "Warm light", color: "bg-[#ddd0b9]", sun: "bg-[#c7887f]", shape: "mood-arch" },
  { name: "Soft colour", color: "bg-[#d8b9ad]", sun: "bg-[#eee0c9]", shape: "mood-bloom" },
  { name: "Quiet rituals", color: "bg-[#b7b5a2]", sun: "bg-[#ece3d2]", shape: "mood-vessel" },
  { name: "Natural form", color: "bg-[#53634f]", sun: "bg-[#c7887f]", shape: "mood-leaf" },
];

export default function StudioMoodboard() {
  return (
    <div role="img" aria-label={`Four abstract illustrations in the ${businessProfile.name} moodboard`}>
      <div className="grid grid-cols-2 gap-2.5 md:gap-3">
        {studies.map((study) => (
          <figure key={study.name} className={`mood-tile ${study.color}`}>
            <div aria-hidden="true" className={`mood-shape ${study.shape}`}>
              <span className={`mood-sun ${study.sun}`} />
              {study.shape === "mood-bloom" && <><span className="bloom-petal petal-a" /><span className="bloom-petal petal-b" /><span className="bloom-petal petal-c" /><span className="bloom-center" /></>}
              {study.shape === "mood-vessel" && <><span className="vessel-neck" /><span className="vessel-body" /></>}
              {study.shape === "mood-leaf" && <><span className="leaf-stem" /><span className="leaf-one" /><span className="leaf-two" /><span className="leaf-three" /></>}
            </div>
            <figcaption>{study.name}</figcaption>
          </figure>
        ))}
      </div>
      <p className="mt-3 text-[10px] text-ink/55">A colour and shape study · illustration, not studio photography</p>
    </div>
  );
}
