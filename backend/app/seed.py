"""Content seed — single source of truth for projects & resume.

Mirrors the frontend copy exactly so the Python backend can serve the
same data the React build renders statically.
"""

from __future__ import annotations

from .domain import Project, ResumeEntry

PROJECTS: list[Project] = [
    Project("tau", "TAU FOODS", "Tau Foods — UX/UI", "UX/UI", "2024", ["UX/UI"], "https://papiraborife.wixsite.com/porti/tau-foods", True),
    Project("cornetto", "CORNETTO CULTURE", "Johannesburg Skatepark — UI/UX, Art Direction & Illustration", "UI/UX, ART DIRECTION & ILLUSTRATION", "2023", ["UI/UX", "ART DIRECTION", "ILLUSTRATION"], "/work/cornetto", True),
    Project("sars", "SARS", "Friends & Taxes — Art Direction", "ART DIRECTION", "2023", ["ART DIRECTION"], "https://papiraborife.wixsite.com/porti/sars-friends-and-taxes"),
    Project("louis-vuitton", "LOUIS VUITTON", "Culture Systems — AI", "AI", "2022", ["AI"], "/contact"),
    Project("audi", "AUDI", "Curated Lifestyle — AI Advertising", "AI ADVERTISING", "2021", ["AI ADVERTISING"], "/contact"),
    Project("debonairs", "DEBONAIRS", "Pizza Brand — Art Direction & Cinematography", "ART DIRECTION & CINEMATOGRAPHY", "2019", ["ART DIRECTION", "CINEMATOGRAPHY"], "/contact"),
    Project("joshua", "JOSHUA THE IAM", "OTR Special — Cinematography", "CINEMATOGRAPHY", "2022", ["CINEMATOGRAPHY"], "https://papiraborife.wixsite.com/porti/joshua-the-i-am"),
]

RESUME_EXPERIENCE: list[ResumeEntry] = [
    ResumeEntry("MAR 2023 — NOW", "UI/UX Designer", "Tau Foods — UX/UI", "Created the Tau Foods UI for web and mobile using Figma and Adobe CC, building prototypes while guiding stakeholders and owning budgets plus API integrations."),
    ResumeEntry("JAN — NOV 2022", "UI/UX · Mid-Senior Art Director & Digital Designer", "Ogilvy Joburg — 360 campaigns", "Handled above and below the line design elements with quick turnaround, directing art direction and flagging delivery risks early."),
    ResumeEntry("JUN 2020 — APR 2021", "UI/UX · Mid Art Director & Digital Designer", "The Niche Guys", "Created graphics across print, social and ATL/BTL, maintaining CI consistency and managing multiple deadlines."),
    ResumeEntry("JUL 2019 — APR 2020", "UI/UX · Mid Art Director & Digital Designer", "M&C Saatchi Abel", "Conceived big ideas to shift behaviour and directed visuals with layout, fonts, illustration and typography."),
    ResumeEntry("FEB 2016 — JUL 2019", "Junior Art Director, Digital Designer", "FCB Joburg", "Developed concepts, graphics, logos and websites with CD/ECD reviews."),
    ResumeEntry("FEB — NOV 2015", "Junior Graphic Designer", "Umuzi Academy", "Built concepts and sites against brief deliverables with lecturer reviews."),
]

RESUME_PAYLOAD = {
    "name": "Papi Raborife",
    "title_line": "UI/UX Design · Art Direction · Graphic Design",
    "skills": ["SKETCH", "ADOBE XD", "FIGMA", "PHOTOSHOP", "INDESIGN", "ILLUSTRATOR", "PREMIERE PRO", "DAVINCI RESOLVE"],
    "experience": [
        {"range": e.range, "role": e.role, "company": e.company, "description": e.description}
        for e in RESUME_EXPERIENCE
    ],
}


def seed_database(repo) -> None:
    for project in PROJECTS:
        repo.upsert_project(project)
    repo.set_resume(RESUME_PAYLOAD)
