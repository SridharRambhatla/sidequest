# /review
Comprehensive code review.

## Check For
- Logging (no console.log, proper logger with context)
- Error handling (try/catch for async, helpful messages)
- TypeScript (no any, proper interfaces, no @ts-ignore)
- Production readiness (no debug, no TODOs, no secrets)
- React/Hooks (cleanup, complete deps, no infinite loops)
- Performance (no unnecessary re-renders, memoize expensive work)
- Security (auth, input validation, RLS)
- Architecture (patterns, correct directory)

## Output Format
### ✅ Looks Good
- [Item 1]
- [Item 2]

### ⚠️ Issues Found
- **[Severity]** [File:line] - [Issue description]
  - Fix: [Suggested fix]

### 📊 Summary
- Files reviewed: X
- Critical issues: X
- Warnings: X

## Severity Levels
- **CRITICAL** - Security, data loss, crashes
- **HIGH** - Bugs, performance issues, bad UX
- **MEDIUM** - Code quality, maintainability
- **LOW** - Style, minor improvements
