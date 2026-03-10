import "dotenv/config"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

async function main() {
  console.log("🌱 Seeding database...")

  // ── Categories ──────────────────────────────────────────────────────────────
  const categoryData = [
    { name: "Books & Notes", slug: "books-notes", iconName: "BookOpen" },
    { name: "Electronics", slug: "electronics", iconName: "Laptop" },
    { name: "Furniture", slug: "furniture", iconName: "Armchair" },
    { name: "Sports & Fitness", slug: "sports-fitness", iconName: "Dumbbell" },
    { name: "Clothing & Accessories", slug: "clothing-accessories", iconName: "Shirt" },
    { name: "Miscellaneous", slug: "miscellaneous", iconName: "Package" },
  ]

  const categories: Record<string, { id: number }> = {}
  for (const cat of categoryData) {
    const result = await prisma.category.upsert({
      where: { slug: cat.slug },
      update: {},
      create: cat,
    })
    categories[cat.slug] = result
  }
  console.log(`✅ ${categoryData.length} categories seeded`)

  // ── Colleges ─────────────────────────────────────────────────────────────────
  const collegeData = [
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

  const colleges: Record<string, { id: string }> = {}
  for (const college of collegeData) {
    const result = await prisma.college.upsert({
      where: { slug: college.slug },
      update: {},
      create: college,
    })
    colleges[college.slug] = result
  }
  console.log(`✅ ${collegeData.length} colleges seeded`)

  // ── Users ────────────────────────────────────────────────────────────────────
  const userData = [
    {
      clerkId: "user_seed_admin_001",
      email: "admin@campx.dev",
      fullName: "CampX Admin",
      phone: "+919876543210",
      avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=admin",
      collegeSlug: "spit",
      verificationStatus: "VERIFIED" as const,
      isAdmin: true,
      onboardingComplete: true,
    },
    {
      clerkId: "user_seed_raaj_002",
      email: "raaj.patkar@spit.ac.in",
      fullName: "Raaj Patkar",
      phone: "+919812345678",
      avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=raaj",
      collegeSlug: "spit",
      verificationStatus: "VERIFIED" as const,
      isAdmin: false,
      onboardingComplete: true,
    },
    {
      clerkId: "user_seed_priya_003",
      email: "priya.sharma@spit.ac.in",
      fullName: "Priya Sharma",
      phone: "+919823456789",
      avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=priya",
      collegeSlug: "spit",
      verificationStatus: "VERIFIED" as const,
      isAdmin: false,
      onboardingComplete: true,
    },
    {
      clerkId: "user_seed_arjun_004",
      email: "arjun.mehta@ves.ac.in",
      fullName: "Arjun Mehta",
      phone: "+919834567890",
      avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=arjun",
      collegeSlug: "vesit",
      verificationStatus: "VERIFIED" as const,
      isAdmin: false,
      onboardingComplete: true,
    },
    {
      clerkId: "user_seed_sneha_005",
      email: "sneha.desai@djsce.ac.in",
      fullName: "Sneha Desai",
      phone: "+919845678901",
      avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=sneha",
      collegeSlug: "djsce",
      verificationStatus: "VERIFIED" as const,
      isAdmin: false,
      onboardingComplete: true,
    },
    {
      clerkId: "user_seed_rohan_006",
      email: "rohan.joshi@somaiya.edu",
      fullName: "Rohan Joshi",
      phone: "+919856789012",
      avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=rohan",
      collegeSlug: "kjsce",
      verificationStatus: "PENDING" as const,
      isAdmin: false,
      onboardingComplete: true,
    },
    {
      clerkId: "user_seed_ananya_007",
      email: "ananya.iyer@tsec.ac.in",
      fullName: "Ananya Iyer",
      phone: "+919867890123",
      avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=ananya",
      collegeSlug: "tsec",
      verificationStatus: "VERIFIED" as const,
      isAdmin: false,
      onboardingComplete: true,
    },
    {
      clerkId: "user_seed_karan_008",
      email: "karan.singh@spit.ac.in",
      fullName: "Karan Singh",
      phone: "+919878901234",
      avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=karan",
      collegeSlug: "spit",
      verificationStatus: "VERIFIED" as const,
      isAdmin: false,
      onboardingComplete: true,
    },
    {
      clerkId: "user_seed_neha_009",
      email: "neha.gupta@ves.ac.in",
      fullName: "Neha Gupta",
      phone: "+919889012345",
      avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=neha",
      collegeSlug: "vesit",
      verificationStatus: "UNVERIFIED" as const,
      isAdmin: false,
      onboardingComplete: false,
    },
    {
      clerkId: "user_seed_vikram_010",
      email: "vikram.rao@djsce.ac.in",
      fullName: "Vikram Rao",
      phone: "+919890123456",
      avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=vikram",
      collegeSlug: "djsce",
      verificationStatus: "VERIFIED" as const,
      isAdmin: false,
      onboardingComplete: true,
    },
  ]

  const users: Record<string, { id: string }> = {}
  for (const u of userData) {
    const { collegeSlug, ...rest } = u
    const result = await prisma.user.upsert({
      where: { clerkId: rest.clerkId },
      update: {},
      create: {
        ...rest,
        collegeId: colleges[collegeSlug].id,
        wallet: { create: {} },
      },
    })
    users[rest.clerkId] = result
  }
  console.log(`✅ ${userData.length} users seeded (with wallets)`)

  // ── Items ────────────────────────────────────────────────────────────────────
  const itemData = [
    // Books & Notes
    {
      sellerClerkId: "user_seed_raaj_002",
      collegeSlug: "spit",
      categorySlug: "books-notes",
      title: "Engineering Mathematics III — Kreyszig 10th Ed",
      description: "Barely used, minor highlighting on first 3 chapters. Covers Laplace, Fourier, and Z-transforms. Perfect for SEM-3.",
      listingType: "SELL" as const,
      sellPrice: 350,
      images: ["https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400"],
      condition: "LIKE_NEW" as const,
      status: "AVAILABLE" as const,
      pickupLocation: "SPIT Canteen",
      pickupLat: 19.1076,
      pickupLng: 72.8377,
    },
    {
      sellerClerkId: "user_seed_priya_003",
      collegeSlug: "spit",
      categorySlug: "books-notes",
      title: "DSA Handwritten Notes — Full Semester",
      description: "Complete handwritten notes for Data Structures & Algorithms. Includes all topics from linked lists to graphs. Got 9.5 GPA using these!",
      listingType: "SELL" as const,
      sellPrice: 200,
      images: ["https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=400"],
      condition: "USED" as const,
      status: "AVAILABLE" as const,
      pickupLocation: "SPIT Library",
      pickupLat: 19.1074,
      pickupLng: 72.8373,
    },
    {
      sellerClerkId: "user_seed_arjun_004",
      collegeSlug: "vesit",
      categorySlug: "books-notes",
      title: "DBMS Textbook — Korth 7th Edition",
      description: "Classic database systems textbook. Some dog-eared pages but content is perfect. Includes practice problems solved in pencil.",
      listingType: "SELL" as const,
      sellPrice: 280,
      images: ["https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=400"],
      condition: "USED" as const,
      status: "AVAILABLE" as const,
      pickupLocation: "VESIT Main Gate",
      pickupLat: 19.0556,
      pickupLng: 72.8955,
    },
    // Electronics
    {
      sellerClerkId: "user_seed_karan_008",
      collegeSlug: "spit",
      categorySlug: "electronics",
      title: "Logitech G502 Gaming Mouse",
      description: "Used for 6 months, works flawlessly. 25K DPI sensor, 11 programmable buttons. Selling because I switched to a trackball. Comes with original box.",
      listingType: "SELL" as const,
      sellPrice: 2800,
      images: ["https://images.unsplash.com/photo-1527814050087-3793815479db?w=400"],
      condition: "LIKE_NEW" as const,
      status: "AVAILABLE" as const,
      pickupLocation: "SPIT Parking Lot",
      pickupLat: 19.1077,
      pickupLng: 72.8379,
    },
    {
      sellerClerkId: "user_seed_sneha_005",
      collegeSlug: "djsce",
      categorySlug: "electronics",
      title: "iPad Air 5th Gen — 64GB WiFi",
      description: "Space Gray, Apple Pencil 2 included. Used for note-taking for 1 year. Screen protector installed since day 1. Battery health 96%.",
      listingType: "SELL" as const,
      sellPrice: 38000,
      images: ["https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=400"],
      condition: "LIKE_NEW" as const,
      status: "AVAILABLE" as const,
      pickupLocation: "DJSCE Canteen",
      pickupLat: 19.0996,
      pickupLng: 72.8416,
    },
    {
      sellerClerkId: "user_seed_vikram_010",
      collegeSlug: "djsce",
      categorySlug: "electronics",
      title: "Raspberry Pi 4 Model B — 4GB RAM",
      description: "Complete kit: Pi 4B, 32GB SD card (Raspbian), case with fan, power supply. Used for one IoT project. Clean and working.",
      listingType: "SELL" as const,
      sellPrice: 3500,
      images: ["https://images.unsplash.com/photo-1629292048998-efc4b9534786?w=400"],
      condition: "USED" as const,
      status: "AVAILABLE" as const,
      pickupLocation: "DJSCE Electronics Lab",
      pickupLat: 19.0994,
      pickupLng: 72.8414,
    },
    {
      sellerClerkId: "user_seed_ananya_007",
      collegeSlug: "tsec",
      categorySlug: "electronics",
      title: "Sony WH-1000XM4 Headphones",
      description: "Best ANC headphones. Black colour. Minor scuff on left ear cup, otherwise pristine. 30h battery. Great for library study sessions.",
      listingType: "SELL" as const,
      sellPrice: 15000,
      images: ["https://images.unsplash.com/photo-1618366712010-f4ae9c647dcb?w=400"],
      condition: "USED" as const,
      status: "AVAILABLE" as const,
      pickupLocation: "TSEC Entrance",
      pickupLat: 19.0999,
      pickupLng: 72.8340,
    },
    // Furniture
    {
      sellerClerkId: "user_seed_raaj_002",
      collegeSlug: "spit",
      categorySlug: "furniture",
      title: "IKEA MARKUS Office Chair — Black",
      description: "Ergonomic office chair, mesh back. Used for 2 years in hostel room. Height adjustable, lumbar support. Small tear on right armrest pad.",
      listingType: "SELL" as const,
      sellPrice: 5500,
      images: ["https://images.unsplash.com/photo-1580480055273-228ff5388ef8?w=400"],
      condition: "USED" as const,
      status: "AVAILABLE" as const,
      pickupLocation: "SPIT Boys Hostel",
      pickupLat: 19.1078,
      pickupLng: 72.8380,
    },
    {
      sellerClerkId: "user_seed_rohan_006",
      collegeSlug: "kjsce",
      categorySlug: "furniture",
      title: "Foldable Study Table — Portable",
      description: "Lightweight wooden foldable table. Perfect for hostel rooms. Fits a laptop + books. Selling because I'm moving out of hostel.",
      listingType: "SELL" as const,
      sellPrice: 1200,
      images: ["https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?w=400"],
      condition: "LIKE_NEW" as const,
      status: "AVAILABLE" as const,
      pickupLocation: "KJ Somaiya Main Building",
      pickupLat: 19.0729,
      pickupLng: 72.8894,
    },
    // Sports & Fitness
    {
      sellerClerkId: "user_seed_arjun_004",
      collegeSlug: "vesit",
      categorySlug: "sports-fitness",
      title: "Yonex Nanoray Light 18i Badminton Racket",
      description: "Lightweight racket, great for beginners and intermediate. Strung with BG65 at 24lbs. Includes full cover. Used for VESIT inter-college tournament.",
      listingType: "SELL" as const,
      sellPrice: 1800,
      images: ["https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?w=400"],
      condition: "USED" as const,
      status: "AVAILABLE" as const,
      pickupLocation: "VESIT Sports Ground",
      pickupLat: 19.0557,
      pickupLng: 72.8956,
    },
    {
      sellerClerkId: "user_seed_karan_008",
      collegeSlug: "spit",
      categorySlug: "sports-fitness",
      title: "10kg Adjustable Dumbbell Set — Pair",
      description: "Cast iron plates, chrome handles. 2.5kg to 10kg per dumbbell. Barely used — gym motivation lasted 2 months. Comes with carrying case.",
      listingType: "SELL" as const,
      sellPrice: 2200,
      images: ["https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=400"],
      condition: "LIKE_NEW" as const,
      status: "AVAILABLE" as const,
      pickupLocation: "SPIT Ground Floor",
      pickupLat: 19.1073,
      pickupLng: 72.8374,
    },
    // Clothing & Accessories
    {
      sellerClerkId: "user_seed_priya_003",
      collegeSlug: "spit",
      categorySlug: "clothing-accessories",
      title: "Levi's 511 Slim Fit Jeans — Size 32",
      description: "Dark indigo wash, worn 3-4 times. Bought wrong size online, too late to return. Tags removed but practically new.",
      listingType: "SELL" as const,
      sellPrice: 1500,
      images: ["https://images.unsplash.com/photo-1542272604-787c3835535d?w=400"],
      condition: "LIKE_NEW" as const,
      status: "AVAILABLE" as const,
      pickupLocation: "SPIT Girls Common Room",
      pickupLat: 19.1075,
      pickupLng: 72.8376,
    },
    {
      sellerClerkId: "user_seed_ananya_007",
      collegeSlug: "tsec",
      categorySlug: "clothing-accessories",
      title: "Wildcraft 45L Trekking Backpack",
      description: "Used for one Ladakh trip. Rain cover included. Multiple compartments, laptop sleeve. Blue/Grey colour. Small name tag sewn inside.",
      listingType: "BOTH" as const,
      sellPrice: 2500,
      rentPricePerDay: 150,
      images: ["https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400"],
      condition: "USED" as const,
      status: "AVAILABLE" as const,
      pickupLocation: "TSEC Library",
      pickupLat: 19.0997,
      pickupLng: 72.8338,
    },
    // Miscellaneous
    {
      sellerClerkId: "user_seed_sneha_005",
      collegeSlug: "djsce",
      categorySlug: "miscellaneous",
      title: "TI-84 Plus CE Graphing Calculator",
      description: "Required for applied maths courses. Full colour screen, Python edition. Includes USB cable and fresh batteries. Only used for exams.",
      listingType: "BOTH" as const,
      sellPrice: 8500,
      rentPricePerDay: 100,
      images: ["https://images.unsplash.com/photo-1564939558297-fc396f18e5c7?w=400"],
      condition: "LIKE_NEW" as const,
      status: "AVAILABLE" as const,
      pickupLocation: "DJSCE Library",
      pickupLat: 19.0995,
      pickupLng: 72.8415,
    },
    {
      sellerClerkId: "user_seed_vikram_010",
      collegeSlug: "djsce",
      categorySlug: "miscellaneous",
      title: "Arduino Mega Starter Kit",
      description: "Complete starter kit: Arduino Mega 2560, breadboard, jumper wires, sensors (ultrasonic, IR, temp), LCD, LEDs, resistors. Everything in organiser box.",
      listingType: "SELL" as const,
      sellPrice: 2800,
      images: ["https://images.unsplash.com/photo-1553406830-ef2513450d76?w=400"],
      condition: "USED" as const,
      status: "AVAILABLE" as const,
      pickupLocation: "DJSCE Workshop",
      pickupLat: 19.0993,
      pickupLng: 72.8413,
    },
    {
      sellerClerkId: "user_seed_rohan_006",
      collegeSlug: "kjsce",
      categorySlug: "miscellaneous",
      title: "Whiteboard with Markers — 3x2 ft",
      description: "Magnetic whiteboard, wall-mountable. Comes with 4 markers and a duster. Great for study groups or hostel room planning.",
      listingType: "SELL" as const,
      sellPrice: 800,
      images: ["https://images.unsplash.com/photo-1532619675605-1ede6c2ed2b0?w=400"],
      condition: "NEW" as const,
      status: "AVAILABLE" as const,
      pickupLocation: "KJ Somaiya Canteen",
      pickupLat: 19.0730,
      pickupLng: 72.8895,
    },
    // SOLD items
    {
      sellerClerkId: "user_seed_raaj_002",
      collegeSlug: "spit",
      categorySlug: "electronics",
      title: "Keychron K2 Mechanical Keyboard — Brown Switches",
      description: "75% layout, wireless Bluetooth + USB-C. Gateron Brown switches. Used for 1 semester. Sold with original keycaps + extra set.",
      listingType: "SELL" as const,
      sellPrice: 4500,
      images: ["https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=400"],
      condition: "USED" as const,
      status: "SOLD" as const,
      pickupLocation: "SPIT Canteen",
      pickupLat: 19.1076,
      pickupLng: 72.8377,
    },
    {
      sellerClerkId: "user_seed_priya_003",
      collegeSlug: "spit",
      categorySlug: "books-notes",
      title: "Operating Systems — Galvin 9th Edition",
      description: "Standard OS textbook. Some sticky notes inside. Covered with brown paper.",
      listingType: "SELL" as const,
      sellPrice: 300,
      images: ["https://images.unsplash.com/photo-1532012197267-da84d127e765?w=400"],
      condition: "USED" as const,
      status: "SOLD" as const,
      pickupLocation: "SPIT Library",
      pickupLat: 19.1074,
      pickupLng: 72.8373,
    },
    // Rent-only
    {
      sellerClerkId: "user_seed_karan_008",
      collegeSlug: "spit",
      categorySlug: "electronics",
      title: "GoPro Hero 11 Black — Rent Only",
      description: "Rent my GoPro for trips, events, or college fests! Comes with mount, selfie stick, and 64GB SD card. Security deposit required.",
      listingType: "RENT" as const,
      rentPricePerDay: 500,
      images: ["https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=400"],
      condition: "LIKE_NEW" as const,
      status: "AVAILABLE" as const,
      pickupLocation: "SPIT Parking Lot",
      pickupLat: 19.1077,
      pickupLng: 72.8379,
    },
  ]

  const items: Array<{ id: string; sellerClerkId: string; title: string; status: string }> = []
  for (const item of itemData) {
    const { sellerClerkId, collegeSlug, categorySlug, ...rest } = item
    const result = await prisma.item.create({
      data: {
        sellerId: users[sellerClerkId].id,
        collegeId: colleges[collegeSlug].id,
        categoryId: categories[categorySlug].id,
        ...rest,
        sellPrice: rest.sellPrice ?? null,
        rentPricePerDay: rest.rentPricePerDay ?? null,
      },
    })
    items.push({ id: result.id, sellerClerkId, title: rest.title, status: rest.status })
  }
  console.log(`✅ ${items.length} items seeded`)

  // ── Transactions (for the SOLD items) ────────────────────────────────────────
  const soldKeyboard = items.find((i) => i.title.includes("Keychron"))!
  const soldOSBook = items.find((i) => i.title.includes("Operating Systems"))!

  const txn1 = await prisma.transaction.create({
    data: {
      itemId: soldKeyboard.id,
      buyerId: users["user_seed_arjun_004"].id,
      sellerId: users["user_seed_raaj_002"].id,
      type: "BUY",
      status: "SETTLED",
      amount: 4500,
      razorpayOrderId: "order_seed_001",
      razorpayPaymentId: "pay_seed_001",
      razorpaySignature: "sig_seed_001",
      settledAt: new Date("2026-02-20"),
    },
  })

  const txn2 = await prisma.transaction.create({
    data: {
      itemId: soldOSBook.id,
      buyerId: users["user_seed_karan_008"].id,
      sellerId: users["user_seed_priya_003"].id,
      type: "BUY",
      status: "SETTLED",
      amount: 300,
      razorpayOrderId: "order_seed_002",
      razorpayPaymentId: "pay_seed_002",
      razorpaySignature: "sig_seed_002",
      settledAt: new Date("2026-02-25"),
    },
  })
  console.log("✅ 2 transactions seeded (settled)")

  // ── Conversations & Messages ─────────────────────────────────────────────────
  await prisma.conversation.create({
    data: {
      transactionId: txn1.id,
      user1Id: users["user_seed_arjun_004"].id,
      user2Id: users["user_seed_raaj_002"].id,
      ablyChannelName: `conv_seed_${txn1.id}`,
      lastMessageAt: new Date("2026-02-20T14:30:00Z"),
      messages: {
        create: [
          {
            senderId: users["user_seed_arjun_004"].id,
            type: "TEXT",
            content: "Hey! Is the Keychron still available?",
            isRead: true,
            createdAt: new Date("2026-02-18T10:00:00Z"),
          },
          {
            senderId: users["user_seed_raaj_002"].id,
            type: "TEXT",
            content: "Yes! It's in great condition. Brown switches, very smooth.",
            isRead: true,
            createdAt: new Date("2026-02-18T10:05:00Z"),
          },
          {
            senderId: users["user_seed_arjun_004"].id,
            type: "TEXT",
            content: "Cool, can you do 4000?",
            isRead: true,
            createdAt: new Date("2026-02-18T10:10:00Z"),
          },
          {
            senderId: users["user_seed_raaj_002"].id,
            type: "TEXT",
            content: "4500 is already a steal bro. Final price.",
            isRead: true,
            createdAt: new Date("2026-02-18T10:12:00Z"),
          },
          {
            senderId: users["user_seed_arjun_004"].id,
            type: "TEXT",
            content: "Fair enough. I'll pay now. Can we meet at SPIT canteen tomorrow?",
            isRead: true,
            createdAt: new Date("2026-02-18T10:15:00Z"),
          },
          {
            senderId: users["user_seed_raaj_002"].id,
            type: "TEXT",
            content: "Done! See you at 2 PM",
            isRead: true,
            createdAt: new Date("2026-02-18T10:17:00Z"),
          },
        ],
      },
    },
  })

  await prisma.conversation.create({
    data: {
      transactionId: txn2.id,
      user1Id: users["user_seed_karan_008"].id,
      user2Id: users["user_seed_priya_003"].id,
      ablyChannelName: `conv_seed_${txn2.id}`,
      lastMessageAt: new Date("2026-02-25T16:00:00Z"),
      messages: {
        create: [
          {
            senderId: users["user_seed_karan_008"].id,
            type: "TEXT",
            content: "Hi Priya, I need the OS Galvin book for my exam next week. Is it available?",
            isRead: true,
            createdAt: new Date("2026-02-24T09:00:00Z"),
          },
          {
            senderId: users["user_seed_priya_003"].id,
            type: "TEXT",
            content: "Yep! It's in good condition. Meet at SPIT library?",
            isRead: true,
            createdAt: new Date("2026-02-24T09:20:00Z"),
          },
          {
            senderId: users["user_seed_karan_008"].id,
            type: "TEXT",
            content: "Perfect, paying now. Thanks!",
            isRead: true,
            createdAt: new Date("2026-02-24T09:25:00Z"),
          },
        ],
      },
    },
  })
  console.log("✅ 2 conversations with messages seeded")

  // ── Reviews ──────────────────────────────────────────────────────────────────
  await prisma.review.createMany({
    data: [
      {
        transactionId: txn1.id,
        reviewerId: users["user_seed_arjun_004"].id,
        revieweeId: users["user_seed_raaj_002"].id,
        rating: 5,
        comment: "Super smooth transaction! Keyboard was exactly as described. Raaj was punctual and friendly. Would buy from him again.",
      },
      {
        transactionId: txn1.id,
        reviewerId: users["user_seed_raaj_002"].id,
        revieweeId: users["user_seed_arjun_004"].id,
        rating: 5,
        comment: "Arjun was a great buyer. Quick payment and easy pickup. 10/10.",
      },
      {
        transactionId: txn2.id,
        reviewerId: users["user_seed_karan_008"].id,
        revieweeId: users["user_seed_priya_003"].id,
        rating: 4,
        comment: "Book was in decent condition. Some highlighting but nothing major. Priya was helpful.",
      },
    ],
  })
  console.log("✅ 3 reviews seeded")

  // ── Favorites ────────────────────────────────────────────────────────────────
  const ipadItem = items.find((i) => i.title.includes("iPad"))!
  const goproItem = items.find((i) => i.title.includes("GoPro"))!
  const sonyItem = items.find((i) => i.title.includes("Sony"))!
  const mathsBook = items.find((i) => i.title.includes("Kreyszig"))!
  const dumbbells = items.find((i) => i.title.includes("Dumbbell"))!

  await prisma.favorite.createMany({
    data: [
      { userId: users["user_seed_raaj_002"].id, itemId: ipadItem.id },
      { userId: users["user_seed_raaj_002"].id, itemId: sonyItem.id },
      { userId: users["user_seed_priya_003"].id, itemId: goproItem.id },
      { userId: users["user_seed_arjun_004"].id, itemId: mathsBook.id },
      { userId: users["user_seed_arjun_004"].id, itemId: dumbbells.id },
      { userId: users["user_seed_sneha_005"].id, itemId: goproItem.id },
      { userId: users["user_seed_ananya_007"].id, itemId: ipadItem.id },
      { userId: users["user_seed_karan_008"].id, itemId: sonyItem.id },
    ],
  })
  console.log("✅ 8 favorites seeded")

  // ── Verifications ────────────────────────────────────────────────────────────
  await prisma.verification.createMany({
    data: [
      {
        userId: users["user_seed_raaj_002"].id,
        idCardImageUrl: "https://res.cloudinary.com/demo/image/upload/v1/seed/id_raaj.jpg",
        status: "VERIFIED",
        reviewerNotes: "Valid SPIT ID card",
        reviewedBy: users["user_seed_admin_001"].id,
        reviewedAt: new Date("2026-01-15"),
      },
      {
        userId: users["user_seed_priya_003"].id,
        idCardImageUrl: "https://res.cloudinary.com/demo/image/upload/v1/seed/id_priya.jpg",
        status: "VERIFIED",
        reviewerNotes: "Valid SPIT ID card",
        reviewedBy: users["user_seed_admin_001"].id,
        reviewedAt: new Date("2026-01-16"),
      },
      {
        userId: users["user_seed_rohan_006"].id,
        idCardImageUrl: "https://res.cloudinary.com/demo/image/upload/v1/seed/id_rohan.jpg",
        status: "PENDING",
      },
    ],
  })
  console.log("✅ 3 verifications seeded")

  // ── Notifications ────────────────────────────────────────────────────────────
  await prisma.notification.createMany({
    data: [
      {
        userId: users["user_seed_raaj_002"].id,
        type: "ITEM_SOLD",
        title: "Item Sold!",
        body: "Your Keychron K2 Mechanical Keyboard has been sold to Arjun Mehta for ₹4,500.",
        data: { itemId: soldKeyboard.id, transactionId: txn1.id },
        isRead: true,
      },
      {
        userId: users["user_seed_raaj_002"].id,
        type: "FUNDS_RELEASED",
        title: "Funds Released",
        body: "₹4,500 has been released to your wallet from the Keychron K2 sale.",
        data: { transactionId: txn1.id },
        isRead: true,
      },
      {
        userId: users["user_seed_raaj_002"].id,
        type: "REVIEW_RECEIVED",
        title: "New Review",
        body: 'Arjun Mehta gave you a 5-star review: "Super smooth transaction!"',
        data: { transactionId: txn1.id },
        isRead: false,
      },
      {
        userId: users["user_seed_arjun_004"].id,
        type: "PAYMENT_RECEIVED",
        title: "Payment Confirmed",
        body: "Your payment of ₹4,500 for Keychron K2 has been received and held in escrow.",
        data: { transactionId: txn1.id },
        isRead: true,
      },
      {
        userId: users["user_seed_priya_003"].id,
        type: "ITEM_SOLD",
        title: "Item Sold!",
        body: "Your Operating Systems book has been sold to Karan Singh for ₹300.",
        data: { itemId: soldOSBook.id, transactionId: txn2.id },
        isRead: true,
      },
      {
        userId: users["user_seed_rohan_006"].id,
        type: "SYSTEM",
        title: "Verification Pending",
        body: "Your ID verification is under review. We'll notify you once it's approved.",
        isRead: false,
      },
      {
        userId: users["user_seed_karan_008"].id,
        type: "REVIEW_RECEIVED",
        title: "New Review",
        body: "Priya Sharma appreciated your purchase of the OS book.",
        data: { transactionId: txn2.id },
        isRead: false,
      },
    ],
  })
  console.log("✅ 7 notifications seeded")

  // ── Update wallet balances for sellers ────────────────────────────────────────
  const raajWallet = await prisma.wallet.findUnique({
    where: { userId: users["user_seed_raaj_002"].id },
  })
  if (raajWallet) {
    await prisma.wallet.update({
      where: { id: raajWallet.id },
      data: { balance: 4500 },
    })
    await prisma.walletTransaction.create({
      data: {
        walletId: raajWallet.id,
        type: "RELEASE_ESCROW",
        amount: 4500,
        description: "Escrow released for Keychron K2 sale",
        referenceId: txn1.id,
      },
    })
  }

  const priyaWallet = await prisma.wallet.findUnique({
    where: { userId: users["user_seed_priya_003"].id },
  })
  if (priyaWallet) {
    await prisma.wallet.update({
      where: { id: priyaWallet.id },
      data: { balance: 300 },
    })
    await prisma.walletTransaction.create({
      data: {
        walletId: priyaWallet.id,
        type: "RELEASE_ESCROW",
        amount: 300,
        description: "Escrow released for Operating Systems book sale",
        referenceId: txn2.id,
      },
    })
  }
  console.log("✅ Wallet balances updated")

  // ── One Report (for admin panel testing) ─────────────────────────────────────
  const spamItem = items.find((i) => i.title.includes("Whiteboard"))!
  await prisma.report.create({
    data: {
      reporterId: users["user_seed_ananya_007"].id,
      reportedItemId: spamItem.id,
      reportedUserId: users["user_seed_rohan_006"].id,
      reason: "SPAM",
      description: "This seems overpriced for a whiteboard. Might be a troll listing.",
      status: "PENDING",
    },
  })
  console.log("✅ 1 report seeded")

  console.log("\n🎉 Database seeded successfully!")
  console.log("   → 6 categories")
  console.log("   → 5 colleges")
  console.log(`   → ${userData.length} users (1 admin)`)
  console.log(`   → ${items.length} items (${items.filter((i) => i.status === "SOLD").length} sold)`)
  console.log("   → 2 transactions, 2 conversations, 9 messages")
  console.log("   → 3 reviews, 8 favorites, 3 verifications")
  console.log("   → 7 notifications, 1 report")
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
