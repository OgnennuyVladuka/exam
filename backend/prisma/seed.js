// backend/prisma/seed.js
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

// Основная функция заполнения базы данных
async function main() {
  console.log(' Сидинг помещений...')

  // Список помещений для создания
  const rooms = [
    { name: 'Аудитория №101' },
    { name: 'Аудитория №205' },
    { name: 'Коворкинг "Старт"' },
    { name: 'Кинозал "Экран"' },
  ]

  // Создание помещений в БД
  for (const room of rooms) {
    await prisma.room.create({ data: room })
    console.log(` Создано: ${room.name}`)
  }

  console.log('Готово!')
}

main()
  .catch(e => { 
    console.error(' Ошибка при сидинге:', e)
    process.exit(1) 
  })
  .finally(async () => {
    // Отключение от БД
    await prisma.$disconnect()
  })