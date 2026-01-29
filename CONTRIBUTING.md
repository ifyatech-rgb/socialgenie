# Contributing Guide

## Development Workflow

1. **Fork and clone** the repository
2. **Create a branch** for your feature: `git checkout -b feature/your-feature-name`
3. **Make changes** and test thoroughly
4. **Commit** with clear messages: `git commit -m "Add feature: description"`
5. **Push** to your fork: `git push origin feature/your-feature-name`
6. **Create a Pull Request**

## Code Style

- Use TypeScript for all new code
- Follow existing code patterns
- Use meaningful variable and function names
- Add comments for complex logic
- Keep components small and focused

## Testing

Before submitting:
- Test all user flows
- Check for TypeScript errors: `npm run build`
- Verify database migrations work
- Test on different screen sizes

## Phase 2 Implementation

When implementing video generation:

1. Review `app/api/scripts/[id]/generate-video/route.ts` for implementation guide
2. Test with HeyGen API sandbox first
3. Handle errors gracefully
4. Update script status appropriately
5. Add loading states in UI

## Questions?

Open an issue or reach out to the maintainers.
