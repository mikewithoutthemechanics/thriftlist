```markdown
# thriftlist Development Patterns

> Auto-generated skill from repository analysis

## Overview
This skill teaches you the core development patterns and conventions used in the `thriftlist` TypeScript codebase. You'll learn how to structure files, write and organize code, follow commit message conventions, and run or write tests in the style of this repository. These patterns help maintain consistency and readability across the project.

## Coding Conventions

### File Naming
- Use **kebab-case** for all file names.
  - Example:  
    ```
    shopping-list.ts
    user-profile.test.ts
    ```

### Import Style
- Both default and named imports are used. Prefer named imports for clarity.
  - Example:
    ```typescript
    import { fetchItems, addItem } from './item-service';
    import utils from './utils';
    ```

### Export Style
- Use **named exports** for all modules.
  - Example:
    ```typescript
    // In item-service.ts
    export function fetchItems() { ... }
    export function addItem(item) { ... }
    ```

### Commit Messages
- Follow **Conventional Commits** format.
- Use prefixes like `fix`, followed by a short, descriptive message (~75 characters).
  - Example:
    ```
    fix: correct item removal logic in shopping-list component
    ```

## Workflows

### Code Change & Commit
**Trigger:** When making any code changes  
**Command:** `/commit`

1. Make your code changes following the coding conventions.
2. Stage your changes.
3. Write a commit message using the conventional commit format (e.g., `fix: ...`).
4. Commit your changes.

### Testing Code
**Trigger:** Before pushing or merging code  
**Command:** `/test`

1. Identify or create test files matching the `*.test.*` pattern.
2. Run the test suite using the project's test runner (framework unknown—consult project docs or package.json).
3. Ensure all tests pass before proceeding.

## Testing Patterns

- Test files are named using the pattern: `*.test.*` (e.g., `user-profile.test.ts`).
- The specific testing framework is not specified; check `package.json` or ask a maintainer for details.
- Place tests alongside the code they test or in a dedicated `tests/` directory, following the file naming convention.

Example test file:
```typescript
// user-profile.test.ts
import { getUserProfile } from './user-profile';

describe('getUserProfile', () => {
  it('returns user data for valid ID', () => {
    // test implementation
  });
});
```

## Commands
| Command   | Purpose                                      |
|-----------|----------------------------------------------|
| /commit   | Commit code changes using conventional commits|
| /test     | Run the test suite on all `*.test.*` files   |
```
