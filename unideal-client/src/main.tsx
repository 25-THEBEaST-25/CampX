import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import { ClerkProvider } from "@clerk/clerk-react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { QueryDevtools } from "./QueryDevtools"
import { Toaster } from "sonner"
import { App } from "./app/App"
import "./styles/globals.css"

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY

if (!PUBLISHABLE_KEY) {
  console.warn("⚠️  VITE_CLERK_PUBLISHABLE_KEY is not set — auth will not work")
}

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
    <ClerkProvider publishableKey={PUBLISHABLE_KEY ?? ""}>
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
    </ClerkProvider>
  </StrictMode>
)
