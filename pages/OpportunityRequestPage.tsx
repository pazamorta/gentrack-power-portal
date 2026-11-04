import React from 'react';
import { LightningOutOpportunityRequest } from '../components/LightningOutOpportunityRequest';

export const OpportunityRequestPage: React.FC = () => {
  return (
    <div className="pt-32 pb-16 min-h-screen container mx-auto px-4">
      <h1 className="text-3xl font-semibold text-white text-center mb-8">Request an opportunity</h1>
      <LightningOutOpportunityRequest />
    </div>
  );
};
