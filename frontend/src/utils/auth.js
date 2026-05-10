export function getDashboardPath(role) {
  if (role === 'hr') {
    return '/hr-dashboard';
  }

  if (role === 'admin') {
    return '/admin';
  }

  return '/applicant';
}

export function hasActiveSession() {
  return Boolean(
    localStorage.getItem('token') &&
    localStorage.getItem('role') &&
    localStorage.getItem('user_id')
  );
}
