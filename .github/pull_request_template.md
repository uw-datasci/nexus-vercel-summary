# Pull Request Template

## Summary
- [ ] Describe the change and any motivation/context.

## Testing
- [ ] List the tests you ran (commands, cases, screenshots).

## Release / Merge Message
Use Angular-style commit wording for the merge commit so semantic-release picks the right bump:
- Patch: `fix(scope): concise summary` — e.g. `fix(pencil): stop graphite breaking when too much pressure applied`.
- Minor: `feat(scope): concise summary` — e.g. `feat(pencil): add 'graphiteWidth' option`.
- Major: include a `BREAKING CHANGE:` footer — e.g. `perf(pencil): remove graphiteWidth option` followed by `BREAKING CHANGE: The graphiteWidth option has been removed. The default graphite width of 10mm is always used for performance reasons.`.

Expected release type:
- [ ] patch
- [ ] minor
- [ ] major (breaking change noted above)

