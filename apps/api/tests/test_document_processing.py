from app.domain.documents.processing import _chunk_text


def test_chunk_text_preserves_page_numbers_and_owner():
    pages = [(1, "one two three four five six")]
    chunks = _chunk_text(pages, "doc-1", "user-1")

    assert chunks
    assert chunks[0]["document_id"] == "doc-1"
    assert chunks[0]["owner_id"] == "user-1"
    assert chunks[0]["page_number"] == 1
    assert chunks[0]["content"]
