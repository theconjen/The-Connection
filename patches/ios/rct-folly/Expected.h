// Patch: guard coroutine include when FOLLY_HAS_COROUTINES is undefined or false
// Source: Pods/Headers/Public/RCT-Folly/folly/Expected.h (modified)

#if defined(FOLLY_HAS_COROUTINES) && FOLLY_HAS_COROUTINES
#include <folly/coro/Coroutine.h>
#endif
