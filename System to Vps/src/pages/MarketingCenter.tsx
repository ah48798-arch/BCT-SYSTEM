import React from 'react';
import { useLocation } from 'react-router-dom';
import { CampaignsManagement } from './CampaignsManagement';
import { CapacityGateCenter } from './CapacityGateCenter';

export { CampaignsManagement, CapacityGateCenter };

export const MarketingCenter: React.FC = () => {
  const location = useLocation();
  if (location.pathname.includes('capacity-gate')) {
    return <CapacityGateCenter />;
  }
  return <CampaignsManagement />;
};

export default MarketingCenter;
