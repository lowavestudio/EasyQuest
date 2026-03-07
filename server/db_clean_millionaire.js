import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function deleteDemoUsers() {
    try {
        console.log("Cleaning up millions of stars and test users...");

        // Find tasks associated with the test users first so we can remove them safely
        const tasksToDelete = await prisma.task.findMany({
            where: {
                OR: [
                    { customerId: 'test_seed_customer' },
                    { executorId: 'test_seed_customer' },
                    { customerId: 'demo123' },
                    { executorId: 'demo123' }
                ]
            }
        });

        const taskIds = tasksToDelete.map(t => t.id);

        if (taskIds.length > 0) {
            // Delete related reviews and messages first
            await prisma.review.deleteMany({ where: { taskId: { in: taskIds } } });
            await prisma.message.deleteMany({ where: { taskId: { in: taskIds } } });

            // Delete the tasks
            const delTasks = await prisma.task.deleteMany({ where: { id: { in: taskIds } } });
            console.log(`Deleted ${delTasks.count} tasks owned by test users`);
        }

        // Delete transactions for test users
        await prisma.transaction.deleteMany({
            where: {
                userId: { in: ['test_seed_customer', 'demo123'] }
            }
        });

        // Delete the users
        const delUsers = await prisma.user.deleteMany({
            where: {
                id: { in: ['test_seed_customer', 'demo123'] }
            }
        });

        console.log(`Deleted ${delUsers.count} test users (including the millionaire)`);
        console.log("Database is clean!");

    } catch (e) {
        console.error("Error during cleanup:", e);
    } finally {
        await prisma.$disconnect();
    }
}

deleteDemoUsers();
