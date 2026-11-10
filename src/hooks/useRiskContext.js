import { useContext } from 'react';
import { RiskContext } from '../context/RiskContext';

export function useRiskContext() {
  const context = useContext(RiskContext);
  if (!context) {
    throw new Error('useRiskContext must be used within a RiskProvider');
  }
  return context;
}
