// Lazy-load TanStack Query Devtools only in development
export function QueryDevtools() {
  if (import.meta.env.PROD) return null
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { ReactQueryDevtools } = (window as any).__REACT_QUERY_DEVTOOLS__ ?? {}
  if (!ReactQueryDevtools) return null
  return <ReactQueryDevtools />
}
