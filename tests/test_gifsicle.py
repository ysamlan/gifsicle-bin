"""Smoke tests for the gifsicle-bin wheel."""

from __future__ import annotations

import shutil
import subprocess
import sys


def test_version():
    """gifsicle --version prints expected version."""
    result = subprocess.run(
        ["gifsicle", "--version"],
        capture_output=True,
        text=True,
    )
    assert result.returncode == 0
    assert "1.96" in result.stdout


def test_module_invocation():
    """python -m gifsicle_bin --version works."""
    result = subprocess.run(
        [sys.executable, "-m", "gifsicle_bin", "--version"],
        capture_output=True,
        text=True,
    )
    assert result.returncode == 0
    assert "1.96" in result.stdout


def test_binary_in_path():
    """gifsicle is findable via shutil.which."""
    path = shutil.which("gifsicle")
    assert path is not None
