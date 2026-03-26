import crypto from 'node:crypto'
import { getPayload } from '../src/lib/payload/client'

function makeTempPassword() {
  return `Segeneyti-${crypto.randomBytes(8).toString('hex')}!9a`
}

async function main() {
  const email = process.env.ADMIN_EMAIL ?? 'admin@segeneyti.org'
  const password = process.env.ADMIN_PASSWORD ?? makeTempPassword()
  const firstName = process.env.ADMIN_FIRST_NAME ?? 'Admin'
  const lastName = process.env.ADMIN_LAST_NAME ?? 'User'

  const payload = await getPayload()

  const existingUsers = await payload.find({
    collection: 'users',
    depth: 0,
    limit: 1,
    overrideAccess: true,
    pagination: false,
    where: {
      email: {
        equals: email,
      },
    },
  })

  const existingUser = existingUsers.docs[0]

  if (existingUser) {
    await payload.update({
      collection: 'users',
      id: existingUser.id,
      data: {
        email,
        firstName,
        lastName,
        password,
        role: 'super-admin',
      },
      depth: 0,
      overrideAccess: true,
    })

    console.log('Admin user updated successfully.')
  } else {
    await payload.create({
      collection: 'users',
      data: {
        email,
        firstName,
        lastName,
        password,
        role: 'super-admin',
      },
      depth: 0,
      overrideAccess: true,
    })

    console.log('Admin user created successfully.')
  }

  console.log(`EMAIL=${email}`)
  console.log(`PASSWORD=${password}`)
}

main().catch((error) => {
  console.error('Failed to create or reset the admin user.')
  console.error(error)
  process.exitCode = 1
})