# QA report

Checked before packaging:
- All five HTML pages parse successfully.
- All local page references resolve.
- JavaScript syntax: script.js PASS; quiz.js PASS.
- Fixed duplicate `class` attribute on quiz page.
- Hardened mobile navigation and added mobile subject submenu.
- Added responsive breakpoints and overflow protection for narrow screens.
- Loader uses requestAnimationFrame for smoother browser-native rendering instead of a 5 ms CPU-burning timer. A browser/display cannot guarantee a literal 200 Hz paint rate.
- Removed dead `example.com` PDF targets and replaced them with an explicit “PDF coming soon” state.
