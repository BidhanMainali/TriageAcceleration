"""
Shared helpers for the AI layer: robust JSON parsing and a
single place that talks to Claude (with retry + deterministic output).
"""
import json
import re
import anthropic

# One canonical model id for the whole pipeline.
MODEL = "claude-opus-4-6"

# temperature=0 keeps triage output stable/reproducible for demos and review.
TEMPERATURE = 0.0


class AIParseError(ValueError):
    """Raised when a model response cannot be coerced into JSON."""


def parse_json(text: str) -> dict:
    """
    Best-effort extraction of a JSON object from a model response.

    Handles markdown fences and stray prose around the object. Raises
    AIParseError (rather than a bare JSONDecodeError) so callers can
    distinguish a bad model response from other failures.
    """
    if not text or not text.strip():
        raise AIParseError("Empty model response")

    cleaned = text.strip()
    cleaned = re.sub(r"^```(?:json)?\s*", "", cleaned)
    cleaned = re.sub(r"\s*```$", "", cleaned)
    cleaned = cleaned.strip()

    try:
        return json.loads(cleaned)
    except json.JSONDecodeError:
        pass

    # Fall back to the first balanced-looking {...} block in the text.
    match = re.search(r"\{.*\}", cleaned, re.DOTALL)
    if match:
        try:
            return json.loads(match.group(0))
        except json.JSONDecodeError:
            pass

    raise AIParseError(f"Could not parse JSON from model response: {text[:200]!r}")


def request_json(system: str, user: str, max_tokens: int, attempts: int = 2) -> dict:
    """
    Call Claude and return a parsed JSON object.

    Centralizes model id, temperature, and a small retry so a single
    malformed response doesn't fail the request. On persistent failure
    the last error propagates to the caller, which is expected to apply
    a safe fallback.
    """
    client = anthropic.Anthropic()
    last_err: Exception | None = None

    for _ in range(max(1, attempts)):
        try:
            message = client.messages.create(
                model=MODEL,
                max_tokens=max_tokens,
                temperature=TEMPERATURE,
                system=system,
                messages=[{"role": "user", "content": user}],
            )
            return parse_json(message.content[0].text)
        except (AIParseError, json.JSONDecodeError) as e:
            last_err = e  # bad output — retry
        except anthropic.APIError as e:
            last_err = e  # transient API issue — retry

    raise last_err if last_err else AIParseError("No response from model")
