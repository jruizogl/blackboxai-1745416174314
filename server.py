#!/usr/bin/env python3
import http.server
import socketserver
import os
import sys
from urllib.parse import parse_qs, urlparse

PORT = 8000

class LicenseManagementHandler(http.server.SimpleHTTPRequestHandler):
    def do_GET(self):
        # Redirigir la raíz a login.html
        if self.path == '/' or self.path == '/index.html':
            self.send_response(302)
            self.send_header('Location', '/login.html')
            self.end_headers()
            return
        # Serve static files
        return http.server.SimpleHTTPRequestHandler.do_GET(self)

    def end_headers(self):
        # Add CORS headers
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        http.server.SimpleHTTPRequestHandler.end_headers(self)

def run_server():
    with socketserver.TCPServer(("", PORT), LicenseManagementHandler) as httpd:
        print(f"Servidor iniciado en http://localhost:{PORT}")
        print("Presiona Ctrl+C para detener el servidor")
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\nServidor detenido")
            httpd.server_close()

if __name__ == "__main__":
    os.chdir(os.path.dirname(os.path.abspath(__file__)))
    run_server()
