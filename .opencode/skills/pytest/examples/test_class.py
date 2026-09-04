import pytest


class TestStringMethods:
    """Test class for string methods."""

    def test_upper(self):
        assert "foo".upper() == "FOO"

    def test_lower(self):
        assert "FOO".lower() == "foo"

    def test_isupper(self):
        assert "FOO".isupper()
        assert not "Foo".isupper()


class TestCalculator:
    """Test class for calculator operations."""

    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup fixture run before each test."""
        self.result = 0

    def test_add(self):
        self.result = 1 + 1
        assert self.result == 2

    def test_subtract(self):
        self.result = 5 - 3
        assert self.result == 2

    def test_multiply(self):
        self.result = 3 * 4
        assert self.result == 12
