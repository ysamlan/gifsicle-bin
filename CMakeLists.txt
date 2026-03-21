cmake_minimum_required(VERSION 3.15)
project(gifsicle-bin C)

set(GIFSICLE_VERSION "1.96")
set(GIFSICLE_SRC "${CMAKE_CURRENT_SOURCE_DIR}/vendor/gifsicle/src")
set(GIFSICLE_INC "${CMAKE_CURRENT_SOURCE_DIR}/vendor/gifsicle/include")

# Verify vendored source exists
if(NOT EXISTS "${GIFSICLE_SRC}/gifsicle.c")
  message(FATAL_ERROR
    "Missing gifsicle sources at ${GIFSICLE_SRC}. "
    "Run: git submodule update --init --recursive")
endif()

# --- config.h generation ---
include(CheckIncludeFile)
include(CheckFunctionExists)
include(CheckTypeSize)

check_include_file(inttypes.h HAVE_INTTYPES_H)
check_include_file(stdint.h HAVE_STDINT_H)
check_include_file(stdlib.h HAVE_STDLIB_H)
check_include_file(string.h HAVE_STRING_H)
check_include_file(strings.h HAVE_STRINGS_H)
check_include_file(memory.h HAVE_MEMORY_H)
check_include_file(unistd.h HAVE_UNISTD_H)
check_include_file(sys/select.h HAVE_SYS_SELECT_H)
check_include_file(sys/stat.h HAVE_SYS_STAT_H)
check_include_file(sys/time.h HAVE_SYS_TIME_H)
check_include_file(sys/types.h HAVE_SYS_TYPES_H)
check_include_file(time.h HAVE_TIME_H)

check_function_exists(strerror HAVE_STRERROR)
check_function_exists(strtoul HAVE_STRTOUL)
check_function_exists(mkstemp HAVE_MKSTEMP)

# pow and cbrtf may be in libm
include(CheckLibraryExists)
check_library_exists(m pow "" HAVE_LIBM)
if(HAVE_LIBM)
  set(MATH_LIBRARY m)
endif()
check_function_exists(pow HAVE_POW)
if(NOT HAVE_POW AND HAVE_LIBM)
  set(HAVE_POW 1)
endif()
check_function_exists(cbrtf HAVE_CBRTF)
if(NOT HAVE_CBRTF AND HAVE_LIBM)
  set(HAVE_CBRTF 1)
endif()

check_type_size(float SIZEOF_FLOAT)
check_type_size("unsigned int" SIZEOF_UNSIGNED_INT)
check_type_size("unsigned long" SIZEOF_UNSIGNED_LONG)
check_type_size("void *" SIZEOF_VOID_P)
check_type_size(int64_t HAVE_INT64_T LANGUAGE C)
check_type_size(uint64_t HAVE_UINT64_T LANGUAGE C)
check_type_size(uintptr_t HAVE_UINTPTR_T LANGUAGE C)

# SIMD / vector type detection
include(CheckCSourceCompiles)
check_c_source_compiles("
  typedef int v4si __attribute__((vector_size(16)));
  int main() { v4si a = {0,0,0,0}; return a[0]; }
" HAVE_VECTOR_SIZE_VECTOR_TYPES)

check_c_source_compiles("
  typedef int v4si __attribute__((ext_vector_type(4)));
  int main() { v4si a = {0,0,0,0}; return a[0]; }
" HAVE_EXT_VECTOR_TYPE_VECTOR_TYPES)

if(HAVE_VECTOR_SIZE_VECTOR_TYPES OR HAVE_EXT_VECTOR_TYPE_VECTOR_TYPES)
  set(HAVE_SIMD 1)
endif()

# Thread support
find_package(Threads QUIET)
if(Threads_FOUND)
  check_c_source_compiles("
    int main() { int x = 0; __sync_add_and_fetch(&x, 1); return x; }
  " HAVE___SYNC_ADD_AND_FETCH)
  if(HAVE___SYNC_ADD_AND_FETCH)
    set(ENABLE_THREADS 1)
  endif()
endif()

# Random function
if(WIN32)
  set(RANDOM "rand")
else()
  set(RANDOM "random")
endif()

# Pathname separator
if(WIN32)
  set(PATHNAME_SEPARATOR "'\\\\\\\\'")
else()
  set(PATHNAME_SEPARATOR "'/'")
endif()

# Generate config.h
configure_file(
  "${CMAKE_CURRENT_SOURCE_DIR}/config.h.cmake.in"
  "${CMAKE_CURRENT_BINARY_DIR}/config.h"
)

# --- Build gifsicle ---
add_executable(gifsicle
  ${GIFSICLE_SRC}/clp.c
  ${GIFSICLE_SRC}/fmalloc.c
  ${GIFSICLE_SRC}/giffunc.c
  ${GIFSICLE_SRC}/gifread.c
  ${GIFSICLE_SRC}/gifunopt.c
  ${GIFSICLE_SRC}/gifwrite.c
  ${GIFSICLE_SRC}/kcolor.c
  ${GIFSICLE_SRC}/merge.c
  ${GIFSICLE_SRC}/optimize.c
  ${GIFSICLE_SRC}/quantize.c
  ${GIFSICLE_SRC}/support.c
  ${GIFSICLE_SRC}/xform.c
  ${GIFSICLE_SRC}/gifsicle.c
)

target_include_directories(gifsicle PRIVATE
  ${GIFSICLE_SRC}
  ${GIFSICLE_INC}              # lcdfgif/gif.h, lcdf/clp.h
  ${CMAKE_CURRENT_BINARY_DIR}  # for generated config.h
)

target_compile_definitions(gifsicle PRIVATE HAVE_CONFIG_H)

if(HAVE_LIBM)
  target_link_libraries(gifsicle PRIVATE m)
endif()

if(ENABLE_THREADS AND Threads_FOUND)
  target_link_libraries(gifsicle PRIVATE Threads::Threads)
endif()

# Install to the scripts directory so pip/uv puts it in PATH
install(TARGETS gifsicle DESTINATION "${SKBUILD_SCRIPTS_DIR}")
