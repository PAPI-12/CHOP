"""Layer 6 — Validation. Pydantic contracts at the API boundary."""

from __future__ import annotations

import re
from typing import Literal, Optional

from pydantic import BaseModel, EmailStr, Field, field_validator


class ContactIn(BaseModel):
    name: str = Field(..., min_length=2, max_length=120)
    email: EmailStr
    project: Optional[str] = Field("", max_length=120)
    message: str = Field(..., min_length=10, max_length=4000)
    consent: Literal[True]
    website: str = Field("", max_length=0)  # honeypot: humans leave blank

    @field_validator("name", "project", "message", mode="before")
    @classmethod
    def strip_and_reject_controls(cls, value):
        if value is None:
            return ""
        cleaned = str(value).strip()
        if re.search(r"[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]", cleaned):
            raise ValueError("Control characters are not allowed.")
        return cleaned


class ContactOut(BaseModel):
    id: int
    ok: bool = True
    duplicate: bool = False
    notification_sent: bool = False
    message: str = "Thanks — your enquiry was stored securely."


class ProjectOut(BaseModel):
    id: str
    title: str
    subtitle: str
    category: str
    year: str
    tags: list[str]
    link: str
    featured: bool = False


class ResumeEntryOut(BaseModel):
    range: str
    role: str
    company: str
    description: str


class ResumeOut(BaseModel):
    name: str
    title_line: str
    skills: list[str]
    experience: list[ResumeEntryOut]


class HealthOut(BaseModel):
    status: str
    service: str
    version: str
