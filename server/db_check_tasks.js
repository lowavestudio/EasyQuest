import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function checkTasks() {
    const tasks = await prisma.task.findMany({
        orderBy: { createdAt: 'desc' },
        take: 5
    });
    console.log("Latest tasks:");
    tasks.forEach(t => console.log(`ID: ${t.id}, Title: ${t.title}, Lat: ${t.lat}, Lng: ${t.lng}, Status: ${t.status}, Payment: ${t.paymentType}`));
}

checkTasks().catch(console.error).finally(() => prisma.$disconnect());
