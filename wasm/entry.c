#include <emscripten.h>
#include <unistd.h>

/* The real main, compiled as __main_argc_argv by clang 15+.
   We provide an EMSCRIPTEN_KEEPALIVE wrapper so the linker
   keeps the code reachable when building with MODULARIZE + INVOKE_RUN=0. */
int __main_argc_argv(int argc, char *argv[]);

EMSCRIPTEN_KEEPALIVE
int run_gifsicle(int argc, char *argv[]) {
    optind = 1;
    return __main_argc_argv(argc, argv);
}
