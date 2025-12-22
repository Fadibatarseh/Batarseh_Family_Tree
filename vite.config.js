import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      // Prefer the module build to avoid wrapper default-export warnings
      '@supabase/supabase-js': '@supabase/supabase-js/dist/module/index.js',
    },
  },
});
