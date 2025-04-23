@echo off
echo Empaquetando Calendario de Visitas...

REM Crear directorio temporal para empaquetar
mkdir temp_package
echo Creando estructura de archivos...

REM Copiar archivos necesarios
copy index.html temp_package\
copy script.js temp_package\
copy iniciar-calendario.cmd temp_package\
copy README.md temp_package\

REM Crear archivo ZIP
powershell Compress-Archive -Path temp_package\* -DestinationPath calendario-visitas.zip -Force

REM Limpiar
rmdir /s /q temp_package

echo.
echo Empaquetado completado! El archivo calendario-visitas.zip ha sido creado.
echo.
pause
