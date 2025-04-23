@echo off
echo Iniciando Calendario de Visitas a Silao...
echo.

REM Verificar si Python esta instalado
python --version > nul 2>&1
if errorlevel 1 (
    echo Python no esta instalado. Por favor instala Python desde:
    echo https://www.python.org/downloads/
    echo.
    echo Asegurate de marcar la opcion "Add Python to PATH" durante la instalacion.
    pause
    exit
)

REM Crear un archivo temporal para el script Python
echo import webbrowser > start_server.py
echo from http.server import HTTPServer, SimpleHTTPRequestHandler >> start_server.py
echo print("Servidor iniciado en http://localhost:8000") >> start_server.py
echo print("Puedes acceder al calendario desde cualquier navegador usando esa direccion") >> start_server.py
echo print("Para cerrar el servidor, cierra esta ventana") >> start_server.py
echo webbrowser.open("http://localhost:8000") >> start_server.py
echo HTTPServer(("localhost", 8000), SimpleHTTPRequestHandler).serve_forever() >> start_server.py

REM Iniciar el servidor
echo Abriendo el calendario en tu navegador...
python start_server.py

REM Limpiar
del start_server.py
