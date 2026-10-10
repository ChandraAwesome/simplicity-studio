<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- Keep the image-to-sketch UI in focused workspace components, separate from the home route; this keeps presentation independent of a future conversion service.
- Use browser-local state for this UI-only prototype, without claiming a live CAD connection or production conversion; service integration is outside the requested scope.
- Keep alternate workspace designs in their own content routes with a shared version switcher; this preserves the original workspace independently.
