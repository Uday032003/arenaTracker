/**
 * Format relative date difference and human-readable label
 * based on user's timezone.
 */
export function calculateLastOccurrence(occurredAtDate, userTimezone = 'UTC', now = new Date()) {
  if (!occurredAtDate) {
    return {
      status: 'never',
      label: 'Never logged',
      daysAgo: null,
      formattedDate: null,
    };
  }

  const occ = new Date(occurredAtDate);
  if (isNaN(occ.getTime())) {
    return {
      status: 'never',
      label: 'Never logged',
      daysAgo: null,
      formattedDate: null,
    };
  }

  // Format in user's timezone to get YYYY-MM-DD local calendar dates
  try {
    const occParts = new Intl.DateTimeFormat('en-CA', {
      timeZone: userTimezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(occ); // 'YYYY-MM-DD'

    const nowParts = new Intl.DateTimeFormat('en-CA', {
      timeZone: userTimezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(now); // 'YYYY-MM-DD'

    const occLocalMidnight = new Date(`${occParts}T00:00:00Z`).getTime();
    const nowLocalMidnight = new Date(`${nowParts}T00:00:00Z`).getTime();

    const diffDays = Math.round((nowLocalMidnight - occLocalMidnight) / (1000 * 60 * 60 * 24));

    let label = '';
    let status = 'past';

    if (diffDays === 0) {
      label = 'Today';
      status = 'today';
    } else if (diffDays === 1) {
      label = 'Yesterday';
      status = 'yesterday';
    } else if (diffDays > 1) {
      label = `${diffDays} days ago`;
      status = 'days_ago';
    } else {
      // Future or same day clock drift
      label = 'Today';
      status = 'today';
    }

    const formattedDate = new Intl.DateTimeFormat('en-US', {
      timeZone: userTimezone,
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      hour12: true,
    }).format(occ);

    return {
      status,
      label,
      daysAgo: Math.max(0, diffDays),
      occurredAt: occ.toISOString(),
      formattedDate,
    };
  } catch (err) {
    // Fallback if timezone string is invalid
    const diffMs = now.getTime() - occ.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    let label = diffDays <= 0 ? 'Today' : diffDays === 1 ? 'Yesterday' : `${diffDays} days ago`;
    return {
      status: diffDays <= 0 ? 'today' : diffDays === 1 ? 'yesterday' : 'days_ago',
      label,
      daysAgo: Math.max(0, diffDays),
      occurredAt: occ.toISOString(),
      formattedDate: occ.toLocaleString(),
    };
  }
}
