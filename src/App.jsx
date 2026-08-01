import React, { useRef } from "react";
import TopMilkyWay from "./TopMilkyWay";
import BottomRipples from "./BottomRipples";
import "./styles.css";

// Resolved against Vite's base so the link survives a subpath deploy.
const RESUME_URL = `${import.meta.env.BASE_URL}Sam_Cain_Resume.pdf`;

const EMAIL = "Samca04@comcast.net";
const GITHUB = "https://github.com/SamCain04";
const LINKEDIN = "https://www.linkedin.com/in/samuel-cain-424947259";


const PROJECTS = [
  {
    title: "EnRoute",
    tagline: "Privacy-first VPN",
    period: "2025 — present",
    blurb:
      "A no-logs VPN built on one rule: every tier gets identical protection, and paying reserves capacity rather than buying better privacy. Anonymous accounts, two-phase admission with client-side key custody, WireGuard and OpenVPN transports, and a fail-closed desktop client.",
    stack: ["TypeScript", "Node", "Electron", "PostgreSQL", "WireGuard"],
    links: [{ label: "getenroute.net", href: "https://getenroute.net" }]
  },
  {
    title: "Stock Forecasting with LSTMs",
    tagline: "Time-series deep learning",
    period: "2024",
    blurb:
      "An LSTM in TensorFlow that forecasts Microsoft daily closing prices. Covers the full loop: data pipeline, windowed feature construction, walk-forward validation, and error tracking against a naive baseline.",
    stack: ["Python", "TensorFlow", "pandas", "Jupyter"],
    links: [
      {
        label: "View on GitHub",
        href: "https://github.com/SamCain04/Market_prediction"
      }
    ]
  },
  {
    title: "GPT-Hero",
    tagline: "AI text-detection demo",
    period: "2023",
    status: "Retired",
    muted: true,
    note: "Site no longer online",
    blurb:
      "A site exposing GPT-Zero's detection flaws across 100+ AI-written samples, built to show how unreliable heuristic detectors are at telling machine text from human writing. Reached over a million unique visitors in its first month, spread organically through TikTok.",
    stack: [],
    links: []
  },
  {
    title: "StratoSplit",
    tagline: "Multicast spatial audio on AWS",
    period: "2024 — 2025",
    status: "Private",
    muted: true,
    note: "Client project — no public link",
    blurb:
      "CS capstone for General Dynamics and the US Coast Guard. Led a team of four to build a multicast spatial-audio system on AWS, delivered against the client's full technical requirements, with a zero-trust access model keeping sensitive communications compartmentalized and modular Python utilities handling data validation.",
    stack: ["AWS", "Python", "Multicast", "Zero-trust"],
    links: []
  }
];

function Hero() {
  // The water mirrors the sky canvas itself, so both halves share this ref.
  const skyRef = useRef(null);

  return (
    <header className="stage">
      <TopMilkyWay canvasRef={skyRef} />
      <BottomRipples skyRef={skyRef} />
      <div className="center-split">
        <h1 className="brand">Sam Cain</h1>
        <p className="tagline">Data Science &amp; Software Engineering</p>
        <nav className="cta-row" aria-label="Primary">
          <a className="pill" href={RESUME_URL} target="_blank" rel="noreferrer">
            Resume
          </a>
          <a className="pill" href="#projects">
            Projects
          </a>
          <a className="pill" href="#contact">
            Contact
          </a>
        </nav>
      </div>
      <a className="scroll-hint" href="#projects" aria-label="Scroll to projects">
        <span aria-hidden="true">↓</span>
      </a>
    </header>
  );
}

function ProjectCard({ project }) {
  const { stack = [], links = [], status, note, muted } = project;

  return (
    <article className={muted ? "project is-muted" : "project"}>
      <div className="project-head">
        <h3 className="project-title">
          {project.title}
          {status ? <span className="project-status">{status}</span> : null}
        </h3>
        {project.period ? <span className="project-period">{project.period}</span> : null}
      </div>
      {project.tagline ? <p className="project-tagline">{project.tagline}</p> : null}
      <p className="project-blurb">{project.blurb}</p>
      {stack.length ? (
        <ul className="stack" aria-label="Technologies">
          {stack.map((tech) => (
            <li key={tech}>{tech}</li>
          ))}
        </ul>
      ) : null}
      <div className="project-links">
        {links.length ? (
          links.map((link) => (
            <a key={link.href} href={link.href} target="_blank" rel="noreferrer">
              {link.label}
              <span aria-hidden="true"> →</span>
            </a>
          ))
        ) : (
          <span className="project-note">{note}</span>
        )}
      </div>
    </article>
  );
}

export default function App() {
  return (
    <>
      <Hero />
      <main>
        <section className="section" id="projects">
          <h2>Projects</h2>
          <div className="project-grid">
            {PROJECTS.map((project) => (
              <ProjectCard key={project.title} project={project} />
            ))}
          </div>
        </section>

        <section className="section" id="contact">
          <h2>Contact</h2>
          <p className="section-lead">
            Open to data science and software engineering roles.
          </p>
          <ul className="contact-list">
            <li>
              <a href={`mailto:${EMAIL}`}>{EMAIL}</a>
            </li>
            <li>
              <a href={GITHUB} target="_blank" rel="noreferrer">
                github.com/SamCain04
              </a>
            </li>
            <li>
              <a href={LINKEDIN} target="_blank" rel="noreferrer">
                LinkedIn
              </a>
            </li>
            <li>
              <a href={RESUME_URL} target="_blank" rel="noreferrer">
                Resume (PDF)
              </a>
            </li>
          </ul>
        </section>
      </main>

      <footer className="footer">
        <p>© {new Date().getFullYear()} Sam Cain</p>
      </footer>
    </>
  );
}
