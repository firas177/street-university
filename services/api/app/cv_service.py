from io import BytesIO
import re

from pypdf import PdfReader


MAX_CV_SIZE_BYTES = 5 * 1024 * 1024  # 5 MB


class CVExtractionError(Exception):
    pass


def validate_cv_file(filename: str | None, content_type: str | None, file_bytes: bytes):
    if not file_bytes:
        raise CVExtractionError("Le fichier CV est vide.")

    if len(file_bytes) > MAX_CV_SIZE_BYTES:
        raise CVExtractionError("Le fichier CV est trop volumineux. Maximum autorisé : 5 MB.")

    safe_filename = (filename or "").lower().strip()

    if not safe_filename.endswith(".pdf"):
        raise CVExtractionError("Format non supporté. Veuillez uploader un fichier PDF.")

    allowed_content_types = {
        "application/pdf",
        "application/octet-stream",
    }

    if content_type and content_type not in allowed_content_types:
        raise CVExtractionError("Type de fichier non supporté. Veuillez uploader un PDF.")


def clean_extracted_text(text: str) -> str:
    text = text or ""
    text = text.replace("\x00", " ")

    # Nettoyer les espaces trop nombreux
    text = re.sub(r"[ \t]+", " ", text)

    # Nettoyer les lignes vides répétées
    text = re.sub(r"\n\s*\n\s*\n+", "\n\n", text)

    return text.strip()


def extract_text_from_pdf_bytes(file_bytes: bytes) -> str:
    try:
        reader = PdfReader(BytesIO(file_bytes))
    except Exception:
        raise CVExtractionError("Impossible de lire ce PDF.")

    pages_text = []

    for index, page in enumerate(reader.pages):
        try:
            page_text = page.extract_text() or ""
        except Exception:
            page_text = ""

        page_text = clean_extracted_text(page_text)

        if page_text:
            pages_text.append(f"--- Page {index + 1} ---\n{page_text}")

    full_text = "\n\n".join(pages_text)
    full_text = clean_extracted_text(full_text)

    if not full_text:
        raise CVExtractionError(
            "Aucun texte détecté dans le PDF. Le CV est peut-être scanné sous forme d'image."
        )

    # Limite raisonnable pour éviter un texte trop long
    return full_text[:30000]



def _compact_lines(text: str) -> list[str]:
    lines = []

    for line in (text or "").splitlines():
        clean = line.strip()
        if clean:
            lines.append(clean)

    return lines


def _contains_any(value: str, keywords: list[str]) -> bool:
    lower = value.lower()
    return any(keyword.lower() in lower for keyword in keywords)


def _extract_contact_info(text: str) -> dict:
    email_match = re.search(
        r"[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}",
        text or "",
    )

    phone_match = re.search(
        r"(\+?\d[\d\s().-]{7,}\d)",
        text or "",
    )

    linkedin_match = re.search(
        r"(https?://)?(www\.)?linkedin\.com/[^\s|]+",
        text or "",
        flags=re.IGNORECASE,
    )

    github_match = re.search(
        r"(https?://)?(www\.)?github\.com/[^\s|]+",
        text or "",
        flags=re.IGNORECASE,
    )

    return {
        "email": email_match.group(0) if email_match else None,
        "phone": phone_match.group(0).strip() if phone_match else None,
        "linkedin": linkedin_match.group(0) if linkedin_match else None,
        "github": github_match.group(0) if github_match else None,
    }


def _extract_section(text: str, start_keywords: list[str], end_keywords: list[str]) -> str:
    if not text:
        return ""

    lower_text = text.lower()

    starts = []
    for keyword in start_keywords:
        index = lower_text.find(keyword.lower())
        if index != -1:
            starts.append(index)

    if not starts:
        return ""

    start_index = min(starts)

    possible_ends = []
    for keyword in end_keywords:
        index = lower_text.find(keyword.lower(), start_index + 1)
        if index != -1:
            possible_ends.append(index)

    end_index = min(possible_ends) if possible_ends else len(text)

    return clean_extracted_text(text[start_index:end_index])


def _split_items(section_text: str, max_items: int = 12) -> list[str]:
    lines = _compact_lines(section_text)

    items = []

    for line in lines:
        line = re.sub(r"^[•\-–—*]\s*", "", line).strip()
        line = re.sub(r"\s+", " ", line).strip()

        if not line:
            continue

        if len(line) < 3:
            continue

        if line.lower() in {
            "education",
            "experience",
            "projects",
            "skills",
            "technical skills",
            "languages",
            "certifications",
        }:
            continue

        items.append(line)

    return items[:max_items]


def _detect_technical_skills(text: str) -> dict:
    skills_catalog = {
        "programming_languages": [
            "Python",
            "JavaScript",
            "TypeScript",
            "Java",
            "PHP",
            "C",
            "C++",
            "SQL",
            "HTML",
            "CSS",
        ],
        "frontend": [
            "React",
            "Next.js",
            "Vue",
            "Tailwind",
            "HTML",
            "CSS",
            "JavaScript",
        ],
        "backend": [
            "FastAPI",
            "Django",
            "Flask",
            "Node.js",
            "Express",
            "Laravel",
            "REST API",
            "JWT",
        ],
        "databases": [
            "PostgreSQL",
            "MySQL",
            "MongoDB",
            "SQLite",
            "SQL",
        ],
        "ai_data": [
            "Machine Learning",
            "Deep Learning",
            "NLP",
            "Pandas",
            "NumPy",
            "Scikit-learn",
            "TensorFlow",
            "PyTorch",
            "Sentiment Analysis",
            "Data Science",
        ],
        "devops_tools": [
            "Docker",
            "Git",
            "GitHub",
            "Linux",
            "VS Code",
            "Cursor",
            "Jupyter",
        ],
    }

    detected = {}

    for category, skills in skills_catalog.items():
        detected[category] = [
            skill for skill in skills if _contains_any(text, [skill])
        ]

    return detected


def _detect_languages(text: str) -> list[str]:
    candidates = [
        "Arabic",
        "French",
        "English",
        "German",
        "Italian",
        "Spanish",
    ]

    detected = []

    for language in candidates:
        if _contains_any(text, [language]):
            detected.append(language)

    return detected


def _build_summary(text: str) -> str:
    lines = _compact_lines(text)

    useful_lines = []

    for line in lines[:20]:
        if len(line) > 40:
            useful_lines.append(line)

    summary = " ".join(useful_lines[:3]).strip()

    if not summary:
        summary = "Profil extrait automatiquement à partir du CV uploadé."

    return summary[:800]


def build_structured_cv_profile(extracted_text: str) -> dict:
    text = clean_extracted_text(extracted_text)

    contact = _extract_contact_info(text)

    education_section = _extract_section(
        text,
        ["education", "formation", "academic background"],
        ["experience", "professional experience", "projects", "technical skills", "skills", "certifications", "languages"],
    )

    experience_section = _extract_section(
        text,
        ["professional experience", "experience", "work experience"],
        ["projects", "featured projects", "technical skills", "skills", "certifications", "languages"],
    )

    projects_section = _extract_section(
        text,
        ["featured projects", "projects", "academic projects"],
        ["technical skills", "skills", "certifications", "languages", "professional certifications"],
    )

    skills_section = _extract_section(
        text,
        ["technical skills", "skills", "competences", "compétences"],
        ["certifications", "languages", "professional certifications", "references"],
    )

    certifications_section = _extract_section(
        text,
        ["certifications", "professional certifications"],
        ["languages", "references", "other competencies"],
    )

    languages_section = _extract_section(
        text,
        ["languages", "langues"],
        ["references", "other competencies"],
    )

    profile = {
        "professional_summary": _build_summary(text),
        "contact": contact,
        "education": _split_items(education_section, max_items=8),
        "experience": _split_items(experience_section, max_items=10),
        "projects": _split_items(projects_section, max_items=12),
        "technical_skills": _detect_technical_skills(text),
        "skills_section_raw": skills_section[:1500],
        "certifications": _split_items(certifications_section, max_items=10),
        "languages": _detect_languages(languages_section or text),
        "languages_section_raw": languages_section[:800],
        "raw_text_preview": text[:1200],
    }

    return profile