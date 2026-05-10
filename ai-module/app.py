"""
Module: AI Matching Service
Purpose: Scores CV text against job text and extracts lightweight resume
metadata for the AI CV Screening System.
"""

# ===========================
# IMPORTS
# ===========================

import re

import spacy
from flask import Flask, jsonify, request
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity


# ===========================
# APP STATE
# ===========================

app = Flask(__name__)

# Load the spaCy model once at startup.
nlp = spacy.load("en_core_web_sm")

DEFAULT_KEYWORDS = [
    "python",
    "machine learning",
    "ml",
    "nlp",
    "natural language processing",
    "data",
    "analysis",
    "analytics",
    "ai",
    "artificial intelligence",
    "deep learning",
    "neural network",
    "tensorflow",
    "pytorch",
    "scikit",
    "pandas",
    "numpy",
    "sql",
    "database",
    "javascript",
    "react",
    "node",
    "java",
    "c++",
    "html",
    "css",
    "git",
    "docker",
    "aws",
    "cloud",
]

SKILL_KEYWORDS = [
    "python",
    "java",
    "javascript",
    "c++",
    "html",
    "css",
    "sql",
    "react",
    "node",
    "machine learning",
    "data analysis",
    "tensorflow",
    "pytorch",
    "docker",
    "git",
    "aws",
    "cloud",
    "ai",
    "nlp",
]


# ===========================
# HELPER FUNCTIONS
# ===========================

def clean_text(text):
    """Normalize input text before AI scoring."""
    if not text:
        return ""

    normalized_text = text.lower()
    normalized_text = re.sub(r"[^a-zA-Z0-9\s]", "", normalized_text)
    normalized_text = re.sub(r"\s+", " ", normalized_text).strip()
    return normalized_text


def lemmatize_text(text):
    """
    Lemmatize text using the already-loaded spaCy model.
    Converts inflected forms to their base: 'developing' -> 'develop',
    'managed' -> 'manage', 'responsibilities' -> 'responsibility'.
    Preserves stop words so TfidfVectorizer can filter them itself.
    """
    if not text:
        return ""
    doc = nlp(text)
    return " ".join(
        token.lemma_ for token in doc
        if not token.is_space and not token.is_punct
    )


def boost_keywords(text, extra_keywords=None):
    """
    Increase the weight of important skills in the TF-IDF input.
    Matched terms are repeated 5x (up from 3x) so the vectorizer
    assigns them significantly higher term frequency weight.
    """
    boosted_text = text
    keywords = list(DEFAULT_KEYWORDS)

    if extra_keywords:
        keywords.extend(extra_keywords)

    for keyword in keywords:
        if keyword and keyword in boosted_text:
            # Repeat matched terms so the similarity model gives them more weight.
            boosted_text += f" {keyword} {keyword} {keyword} {keyword} {keyword}"

    return boosted_text


def extract_skill_keywords(skills_text):
    """Convert comma-separated job skills into a cleaned keyword list."""
    if not skills_text:
        return []

    skills = [skill.strip().lower() for skill in skills_text.split(",") if skill.strip()]
    return [clean_text(skill) for skill in skills]


def compute_skill_overlap(cv_text_lower, skill_keywords):
    """
    Compute what fraction of the job's required skills appear in the CV.
    Returns a float in [0.0, 1.0]. Uses simple substring matching on the
    cleaned CV text so it works without a separate skills extractor.
    """
    if not skill_keywords:
        return 0.0
    matched = sum(1 for skill in skill_keywords if skill and skill in cv_text_lower)
    return matched / len(skill_keywords)


def extract_entities(cv_text):
    """Extract lightweight skill, education, and experience signals from a CV."""
    document = nlp(cv_text)

    skills = []
    education = []
    experience = []

    # Use named entities to infer education and company references.
    for entity in document.ents:
        entity_text = entity.text.lower()

        if entity.label_ in ["ORG", "GPE"] and any(
            word in entity_text for word in ["university", "college", "school", "institute"]
        ):
            education.append(entity.text)
        elif entity.label_ == "ORG" and any(
            word in entity_text for word in ["ltd", "inc", "corp", "company"]
        ):
            experience.append(entity.text)

    # Scan noun chunks for common technical skill phrases.
    for chunk in document.noun_chunks:
        chunk_text = chunk.text.lower()
        if any(skill in chunk_text for skill in SKILL_KEYWORDS):
            skills.append(chunk.text.strip())

    return {
        "skills_extracted": ", ".join(set(skills)),
        "education": ", ".join(set(education)),
        "experience": ", ".join(set(experience)),
    }


def build_empty_response():
    """Return the fallback response used when matching cannot be performed."""
    return {
        "score": 0.0,
        "skills_extracted": "",
        "education": "",
        "experience": "",
    }


# ===========================
# ROUTES
# ===========================

@app.route("/match", methods=["POST"])
def match():
    """Match a CV against a job description and return extracted metadata."""
    try:
        request_data = request.json or {}
        cv_text  = request_data.get("cv_text", "")
        job_text = request_data.get("job_text", "")
        job_skills = request_data.get("job_skills", "")

        # Return a safe default when either side of the comparison is missing.
        if not cv_text or not job_text:
            return jsonify(build_empty_response())

        # Extract metadata before cleaning so spaCy sees the original CV text.
        extracted_entities = extract_entities(cv_text)

        # --- Improved pipeline ---
        # Step 1: Lemmatize using the already-loaded spaCy model.
        #         This maps inflected forms to their base form so that
        #         "developed" and "develops" both match "develop" in the job.
        lemmatized_cv  = lemmatize_text(cv_text)
        lemmatized_job = lemmatize_text(job_text)

        # Step 2: Clean (lowercase, remove punctuation, collapse whitespace).
        cleaned_cv_text  = clean_text(lemmatized_cv)
        cleaned_job_text = clean_text(lemmatized_job)

        # Step 3: Boost job skill terms in both texts to make matching
        #         more skill-aware. Matched terms repeated 5x.
        skill_keywords   = extract_skill_keywords(job_skills)
        cleaned_cv_text  = boost_keywords(cleaned_cv_text,  extra_keywords=skill_keywords)
        cleaned_job_text = boost_keywords(cleaned_job_text, extra_keywords=skill_keywords)

        documents = [cleaned_cv_text, cleaned_job_text]

        # Step 4: TF-IDF with improvements:
        #   - ngram_range=(1,2): scores "machine learning" as a phrase, not two weak words
        #   - sublinear_tf=True: log-dampens term frequency so one repeated word
        #                        doesn't dominate the whole vector
        #   - stop_words="english": filters noise words
        tfidf_vectorizer = TfidfVectorizer(
            stop_words="english",
            ngram_range=(1, 2),
            sublinear_tf=True,
        )
        tfidf_matrix     = tfidf_vectorizer.fit_transform(documents)
        tfidf_score      = float(cosine_similarity(tfidf_matrix[0:1], tfidf_matrix[1:2])[0][0])

        # Step 5: Skill overlap — fraction of required job skills found in the CV.
        #         Blended with TF-IDF so a candidate who hits every required skill
        #         gets a meaningfully higher score than one who matches vague prose.
        skill_overlap = compute_skill_overlap(cleaned_cv_text, skill_keywords)

        # Blend: TF-IDF carries 75% of the score; direct skill coverage 25%.
        # When no job skills are provided, fall back to pure TF-IDF.
        if skill_keywords:
            final_score = (tfidf_score * 0.75) + (skill_overlap * 0.25)
        else:
            final_score = tfidf_score

        return jsonify(
            {
                "score": round(min(final_score, 1.0), 4),
                "skills_extracted": extracted_entities["skills_extracted"],
                "education": extracted_entities["education"],
                "experience": extracted_entities["experience"],
            }
        )
    except Exception as error:
        print(f"Error in AI matching: {error}")
        return jsonify(build_empty_response())


# ===========================
# ENTRY POINT
# ===========================

if __name__ == "__main__":
    app.run(port=5001)
