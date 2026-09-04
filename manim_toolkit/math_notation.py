from __future__ import annotations

import json
from pathlib import Path
from typing import Any

DEFAULT_NOTATION_PROFILE = "VN_GDPT2018"
REGISTRY_PATH = Path(__file__).resolve().parents[1] / "registry" / "pimath-dna-math-notation-v1.0.json"


class MathNotationError(ValueError):
    """Raised when registered notation cannot be preserved safely."""


def _load_registry() -> dict[str, Any]:
    registry = json.loads(REGISTRY_PATH.read_text(encoding="utf-8"))
    entries = registry.get("entries")
    if not isinstance(entries, list) or not entries:
        raise MathNotationError("MATH_NOTATION_REGISTRY_INVALID: entries must be a non-empty list")

    symbol_ids: set[str] = set()
    token_owners: dict[str, str] = {}
    declared_profiles = set(registry.get("notationProfiles", []))
    for entry in entries:
        symbol_id = entry.get("symbolId")
        if not isinstance(symbol_id, str) or not symbol_id:
            raise MathNotationError("MATH_NOTATION_REGISTRY_INVALID: symbolId is required")
        if symbol_id in symbol_ids:
            raise MathNotationError(f"MATH_NOTATION_REGISTRY_INVALID: duplicate symbolId {symbol_id}")
        symbol_ids.add(symbol_id)

        for profile_id in (entry.get("profileSemantics") or {}).keys():
            if profile_id not in declared_profiles:
                raise MathNotationError(
                    f"MATH_NOTATION_REGISTRY_INVALID: undeclared notation profile {profile_id}"
                )

        tokens = [entry.get("canonicalLatex")]
        if entry.get("unicode"):
            tokens.append(entry["unicode"])
        tokens.extend(entry.get("aliases", []))
        for token in tokens:
            if not isinstance(token, str) or not token:
                raise MathNotationError(
                    f"MATH_NOTATION_REGISTRY_INVALID: invalid token in {symbol_id}"
                )
            owner = token_owners.get(token)
            if owner and owner != symbol_id:
                raise MathNotationError(
                    f"MATH_NOTATION_AMBIGUITY: token {token!r} belongs to {owner} and {symbol_id}"
                )
            token_owners[token] = symbol_id

    return registry


REGISTRY = _load_registry()


def _entry_tokens(entry: dict[str, Any]) -> list[str]:
    tokens = [entry["canonicalLatex"]]
    if entry.get("unicode"):
        tokens.append(entry["unicode"])
    tokens.extend(entry.get("aliases", []))
    return tokens


def _matches_at(source: str, offset: int, token: str) -> bool:
    if not source.startswith(token, offset):
        return False
    if token.startswith("\\") and token[1:].isalpha():
        next_index = offset + len(token)
        if next_index < len(source) and source[next_index].isalpha():
            return False
    return True


def _effective_semantics(entry: dict[str, Any], profile_id: str | None) -> tuple[str, str]:
    profile_semantics = entry.get("profileSemantics") or {}
    if not profile_semantics:
        return entry["semantic"], entry["spokenVi"]
    if not profile_id:
        raise MathNotationError(
            f"MATH_NOTATION_AMBIGUITY: {entry['symbolId']} requires a notation profile"
        )
    profile = profile_semantics.get(profile_id)
    if not profile:
        raise MathNotationError(
            f"MATH_NOTATION_AMBIGUITY: {entry['symbolId']} has no semantics for {profile_id}"
        )
    return profile["semantic"], profile.get("spokenVi", entry["spokenVi"])


def prepare_math_notation(
    source: str,
    *,
    profile_id: str | None = DEFAULT_NOTATION_PROFILE,
    output: str | None = None,
) -> dict[str, Any]:
    indexed: list[tuple[str, dict[str, Any]]] = []
    for entry in REGISTRY["entries"]:
        indexed.extend((token, entry) for token in _entry_tokens(entry))
    indexed.sort(key=lambda pair: (-len(pair[0]), pair[0]))

    canonical_parts: list[str] = []
    semantic_tokens: list[dict[str, Any]] = []
    cursor = 0
    while cursor < len(source):
        match: tuple[str, dict[str, Any]] | None = None
        for token, entry in indexed:
            if _matches_at(source, cursor, token):
                match = (token, entry)
                break
        if match is None:
            canonical_parts.append(source[cursor])
            cursor += 1
            continue

        token, entry = match
        semantic, spoken_vi = _effective_semantics(entry, profile_id)
        if output and output not in entry.get("outputs", []):
            raise MathNotationError(
                f"MATH_NOTATION_RENDER_FAILURE: {entry['symbolId']} is not declared for {output}"
            )
        if output == "TTS" and not spoken_vi.strip():
            raise MathNotationError(
                f"MATH_NOTATION_NARRATION_MISMATCH: {entry['symbolId']} has no Vietnamese narration"
            )

        canonical = entry["canonicalLatex"]
        semantic_tokens.append(
            {
                "token": token,
                "canonicalLatex": canonical,
                "symbolId": entry["symbolId"],
                "semantic": semantic,
                "spokenVi": spoken_vi,
                "start": cursor,
                "end": cursor + len(token),
            }
        )
        canonical_parts.append(canonical)
        cursor += len(token)

    return {
        "status": "PASS",
        "source": source,
        "canonicalLatex": "".join(canonical_parts),
        "notationProfileId": profile_id,
        "semanticTokens": semantic_tokens,
        "semanticSignature": [
            f"{item['symbolId']}:{item['semantic']}" for item in semantic_tokens
        ],
    }


def canonicalize_math_expression(
    source: str,
    *,
    profile_id: str | None = DEFAULT_NOTATION_PROFILE,
    output: str = "VIDEO",
) -> str:
    return prepare_math_notation(source, profile_id=profile_id, output=output)["canonicalLatex"]


def semantic_signature(
    source: str,
    *,
    profile_id: str | None = DEFAULT_NOTATION_PROFILE,
) -> list[str]:
    return prepare_math_notation(source, profile_id=profile_id)["semanticSignature"]
