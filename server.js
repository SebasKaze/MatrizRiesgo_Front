/**
 * Servidor Backend de Ejemplo (Sin dependencias externas)
 *
 * Ejecuta este servidor con:
 *   node server.js
 *
 * Estará escuchando en: http://localhost:3000
 */
import http from 'node:http';

const PORT = 3000;

// Base de datos en memoria para pruebas
let risksDatabase = [
  {
    id: 'RSK-001',
    estandar: 'N/A',
    subestandar: 'N/A',
    title: 'Falla en el suministro eléctrico principal',
    description: 'Interrupción intempestiva del fluido eléctrico comercial durante el turno de producción principal.',
    causa: 'Sobrecarga en la subestación externa de media tensión y desgaste de transformadores.',
    consecuencia: 'Paralización inmediata de líneas de ensamble, pérdida de lotes en proceso y daño potencial a motores.',
    factor: 'Externo',
    category: 'Operacional',
    probability: 2,
    impact: 4,
    status: 'Mitigado',
    responsible: 'Mantenimiento General',
    plan: 'Instalación de generador de respaldo automático diésel con transferencia en < 10 segundos.',
  },
  {
    id: 'RSK-002',
    estandar: 'N/A',
    subestandar: 'N/A',
    title: 'Ataque de ransomware o brecha de seguridad',
    description: 'Infección masiva de servidores centrales mediante malware cifrador y exfiltración de credenciales.',
    causa: 'Campaña de phishing dirigida y vulnerabilidad crítica sin parchear en el portal VPN perimetral.',
    consecuencia: 'Secuestro y cifrado de bases de datos operativas, fuga de información sensible y multas regulatorias.',
    factor: 'Externo',
    category: 'Tecnología',
    probability: 4,
    impact: 5,
    status: 'En Proceso',
    responsible: 'Seguridad TI',
    plan: 'Implementación de EDR con IA, autenticación multifactor obligatoria y backups inmutables en la nube.',
  },
  {
    id: 'RSK-003',
    estandar: 'N/A',
    subestandar: 'N/A',
    title: 'Fluctuación cambiaria desfavorable en insumos',
    description: 'Depreciación abrupta de la moneda local frente al dólar en la compra de materia prima importada.',
    causa: 'Volatilidad geopolítica macroeconómica y cambios inesperados en la política monetaria global.',
    consecuencia: 'Incremento del 25% en costos directos de adquisición y reducción del margen de rentabilidad operativa.',
    factor: 'Externo',
    category: 'Financiero',
    probability: 3,
    impact: 3,
    status: 'Monitoreo',
    responsible: 'Tesorería',
    plan: 'Contratación de coberturas cambiarias forward para el 70% del presupuesto de importaciones.',
  },
  {
    id: 'RSK-004',
    estandar: 'N/A',
    subestandar: 'N/A',
    title: 'Desabastecimiento y retrasos en proveedores críticos',
    description: 'Demoras reiteradas superiores a 20 días en la entrega de componentes electrónicos estratégicos.',
    causa: 'Concentración excesiva en un solo proveedor extranjero y cuellos de botella en la logística portuaria.',
    consecuencia: 'Incumplimiento de órdenes de despacho a clientes clave y penalizaciones contractuales por mora.',
    factor: 'Externo',
    category: 'Logística',
    probability: 4,
    impact: 3,
    status: 'Abierto',
    responsible: 'Compras & Logística',
    plan: 'Desarrollo y homologación de proveedores alternativos locales y aumento de stock de seguridad a 45 días.',
  },
  {
    id: 'RSK-005',
    estandar: 'N/A',
    subestandar: 'N/A',
    title: 'Fallas en el control de calidad interno',
    description: 'Liberación al mercado de lotes con tolerancias dimensionales fuera de especificación técnica.',
    causa: 'Falta de calibración periódica del instrumental de metrología y rotación de personal técnico sin inducción.',
    consecuencia: 'Rechazo de cargamentos por parte del cliente, costos elevados de reproceso y afectación a la reputación.',
    factor: 'Interno',
    category: 'Operacional',
    probability: 2,
    impact: 3,
    status: 'En Proceso',
    responsible: 'Aseguramiento de Calidad',
    plan: 'Calibración trazable ISO/IEC 17025 y checklist digital mandatorio previo a la liberación de embarque.',
  },
];

const server = http.createServer((req, res) => {
  // Configuración de encabezados CORS para permitir conexiones desde Vite (http://localhost:5173)
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  const url = new URL(req.url, `http://${req.headers.host}`);
  const pathname = url.pathname;

  // 1. Health check
  if (pathname === '/api/health' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok', server: 'Node.js Localhost:3000', timestamp: new Date() }));
    return;
  }

  // 2. Auth Login
  if (pathname === '/api/auth/login' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        const { email, password } = JSON.parse(body || '{}');
        if (!email || !password) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ message: 'Se requiere email y password' }));
          return;
        }

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          token: `jwt-bearer-${Date.now()}`,
          user: {
            id: 'USR-SERVER-1',
            name: email.split('@')[0],
            email,
            role: 'Administrador de Riesgos (BD)',
            roleCode: 'ADMIN',
            department: 'Base de Datos localhost:3000',
            avatar: email.slice(0, 2).toUpperCase(),
            color: 'bg-emerald-600',
          },
        }));
      } catch {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ message: 'JSON inválido' }));
      }
    });
    return;
  }

  // 3. Obtener Riesgos (GET /api/risks)
  if (pathname === '/api/risks' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(risksDatabase));
    return;
  }

  // 4. Crear Riesgo (POST /api/risks)
  if (pathname === '/api/risks' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        const newRisk = JSON.parse(body || '{}');
        const created = {
          ...newRisk,
          id: `RSK-DB-${Date.now().toString().slice(-4)}`,
        };
        risksDatabase.unshift(created);
        res.writeHead(201, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(created));
      } catch {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ message: 'JSON inválido' }));
      }
    });
    return;
  }

  // 404 No encontrado
  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ message: 'Endpoint no encontrado' }));
});

server.listen(PORT, () => {
  console.log(`[Servidor BD / API] Escuchando en http://localhost:${PORT}`);
  console.log(`- Health Check: http://localhost:${PORT}/api/health`);
  console.log(`- Auth Endpoint: http://localhost:${PORT}/api/auth/login`);
  console.log(`- Risks Endpoint: http://localhost:${PORT}/api/risks`);
});
