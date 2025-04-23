import os
import zipfile
import shutil

print("Empaquetando Calendario de Visitas...")

# Lista de archivos a incluir
files_to_package = [
    'index.html',
    'script.js',
    'iniciar-calendario.cmd',
    'README.md'
]

# Crear el archivo ZIP
with zipfile.ZipFile('calendario-visitas.zip', 'w', zipfile.ZIP_DEFLATED) as zipf:
    for file in files_to_package:
        if os.path.exists(file):
            print(f"Agregando {file}...")
            zipf.write(file)
        else:
            print(f"Advertencia: {file} no encontrado")

print("\nEmpaquetado completado! El archivo calendario-visitas.zip ha sido creado.")
print("Archivos incluidos:")
for file in files_to_package:
    if os.path.exists(file):
        print(f"- {file}")
