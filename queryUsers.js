const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

(async () => {
  try {
    const users = await prisma.user.findMany();
    console.log('Total users: ' + users.length);
    if (users.length > 0) {
      console.log('User details:');
      users.forEach((user, index) => {
        console.log((index + 1) + '. ' + JSON.stringify(user));
      });
    }
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
})();
