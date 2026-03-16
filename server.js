require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname)));

const GROQ_API_KEY = process.env.GROQ_API_KEY;
const N8N_BASE = 'http://localhost:5678/webhook';
const N8N_WEBHOOK_URL = `${N8N_BASE}/Librin`;
const N8N_VERIFICAR_URL = `${N8N_BASE}/Librin-verificar`;
const N8N_RENOVAR_URL = `${N8N_BASE}/Librin-renovar`;

// ─── SYSTEM PROMPT OFICIAL (basado en bidig.areandina.edu.co) ─────────────────
const SYSTEM_PROMPT_BASE = `Eres Librín, la mascota y asistente virtual oficial de la Biblioteca Digital BIDIG de la Fundación Universitaria del Área Andina (Areandina).

SITIO WEB OFICIAL: https://bidig.areandina.edu.co/

CÓMO ACCEDER A BIDIG:
- NO hay registro propio. El acceso es con las CREDENCIALES INSTITUCIONALES de Areandina.
- Usuario: correo institucional @areandina.edu.co
- Contraseña: la misma del campus virtual o correo institucional
- Si no recuerda la contraseña: contactar a sistemas@areandina.edu.co o acercarse a la biblioteca
- Acceso remoto disponible desde cualquier lugar con credenciales institucionales

RECURSOS DISPONIBLES EN BIDIG:
- Catálogo bibliográfico: https://biblioteca.areandina.edu.co/
- Recursos digitales (bases de datos): https://bidig.areandina.edu.co/main-home/recursos/elementor-4206/
- Repositorio institucional Digitk: https://digitk.areandina.edu.co/
- Portal de Revistas: https://revia.areandina.edu.co/
- BiblioClick (recursos por facultad): https://bidig.areandina.edu.co/main-home/inicio-todas-las-facultades-micro-facultades/
- Metaverso Biblioteca: https://www.spatial.io/s/Metaverso-Biblioteca-Areandina-66ff0dd2e3e41a7752945148
- Experiencias de Aprendizaje: https://areandina-ea.odilotk.es/
- Descriptores y Tesauros, Gestores Bibliográficos, Herramientas Web (audiovisuales, imágenes, presentaciones)

SERVICIOS:
- Servicios básicos: préstamo, consulta, referencia
- Salas y espacios: reserva de cubículos individuales, dobles, grupales y sala interactiva
- Agenda de espacios: https://bidig.areandina.edu.co/main-home/servicios/agenda-espacios/
- Los libros te visitan (préstamo a domicilio)
- Bibliotecas Inclusivas
- Acuerdos interbibliotecarios

BIBLIOTECA FÍSICA - SEDE PEREIRA:
Nombre: Biblioteca Otto Morales Benítez
Dirección: Cra. 10 # 24-11, Pereira
Horario: Lunes a Viernes 8:00am - 8:00pm | Sábados 8:00am - 12:00pm | Domingos y festivos: CERRADO

OTRAS SEDES:
- Bogotá: Cra. 14A No.70A-34
- Valledupar: Tr. 22 Bis # 4-105

ESPACIOS SEDE PEREIRA:
- Cubículo Individual: 1 persona
- Cubículo Doble: 1 a 3 personas
- Cubículo Grupal: 3 a 6 personas
- Sala Interactiva: 6 a 13 personas
Duración: 45 minutos por reserva | Solo UNA reserva activa por cédula

BASES DE DATOS (más de 90):
EBSCOhost, ProQuest, Scopus, Web of Science, Science Direct, Springer, Elsevier, Taylor & Francis, Wiley, IEEE, JSTOR y muchas más.

ALFABETIZACIÓN INFORMACIONAL:
- Cursos de formación en niveles
- Curso virtual: https://campusvirtual.areandina.edu.co/
- Encuesta de satisfacción disponible

CONTACTO:
- Email: biblioteca@areandina.edu.co
- WhatsApp: disponible en el sitio web
- Sala de atención en línea disponible

NORMAS DE LA BIBLIOTECA:
Silencio, no alimentos ni bebidas, celular en vibración, respetar horario, dejar espacio limpio.

IMPORTANTE - LO QUE NO DEBES DECIR:
- NO existe opción de "Registrarse" en BIDIG. El acceso es SOLO con credenciales institucionales.
- NO inventes URLs o secciones que no existan.
- Si no sabes algo con certeza, indica que el usuario contacte a biblioteca@areandina.edu.co

PERSONALIDAD: Amigable, entusiasta, paciente. Tono cálido en español. Emojis moderados 📚. Respuestas concisas máximo 3 párrafos.`;

// Capacidades por tipo de espacio
const CAPACIDADES = {
  individual: { total: 5, min: 1, max: 1 },
  doble: { total: 3, min: 1, max: 3 },
  grupal: { total: 6, min: 3, max: 6 },
  sala_interactiva: { total: 1, min: 6, max: 13 }
};

// Servir el chatbot
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'chatbot2.html'));
});

// ─── CHAT CON GROQ ───────────────────────────────────────────────────────────
app.post('/api/chat', async (req, res) => {
  try {
    // ✅ CAMBIO: ignoramos el 'system' que viene del HTML, usamos SYSTEM_PROMPT_BASE del servidor
    const { messages } = req.body;

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GROQ_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT_BASE }, // ✅ siempre usa el prompt del servidor
          ...messages
        ],
        max_tokens: 1024,
        temperature: 0.7
      })
    });

    const data = await response.json();
    if (!response.ok) {
      console.error('Groq error:', data);
      return res.status(500).json({ error: data.error?.message || 'Error con Groq' });
    }

    res.json({ content: [{ text: data.choices[0].message.content }] });

  } catch (error) {
    console.error('Error en /api/chat:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// ─── VERIFICAR DISPONIBILIDAD ─────────────────────────────────────────────────
app.post('/api/verificar', async (req, res) => {
  try {
    const { tipo, fecha, horaInicio, horaFin, personas } = req.body;

    const n8nResponse = await fetch(N8N_VERIFICAR_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tipo, fecha, horaInicio, horaFin, personas })
    });

    if (!n8nResponse.ok) throw new Error(`n8n respondió con status ${n8nResponse.status}`);

    const data = await n8nResponse.json();
    res.json(data);

  } catch (error) {
    console.error('❌ Error en verificación:', error.message);
    res.json({ disponible: true, espaciosLibres: 1, alternativa: null });
  }
});

// ─── GUARDAR RESERVA ──────────────────────────────────────────────────────────
app.post('/api/reserva', async (req, res) => {
  try {
    const datos = req.body;
    const ahora = new Date();

    const payload = {
      tipo: 'RESERVA',
      id: `RES-${Date.now()}`,
      nombre: datos.nombre || '',
      documento: datos.documento || '',
      documentos_asistentes: datos.documentos_asistentes || '',
      email: datos.email || '',
      personas: datos.personas || 1,
      sede: datos.sede || 'Pereira',
      espacio: datos.espacio || '',
      fecha: datos.fecha || '',
      horaInicio: datos.horaInicio || '',
      horaFin: datos.horaFin || '',
      estado: 'Pendiente',
      timestamp: ahora.toISOString()
    };

    const n8nResponse = await fetch(N8N_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!n8nResponse.ok) throw new Error(`n8n respondió con status ${n8nResponse.status}`);

    console.log('✅ Reserva enviada a n8n:', payload.id);
    res.json({ success: true, id: payload.id });

  } catch (error) {
    console.error('❌ Error enviando reserva a n8n:', error.message);
    res.status(500).json({ success: false, error: 'No se pudo registrar la reserva' });
  }
});

// ─── RENOVAR RESERVA ──────────────────────────────────────────────────────────
app.post('/api/renovar', async (req, res) => {
  try {
    const { documento, email } = req.body;

    const n8nResponse = await fetch(N8N_RENOVAR_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tipo: 'RENOVACION',
        documento,
        email,
        timestamp: new Date().toISOString()
      })
    });

    if (!n8nResponse.ok) throw new Error(`n8n respondió con status ${n8nResponse.status}`);

    const texto = await n8nResponse.text();
    console.log('Respuesta renovar:', texto);
    if (!texto || texto.trim() === '') {
      return res.json({ renovado: false, error: 'Sin respuesta' });
    }
    const data = JSON.parse(texto);
    res.json(data);

  } catch (error) {
    console.error('❌ Error en renovación:', error.message);
    res.status(500).json({ renovado: false, error: 'Error al procesar renovación' });
  }
});

// ─── PRÉSTAMOS ────────────────────────────────────────────────────────────────
app.post('/api/prestamo', async (req, res) => {
  try {
    const datos = req.body;
    const ahora = new Date();

    const payload = {
      id: `PRES-${Date.now()}`,
      fecha: ahora.toLocaleDateString('es-CO'),
      hora: ahora.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' }),
      nombre: datos.nombre || '',
      email: datos.email || '',
      titulo_libro: datos.titulo_libro || '',
      autor: datos.autor || '',
      sede: datos.sede || '',
      fecha_devolucion: datos.fecha_devolucion || '',
      estado: 'Pendiente'
    };

    const n8nResponse = await fetch(N8N_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!n8nResponse.ok) throw new Error(`n8n respondió con status ${n8nResponse.status}`);

    console.log('✅ Préstamo enviado a n8n:', payload.id);
    res.json({ success: true, id: payload.id });

  } catch (error) {
    console.error('❌ Error enviando préstamo:', error.message);
    res.status(500).json({ success: false, error: 'No se pudo registrar el préstamo' });
  }
});

// ─── SOPORTE ──────────────────────────────────────────────────────────────────
app.post('/api/soporte', async (req, res) => {
  try {
    const datos = req.body;
    const ahora = new Date();

    const payload = {
      id: `SOP-${Date.now()}`,
      fecha: ahora.toLocaleDateString('es-CO'),
      hora: ahora.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' }),
      nombre: datos.nombre || '',
      email: datos.email || '',
      tipo_problema: datos.tipo_problema || '',
      descripcion: datos.descripcion || '',
      estado: 'Pendiente'
    };

    const n8nResponse = await fetch(N8N_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!n8nResponse.ok) throw new Error(`n8n respondió con status ${n8nResponse.status}`);

    console.log('✅ Soporte enviado a n8n:', payload.id);
    res.json({ success: true, id: payload.id });

  } catch (error) {
    console.error('❌ Error enviando soporte:', error.message);
    res.status(500).json({ success: false, error: 'No se pudo registrar la solicitud' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Servidor Librín corriendo en http://localhost:${PORT}`);
  console.log(`📡 Webhook n8n → Reservas:      ${N8N_WEBHOOK_URL}`);
  console.log(`📡 Webhook n8n → Verificación:  ${N8N_VERIFICAR_URL}`);
  console.log(`📡 Webhook n8n → Renovación:    ${N8N_RENOVAR_URL}`);
});
