import { FaFacebookF, FaInstagram, FaTiktok } from "react-icons/fa";

const socials = [
  { label: "Instagram", href: "#", Icon: FaInstagram }, // TODO: real links
  { label: "Facebook", href: "#", Icon: FaFacebookF },
  { label: "TikTok", href: "#", Icon: FaTiktok },
];

export default function Footer() {
  return (
    <footer className="flex flex-wrap items-center justify-between gap-4 bg-gold-dark px-6 py-10 text-sm text-cream md:px-16">
      <span className="font-display text-2xl tracking-[0.14em]">SBOSH</span>

      <ul className="flex items-center gap-5">
        {socials.map(({ label, href, Icon }) => (
          <li key={label}>
            <a
              href={href}
              aria-label={label}
              className="flex size-11 items-center justify-center rounded-full hover:bg-white/10"
            >
              <Icon size={18} />
            </a>
          </li>
        ))}
      </ul>

      <span>[YOUR CONTACT DETAILS]</span>
    </footer>
  );
}