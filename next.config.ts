import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'export',
  // Opcional: Desactivar la optimización de imágenes si vas a usar next/image con export estático (requiere configuración extra), 
  // pero para esta app no usamos next/image de forma que rompa.
};

export default nextConfig;
