import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import { AuthProvider } from "./contexts/AuthContext"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { QueryDevtools } from "./QueryDevtools"
import { Toaster } from "sonner"
import { App } from "./app/App"
import "./styles/globals.css"

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 2, // 2 minutes
      retry: 1,
    },
  },
})

const rootEl = document.getElementById("root")
if (!rootEl) throw new Error("Root element not found")

createRoot(rootEl).render(
  <StrictMode>
    <AuthProvider>
      <QueryClientProvider client={queryClient}>
        <App />
        <Toaster
          position="bottom-right"
          richColors
          theme="dark"
          toastOptions={{
            style: {
              background: "#121212",
              border: "1px solid #27272A",
              color: "#FAFAFA",
            },
          }}
        />
        <QueryDevtools />
      </QueryClientProvider>
    </AuthProvider>
  </StrictMode>
)
