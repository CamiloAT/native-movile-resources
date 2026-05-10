<div align="center">
  <h1>Native Mobile Resources Demo</h1>
  <p><strong>A sleek and interactive web application to demonstrate native mobile-like capabilities on the web.</strong></p>
</div>

---

## About the Project

**Native Mobile Resources** is a frontend web application designed to showcase various advanced web APIs that bridge the gap between traditional websites and native mobile apps. It provides a beautiful, modern UI to test device hardware features directly from the browser.

Developed by: **Camilo Andres Arias Tenjo**

## Key Features

*   **Hardware Sensors:** Demonstrates access to device orientation, geolocation, battery status, and vibration APIs.
*   **Media Capabilities:** Utilizes `getUserMedia` for advanced camera access, including Face Detection (Shape Detection API) and Barcode scanning.
*   **Modern Interactive UI:** Features an interactive canvas with particles, 3D CSS transforms, and fluid animations for a premium user experience.
*   **File System Access:** Showcases the File System Access API to read and navigate local directories safely from the browser.

## Architecture & Technologies

*   **Core Languages:** HTML5, CSS3, JavaScript (ES6+)
*   **Build Tool:** Vite (for fast, modern web development)
*   **Deployment:** Vercel (Configured via `vercel.json`)
*   **Design:** Custom CSS with Glassmorphism, CSS Variables, and responsive grids.

## Requirements & Installation Guide

To run this project locally, ensure you have **Node.js** installed on your system.

Follow these steps to run the project on your local machine:

1. **Clone or Download the repository** to your workspace directory.
2. **Install Dependencies**: Open a terminal in the project root and run:
   ```bash
   npm install
   ```
3. **Run the Development Server**: Start the Vite dev server by running:
   ```bash
   npm run dev
   ```
4. **View the App**: Open your browser and navigate to the local URL provided in the terminal (usually `http://localhost:5173`).

*Note: Some hardware APIs (like Face Detection or Bluetooth) may require you to run the app over HTTPS, use a physical mobile device, or enable Experimental Web Platform Features in your browser settings.*

---
<div align="center">
  <i>Bringing native mobile power to the modern web.</i>
</div>
