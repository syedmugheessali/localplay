# Contributing to LocalPlay

Thanks for helping improve LocalPlay. Contributions of any size are welcome, including bug fixes, documentation, themes, and new player controls.

## Getting started

1. Fork the repository on GitHub.
2. Clone your fork.
3. Create a branch for your change.
4. Make and test your changes.
5. Commit the changes with a clear message.
6. Push the branch and open a pull request.

Example:

```bash
git checkout -b feature/playlist-support
git add .
git commit -m "Add playlist support"
git push origin feature/playlist-support
```

## Project approach

LocalPlay is designed to remain approachable for people learning web development. Please:

- Use plain HTML, CSS, and JavaScript.
- Avoid adding a build step unless it solves an important problem.
- Prefer small functions and descriptive variable names.
- Comment code where the reason is not immediately clear.
- Keep video processing local and protect the privacy-first design.
- Do not commit copyrighted or personal video files.

## Testing a change

Before opening a pull request, check that:

- A local video can be opened with both the file picker and drag and drop.
- The custom playback controls still work.
- The page works at desktop and mobile widths.
- The browser console does not show unexpected errors.
- No personal media or editor files are included in the commit.

## Reporting a bug

Include the browser and operating system, what you expected, what happened, and the steps needed to reproduce the problem. Screenshots are helpful for visual issues.
