import { PrismaClient } from "@prisma/client"
import { hash } from "bcryptjs"

const db = new PrismaClient()

async function main() {
  const adminEmail = "admin@mrcoaching.com"
  const existing = await db.user.findUnique({ where: { email: adminEmail } })
  if (!existing) {
    await db.user.create({
      data: { name: "Gary (Admin)", email: adminEmail, hashedPassword: await hash("admin123", 12), role: "admin" },
    })
    console.log("✅ Admin: admin@mrcoaching.com / admin123")
  }

  const exercises = [
    { name: "Barbell Bench Press", muscleGroup: "chest", equipment: "barbell" },
    { name: "Barbell Squat", muscleGroup: "legs", equipment: "barbell" },
    { name: "Deadlift", muscleGroup: "back", equipment: "barbell" },
    { name: "Pull Up", muscleGroup: "back", equipment: "bodyweight" },
    { name: "Overhead Press", muscleGroup: "shoulders", equipment: "barbell" },
    { name: "Barbell Row", muscleGroup: "back", equipment: "barbell" },
    { name: "Dumbbell Bicep Curl", muscleGroup: "arms", equipment: "dumbbell" },
    { name: "Tricep Pushdown", muscleGroup: "arms", equipment: "cable" },
    { name: "Leg Press", muscleGroup: "legs", equipment: "machine" },
    { name: "Plank", muscleGroup: "core", equipment: "bodyweight" },
  ]

  for (const ex of exercises) {
    const exists = await db.exercise.findFirst({ where: { name: ex.name } })
    if (!exists) await db.exercise.create({ data: ex })
  }
  console.log(`✅ ${exercises.length} sample exercises`)
}

main().catch(console.error).finally(() => db.$disconnect())