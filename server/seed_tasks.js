import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
dotenv.config();

const prisma = new PrismaClient();

const TASKS = [
    // Moscow (Russia)
    {
        title: "Сфотографировать вывеску ресторана 'Пушкин'",
        description: "Нужно сделать 3 четкие фотографии фасада и вывески ресторана при дневном свете.",
        reward: 50, lat: 55.764, lng: 37.604, address: "Тверской бульвар, 26А, Москва",
        category: "photo", timeAllowed: "24 hours", paymentType: "stars"
    },
    {
        title: "Доставить документы в Сити",
        description: "Забрать конверт на ресепшене башни Федерация и передать в соседнее здание (башня Империя).",
        reward: 150, lat: 55.749, lng: 37.537, address: "Пресненская наб., 12, Москва",
        category: "delivery", timeAllowed: "2 hours", paymentType: "stars"
    },
    {
        title: "Тайный покупатель в кофейне",
        description: "Прийти в кофейню, заказать эспрессо, сделать фото чека и оценить вежливость бариста по 5-балльной шкале.",
        reward: 200, lat: 55.753, lng: 37.621, address: "Красная площадь, Москва",
        category: "help", timeAllowed: "4 hours", paymentType: "stars"
    },
    {
        title: "Раздать 50 флаеров у метро",
        description: "Нужно постоять у выхода из метро 1 час и раздать рекламные листовки целевой аудитории.",
        reward: 350, lat: 55.786, lng: 37.589, address: "Метро Белорусская, Москва",
        category: "promo", timeAllowed: "3 hours", paymentType: "stars"
    },
    {
        title: "Помочь настроить Wi-Fi роутер",
        description: "Неработает интернет в офисе, нужно прийти и перенастроить роутер Mikrotik.",
        reward: 500, lat: 55.729, lng: 37.601, address: "Улица Крымский Вал, 9, Москва",
        category: "it", timeAllowed: "today", paymentType: "stars"
    },

    // Saint Petersburg (Russia)
    {
        title: "Сделать фото Казанского собора",
        description: "Нужно 2 панорамных фото собора для туристической статьи.",
        reward: 75, lat: 59.934, lng: 30.324, address: "Невский проспект, Санкт-Петербург",
        category: "photo", timeAllowed: "12 hours", paymentType: "stars"
    },
    {
        title: "Купить и привезти кормом для собак",
        description: "Нужно зайти в зоомагазин и купить 3кг корма Royal Canin для мелких пород. Деньги скину на карту.",
        reward: 120, lat: 59.927, lng: 30.316, address: "Сенная площадь, Санкт-Петербург",
        category: "delivery", timeAllowed: "3 hours", paymentType: "cash", cashAmount: "500 RUB"
    },

    // New York (USA)
    {
        title: "Photo of Times Square Billboard",
        description: "Need a clear photo of the new Coca-Cola billboard in Times Square at night.",
        reward: 80, lat: 40.758, lng: -73.985, address: "Times Square, New York, NY",
        category: "photo", timeAllowed: "12 hours", paymentType: "stars"
    },
    {
        title: "Deliver documents to Wall Street",
        description: "Pick up a folder from an office building and deliver it to another office 3 blocks away.",
        reward: 150, lat: 40.706, lng: -74.009, address: "Wall Street, New York, NY",
        category: "delivery", timeAllowed: "2 hours", paymentType: "stars"
    },
    {
        title: "Help moving moving boxes",
        description: "Need an extra pair of hands for 1 hour to move some medium-sized boxes from 2nd floor to a truck.",
        reward: 300, lat: 40.730, lng: -73.997, address: "Washington Square Park, NY",
        category: "help", timeAllowed: "today", paymentType: "cash", cashAmount: "30 USD"
    },
    {
        title: "Distribute discount coupons",
        description: "Hand out 100 discount coupons near Central Park entrance.",
        reward: 200, lat: 40.768, lng: -73.981, address: "Central Park South, NY",
        category: "promo", timeAllowed: "4 hours", paymentType: "stars"
    },

    // London (UK)
    {
        title: "Check availability of item in Zara",
        description: "Please check if a specific black jacket (size M) is available in the Oxford street store and take a photo.",
        reward: 60, lat: 51.514, lng: -0.141, address: "Oxford Street, London",
        category: "help", timeAllowed: "24 hours", paymentType: "stars"
    },
    {
        title: "Take a photo of Big Ben",
        description: "Need a stock-like photo of the Elizabeth Tower for a blog post from Westminster bridge.",
        reward: 50, lat: 51.500, lng: -0.124, address: "Westminster, London",
        category: "photo", timeAllowed: "48 hours", paymentType: "stars"
    },
    {
        title: "IT Support: Install Windows",
        description: "Need an IT guy to reinstall Windows 11 on my laptop.",
        reward: 450, lat: 51.520, lng: -0.098, address: "Barbican Centre, London",
        category: "it", timeAllowed: "today", paymentType: "stars"
    },

    // Paris (France)
    {
        title: "Buy a croissant from Paul bakery",
        description: "Just buy me a fresh croissant from Paul and bring it to my office nearby.",
        reward: 45, lat: 48.870, lng: 2.332, address: "Opéra Garnier, Paris",
        category: "delivery", timeAllowed: "1 hour", paymentType: "cash", cashAmount: "10 EUR"
    },
    {
        title: "Photo of Eiffel Tower park condition",
        description: "Need a photo showing the current crowd status at the Champ de Mars to decide if we want to go there.",
        reward: 30, lat: 48.856, lng: 2.298, address: "Champ de Mars, Paris",
        category: "photo", timeAllowed: "2 hours", paymentType: "stars"
    },

    // Tokyo (Japan)
    {
        title: "Check Akihabara store for anime figure",
        description: "Please go to Mandarake in Akihabara and check if they have the limited edition Goku figure.",
        reward: 120, lat: 35.702, lng: 139.771, address: "Akihabara, Tokyo",
        category: "help", timeAllowed: "2 days", paymentType: "stars"
    },
    {
        title: "Photo of Shibuya Crossing",
        description: "Need a high vantage point photo of the Shibuya scramble crossing during rush hour.",
        reward: 150, lat: 35.659, lng: 139.700, address: "Shibuya, Tokyo",
        category: "photo", timeAllowed: "tomorrow", paymentType: "stars"
    },

    // Dubai (UAE)
    {
        title: "Take video of Burj Khalifa light show",
        description: "Need a 1-minute 4k video of the Burj Khalifa evening fountain and light show from the bridge.",
        reward: 250, lat: 25.197, lng: 55.274, address: "Dubai Mall, Dubai",
        category: "photo", timeAllowed: "Evening", paymentType: "stars"
    },
    {
        title: "Deliver keys to Marina",
        description: "I left my apartment keys with a friend, need someone to pick them up and bring to Dubai Marina.",
        reward: 180, lat: 25.080, lng: 55.140, address: "Dubai Marina",
        category: "delivery", timeAllowed: "3 hours", paymentType: "stars"
    },

    // Sydney (Australia)
    {
        title: "Check surf conditions at Bondi Beach",
        description: "Need a photo of the waves at Bondi Beach and current crowd level.",
        reward: 40, lat: -33.891, lng: 151.274, address: "Bondi Beach, Sydney",
        category: "photo", timeAllowed: "1 hour", paymentType: "stars"
    },
    {
        title: "Help assemble IKEA desk",
        description: "Need helping hand for an hour to put together an IKEA Bekant desk.",
        reward: 300, lat: -33.868, lng: 151.209, address: "Sydney CBD",
        category: "help", timeAllowed: "tomorrow", paymentType: "cash", cashAmount: "40 AUD"
    },

    // Berlin (Germany)
    {
        title: "Photo of Brandenburg Gate",
        description: "Photo of Brandenburg gate during sunset without too many people in front.",
        reward: 80, lat: 52.516, lng: 13.377, address: "Pariser Platz, Berlin",
        category: "photo", timeAllowed: "Evening", paymentType: "stars"
    },
    {
        title: "Pick up food from vegan restaurant",
        description: "Bring a takeaway order from a nearby vegan place to my startup office.",
        reward: 60, lat: 52.520, lng: 13.405, address: "Alexanderplatz, Berlin",
        category: "delivery", timeAllowed: "1 hour", paymentType: "stars"
    },

    // Toronto (Canada)
    {
        title: "CN Tower photo",
        description: "Need a photo of CN tower from the Toronto Islands ferry.",
        reward: 100, lat: 43.642, lng: -79.387, address: "Downtown Toronto",
        category: "photo", timeAllowed: "anytime", paymentType: "stars"
    },

    // Los Angeles (USA)
    {
        title: "Beverly Hills coffee delivery",
        description: "Bring 2 iced lattes from Starbucks to Rodeo drive.",
        reward: 80, lat: 34.073, lng: -118.400, address: "Beverly Hills, CA",
        category: "delivery", timeAllowed: "1 hour", paymentType: "stars"
    },
    {
        title: "Hand out flyers at Venice Beach",
        description: "Distribute 50 flyers for a new surfing school near the skate park.",
        reward: 200, lat: 33.985, lng: -118.469, address: "Venice Beach, LA",
        category: "promo", timeAllowed: "today", paymentType: "stars"
    },

    // Singapore
    {
        title: "Photo in Marina Bay Sands",
        description: "Take high-res photos inside the shopping mall area of Marina Bay Sands.",
        reward: 90, lat: 1.283, lng: 103.860, address: "Marina Bay, Singapore",
        category: "photo", timeAllowed: "2 days", paymentType: "stars"
    },

    // Rio de Janeiro (Brazil)
    {
        title: "Check beach weather at Copacabana",
        description: "Send a video of Copacabana beach to check if it's currently raining.",
        reward: 35, lat: -22.971, lng: -43.182, address: "Copacabana, Rio",
        category: "photo", timeAllowed: "30 mins", paymentType: "stars"
    },

    // Almaty (Kazakhstan)
    {
        title: "Отвезти посылку на Медео",
        description: "Нужно забрать небольшой пакет в центре Алматы и отвезти на высокогорный каток Медео.",
        reward: 250, lat: 43.157, lng: 77.059, address: "Каток Медео, Алматы",
        category: "delivery", timeAllowed: "сегодня", paymentType: "stars"
    }
];

async function seed() {
    try {
        console.log('Создаем тестового пользователя для публикации заданий...');

        // Upsert dummy user
        const customer = await prisma.user.upsert({
            where: { id: 'test_seed_customer' },
            create: {
                id: 'test_seed_customer',
                firstName: 'Global',
                username: 'global_customer',
                role: 'customer',
                balance: 1000000,
                verificationStatus: 'verified'
            },
            update: {
                balance: 1000000
            }
        });

        console.log('Тестовый пользователь создан. Генерируем задания...');

        for (const task of TASKS) {
            await prisma.task.create({
                data: {
                    ...task,
                    customerId: customer.id,
                }
            });
            console.log(`Создано: ${task.title}`);
        }

        console.log(`\nУспешно добавлено ${TASKS.length} заданий по всему миру!`);
    } catch (e) {
        console.error('Ошибка при сидировании:', e);
    } finally {
        await prisma.$disconnect();
    }
}

seed();
