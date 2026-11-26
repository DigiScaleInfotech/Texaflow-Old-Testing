# Texa Project AI & Developer Guidelines

## UI & Design System (Strictly Locked)
Whenever adding any new feature, page, modal, or module to Texa, you **MUST** strictly follow the design system documented in [DESIGN.md](file:///Users/apple/Desktop/Project/Texa/DESIGN.md):

1. **Typography:**
   - Always use `'Plus Jakarta Sans'` for prose and headings.
   - Always use `font-mono` for IDs, codes, GSTIN, and currency figures.
2. **Colors & Dark Mode:**
   - Dark mode background: `#202936`.
   - Cards: `.glass-card rounded-xl`.
   - Primary buttons & active accents: `bg-blue-500 hover:bg-blue-600 text-white`.
3. **Table & List Structure:**
   - Use `<div className="glass-card rounded-xl"><div className="overflow-x-auto md:overflow-visible"><table className="w-full">...`.
   - **Never** add forced minimum heights (like `min-h-[260px]` or `min-h-[80vh]`) or huge bottom padding. Tables must hug content naturally.
4. **ID Display Standard:**
   - Display IDs using `formatShortId(id, prefix)` from `@/utils/format`.
   - **Never** put IDs in a bordered box or pill badge in tables. Use clean plain text:
     `<td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300 font-mono" title={id}>{formatShortId(id, prefix)}</td>`.
5. **Action Menus:**
   - Use the standard three-dot (`MoreVertical`) dropdown positioned with `absolute right-0 top-full mt-1` (or `bottom-full mb-1` if near bottom of viewport).
