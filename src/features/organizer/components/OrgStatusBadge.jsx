import { getBadgeClass, getEventStatusLabel } from '../utils/organizerHelpers';

export default function OrgStatusBadge({ status, style = {} }) {
  return (
    <span className={getBadgeClass(status)} style={style}>
      {getEventStatusLabel(status)}
    </span>
  );
}
