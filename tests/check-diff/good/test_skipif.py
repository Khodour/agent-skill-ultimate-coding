import pytest


@pytest.mark.skipif(not HAS_BZ2, reason="needs bz2")
def test_compress():
    assert compress(b"x")
