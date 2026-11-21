import React from 'react';
import StatusDot from './common/StatusDot';
import BloodGroupStamp from './common/BloodGroupStamp';

export const UrgencyBadge = ({ urgency, className = '' }) => {
  return <StatusDot status={urgency} className={className} />;
};

export const StatusBadge = ({ status, className = '' }) => {
  return <StatusDot status={status} className={className} />;
};

export const BloodGroupPill = ({ bloodGroup, className = '' }) => {
  return <BloodGroupStamp bloodGroup={bloodGroup} className={className} />;
};

export default { UrgencyBadge, StatusBadge, BloodGroupPill };
