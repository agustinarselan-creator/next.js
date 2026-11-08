# Lumbre — Generador de imágenes

Una pequeña aplicación en español para crear imágenes a partir de texto y descargarlas como PNG. La interfaz y el servidor corren en tu PC; la generación se procesa en la API de OpenAI, así que no necesita una GPU ni mucha RAM.

## Requisitos

- Windows 10/11
- Node.js 20 o posterior
- Una clave de API de OpenAI con facturación configurada. La suscripción a ChatGPT no incluye uso de API. Consulta [precios de imágenes](https://openai.com/api/pricing/) antes de generar.

## Instalar en Windows

1. Instala Node.js desde [nodejs.org](https://nodejs.org/) si todavía no lo tienes.
2. Descarga esta carpeta del repositorio o clona el repo en modo parcial desde PowerShell:

   ```powershell
   git clone --depth 1 --filter=blob:none --sparse --branch agustin/image-generator https://github.com/agustinarselan-creator/next.js.git lumbre
   cd lumbre
   git sparse-checkout set tools/generador-imagenes
   cd tools/generador-imagenes
   ```

3. Crea una clave de API en [platform.openai.com/api-keys](https://platform.openai.com/api-keys), habilita facturación y configúrala solo en la ventana de PowerShell donde vas a usar la app:

   ```powershell
   $env:OPENAI_API_KEY = "PEGA_TU_CLAVE_ACA"
   ```

4. Inicia la aplicación:

   ```powershell
   npm start
   ```

5. Abre [http://localhost:3030](http://localhost:3030).

Para detener el servidor, vuelve a PowerShell y presiona **Ctrl + C**. Al cerrar esa ventana, se elimina la clave del entorno de esa sesión.

## Privacidad y costos

- La clave queda como variable de entorno en tu PC; no se incluye en los archivos del proyecto ni se envía a la interfaz del navegador.
- El texto de cada pedido se envía a la API de OpenAI para generar la imagen.
- Cada generación puede tener costo según el modelo, calidad y tamaño elegidos. Revisa los precios vigentes antes de usarla.
- El servidor escucha únicamente en `localhost`, por lo que la app está pensada para uso en tu propia computadora.

## Opciones

- Formato cuadrado, horizontal o vertical.
- Calidad rápida, equilibrada o alta.
- Fondo transparente opcional.
- Descarga del resultado en PNG.

El modelo usado por defecto es `gpt-image-2.5-flare`. Puedes cambiarlo antes de iniciar el servidor definiendo `OPENAI_IMAGE_MODEL` en PowerShell.
