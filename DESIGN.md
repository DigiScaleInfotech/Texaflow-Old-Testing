# Texa Design System & UI Standards (Locked)

> **IMPORTANT:** This document defines the locked single source of truth for the Texa platform UI. Any new feature, page, modal, or module must strictly adhere to these design tokens, component specifications, and interaction patterns.

---

## 1. Typography & Fonts

- **Primary Font Family:** `'Plus Jakarta Sans', sans-serif`
  - Body text: Regular (`font-normal` / 400), Medium (`font-medium` / 500)
  - Headings & Labels: Semi-bold (`font-semibold` / 600), Bold (`font-bold` / 700)
- **Monospace Font (for IDs, Codes, Currency, GSTIN):** `font-mono`
- **Page Titles:** `text-2xl font-bold text-gray-900 dark:text-white`
- **Section Headers:** `text-lg font-semibold text-gray-900 dark:text-white`
- **Body & Table Text:** `text-sm text-gray-700 dark:text-gray-300`
- **Subtext & Meta:** `text-xs text-gray-500 dark:text-gray-400`

---

## 2. Color Palette & Surfaces

| Role | Light Mode | Dark Mode | Class Pattern |
| :--- | :--- | :--- | :--- |
| **App Background** | `#f8fafc` to `#e2e8f0` (linear gradient) | `#202936` (deep slate) | Global `body` |
| **Cards & Containers** | `bg-[rgb(243,241,241)]` | `bg-[#202936]` with `border-white/10` | `glass-card rounded-xl` |
| **Primary Accent** | `#3B82F6` (Blue 500) | `#3B82F6` (Blue 500) | `bg-blue-500 hover:bg-blue-600 text-white` |
| **Borders** | `border-gray-200` | `border-gray-700` or `border-gray-800` | `border border-gray-200 dark:border-gray-700` |
| **Text Primary** | `text-gray-900` | `text-white` | `text-gray-900 dark:text-white` |
| **Text Secondary** | `text-gray-700` | `text-gray-300` | `text-gray-700 dark:text-gray-300` |
| **Text Muted** | `text-gray-500` | `text-gray-400` | `text-gray-500 dark:text-gray-400` |

### Status Badges (Pills)
Status badges must always use 10% opacity backgrounds with matching colored text:
- **Completed / Paid / Approved / In Stock:**  
  `bg-green-100 text-green-600 dark:bg-green-500/10 dark:text-green-400`
- **Pending / In Progress / Low Stock:**  
  `bg-yellow-100 text-yellow-600 dark:bg-yellow-500/10 dark:text-yellow-400`
- **Cancelled / Rejected / Overdue / Out of Stock:**  
  `bg-red-100 text-red-600 dark:bg-red-500/10 dark:text-red-400`
- **Sales / Shipped / Info:**  
  `bg-blue-100 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400`

---

## 3. Standard Table Patterns (Locked)

All module list views (Orders, Customers, Billing, Inventory, Vendors, Employees, etc.) must follow this exact table architecture:

### 3.1 Container Hierarchy
```tsx
<div className="glass-card rounded-xl">
  <div className="overflow-x-auto md:overflow-visible">
    <table className="w-full">
      <thead>
        <tr className="border-b border-gray-200 dark:border-gray-800">
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 dark:text-gray-400 uppercase">
            Header Title
          </th>
          ...
        </tr>
      </thead>
      <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
        <motion.tr 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
        >
          ...
        </motion.tr>
      </tbody>
    </table>
  </div>
</div>
```

### 3.2 ID Cell Rule (NO Box / NO Badge)
- **Rule:** Never wrap IDs in a bordered box or pill badge inside tables.
- **Specification:** Clean plain text with `font-mono`, with the original UUID in the `title` attribute for tooltip copy:
```tsx
<td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300 font-mono" title={item.id}>
  {formatShortId(item.id, 'PREFIX')}
</td>
```
- **Prefix Standard:**
  - Orders: `ORD-XXXXXX`
  - Invoices / Bills: `INV-XXXXXX`
  - Products: `PRD-XXXXXX`
  - Customers: `CUST-XXXXXX`
  - Vendors: `VND-XXXXXX`
  - Employees: `EMP-XXXXXX`

### 3.3 No False Void Space Rule
- **Rule:** Never force fixed container heights (`min-h-[260px]`, `min-h-[80vh]`, or huge bottom paddings) on table containers.
- **Specification:** Tables must hug their content naturally (`overflow-x-auto md:overflow-visible`).

---

## 4. Action Menu Standard (Dropdown Specification)

All three-dots (`MoreVertical`) dropdown menus must follow this exact behavior and styling:

```tsx
<td className="px-6 py-4">
  <div className="relative inline-block text-left action-menu-container">
    <button 
      onClick={(e) => toggleActionMenu(item.id, e)}
      className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors text-gray-600 dark:text-gray-400"
    >
      <MoreVertical size={16} />
    </button>
    
    {activeActionMenu === item.id && (
      <div className={`absolute right-0 ${
        menuVerticalPosition === 'bottom' ? 'bottom-full mb-1' : 'top-full mt-1'
      } bg-white dark:bg-gray-800 shadow-xl rounded-xl border border-gray-200 dark:border-gray-700 py-1.5 z-[100] min-w-36 whitespace-nowrap`}>
        <button 
          onClick={() => router.push(`/module/${item.id}`)}
          className="flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
        >
          <Eye size={16} className="mr-2 text-blue-500" />
          View
        </button>
        <button 
          onClick={() => router.push(`/module/edit/${item.id}`)}
          className="flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
        >
          <Edit size={16} className="mr-2 text-amber-500" />
          Edit
        </button>
        <button 
          onClick={() => handleDelete(item.id)}
          className="flex items-center w-full px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700"
        >
          <Trash size={16} className="mr-2" />
          Delete
        </button>
      </div>
    )}
  </div>
</td>
```

### Positioning Logic:
```tsx
const toggleActionMenu = (id: string, e: React.MouseEvent) => {
  e.stopPropagation();
  if (activeActionMenu === id) {
    setActiveActionMenu(null);
    return;
  }
  const button = e.currentTarget as HTMLElement;
  const buttonRect = button.getBoundingClientRect();
  const spaceBelow = window.innerHeight - buttonRect.bottom;
  setMenuVerticalPosition(spaceBelow < 200 ? 'bottom' : 'top');
  setActiveActionMenu(id);
};
```

---

## 5. Input & Form Standards

- **Search Inputs:**
  ```tsx
  <div className="relative flex-1">
    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
    <input
      type="text"
      placeholder="Search..."
      className="w-full pl-10 pr-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:border-blue-500 text-sm"
    />
  </div>
  ```
- **Primary CTA Button:**
  ```tsx
  <button className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-2 text-sm font-medium">
    <Plus size={18} />
    Add New
  </button>
  ```
- **Secondary / Filter Button:**
  ```tsx
  <button className="px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex items-center gap-2 text-sm">
    <Filter size={18} />
    Filter
  </button>
  ```

---

## 6. Iconography Rules

- **Library:** `lucide-react`
- **Sizes:**
  - Table inline icons & Action dropdown icons: `size={16}`
  - Buttons & Form inputs: `size={18}` or `size={20}`
  - Metric / KPI cards: `size={20}` or `size={24}`
