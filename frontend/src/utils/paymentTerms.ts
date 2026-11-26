/**
 * Helper utilities for Customer Payment Terms, Due Dates, and Overdue calculations
 * Tailored for Indian & Textile trade credit terms (Net 15, Net 30, Net 45, Net 60, etc.)
 */

export interface DueStatus {
  isOverdue: boolean;
  isDueSoon: boolean;
  isDueToday: boolean;
  daysDiff: number; // positive = days overdue, negative = days left
  label: string;
  badgeClass: string;
}

/**
 * Extracts credit days from paymentTerms string.
 * e.g. "Net 30" -> 30, "Net 15" -> 15, "Due on Receipt" -> 0
 */
export function parsePaymentTermsDays(paymentTerms?: string): number {
  if (!paymentTerms) return 0;
  const term = paymentTerms.trim().toLowerCase();
  if (term.includes('15')) return 15;
  if (term.includes('30')) return 30;
  if (term.includes('45')) return 45;
  if (term.includes('60')) return 60;
  if (term.includes('90')) return 90;
  if (term.includes('receipt') || term.includes('cash')) return 0;

  const match = term.match(/\d+/);
  if (match) return parseInt(match[0], 10);
  return 0;
}

/**
 * Calculates due date based on an issue date and payment terms.
 */
export function calculateDueDate(issueDate: Date | string, paymentTerms?: string): Date {
  const date = new Date(issueDate);
  if (isNaN(date.getTime())) return new Date();
  const days = parsePaymentTermsDays(paymentTerms);
  date.setDate(date.getDate() + days);
  return date;
}

/**
 * Calculates due date string in 'YYYY-MM-DD' format.
 */
export function calculateDueDateString(issueDateStr: string, paymentTerms?: string): string {
  if (!issueDateStr) return '';
  const date = new Date(issueDateStr);
  if (isNaN(date.getTime())) return '';
  const days = parsePaymentTermsDays(paymentTerms);
  date.setDate(date.getDate() + days);
  return date.toISOString().split('T')[0];
}

/**
 * Calculates whether an invoice/challan is overdue, due soon, or paid.
 */
export function getDueStatus(dueDate: Date | string | null | undefined, isPaid: boolean = false): DueStatus {
  if (isPaid) {
    return {
      isOverdue: false,
      isDueSoon: false,
      isDueToday: false,
      daysDiff: 0,
      label: 'Paid',
      badgeClass: 'text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30 border-emerald-200 dark:border-emerald-800',
    };
  }

  if (!dueDate) {
    return {
      isOverdue: false,
      isDueSoon: false,
      isDueToday: false,
      daysDiff: 0,
      label: 'No Due Date',
      badgeClass: 'text-gray-500 bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700',
    };
  }

  const due = new Date(dueDate);
  if (isNaN(due.getTime())) {
    return {
      isOverdue: false,
      isDueSoon: false,
      isDueToday: false,
      daysDiff: 0,
      label: 'Invalid Date',
      badgeClass: 'text-gray-500 bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700',
    };
  }

  const today = new Date();
  due.setHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);

  const diffTime = today.getTime() - due.getTime();
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays > 0) {
    return {
      isOverdue: true,
      isDueSoon: false,
      isDueToday: false,
      daysDiff: diffDays,
      label: `${diffDays}d Overdue`,
      badgeClass: 'text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-900/30 border-rose-200 dark:border-rose-800 font-semibold',
    };
  } else if (diffDays === 0) {
    return {
      isOverdue: false,
      isDueSoon: true,
      isDueToday: true,
      daysDiff: 0,
      label: 'Due Today',
      badgeClass: 'text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/30 border-amber-200 dark:border-amber-800 font-semibold',
    };
  } else {
    const daysLeft = Math.abs(diffDays);
    return {
      isOverdue: false,
      isDueSoon: daysLeft <= 3,
      isDueToday: false,
      daysDiff: diffDays,
      label: `Due in ${daysLeft}d`,
      badgeClass: daysLeft <= 3
        ? 'text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/30 border-amber-200 dark:border-amber-800'
        : 'text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-800',
    };
  }
}
