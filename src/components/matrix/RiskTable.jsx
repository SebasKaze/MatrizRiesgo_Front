import { calculateRiskScore, getRiskSeverity } from '../../utils/riskCalculations';
import { Badge } from '../ui/Badge';
import { Trash2 } from 'lucide-react';

export function RiskTable({ risks, onRemoveRisk }) {
  if (risks.length === 0) {
    return (
      <div className="text-center py-12 bg-white rounded-xl border border-slate-200">
        <p className="text-slate-500 text-sm">No se encontraron riesgos que coincidan con los filtros.</p>
      </div>
    );
  }

  const getSeverityBadgeVariant = (severityLabel) => {
    switch (severityLabel) {
      case 'Crítico':
        return 'critical';
      case 'Alto':
        return 'high';
      case 'Medio':
        return 'medium';
      default:
        return 'low';
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
          <thead className="bg-slate-50 text-slate-600 font-semibold text-xs uppercase tracking-wider">
            <tr>
              <th className="py-3.5 px-4">Código</th>
              <th className="py-3.5 px-4">Descripción del Riesgo</th>
              <th className="py-3.5 px-4">Categoría</th>
              <th className="py-3.5 px-4 text-center">Prob.</th>
              <th className="py-3.5 px-4 text-center">Imp.</th>
              <th className="py-3.5 px-4 text-center">Severidad</th>
              <th className="py-3.5 px-4">Responsable</th>
              <th className="py-3.5 px-4">Estado</th>
              <th className="py-3.5 px-4 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {risks.map((risk) => {
              const score = calculateRiskScore(risk.probability, risk.impact);
              const severity = getRiskSeverity(score);

              return (
                <tr key={risk.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3.5 px-4 font-mono font-medium text-xs text-slate-500">
                    {risk.id}
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="font-medium text-slate-900">{risk.title}</div>
                    {risk.plan && (
                      <div className="text-xs text-slate-500 truncate max-w-xs">
                        Plan: {risk.plan}
                      </div>
                    )}
                  </td>
                  <td className="py-3.5 px-4 text-slate-600">
                    <Badge variant="default">{risk.category}</Badge>
                  </td>
                  <td className="py-3.5 px-4 text-center font-medium text-slate-700">
                    {risk.probability}
                  </td>
                  <td className="py-3.5 px-4 text-center font-medium text-slate-700">
                    {risk.impact}
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <Badge variant={getSeverityBadgeVariant(severity.label)}>
                      {severity.label} ({score})
                    </Badge>
                  </td>
                  <td className="py-3.5 px-4 text-slate-600">
                    {risk.responsible}
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-800">
                      {risk.status}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <button
                      type="button"
                      onClick={() => onRemoveRisk(risk.id)}
                      className="text-slate-400 hover:text-rose-600 transition-colors p-1 rounded hover:bg-rose-50 cursor-pointer"
                      title="Eliminar riesgo"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
