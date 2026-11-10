import { RiskContext } from './RiskContext';
import { useRisks } from '../hooks/useRisks';

export function RiskProvider({ children }) {
  const riskState = useRisks();

  return (
    <RiskContext.Provider value={riskState}>
      {children}
    </RiskContext.Provider>
  );
}
