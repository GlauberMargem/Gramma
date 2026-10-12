from unittest.mock import MagicMock, patch

from app.tests_pre_start import init, logger


def test_init_successful_connection() -> None:
    engine_mock = MagicMock()

    connection_mock = MagicMock()
    connection_mock.__enter__.return_value = connection_mock

    with (
        patch("app.tests_pre_start.text", return_value="SELECT 1"),
        patch.object(engine_mock, "connect", return_value=connection_mock),
        patch.object(logger, "info"),
        patch.object(logger, "error"),
        patch.object(logger, "warn"),
    ):
        try:
            init(engine_mock)
            connection_successful = True
        except Exception:
            connection_successful = False

        assert connection_successful, (
            "The database connection should be successful and not raise an exception."
        )

        engine_mock.connect.assert_called_once_with()
        connection_mock.execute.assert_called_once_with("SELECT 1")