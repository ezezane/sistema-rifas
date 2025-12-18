# Objetivo: Rifa Navideña Sencilla

Crear una aplicación web súper liviana para administrar y visualizar una rifa, con temática navideña.

## Características Clave

1.  **Grilla Visual:**
    *   Mostrar una grilla con números (ej: del 1 al 100).
    *   Los números comprados se marcarán con un emoji de árbol de navidad (🎄) y mostrarán el nombre del comprador al pasar el mouse.

2.  **Gestión de Números:**
    *   **Selección Múltiple:** Permitir seleccionar varios números disponibles a la vez.
    *   **Asignar Comprador:** Al guardar, solicitar el nombre de la persona que compra los números seleccionados.
    *   **Liberar Número:** Si se hace clic en un número ya comprado (🎄), dar la opción de borrarlo para que vuelva a estar disponible.

3.  **Persistencia de Datos:**
    *   Toda la información de los números y compradores se guardará en un archivo `data.json`.
    *   Los datos deben persistir si se recarga la página.

4.  **Exportar Imagen:**
    *   Incluir un botón para generar y descargar una imagen (JPG de 800x800px) del estado actual de la grilla de la rifa, para poder compartirla fácilmente.

## Stack Tecnológico

*   **Frontend:** HTML, CSS, JavaScript (puro).
*   **Backend:** PHP (para guardar los datos).
*   **Almacenamiento:** Archivo `data.json`.

## Exclusiones

*   No se requiere integración con pasarelas de pago. La gestión de cobros es manual.
*   No se requiere una función automática de sorteo. El sorteo se realizará por fuera del sistema.