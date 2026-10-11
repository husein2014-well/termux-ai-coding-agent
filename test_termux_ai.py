import tempfile
import unittest
from pathlib import Path
import termux_ai


class HelpersTest(unittest.TestCase):
    def test_secret_names_are_excluded(self):
        self.assertFalse(termux_ai.safe_context_file(Path(".env")))
        self.assertFalse(termux_ai.safe_context_file(Path("config/api.key")))
        self.assertFalse(termux_ai.safe_context_file(Path("id_ed25519")))

    def test_regular_source_is_allowed(self):
        self.assertTrue(termux_ai.safe_context_file(Path("src/main.py")))

    def test_context_skips_secrets(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            (root / "app.py").write_text("print('ok')", encoding="utf-8")
            (root / ".env").write_text("TOKEN=do-not-send", encoding="utf-8")
            context = termux_ai.read_context([root])
            self.assertIn("app.py", context)
            self.assertNotIn("do-not-send", context)

    def test_strip_code_fence(self):
        self.assertEqual(termux_ai.strip_fence("```py\nprint(1)\n```"), "print(1)\n")


if __name__ == "__main__":
    unittest.main()
