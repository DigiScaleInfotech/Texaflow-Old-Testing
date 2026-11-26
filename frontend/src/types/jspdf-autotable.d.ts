import { jsPDF } from 'jspdf';

declare module 'jspdf-autotable' {
  export interface UserOptions {
    startY?: number;
    head?: string[][];
    body?: string[][];
    foot?: string[][];
    margin?: { left: number; right: number; top?: number; bottom?: number };
    theme?: 'grid' | 'striped' | 'plain';
    styles?: any;
    headStyles?: any;
    bodyStyles?: any;
    footStyles?: any;
    didDrawPage?: (data: any) => void;
    didParseCell?: (data: any) => void;
    willDrawCell?: (data: any) => void;
    didDrawCell?: (data: any) => void;
  }

  interface AutoTablePlugin {
    (doc: jsPDF, options: UserOptions): void;
  }

  const autoTable: AutoTablePlugin;
  export default autoTable;
}

// Augment jsPDF to include lastAutoTable property
declare module 'jspdf' {
  interface jsPDF {
    lastAutoTable?: {
      finalY: number;
    };
  }
}
