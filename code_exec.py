import subprocess
import tempfile
from pathlib import Path
import sys

PROFILE = """
(version 1)

(allow default)
(allow process*)

(deny network*)

(deny file-write*)
(allow file-write* (subpath "{workdir}"))
"""


def execute_python(code: str, timeout: int = 5) -> dict:
    with tempfile.TemporaryDirectory(prefix="llm-code-") as tmp:
        workdir = Path(tmp).resolve()
        code_path = workdir / "main.py"
        profile_path = workdir / "sandbox.sb"

        code_path.write_text(code, encoding="utf-8")
        profile_path.write_text(PROFILE.format(workdir=str(workdir)), encoding="utf-8")

        PYTHON = "/opt/homebrew/bin/python3"

        try:
            result = subprocess.run(
                [
                    "sandbox-exec",
                    "-f",
                    str(profile_path),
                    PYTHON,
                    str(code_path),
                ],
                cwd=workdir,
                capture_output=True,
                text=True,
                timeout=timeout,
                env={
                    "PATH": "/opt/homebrew/bin:/usr/bin:/bin",
                    "PYTHONNOUSERSITE": "1",
                },
            )

            return {
                "stdout": result.stdout[-8000:],
                "stderr": result.stderr[-8000:],
                "exit_code": result.returncode,
                "timed_out": False,
            }

        except subprocess.TimeoutExpired as exc:
            return {
                "stdout": (exc.stdout or "")[-8000:],
                "stderr": (exc.stderr or "")[-8000:],
                "exit_code": None,
                "timed_out": True,
            }


input = {"code": "print(min([8, 3]))"}

print(execute_python(input["code"]))
