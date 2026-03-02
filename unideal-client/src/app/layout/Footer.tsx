import { Link } from "react-router-dom"
import { Separator } from "@/components/ui/separator"
import { ROUTES } from "@/lib/constants"

const FOOTER_LINKS = [
  { group: "Marketplace", links: [
    { label: "Browse", href: ROUTES.BROWSE },
    { label: "Sell an Item", href: ROUTES.SELL },
    { label: "Categories", href: ROUTES.BROWSE },
  ]},
  { group: "Account", links: [
    { label: "Dashboard", href: ROUTES.DASHBOARD },
    { label: "Wallet", href: ROUTES.WALLET },
    { label: "Settings", href: ROUTES.SETTINGS },
  ]},
  { group: "Trust & Safety", links: [
    { label: "Verification", href: ROUTES.VERIFICATION },
    { label: "Escrow Policy", href: "#" },
    { label: "Report a Listing", href: "#" },
  ]},
]

/** Minimal site footer */
export function Footer() {
  return (
    <footer className="border-t border-border bg-background mt-auto">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-8 sm:grid-cols-4">
          {/* Brand */}
          <div className="col-span-2 sm:col-span-1">
            <Link
              to={ROUTES.HOME}
              className="font-brand text-xl font-bold text-foreground hover:text-primary transition-colors"
            >
              Unideal
            </Link>
            <p className="mt-3 text-xs text-muted-foreground leading-relaxed">
              Your campus marketplace. Buy, sell and rent with trust.
            </p>
          </div>

          {/* Link groups */}
          {FOOTER_LINKS.map((group) => (
            <div key={group.group}>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                {group.group}
              </h4>
              <ul className="space-y-2">
                {group.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      to={link.href}
                      className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <Separator className="my-8" />

        <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} Unideal. Built for campus communities.
          </p>
          <p className="text-xs text-muted-foreground">
            Transactions protected by Razorpay Escrow
          </p>
        </div>
      </div>
    </footer>
  )
}
