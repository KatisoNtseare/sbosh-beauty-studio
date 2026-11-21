import type { Metadata } from "next";
import PageIntro from "@/components/layouts/PageIntro";
import StudioMoodboard from "@/components/home/StudioMoodboard";

export const metadata: Metadata = {
  title: "Studio moodboard | SBOSH Beauty Studio",
  description: "An illustrated moodboard for the calm, considered feeling behind SBOSH Beauty Studio.",
};

export default function GalleryPage() {
  return (
    <div className="mx-auto max-w-7xl px-6 py-14 md:px-16 md:py-20">
      <PageIntro
        eyebrow="The studio moodboard"
        title="A feeling, in colour and shape."
        lead="An illustrated study in warm light, natural forms and the quiet details that make a little time for yourself feel special."
      />
      <div className="mx-auto mt-10 max-w-5xl">
        <StudioMoodboard />
      </div>
    </div>
  );
}
