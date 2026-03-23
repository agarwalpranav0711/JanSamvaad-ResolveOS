/**
 * Simple keyword-based sentiment analysis for ticket summaries.
 * Returns { emoji, label, color }
 */
const ANGRY_KEYWORDS = ['urgent', 'emergency', 'dangerous', 'critical', 'hazard', 'unsafe', 'death', 'accident', 'flooding', 'collapse'];
const POSITIVE_KEYWORDS = ['thank', 'good', 'fixed', 'repaired', 'resolved', 'cleared', 'restored'];
const NORMAL_KEYWORDS = ['please', 'request', 'kindly', 'would like'];

export function analyzeSentiment(summary) {
  const text = (summary || '').toLowerCase();

  if (ANGRY_KEYWORDS.some(kw => text.includes(kw))) {
    return { emoji: '😡', label: 'Critical', color: 'text-red-400' };
  }
  if (POSITIVE_KEYWORDS.some(kw => text.includes(kw))) {
    return { emoji: '😊', label: 'Positive', color: 'text-green-400' };
  }
  if (NORMAL_KEYWORDS.some(kw => text.includes(kw))) {
    return { emoji: '😐', label: 'Normal', color: 'text-yellow-400' };
  }

  return { emoji: '😐', label: 'Neutral', color: 'text-slate-400' };
}
