1.  **Update Next-Themes Provider Integration**
    *   Since I already installed `next-themes`, I need to wrap the app layout in a `<ThemeProvider attribute="class" defaultTheme="system" enableSystem>`.
2.  **Define CSS Variables in `globals.css` for Light and Dark Modes**
    *   Add color variables for the application interface (e.g., `--card`, `--card-foreground`, `--border`, `--input`, `--muted`, `--muted-foreground`).
    *   For dark mode, define exactly the colors the user requested: `--card: #2D2D2D`, `--border: #3E3E3E`, `--input: #3E3E3E`, deep background `--background: #232323`.
    *   Update the `@theme` block to export these custom colors so they are accessible as `bg-card`, `border-border`, `text-muted-foreground`, etc., in Tailwind CSS.
3.  **Create a Theme Toggle Component**
    *   Create `src/components/shared/ThemeToggle.tsx` that allows manually switching between system/light/dark modes.
    *   Place this component in the `TopBar` next to the user profile.
4.  **Refactor Existing Components to Use Semantic Colors**
    *   Globally replace hardcoded `bg-white` with `bg-card` where appropriate, or `bg-background` for base layers.
    *   Replace `text-gray-900` with `text-foreground`, `text-gray-500` with `text-muted-foreground`, etc.
    *   Replace `border-gray-200` with `border-border`.
    *   Remove all `dark:...` utility classes from `SmsSettingsForm.tsx` and replace them with these new semantic variables.
    *   Update common UI components like `StatCard`, `DataTable`, `SearchBar`, Modals, `TopBar`, `Sidebar`, and forms across all routes (`admin`, `cashier`, `meter-reader`, `consumer`).
5.  **Pre-commit Instructions**
    *   Ensure proper testing, verification, review, and reflection are done.
6.  **Submit Changes**
    *   Once all styles have been updated and manually tested for consistent dark/light mode rendering, submit the code.
