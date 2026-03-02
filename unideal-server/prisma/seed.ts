import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

async function main() {
  console.log("🌱 Seeding database...")

  // ── Categories ──────────────────────────────────────────────────────────────
  const categories = [
    { name: "Books & Notes", slug: "books-notes", iconName: "BookOpen" },
    { name: "Electronics", slug: "electronics", iconName: "Laptop" },
    { name: "Furniture", slug: "furniture", iconName: "Armchair" },
    { name: "Sports & Fitness", slug: "sports-fitness", iconName: "Dumbbell" },
    { name: "Clothing & Accessories", slug: "clothing-accessories", iconName: "Shirt" },
    { name: "Miscellaneous", slug: "miscellaneous", iconName: "Package" },
  ]

  for (const category of categories) {
    await prisma.category.upsert({
      where: { slug: category.slug },
      update: {},
      create: category,
    })
  }
  console.log(`✅ ${categories.length} categories seeded`)

  // ── Colleges ─────────────────────────────────────────────────────────────────
  const colleges = [
    {
      name: "Sardar Patel Institute of Technology",
      slug: "spit",
      emailDomain: "spit.ac.in",
      city: "Mumbai",
      state: "Maharashtra",
      campusLat: 19.1075,
      campusLng: 72.8375,
      isActive: true,
    },
    {
      name: "Vivekanand Education Society's Institute of Technology",
      slug: "vesit",
      emailDomain: "ves.ac.in",
      city: "Mumbai",
      state: "Maharashtra",
      campusLat: 19.0555,
      campusLng: 72.8954,
      isActive: true,
    },
    {
      name: "D.J. Sanghvi College of Engineering",
      slug: "djsce",
      emailDomain: "djsce.ac.in",
      city: "Mumbai",
      state: "Maharashtra",
      campusLat: 19.0995,
      campusLng: 72.8415,
      isActive: true,
    },
    {
      name: "K.J. Somaiya College of Engineering",
      slug: "kjsce",
      emailDomain: "somaiya.edu",
      city: "Mumbai",
      state: "Maharashtra",
      campusLat: 19.0728,
      campusLng: 72.8893,
      isActive: true,
    },
    {
      name: "Thadomal Shahani Engineering College",
      slug: "tsec",
      emailDomain: "tsec.ac.in",
      city: "Mumbai",
      state: "Maharashtra",
      campusLat: 19.0998,
      campusLng: 72.8339,
      isActive: true,
    },
  ]

  for (const college of colleges) {
    await prisma.college.upsert({
      where: { slug: college.slug },
      update: {},
      create: college,
    })
  }
  console.log(`✅ ${colleges.length} colleges seeded`)

  // ── Test admin user (only in dev) ────────────────────────────────────────────
  if (process.env.NODE_ENV !== "production") {
    const adminClerkId = process.env.SEED_ADMIN_CLERK_ID ?? "user_admin_seed"
    const adminEmail = process.env.SEED_ADMIN_EMAIL ?? "admin@unideal.dev"

    const admin = await prisma.user.upsert({
      where: { clerkId: adminClerkId },
      update: {},
      create: {
        clerkId: adminClerkId,
        email: adminEmail,
        fullName: "Unideal Admin",
        isAdmin: true,
        onboardingComplete: true,
        verificationStatus: "VERIFIED",
        wallet: { create: {} },
      },
    })
    console.log(`✅ Admin user seeded: ${admin.email}`)
  }

  console.log("🎉 Database seeded successfully!")
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
