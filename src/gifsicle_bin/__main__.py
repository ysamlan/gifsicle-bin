"""Allow running as: python -m gifsicle_bin --version"""

from __future__ import annotations

import os
import subprocess
import sys
import sysconfig


def main() -> None:
    exe_suffix = sysconfig.get_config_var("EXE") or ""
    gifsicle = os.path.join(sysconfig.get_path("scripts"), "gifsicle" + exe_suffix)
    raise SystemExit(subprocess.call([gifsicle, *sys.argv[1:]], close_fds=False))


main()
