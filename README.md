# Tornado MCP Client

Universal AI overlay client for video games using Model Context Protocol (MCP).

## ¿Qué es Tornado?
Tornado es un cliente de overlay (al estilo Discord Overlay) construido con Electron + React que agrega una capa de IA a cualquier videojuego. Se conecta a servidores MCP específicos de cada juego (Game MCPs) para entender contexto del juego y darte ayuda en tiempo real.

## ¿Qué es MCP y qué MCPs soporta Tornado?
[MCP (Model Context Protocol)](https://modelcontextprotocol.io/) es un estándar para que clientes de IA descubran recursos y ejecuten herramientas de manera segura.

Tornado permite cargar uno o varios Game MCPs a la vez. Un Game MCP compatible DEBE exponer al menos estas 3 tools:
- `analyze_savefile`: parsea el savefile y retorna JSON estructurado (estado del juego/progreso)
- `take_screenshot`: captura una imagen del juego (o recibe una ruta) y retorna la referencia/bytes
- `download_guide`: descarga/expone la guía oficial o comunitaria del juego (texto), con versionado

Los MCPs pueden agregar tools extra (mods, builds, rutas, etc.). Ejemplo de referencia: [hollow-knight-mcp (PR)](https://github.com/gzzydevs/hollow-knight-mcp/pull/1).

## Arquitectura (alto nivel)
```mermaid
graph TD
  A[Overlay UI (React)] -- IPC --> B[Proceso Main (Electron)]
  B -- MCP Client SDK --> C[MCP Connection Manager]
  C -- stdio/transport --> D[Servidores MCP (Juego 1..N)]
  C -- Context Builder --> E[Context System]
  E -- SQLite --> F[DB (metadatos/cache)]
  E -- Filesystem --> G[Guías / Screenshots / Cache]
  A -- Hotkeys/Estado --> E
```

- Overlay UI (React): chat, selector de modelo, botones de acciones (tools), indicadores.
- Proceso Main (Electron): ventana transparente, always-on-top, click-through, multi-monitor.
- MCP Connection Manager: gestiona múltiples conexiones MCP, reconexión y namespaces.
- Context System: empaca savefile + screenshot + guía (chunking) según límites de tokens.
- DB: metadatos de MCPs, cache de parseos, paths y configuración.

## Tecnologías
- Electron 28+ (ventana overlay, IPC, empaquetado con electron-builder)
- React 18 + TypeScript
- Bundler: Vite o Webpack (dev hot reload)
- SQLite (persistencia): metadatos y cache por MCP
- @modelcontextprotocol/sdk (cliente MCP)

## Modos de modelos (Sampling)
- Modo API Key: conexión directa a modelos (Claude, GPT-4, etc.) con tu API key
- Modo GitHub Free: integración con VS Code/GitHub para planes gratuitos (cuando aplique)

## Detección de juegos
- Detección de procesos/ventanas para asociar MCPs instalados
- Auto-carga del MCP correcto al detectar el juego

## Estructura de carpetas (propuesta)
```
src/
  main/        # Electron main (ventana, IPC, hotkeys)
  renderer/    # React UI (chat, selector, acciones)
  shared/      # Tipos y utilidades comunes
  db/          # Acceso SQLite y DAOs
mcps/          # MCPs instalados (npm/local)
cache/         # screenshots, guías chunked, parseos
```

## Desarrollo
Requisitos: Node 18+, pnpm (recomendado)

```bash
pnpm install
pnpm dev   # arranca Electron con hot reload
pnpm build # genera binarios con electron-builder
```

Variables opcionales: `OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, etc.

## Roadmap / Issues
- Foundation: setup + README (#2)
- Overlay: ventana y hotkeys (#9, #10)
- Core MCP: cliente y sampling (#3)
- Game Integration: DB, instalación MCPs, auto-detección (#4, #15–#17)
- UI/UX: chat, modelos, acciones, estados (#5, #11–#14)
- Context System: tools obligatorias y empaquetado (#7)

## Licencia
Licencia Dual:
- AGPL-3.0 (ver `LICENSE.md`)
- Licencia Comercial (ver `LICENSE-COMMERCIAL.md`)

Excepción de uso personal no comercial incluida en LICENSE.md. Para licencias comerciales: comercial@gzzydevs.com