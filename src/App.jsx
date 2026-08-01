import React, { useRef } from "react";
import TopMilkyWay from "./TopMilkyWay";
import BottomRipples from "./BottomRipples";
import "./styles.css";

// Resolved against Vite's base so the link survives a subpath deploy.
const RESUME_URL = `${import.meta.env.BASE_URL}Sam_Cain_resume_2025.pdf`;

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
  return (
    <article className="project">
      <div className="project-head">
        <h3 className="project-title">{project.title}</h3>
        <span className="project-period">{project.period}</span>
      </div>
      <p className="project-tagline">{project.tagline}</p>
      <p className="project-blurb">{project.blurb}</p>
      <ul className="stack" aria-label="Technologies">
        {project.stack.map((tech) => (
          <li key={tech}>{tech}</li>
        ))}
      </ul>
      <div className="project-links">
        {project.links.map((link) => (
          <a key={link.href} href={link.href} target="_blank" rel="noreferrer">
            {link.label}
            <span aria-hidden="true"> →</span>
          </a>
        ))}
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
