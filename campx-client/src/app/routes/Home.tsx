import { useMemo } from "react"
import { motion } from "framer-motion"
import { Link } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { ItemCard } from "@/components/items/ItemCard"
import { ItemCardSkeleton } from "@/components/items/ItemCardSkeleton"
import { useItems } from "@/hooks/useItems"
import { ROUTES } from "@/lib/constants"
import {
  ShieldCheck,
  Wallet,
  MessageCircle,
  BookOpen,
  Laptop,
  Dumbbell,
  Shirt,
  Armchair,
  Package,
  ArrowRight,
} from "lucide-react"

const STATS = [
  { label: "Students", value: "10K+" },
  { label: "Listings", value: "5K+" },
  { label: "Transactions", value: "2K+" },
]

const FEATURES = [
  {
    icon: ShieldCheck,
    title: "ID Verified Sellers",
    desc: "Every seller is authenticated with a college ID — no anonymous strangers.",
  },
  {
    icon: Wallet,
    title: "Escrow Protection",
    desc: "Funds are held until you confirm receipt. Zero risk of getting scammed.",
  },
  {
    icon: MessageCircle,
    title: "In-App Chat",
    desc: "Negotiate, share location, and coordinate pickup — all in one place.",
  },
]

const CATEGORIES = [
  { icon: BookOpen, label: "Textbooks" },
  { icon: Laptop, label: "Electronics" },
  { icon: Armchair, label: "Furniture" },
  { icon: Dumbbell, label: "Sports" },
  { icon: Shirt, label: "Clothing" },
  { icon: Package, label: "Miscellaneous" },
]

const HOW_IT_WORKS = [
  { step: 1, title: "Sign Up", desc: "Create your account with Google or email" },
  { step: 2, title: "Verify", desc: "Upload your college ID for seller access" },
  { step: 3, title: "List or Buy", desc: "Post items or browse your campus feed" },
  { step: 4, title: "Escrow Pays", desc: "Funds held safely until delivery confirmed" },
]

/** Landing / Home page */
export function Home() {
  const { data: itemsData, isLoading: itemsLoading } = useItems({ sort: "newest" })
  const recentItems = useMemo(
    () => itemsData?.pages.flatMap((p) => p.items).slice(0, 4) ?? [],
    [itemsData]
  )

  return (
    <div className="flex flex-col">
      {/* Hero */}
      <section className="relative overflow-hidden py-24 sm:py-32 px-4">
        {/* Background glow */}
        <div
          aria-hidden
          className="pointer-events-none absolute left-1/2 top-0 -translate-x-1/2 w-[600px] h-[400px] rounded-full opacity-20"
          style={{
            background:
              "radial-gradient(ellipse at center, #A855F7 0%, transparent 70%)",
          }}
        />

        <div className="relative mx-auto max-w-4xl text-center">
          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="font-brand text-5xl sm:text-7xl font-bold text-foreground leading-tight"
          >
            Your Campus.
            <br />
            <span className="bg-gradient-to-br from-purple-400 to-purple-600 bg-clip-text text-transparent">
              Your Marketplace.
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.15 }}
            className="mt-6 text-lg text-muted-foreground max-w-2xl mx-auto"
          >
            Buy and sell textbooks, electronics, furniture & more — exclusively
            with verified students at your college. Backed by escrow payments
            and real-name verification.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="mt-10 flex flex-col sm:flex-row gap-4 justify-center"
          >
            <Link to={ROUTES.BROWSE}>
              <Button size="xl" className="w-full sm:w-auto">
                Browse Listings
              </Button>
            </Link>
            <Link to={ROUTES.SELL}>
              <Button variant="secondary" size="xl" className="w-full sm:w-auto">
                Start Selling
              </Button>
            </Link>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.5 }}
            className="mt-16 flex justify-center gap-12"
          >
            {STATS.map(({ label, value }) => (
              <div key={label} className="text-center">
                <p className="text-3xl font-bold text-primary">{value}</p>
                <p className="text-sm text-muted-foreground">{label}</p>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Categories */}
      <section className="py-16 px-4 bg-card/30">
        <div className="mx-auto max-w-5xl">
          <h2 className="text-2xl font-semibold text-center text-foreground mb-10">
            Shop by Category
          </h2>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-4">
            {CATEGORIES.map(({ icon: Icon, label }) => (
              <motion.div
                key={label}
                whileHover={{ y: -4, scale: 1.04 }}
                whileTap={{ scale: 0.97 }}
                transition={{ type: "spring", stiffness: 300, damping: 25 }}
              >
                <Link
                  to={`${ROUTES.BROWSE}?category=${label.toLowerCase()}`}
                  className="flex flex-col items-center gap-3 p-4 rounded-xl border border-border bg-card hover:border-primary/40 hover:shadow-glow-card transition-all duration-200"
                >
                  <Icon className="text-primary" size={28} />
                  <span className="text-xs font-medium text-muted-foreground text-center">
                    {label}
                  </span>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Recent Listings */}
      <section className="py-20 px-4">
        <div className="mx-auto max-w-6xl">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-semibold text-foreground">
              Recently Listed
            </h2>
            <Link to={ROUTES.BROWSE}>
              <Button variant="ghost" size="sm" className="gap-1 text-muted-foreground hover:text-primary">
                View all <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {itemsLoading
              ? Array.from({ length: 4 }).map((_, i) => (
                  <ItemCardSkeleton key={i} />
                ))
              : recentItems.map((item) => (
                  <ItemCard key={item.id} item={item} />
                ))}
            {!itemsLoading && recentItems.length === 0 && (
              <div className="col-span-full text-center py-12">
                <Package className="mx-auto h-12 w-12 text-muted-foreground mb-3" />
                <p className="text-sm text-muted-foreground">
                  No listings yet. Be the first to{" "}
                  <Link to={ROUTES.SELL} className="text-primary hover:underline">
                    sell something
                  </Link>
                  !
                </p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-4">
        <div className="mx-auto max-w-5xl">
          <h2 className="text-2xl font-semibold text-center text-foreground mb-12">
            Why CampX?
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {FEATURES.map(({ icon: Icon, title, desc }, i) => (
              <motion.div
                key={title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.1 }}
                className="flex flex-col gap-4 p-6 rounded-xl border border-border bg-card hover:shadow-glow-card transition-all duration-200"
              >
                <div className="w-10 h-10 rounded-lg bg-primary/15 flex items-center justify-center">
                  <Icon className="text-primary" size={20} />
                </div>
                <h3 className="font-semibold text-foreground">{title}</h3>
                <p className="text-sm text-muted-foreground">{desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section className="py-20 px-4 bg-card/30">
        <div className="mx-auto max-w-4xl">
          <h2 className="text-2xl font-semibold text-center text-foreground mb-12">
            How It Works
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
            {HOW_IT_WORKS.map(({ step, title, desc }, i) => (
              <motion.div
                key={step}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.1 }}
                className="flex flex-col items-center text-center gap-3"
              >
                <div className="w-10 h-10 rounded-full border-2 border-primary flex items-center justify-center text-primary font-bold">
                  {step}
                </div>
                <h4 className="font-medium text-foreground">{title}</h4>
                <p className="text-xs text-muted-foreground">{desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-4 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mx-auto max-w-2xl"
        >
          <h2 className="font-brand text-4xl font-bold text-foreground mb-4">
            Ready to trade smarter?
          </h2>
          <p className="text-muted-foreground mb-8">
            Join thousands of students who trust CampX for safe campus
            transactions.
          </p>
          <Link to={ROUTES.BROWSE}>
            <Button size="xl">Explore Listings</Button>
          </Link>
        </motion.div>
      </section>
    </div>
  )
}
