# 📚 Librín — Chatbot de la Biblioteca Digital Areandina

Librín es el asistente virtual oficial de la [Biblioteca Digital Areandina (BIDIG)](https://bidig.areandina.edu.co/), impulsado por **Claude** de Anthropic. Ayuda a estudiantes, docentes y administrativos a navegar los recursos de la biblioteca digital.

---

## 🚀 Instalación y Configuración

### Prerrequisitos
- [Node.js](https://nodejs.org/) v18 o superior instalado
- Una API key válida de [Anthropic Console](https://console.anthropic.com/)

### Pasos

**1. Clona o descarga el proyecto**

Asegúrate de tener esta estructura de archivos:
```
/librin-chatbot
  chatbot2.html
  server.js
  package.json
  .env
  .gitignore
  README.md
```

**2. Instala las dependencias**

Abre una terminal en la carpeta del proyecto y ejecuta:
```bash
npm install
```

**3. Configura tu API Key**

Abre el archivo `.env` y reemplaza el placeholder con tu clave real de Anthropic:
```env
ANTHROPIC_API_KEY=sk-ant-api03-XXXXXXXXXXXXXXXXXXXXXX
```

> ⚠️ **Importante:** Nunca compartas ni subas el archivo `.env` a repositorios públicos. Ya está incluido en `.gitignore`.

**4. Inicia el servidor**

```bash
node server.js
```

Verás en la terminal:
```
✅ Servidor Librín corriendo en http://localhost:3000
📚 Abre tu chatbot en: http://localhost:3000
```

**5. Abre el chatbot en tu navegador**

Ve a: [http://localhost:3000](http://localhost:3000)

---

## 🗂️ Estructura del proyecto

| Archivo | Descripción |
|---|---|
| `chatbot2.html` | Interfaz completa del chatbot (HTML + CSS + JS) |
| `server.js` | Servidor Express — proxy seguro hacia la API de Anthropic |
| `package.json` | Configuración y dependencias del proyecto |
| `.env` | Variables de entorno (API key — **NO subir a Git**) |
| `.gitignore` | Archivos excluidos del control de versiones |
| `README.md` | Este archivo |

---

## 🔑 ¿Cómo consigo una API Key de Anthropic?

1. Ve a [https://console.anthropic.com/](https://console.anthropic.com/)
2. Crea o inicia sesión en tu cuenta
3. Navega a **API Keys** y genera una nueva clave
4. Cópiala y pégala en el archivo `.env`

---

## ⚙️ Cómo funciona

```
Usuario (navegador)
      │
      ▼
  chatbot2.html  ──POST /api/chat──▶  server.js  ──▶  API Anthropic
                                          │
                                   (API key segura
                                    en variables de
                                    entorno - .env)
```

El frontend **nunca** expone la API key. Todo el llamado a Anthropic se hace desde el servidor Node.js.

---

## 🛠️ Comandos útiles

| Comando | Acción |
|---|---|
| `npm install` | Instala todas las dependencias |
| `node server.js` | Inicia el servidor en el puerto 3000 |
| `npm start` | Alternativa para iniciar el servidor |

---

## 📞 Soporte

Si tienes problemas con el acceso a la biblioteca, contacta a:
- 📧 **biblioteca@areandina.edu.co**
- 🌐 **[https://bidig.areandina.edu.co/](https://bidig.areandina.edu.co/)**
