#!/usr/bin/env python3
"""Pytest fixtures for quiz-writer tests."""
import json
from pathlib import Path

import pytest

SUB_11 = "1.1 - Describe design considerations for applications that use foundation models"
SUB_12 = "1.2 - Explain the concept of foundation models"
SUB_21 = "2.1 - The capabilities of generative AI"


def make_quiz() -> dict:
    """Minimal quiz document that mirrors the real bank's structure."""
    return {
        "id": "aws-aif-c01",
        "slug": "aws-aif-c01",
        "title": "Fixture quiz",
        "description": "A fixture quiz used by the quiz-writer test suite only.",
        "kind": "certification",
        "category": "ai-ml",
        "difficulty": "intermediate",
        "durationSeconds": 5400,
        "passingScore": 70,
        "mockQuestionCount": 65,
        "topic": "AWS",
        "certification": "AWS Certified AI Practitioner (AIF-C01)",
        "domains": [
            {"id": "1", "name": "1: Domain one", "color": "blue", "percent": 20, "subdomains": [SUB_11, SUB_12]},
            {"id": "2", "name": "2: Domain two", "color": "purple", "percent": 24, "subdomains": [SUB_21]},
        ],
        "questions": [
            {
                "id": "q001",
                "subdomain": SUB_11,
                "type": "mcq",
                "question": "Which service stores retrieved passages before a generation call?",
                "options": ["A vector database", "A message queue", "A block device", "A cron daemon"],
                "correct": 0,
                "explanation": "Retrieved passages live in a vector database until the prompt is assembled.",
            }
        ],
    }


def make_mcq(question: str = "Which input mode streams objects for immediate use?", correct: int = 0,
             subdomain: str = SUB_11, options=None) -> dict:
    """Build a schema-valid mcq item."""
    return {
        "subdomain": subdomain,
        "type": "mcq",
        "question": question,
        "options": options or ["FastFile mode", "File mode", "Pipe mode", "EFS mode"],
        "correct": correct,
        "explanation": "FastFile streams objects from Amazon S3 as training starts.",
    }


def make_multi(question: str = "Which statements about chunking a corpus are correct?", correct=None,
               subdomain: str = SUB_11) -> dict:
    """Build a schema-valid multi-select item."""
    return {
        "subdomain": subdomain,
        "type": "multi",
        "question": question,
        "options": [
            "Chunking splits documents into retrievable segments",
            "Larger chunks always improve retrieval precision",
            "Overlapping chunks reduce loss at segment boundaries",
            "Chunking must run before embeddings are computed",
            "Chunking replaces the need for an embedding model",
        ],
        "correct": [0, 2, 3] if correct is None else correct,
        "explanation": "Chunking prepares segments for embedding with optional overlap between neighbours.",
    }


def make_ordering(question: str = "Place the steps of a retrieval request in the order they occur.", correct=None,
                 subdomain: str = SUB_11) -> dict:
    """Build a schema-valid ordering item whose answer is not presented in order."""
    return {
        "subdomain": subdomain,
        "type": "ordering",
        "question": question,
        "options": [
            "The query is embedded as a vector",
            "Nearest neighbours are searched in the index",
            "Passages are filtered and deduplicated",
            "The prompt assembles context with the passages",
            "The model generates the grounded answer",
        ],
        "correct": [2, 0, 4, 1] if correct is None else correct,
        "explanation": "Embedding precedes search, search precedes filtering, and generation is last.",
    }


def make_matching(question: str = "Match each retrieval API to the job it performs.", correct=None,
                 subdomain: str = SUB_11) -> dict:
    """Build a schema-valid matching item with short strings and prompts before options."""
    return {
        "subdomain": subdomain,
        "type": "matching",
        "question": question,
        "prompts": ["Ranked passages only", "Answer and citations in one call", "Reformulate the question"],
        "options": ["Retrieve", "RetrieveAndGenerate", "GenerateQuery"],
        "correct": [0, 1, 2] if correct is None else correct,
        "explanation": "Retrieve ranks passages, RetrieveAndGenerate answers with citations, GenerateQuery rewrites.",
    }


@pytest.fixture
def quiz(tmp_path: Path) -> Path:
    """Write the fixture quiz to a temp file and return its path."""
    path = tmp_path / "quiz.json"
    path.write_text(json.dumps(make_quiz(), indent=2), encoding="utf-8")
    return path


@pytest.fixture
def valid_batch() -> list:
    """A batch that satisfies every gate: grid 1.1 mcq x2, 1.1 multi x1, 1.2 ordering x1, 2.1 matching x1."""
    return [
        make_mcq("Which input mode streams objects for immediate use?", correct=0),
        make_mcq("Which setting caps a training job's wall-clock runtime?", correct=1),
        make_multi(),
        make_ordering(),
        make_matching(),
    ]


def write_batch(tmp_path: Path, items: list, name: str = "batch.json") -> Path:
    """Write a batch file and return its path."""
    path = tmp_path / name
    path.write_text(json.dumps(items, indent=2), encoding="utf-8")
    return path
