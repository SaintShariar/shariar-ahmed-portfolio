/**
 * Secondary affiliation strip for the welcome screen.
 * Logos live in public/logos/.
 */

const EDUCATION_LOGOS = [
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
    <aside className="welcome__affiliations" aria-label="Work experience, volunteer work, and education">
      <div className="welcome__exp">
        <span className="welcome__affil-label">Experience</span>
        <div className="welcome__exp-list">
          <div className="welcome__exp-row">
            <img
              src="/logos/canvass-america.png"
              alt="Canvass America"
              title="Canvass America"
              className="welcome__exp-avatar"
              width={40}
              height={40}
            />
            <div className="welcome__exp-text">
              <p className="welcome__exp-org">Canvass America</p>
              <p className="welcome__exp-meta">
                Political Canvasser · Jan 2024–Dec 2024
              </p>
            </div>
          </div>
          <div className="welcome__exp-row">
            <img
              src="/logos/lions-international.svg"
              alt="Lions Clubs International"
              title="Lions Clubs International"
              className="welcome__exp-avatar"
              width={40}
              height={40}
            />
            <div className="welcome__exp-text">
              <p className="welcome__exp-org">Lions International</p>
              <p className="welcome__exp-meta">Volunteer — most recent</p>
            </div>
          </div>
        </div>
      </div>

      <div className="welcome__edu" aria-label="Education">
        <span className="welcome__affil-label">Education</span>
        <div className="welcome__exp-row welcome__edu-primary">
          <img
            src="/logos/wgu-owl.svg"
            alt="Western Governors University owl"
            title="Western Governors University"
            className="welcome__exp-avatar welcome__wgu-owl"
            width={48}
            height={48}
          />
          <div className="welcome__exp-text">
            <p className="welcome__exp-org">Western Governors University</p>
            <p className="welcome__edu-degree">
              Bachelor of Science, Information Technology
            </p>
            <p className="welcome__exp-meta">2025–2027</p>
          </div>
        </div>
        <ul className="welcome__logo-row">
          {EDUCATION_LOGOS.map((logo) => (
            <li key={logo.src}>
              <img
                src={logo.src}
                alt={logo.alt}
                title={logo.alt}
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
