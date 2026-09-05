import { RankedCandidate } from '../api/types';

/**
 * Escapes a field for CSV compliance (wraps in quotes if contains comma, quote, or newline).
 */
const escapeCsvField = (field: string | number | undefined | null): string => {
  if (field === null || field === undefined) {
    return '""';
  }
  const str = String(field);
  if (str.includes('"') || str.includes(',') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return `"${str}"`;
};

/**
 * Exports ranked candidates to a CSV file and triggers a browser download.
 */
export const exportShortlistToCsv = (
  jobTitle: string,
  candidates: RankedCandidate[]
): void => {
  if (!candidates || candidates.length === 0) {
    return;
  }

  const headers = [
    'Rank',
    'Candidate Name',
    'Candidate Email',
    'Overall Match Score (%)',
    'Experience Score (/100)',
    'Skills Score (/100)',
    'Projects Score (/100)',
    'Education Score (/100)',
    'AI Evaluation Summary',
  ];

  const rows = candidates.map((c) => {
    // Gather all reason texts into a single coherent summary string
    const reasons = Object.entries(c.criteria_details || {})
      .map(([criterion, detail]) => `[${criterion.toUpperCase()}]: ${detail.reason}`)
      .join(' | ');

    return [
      escapeCsvField(c.rank),
      escapeCsvField(c.candidate_name),
      escapeCsvField(c.candidate_email),
      escapeCsvField(c.final_score.toFixed(1)),
      escapeCsvField(c.criteria_scores?.experience ?? 'N/A'),
      escapeCsvField(c.criteria_scores?.skills ?? 'N/A'),
      escapeCsvField(c.criteria_scores?.projects ?? 'N/A'),
      escapeCsvField(c.criteria_scores?.education ?? 'N/A'),
      escapeCsvField(reasons),
    ].join(',');
  });

  const csvContent = [headers.map(escapeCsvField).join(','), ...rows].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);

  const cleanTitle = jobTitle.replace(/[^a-zA-Z0-9_-]/g, '_').toLowerCase();
  const dateStr = new Date().toISOString().split('T')[0];
  const filename = `shortlist_${cleanTitle}_${dateStr}.csv`;

  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
