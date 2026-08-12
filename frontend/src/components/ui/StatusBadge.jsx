import Badge from './Badge';

const STATUS_MAP = {
  paid: { tone: 'emerald', label: 'Paid' },
  pending: { tone: 'amber', label: 'Pending' },
  overdue: { tone: 'rose', label: 'Overdue' },
  approved: { tone: 'emerald', label: 'Approved' },
  active: { tone: 'emerald', label: 'Active' },
  inactive: { tone: 'slate', label: 'Inactive' },
  rejected: { tone: 'rose', label: 'Rejected' },
  'pending approval': { tone: 'amber', label: 'Pending Approval' },
  verified: { tone: 'emerald', label: 'Verified' },
  verified_active: { tone: 'emerald', label: 'Verified & Active' },
  not_verified: { tone: 'amber', label: 'Pending Approval' },
  success: { tone: 'emerald', label: 'Success' },
  failed: { tone: 'rose', label: 'Failed' },
  cancelled: { tone: 'slate', label: 'Cancelled' },
};

const StatusBadge = ({ status, customLabel, className = '' }) => {
  const config = STATUS_MAP[String(status).toLowerCase()] || {
    tone: 'slate',
    label: customLabel || status,
  };
  return (
    <Badge tone={config.tone} dot className={className}>
      {customLabel || config.label}
    </Badge>
  );
};

export default StatusBadge;
