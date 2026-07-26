import { BrowserRouter } from "react-router-dom"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { Toaster as SonnerToaster } from "sonner"
import { Toaster } from "@/components/ui/toaster"
import { ThemeProvider } from "@/components/theme-provider"
import { ThemeFavicon } from "@/components/theme-favicon"
import AppRoutes from "@/routes/routes"

const queryClient = new QueryClient()

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <ThemeFavicon />
        <BrowserRouter>
          <AppRoutes />
          <Toaster />
          <SonnerToaster richColors position="top-right" />
        </BrowserRouter>
      </ThemeProvider>
    </QueryClientProvider>
  )
}
