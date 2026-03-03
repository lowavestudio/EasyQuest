export type Language = 'ru' | 'en';

export const translations = {
    ru: {
        nav: {
            feed: 'Лента',
            tasks: 'Задания',
            wallet: 'Кошелек',
            profile: 'Профиль'
        },
        feed: {
            title: 'Лента заданий',
            search: 'Поиск заданий...',
            available: 'доступно',
            nearby: 'Задания рядом',
            my_tasks: 'Ваши задания',
            no_tasks: 'Заданий нет',
            no_tasks_text: 'По выбранному фильтру пока нет доступных заданий',
            locate_me: 'Найти меня',
            chips: {
                all: 'Все',
                near: 'Рядом',
                delivery: 'Доставка',
                photo: 'Фото/Видео',
                help: 'Помощь',
                it: 'IT',
                promo: 'Промо',
                other: 'Другое',
                reward: 'Высокая награда'
            }
        },
        wallet: {
            title: 'Кошелёк',
            total_balance: 'ОБЩИЙ БАЛАНС',
            available_withdraw: 'Доступно для вывода',
            bonuses: 'Бонусы (для заданий)',
            activity_7d: 'Активность за 7 дней',
            buy_stars: 'Пополнить баланс',
            withdraw: 'Вывести',
            history: 'История операций',
            no_history: 'Пока нет операций',
            no_history_text: 'Здесь будет отображаться история ваших заработков и трат',
            withdraw_modal: {
                title: 'Вывод средств',
                min_tasks: 'Для вывода средств необходимо выполнить минимум 3 задания.',
                min_amount: 'Минимальная сумма вывода — 500 Stars.',
                amount_label: 'Сумма вывода (Star)',
                address_label: 'Ваш TON кошелёк',
                button: 'Запросить вывод'
            },
            topup_modal: {
                title: 'Пополнить баланс',
                official_tg: 'Оплата происходит официально через Telegram Stars.'
            }
        },
        profile: {
            title: 'Профиль',
            reviews: 'отзывов',
            balance: 'БАЛАНС',
            completed: 'СДАНО',
            active: 'АКТИВНЫХ',
            role_label: 'Роль',
            role_executor: 'Исполнитель',
            role_customer: 'Заказчик',
            role_desc: 'Исполнитель зарабатывает звёзды, выполняя задания. Заказчик создаёт задания.',
            referral_title: 'Партнёрская программа',
            referral_desc: 'Приглашайте друзей и получайте 5% от каждого выполненного ими задания пожизненно!',
            referral_link: 'Ваша ссылка',
            copy: 'Копировать',
            copied: 'Скопировано!',
            settings: 'Настройки',
            help: 'Помощь и FAQ',
            verification: 'Верификация профиля',
            admin_panel: 'АДМИН-ПАНЕЛЬ',
            privacy: 'Политика конфиденциальности',
            logout: 'Выйти',
            wallet_connect: 'TON Кошелёк',
            status: {
                verified: 'Верифицирован',
                pending: 'На проверке',
                none: 'Не верифицирован'
            }
        },
        create_task: {
            title: 'Новое задание',
            category: 'Категория',
            task_title: 'Название',
            description: 'Описание и инструкции',
            reward: 'Награда',
            location: 'Место выполнения',
            publish_btn: 'Опубликовать задание',
            placeholders: {
                title: 'Например: Аудит витрины магазина',
                description: 'Что должен сделать исполнитель?',
                address: 'Поиск адреса...'
            }
        },
        task_details: {
            title: 'Детали задания',
            reward_label: 'Награда',
            description_title: 'Описание и инструкции',
            requirements_title: 'Требования',
            customer_title: 'Заказчик',
            report_title: 'Отчёт исполнителя',
            status: {
                cancelled: 'Отменено',
                reviewing: 'На проверке',
                accepted: 'В работе',
                completed: 'Завершено'
            },
            actions: {
                accept: 'Принять задание',
                accepting: 'Принятие...',
                abandon: 'Отказаться от задания',
                chat: 'Чат с заказчиком',
                chat_executor: 'Чат с исполнителем',
                submit: 'Сдать задание (загрузить фото)',
                uploading: 'Загрузка...',
                cancel: 'Отменить задание',
                cancelling: 'Отмена...',
                approve: 'Принять и оплатить',
                approving: 'Завершение...'
            },
            warnings: {
                accept: 'Принимая задание, вы соглашаетесь выполнить его в установленный срок.',
                reviewing: 'Ваша работа на проверке у заказчика',
                waiting: 'Задание принято. Ожидайте выполнения.'
            },
            requirements: [
                'Сделайте минимум 1 чёткое фото',
                'GPS-локация должна совпадать с меткой',
                'Сдайте в течение 2 часов после принятия'
            ]
        },
        my_tasks: {
            title: 'Мои задания',
            tabs: {
                active: 'Активные',
                history: 'История'
            },
            empty_active_title: 'Нет активных заданий',
            empty_active_text: 'Примите задание из ленты, чтобы начать зарабатывать звёзды',
            find_tasks: 'Найти задания',
            empty_history_title: 'История пуста',
            empty_history_text: 'Здесь будут отображаться завершённые и отменённые задания',
            status: {
                reviewing: 'На проверке',
                completed: 'Выполнено',
                cancelled: 'Отменено'
            },
            role: {
                customer: 'Вы — заказчик',
                executor: 'Вы — исполнитель'
            },
            actions: {
                submit: 'Сдать',
                uploading: 'Загрузка...',
                abandon: 'Отказ'
            },
            abandon_modal: {
                title: 'Отказаться от задания?',
                message: 'Задание вернётся в ленту и станет доступно другим исполнителям.',
                confirm: 'Да, отказаться',
                cancel: 'Нет, продолжить'
            }
        },
        verification: {
            title: 'Верификация',
            top_title: 'Пройдите KYC верификацию',
            top_desc: 'Верифицированные исполнители получают в 3 раза больше заданий и больше доверия от заказчиков.',
            how_to: 'Как это сделать?',
            steps: [
                'Возьмите в руку свой паспорт или ID карту.',
                'Сделайте селфи так, чтобы было четко видно ваше лицо и данные на документе.',
                'Загрузите фото ниже.'
            ],
            upload_hint: 'Нажмите, чтобы загрузить селфи с паспортом',
            change_photo: 'Изменить фото',
            submit: 'Отправить на проверку',
            submitting: 'Отправляем данные...',
            verified_title: 'Аккаунт верифицирован',
            verified_desc: 'Вы официально подтвердили свою личность. Теперь заказчики видят специальную галочку рядом с вашим именем и больше доверяют вам!',
            pending_title: 'Документы проверяются',
            pending_desc: 'Мы получили вашу фотографию. Обычно проверка занимает не более 24 часов. Вы получите уведомление по её завершению.',
            rejected_title: 'Проверка не пройдена',
            rejected_desc: 'К сожалению, мы не смогли подтвердить вашу личность. Вероятно, фото было размытым или документ не читается.',
            retry: 'Попробовать снова'
        },
        common: {
            stars: 'Stars',
            loading: 'Загрузка...',
            error: 'Ошибка',
            success: 'Успех',
            km: 'км',
            min: 'мин',
            back: 'Назад',
            distance_near: 'рядом'
        }
    },
    en: {
        nav: {
            feed: 'Feed',
            tasks: 'Tasks',
            wallet: 'Wallet',
            profile: 'Profile'
        },
        feed: {
            title: 'Task Feed',
            search: 'Search tasks...',
            available: 'available',
            nearby: 'Nearby Tasks',
            my_tasks: 'Your Tasks',
            no_tasks: 'No tasks',
            no_tasks_text: 'No available tasks for the selected filters',
            locate_me: 'Locate me',
            chips: {
                all: 'All',
                near: 'Near',
                delivery: 'Delivery',
                photo: 'Photo/Video',
                help: 'Help',
                it: 'IT',
                promo: 'Promo',
                other: 'Other',
                reward: 'High Reward'
            }
        },
        wallet: {
            title: 'Wallet',
            total_balance: 'TOTAL BALANCE',
            available_withdraw: 'Available for withdraw',
            bonuses: 'Bonuses (for tasks)',
            activity_7d: 'Activity (7 days)',
            buy_stars: 'Top Up Balance',
            withdraw: 'Withdraw',
            history: 'Transaction History',
            no_history: 'No transactions yet',
            no_history_text: 'Your earnings and spending history will appear here',
            withdraw_modal: {
                title: 'Withdraw Funds',
                min_tasks: 'Minimum 3 completed tasks required to withdraw.',
                min_amount: 'Minimum withdrawal amount is 500 Stars.',
                amount_label: 'Withdraw amount (Star)',
                address_label: 'Your TON wallet',
                button: 'Request withdrawal'
            },
            topup_modal: {
                title: 'Top Up Balance',
                official_tg: 'Payments are processed officially via Telegram Stars.'
            }
        },
        profile: {
            title: 'Profile',
            reviews: 'reviews',
            balance: 'BALANCE',
            completed: 'DONE',
            active: 'ACTIVE',
            role_label: 'Role',
            role_executor: 'Executor',
            role_customer: 'Customer',
            role_desc: 'Executor earns stars by completing tasks. Customer creates tasks.',
            referral_title: 'Partner Program',
            referral_desc: 'Invite friends and get 5% from every task they complete for life!',
            referral_link: 'Your link',
            copy: 'Copy',
            copied: 'Copied!',
            settings: 'Settings',
            help: 'Help & FAQ',
            verification: 'Profile Verification',
            admin_panel: 'ADMIN PANEL',
            privacy: 'Privacy Policy',
            logout: 'Logout',
            wallet_connect: 'TON Wallet',
            status: {
                verified: 'Verified',
                pending: 'Pending',
                none: 'Not Verified'
            }
        },
        create_task: {
            title: 'New Task',
            category: 'Category',
            task_title: 'Title',
            description: 'Description and instructions',
            reward: 'Reward',
            location: 'Execution place',
            publish_btn: 'Publish Task',
            placeholders: {
                title: 'Example: Store window audit',
                description: 'What should the executor do?',
                address: 'Search address...'
            }
        },
        task_details: {
            title: 'Task Details',
            reward_label: 'Reward',
            description_title: 'Description and instructions',
            requirements_title: 'Requirements',
            customer_title: 'Customer',
            report_title: 'Executor Report',
            status: {
                cancelled: 'Cancelled',
                reviewing: 'Reviewing',
                accepted: 'Accepted',
                completed: 'Completed'
            },
            actions: {
                accept: 'Accept Task',
                accepting: 'Accepting...',
                abandon: 'Abandon Task',
                chat: 'Chat with Customer',
                chat_executor: 'Chat with Executor',
                submit: 'Submit Task (upload photo)',
                uploading: 'Uploading...',
                cancel: 'Cancel Task',
                cancelling: 'Cancelling...',
                approve: 'Approve and Pay',
                approving: 'Finishing...'
            },
            warnings: {
                accept: 'By accepting the task, you agree to complete it within the specified timeframe.',
                reviewing: 'Your work is under review by the customer',
                waiting: 'Task accepted. Waiting for completion.'
            },
            requirements: [
                'Take at least 1 clear photo',
                'GPS location must match the marker',
                'Submit within 2 hours after acceptance'
            ]
        },
        my_tasks: {
            title: 'My Tasks',
            tabs: {
                active: 'Active',
                history: 'History'
            },
            empty_active_title: 'No active tasks',
            empty_active_text: 'Accept a task from the feed to start earning stars',
            find_tasks: 'Find tasks',
            empty_history_title: 'History is empty',
            empty_history_text: 'Completed and cancelled tasks will appear here',
            status: {
                reviewing: 'Reviewing',
                completed: 'Completed',
                cancelled: 'Cancelled'
            },
            role: {
                customer: 'You are customer',
                executor: 'You are executor'
            },
            actions: {
                submit: 'Submit',
                uploading: 'Uploading...',
                abandon: 'Abandon'
            },
            abandon_modal: {
                title: 'Abandon task?',
                message: 'Task will return to the feed and become available to other executors.',
                confirm: 'Yes, abandon',
                cancel: 'No, continue'
            }
        },
        verification: {
            title: 'Verification',
            top_title: 'Complete KYC verification',
            top_desc: 'Verified executors receive 3x more tasks and more trust from customers.',
            how_to: 'How to do it?',
            steps: [
                'Take your passport or ID card in your hand.',
                'Take a selfie so that your face and the details on the document are clearly visible.',
                'Upload the photo below.'
            ],
            upload_hint: 'Tap to upload a selfie with passport',
            change_photo: 'Change photo',
            submit: 'Submit for review',
            submitting: 'Submitting data...',
            verified_title: 'Account verified',
            verified_desc: 'You have officially verified your identity. Now customers see a special checkmark next to your name and trust you more!',
            pending_title: 'Documents are under review',
            pending_desc: 'We have received your photo. Verification usually takes no more than 24 hours. You will receive a notification upon its completion.',
            rejected_title: 'Verification failed',
            rejected_desc: 'Unfortunately, we were unable to verify your identity. The photo was likely blurry or the document is unreadable.',
            retry: 'Try again'
        },
        common: {
            stars: 'Stars',
            loading: 'Loading...',
            error: 'Error',
            success: 'Success',
            km: 'km',
            min: 'min',
            back: 'Back',
            distance_near: 'near'
        }
    }
};
