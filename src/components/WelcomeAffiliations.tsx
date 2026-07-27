/**
 * Secondary affiliation strip for the welcome screen.
 * Logos live in public/logos/ — replace SVGs with official assets when available.
 */

const EDUCATION_LOGOS = [
  {
    src: "/logos/wgu.svg",
    alt: "Western Governors University",
    label: "WGU",
  },
  {
    src: "/logos/ub.svg",
    alt: "University at Buffalo",
    label: "UB",
  },
  {
    src: "/logos/buffalo-state.svg",
    alt: "Buffalo State College",
    label: "Buffalo State",
  },
] as const;

export function WelcomeAffiliations() {
  return (
    <aside className="welcome__affiliations" aria-label="Volunteer work and education">
      <div className="welcome__exp">
        <span className="welcome__affil-label">Volunteer</span>
        <div className="welcome__exp-row">
          <img
            src="/logos/lions-international.svg"
            alt="Lions Clubs International"
            title="Lions Clubs International (placeholder — replace public/logos/lions-international.svg with official emblem)"
            className="welcome__exp-avatar"
            width={40}
            height={40}
          />
          <div className="welcome__exp-text">
            <p className="welcome__exp-org">Lions International</p>
            <p className="welcome__exp-meta">Volunteer · most recent</p>
          </div>
        </div>
      </div>

      <div className="welcome__edu" aria-label="Education">
        <span className="welcome__affil-label">Education</span>
        <p className="welcome__edu-degree">
          B.S. Information Technology — Western Governors University
        </p>
        <ul className="welcome__logo-row">
          {EDUCATION_LOGOS.map((logo) => (
            <li key={logo.src}>
              <img
                src={logo.src}
                alt={logo.alt}
                title={`${logo.alt} (placeholder — replace public/logos file with official SVG)`}
                className="welcome__logo-mark"
                width={logo.src.includes("buffalo") ? 100 : 72}
                height={20}
              />
            </li>
          ))}
        </ul>
      </div>
    </aside>
  );
}
