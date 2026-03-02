// ============================================
// ItemGrid — responsive grid of ItemCards with stagger animation
// ============================================

import { motion } from "framer-motion"
import { ItemCard } from "@/components/items/ItemCard"
import type { Item } from "@/types"

interface ItemGridProps {
  items: Item[]
  /** Show favorite hearts (default true) */
  showFavorite?: boolean
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.04 },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
}

/**
 * Responsive item grid: 1→2→3→4 columns.
 * Wraps ItemCard with stagger entrance animation.
 */
export function ItemGrid({ items, showFavorite = true }: ItemGridProps) {
  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
    >
      {items.map((item) => (
        <motion.div key={item.id} variants={itemVariants}>
          <ItemCard item={item} showFavorite={showFavorite} />
        </motion.div>
      ))}
    </motion.div>
  )
}
