import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import {
  Server,
  Database,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  Code,
} from 'lucide-react';

export function DatabaseStatusPage() {
  const { backendStatus, checkBackend, apiBaseUrl } = useAuth();
  const [copiedIndex, setCopiedIndex] = useState(null);

  const handleCopy = (text, index) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const sampleServerCode = `// Servidor de ejemplo con Express (Node.js) para localhost:3000
// npm install express cors
import express from 'express';
import cors from 'cors';

const app = express();
app.use(cors());
app.use(express.json());

// 1. Health Check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', database: 'connected', timestamp: new Date() });
});

// 2. Login con Base de Datos
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  // TODO: Consultar tu base de datos (PostgreSQL / MySQL / MongoDB)
  if (email && password) {
    return res.json({
      token: 'jwt-token-generado-por-tu-servidor',
      user: {
        id: 'USR-DB-1',
        name: 'Usuario Base de Datos',
        email,
        role: 'Administrador de Riesgos',
        roleCode: 'ADMIN'
      }
    });
  }
  res.status(401).json({ message: 'Credenciales inválidas' });
});

// 3. Obtener Riesgos de la BD
app.get('/api/risks', (req, res) => {
  // TODO: SELECT * FROM riesgos;
  res.json([
    {
      id: 'RSK-DB-001',
      title: 'Riesgo desde Base de Datos Local',
      category: 'Tecnología',
      probability: 4,
      impact: 5,
      status: 'En Proceso',
      responsible: 'Equipo TI'
    }
  ]);
});

app.listen(3000, () => {
  console.log('Servidor corriendo en http://localhost:3000');
});`;

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shrink-0">
              <Server className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">
                Conexión con Base de Datos / Backend
              </h2>
              <p className="text-sm text-slate-500 mt-0.5">
                La aplicación está preparada para interactuar automáticamente con tu API REST en{' '}
                <code className="text-xs bg-slate-100 text-indigo-700 px-1.5 py-0.5 rounded font-mono font-semibold">
                  {apiBaseUrl}
                </code>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={checkBackend}
              className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-sm font-semibold rounded-xl transition-colors cursor-pointer"
            >
              <RefreshCw
                className={`w-4 h-4 ${
                  backendStatus === 'checking' ? 'animate-spin' : ''
                }`}
              />
              Comprobar Conexión
            </button>
          </div>
        </div>

        {/* Status Callout */}
        <div className="mt-6 p-4 rounded-xl border flex items-center justify-between gap-4 bg-slate-50 border-slate-200">
          <div className="flex items-center gap-3">
            {backendStatus === 'connected' ? (
              <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-6 h-6 text-amber-600 shrink-0" />
            )}
            <div>
              <p className="text-sm font-bold text-slate-900">
                {backendStatus === 'connected'
                  ? 'Servidor Backend Activo y Conectado'
                  : 'Servidor Backend Desconectado (Modo Simulado Activo)'}
              </p>
              <p className="text-xs text-slate-500 mt-0.5">
                {backendStatus === 'connected'
                  ? `Las peticiones de autenticación y riesgos se envían y leen desde ${apiBaseUrl}.`
                  : 'No se detectó un servidor escuchando en localhost:3000. El frontend funciona de forma autónoma con datos de prueba locales en memoria y localStorage.'}
              </p>
            </div>
          </div>
          <Badge variant={backendStatus === 'connected' ? 'low' : 'medium'}>
            {backendStatus === 'connected' ? 'Online' : 'Offline / Simulado'}
          </Badge>
        </div>
      </div>

      {/* Grid: Endpoints Table & Setup Guide */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Endpoints Table */}
        <Card>
          <div className="flex items-center gap-2 mb-4">
            <Database className="w-5 h-5 text-indigo-600" />
            <h3 className="text-base font-bold text-slate-900">
              Contrato de API REST Preparado
            </h3>
          </div>
          <p className="text-xs text-slate-500 mb-4">
            Endpoints que el frontend ya consume o tiene listos para tu backend:
          </p>

          <div className="divide-y divide-slate-100 text-xs font-mono">
            <div className="py-2.5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold">
                  GET
                </span>
                <span className="text-slate-800">/api/health</span>
              </div>
              <span className="text-slate-500 font-sans text-[11px]">
                Comprobación de estado
              </span>
            </div>

            <div className="py-2.5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-800 font-bold">
                  POST
                </span>
                <span className="text-slate-800">/api/auth/login</span>
              </div>
              <span className="text-slate-500 font-sans text-[11px]">
                Autenticación y token JWT
              </span>
            </div>

            <div className="py-2.5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold">
                  GET
                </span>
                <span className="text-slate-800">/api/risks</span>
              </div>
              <span className="text-slate-500 font-sans text-[11px]">
                Listar todos los riesgos
              </span>
            </div>

            <div className="py-2.5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-800 font-bold">
                  POST
                </span>
                <span className="text-slate-800">/api/risks</span>
              </div>
              <span className="text-slate-500 font-sans text-[11px]">
                Registrar un nuevo riesgo
              </span>
            </div>

            <div className="py-2.5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded bg-rose-100 text-rose-800 font-bold">
                  DELETE
                </span>
                <span className="text-slate-800">/api/risks/:id</span>
              </div>
              <span className="text-slate-500 font-sans text-[11px]">
                Eliminar un riesgo por ID
              </span>
            </div>
          </div>
        </Card>

        {/* Server Starter Snippet */}
        <Card>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Code className="w-5 h-5 text-indigo-600" />
              <h3 className="text-base font-bold text-slate-900">
                Código Base para tu Backend (Express)
              </h3>
            </div>
            <button
              type="button"
              onClick={() => handleCopy(sampleServerCode, 'server')}
              className="text-xs text-indigo-600 hover:text-indigo-800 flex items-center gap-1 font-semibold cursor-pointer"
            >
              {copiedIndex === 'server' ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" /> Copiado
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" /> Copiar código
                </>
              )}
            </button>
          </div>
          <div className="bg-slate-900 rounded-xl p-3 text-slate-300 font-mono text-[11px] overflow-x-auto max-h-[300px]">
            <pre>{sampleServerCode}</pre>
          </div>
        </Card>
      </div>
    </div>
  );
}
