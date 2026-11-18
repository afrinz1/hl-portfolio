#!/usr/bin/env python
"""Django's command-line utility for administrative tasks."""
import os
from pathlib import Path
import subprocess
import sys


def main():
    """Run administrative tasks."""
    # If launched outside the project's virtual environment, automatically forward
    # execution to the virtualenv Python interpreter in env/.
    root_dir = Path(__file__).resolve().parent.parent
    venv_python = root_dir / "env" / "Scripts" / "python.exe"
    if not venv_python.exists():
        venv_python = root_dir / "env" / "bin" / "python"

    if venv_python.exists() and os.path.normcase(sys.executable) != os.path.normcase(str(venv_python)):
        sys.exit(subprocess.call([str(venv_python)] + sys.argv))

    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'portfolio.settings')
    try:
        from django.core.management import execute_from_command_line
    except ImportError as exc:
        raise ImportError(
            "Couldn't import Django. Are you sure it's installed and "
            "available on your PYTHONPATH environment variable? Did you "
            "forget to activate a virtual environment?"
        ) from exc
    execute_from_command_line(sys.argv)


if __name__ == '__main__':
    main()
