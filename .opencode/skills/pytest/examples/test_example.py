import pytest


def test_simple_assertion():
    """Basic assertion test."""
    assert 1 + 1 == 2
    assert "hello".upper() == "HELLO"


def test_exception_handling():
    """Test that exceptions are raised correctly."""
    with pytest.raises(ZeroDivisionError):
        1 / 0


@pytest.mark.parametrize("input,expected", [
    (1, 1),
    (2, 4),
    (3, 9),
])
def test_parametrize(input, expected):
    """Parametrized test."""
    assert input ** 2 == expected


@pytest.fixture
def sample_data():
    """Sample fixture providing test data."""
    return {"users": ["alice", "bob"], "count": 2}


def test_with_fixture(sample_data):
    """Test using a fixture."""
    assert sample_data["count"] == 2
    assert "alice" in sample_data["users"]


@pytest.mark.slow
def test_slow_operation():
    """Test marked as slow."""
    import time
    time.sleep(0.1)
    assert True


@pytest.mark.skip(reason="Not implemented yet")
def test_skipped():
    """This test is skipped."""
    pass


@pytest.mark.xfail(reason="Known bug")
def test_known_failure():
    """Expected failure."""
    assert False
