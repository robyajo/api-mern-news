import { prisma } from '../src/prisma'
import bcrypt from 'bcryptjs'
import { v4 as uuidv4 } from 'uuid'
import slugify from 'slugify'

async function main() {
  console.log('Start seeding...')

  // Fix Auto Increment Sequences
  try {
    const tables = ['users', 'categori_posts', 'posts', 'comments']
    for (const table of tables) {
      await prisma.$executeRawUnsafe(`SELECT setval(pg_get_serial_sequence('${table}', 'id'), coalesce(max(id)+1, 1), false) FROM ${table};`)
      console.log(`Reset sequence for ${table}`)
    }
  } catch (error) {
    console.warn('Failed to reset sequences, might be permissions or table structure:', error)
  }

  // 1. Create Users (Admin & User)
  const passwordHash = await bcrypt.hash('password123', 10)

  const admin = await prisma.users.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: {
      uuid: uuidv4(),
      name: 'Admin User',
      email: 'admin@example.com',
      password: passwordHash,
      role: 'admin',
      created_at: new Date(),
      updated_at: new Date()
    }
  })
  console.log(`Created admin: ${admin.name}`)

  const user = await prisma.users.upsert({
    where: { email: 'user@example.com' },
    update: {},
    create: {
      uuid: uuidv4(),
      name: 'Regular User',
      email: 'user@example.com',
      password: passwordHash,
      role: 'user',
      created_at: new Date(),
      updated_at: new Date()
    }
  })
  console.log(`Created user: ${user.name}`)

  // 2. Create Categories
  const categoryNames = ['Technology', 'Health', 'Sports']
  const categories = []

  for (const name of categoryNames) {
    const slug = slugify(name, { lower: true })
    // Check existing by slug to avoid unique constraint error on re-seed if upsert logic differs
    // Schema says slug is unique.
    const cat = await prisma.categori_posts.upsert({
      where: { slug },
      update: {},
      create: {
        uuid: uuidv4(),
        user_id: admin.id,
        name,
        slug,
        status: 'active',
        created_at: new Date(),
        updated_at: new Date()
      }
    })
    categories.push(cat)
    console.log(`Created category: ${cat.name}`)
  }

  // 3. Create Posts
  // We don't upsert posts easily because slug has random part in controller, but here we can make it static or check existence.
  // For simplicity, we just create if not exists (check by name/title loosely or just create always? 
  // Better check by name to avoid duplicates on re-seed if we want idempotency).
  
  const postTitle1 = 'The Future of AI'
  const existingPost1 = await prisma.posts.findFirst({ where: { name: postTitle1 } })
  
  let post1
  if (!existingPost1) {
    post1 = await prisma.posts.create({
        data: {
        uuid: uuidv4(),
        user_id: admin.id,
        categori_id: categories[0].id,
        name: postTitle1,
        slug: slugify(postTitle1, { lower: true }) + '-' + uuidv4().slice(0, 8),
        content: 'Artificial Intelligence is evolving rapidly...',
        status: 'published',
        created_at: new Date(),
        updated_at: new Date()
        }
    })
    console.log(`Created post: ${post1.name}`)
  } else {
    post1 = existingPost1
    console.log(`Post already exists: ${post1.name}`)
  }

  const postTitle2 = 'Healthy Living Tips'
  const existingPost2 = await prisma.posts.findFirst({ where: { name: postTitle2 } })
  
  let post2
  if (!existingPost2) {
    post2 = await prisma.posts.create({
        data: {
        uuid: uuidv4(),
        user_id: user.id,
        categori_id: categories[1].id,
        name: postTitle2,
        slug: slugify(postTitle2, { lower: true }) + '-' + uuidv4().slice(0, 8),
        content: 'Drinking water is essential...',
        status: 'published',
        created_at: new Date(),
        updated_at: new Date()
        }
    })
    console.log(`Created post: ${post2.name}`)
  } else {
    post2 = existingPost2
    console.log(`Post already exists: ${post2.name}`)
  }

  // 4. Create Comments
  // Check if comment exists
  const existingComment1 = await prisma.comments.findFirst({ where: { post_id: post1.id, user_id: user.id } })
  if (!existingComment1) {
    await prisma.comments.create({
        data: {
        uuid: uuidv4(),
        user_id: user.id,
        post_id: post1.id,
        content: 'Great article!',
        created_at: new Date(),
        updated_at: new Date()
        }
    })
    console.log('Created comment on post 1')
  }

  const existingComment2 = await prisma.comments.findFirst({ where: { post_id: post2.id, user_id: admin.id } })
  if (!existingComment2) {
    await prisma.comments.create({
        data: {
        uuid: uuidv4(),
        user_id: admin.id,
        post_id: post2.id,
        content: 'Nice tips, thanks!',
        created_at: new Date(),
        updated_at: new Date()
        }
    })
    console.log('Created comment on post 2')
  }

  console.log('Seeding finished.')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
