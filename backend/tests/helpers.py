from backend.app.schemas import BackendMemoryRecord


def make_memory(
    memory_id: str,
    *,
    title: str,
    memory_type: str,
    visibility: str,
    reliability: float,
    active: bool,
    evidence_role: str = "neutral",
    source: str = "Test Source",
    day: int = 8,
    location: str = "Test Location",
):
    return BackendMemoryRecord(
        memoryId=memory_id,
        title=title,
        text=f"{title} text",
        day=day,
        type=memory_type,
        source=source,
        location=location,
        visibility=visibility,
        reliability=reliability,
        active=active,
        tags=["test", memory_type],
        evidenceRole=evidence_role,
        persistent=memory_type != "short_term",
    )
