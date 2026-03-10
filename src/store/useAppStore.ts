import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { translations } from '../translations';
import type { Language } from '../translations';

const API_URL = '/api';

export interface User {
    id: string;
    firstName: string;
    username?: string;
    photoUrl?: string;
    balance: number;
    bonusBalance: number;   // non-withdrawable (signup bonus)
    earnedBalance: number;  // withdrawable (tasks + purchases)
    tasksCompleted: number; // for withdrawal eligibility
    role: Role;
    rating: number;
    reviewCount: number;
    _count?: {
        referrals: number;
    };
    verificationStatus: 'none' | 'pending' | 'verified' | 'rejected';
    isAdmin?: boolean;
}

export type Role = 'executor' | 'customer';

export type TaskStatus = 'available' | 'accepted' | 'completed' | 'under_review' | 'cancelled';

export interface TaskUser {
    id: string;
    firstName: string;
    photoUrl?: string;
    rating: number;
    reviewCount?: number;
    verificationStatus: 'none' | 'pending' | 'verified' | 'rejected';
}

export interface Task {
    id: number;
    title: string;
    description: string;
    reward: number;
    status: TaskStatus;
    lat: number;
    lng: number;
    distance?: string;
    timeAllowed?: string;
    acceptedAt?: string;
    customerId: string;
    executorId?: string;
    proofPhotoUrl?: string;
    category?: string;
    address?: string;
    customer?: TaskUser;
    executor?: TaskUser;
    paymentType?: 'stars' | 'cash';
    cashAmount?: string;
    isOnline?: boolean;
}

export interface Transaction {
    id: number;
    title: string;
    amount: number;
    type: 'earn' | 'bonus' | 'spend' | 'refund' | 'topup' | 'withdraw';
    createdAt: string;
}

export interface AppNotification {
    id: number;
    message: string;
    type: 'info' | 'success' | 'warning' | 'error';
}

export interface ChatMessage {
    id: number;
    text: string;
    taskId: number;
    senderId: string;
    sender: User;
    createdAt: string;
}

interface AppState {
    user: User | null;
    role: Role;
    balance: number;
    tasks: Task[];
    transactions: Transaction[];
    notifications: AppNotification[];
    messages: ChatMessage[];
    unreadCount: number;
    userLocation: [number, number] | null;
    isLoadingTasks: boolean;

    login: (tgUser: any) => Promise<void>;
    setRole: (role: Role) => void;
    fetchTasks: () => Promise<void>;
    fetchMyTasks: () => Promise<void>;
    acceptTask: (id: number) => Promise<void>;
    completeTask: (id: number, proofPhotoUrl?: string) => Promise<void>;
    approveTask: (id: number, rating?: number, comment?: string) => Promise<void>;
    addTask: (task: { title: string, description: string, reward: number, lat: number, lng: number, category: string, address?: string, paymentType?: 'stars' | 'cash', cashAmount?: string, isOnline?: boolean }) => Promise<void>;
    setUserLocation: (coords: [number, number]) => void;
    abandonTask: (id: number) => Promise<void>;
    cancelOwnTask: (id: number) => Promise<void>;
    refreshUser: () => Promise<void>;
    uploadPhoto: (file: File) => Promise<string | null>;
    logout: () => void;
    buyStars: (stars: number) => Promise<void>;
    withdraw: (amount: number, walletAddress: string) => Promise<void>;
    submitVerification: (photoUrl: string) => Promise<void>;

    // Chat actions
    fetchMessages: (taskId: number) => Promise<void>;
    sendMessage: (taskId: number, text: string) => Promise<void>;
    fetchUnreadCount: () => Promise<void>;

    // Notifications actions
    notify: (message: string, type?: AppNotification['type']) => void;
    dismissNotification: (id: number) => void;

    // Translation
    language: Language;
    setLanguage: (lang: Language) => void;
    t: (path: string) => any;

    // UI/UX
    theme: 'system' | 'light' | 'dark';
    setTheme: (t: 'system' | 'light' | 'dark') => void;
    haptic: (type: 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error' | 'selection') => void;
}

export const useAppStore = create<AppState>()(
    persist(
        (set, get) => ({
            user: null,
            role: 'executor',
            balance: 0,
            tasks: [],
            transactions: [],
            notifications: [],
            messages: [],
            unreadCount: 0,
            userLocation: null,
            isLoadingTasks: true,
            language: 'ru',
            theme: 'system',

            setTheme: (theme) => set({ theme }),

            haptic: (type) => {
                const tg = window.Telegram?.WebApp;
                if (!tg?.HapticFeedback) return;

                try {
                    if (['light', 'medium', 'heavy'].includes(type)) {
                        tg.HapticFeedback.impactOccurred(type as 'light' | 'medium' | 'heavy');
                    } else if (['success', 'warning', 'error'].includes(type)) {
                        tg.HapticFeedback.notificationOccurred(type as 'success' | 'warning' | 'error');
                    } else if (type === 'selection') {
                        tg.HapticFeedback.selectionChanged();
                    }
                } catch (e) {
                    console.error('Haptic error:', e);
                }
            },

            setLanguage: (lang) => set({ language: lang }),

            t: (path) => {
                const lang = get().language;
                const keys = path.split('.');
                let result: any = translations[lang];
                for (const key of keys) {
                    if (result && result[key]) {
                        result = result[key];
                    } else {
                        return path; // fallback to path string if not found
                    }
                }
                return result;
            },

            notify: (message, type = 'info') => {
                const id = Date.now();
                set(state => ({
                    notifications: [...state.notifications, { id, message, type }]
                }));
                setTimeout(() => get().dismissNotification(id), 4000);
            },

            dismissNotification: (id) => set(state => ({
                notifications: state.notifications.filter(n => n.id !== id)
            })),

            login: async (tgUser) => {
                try {
                    const res = await fetch(`${API_URL}/auth/login`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            id: String(tgUser.id),
                            firstName: tgUser.first_name || tgUser.firstName,
                            username: tgUser.username,
                            photoUrl: tgUser.photo_url || tgUser.photoUrl,
                            startParam: tgUser.start_param || null
                        })
                    });
                    const user = await res.json();
                    set({ user, balance: user.balance, role: (user.role as Role) || 'executor' });
                    await get().fetchTasks();
                    await get().refreshUser();
                } catch (err) {
                    get().notify('Ошибка авторизации', 'error');
                }
            },

            logout: () => {
                set({ user: null, balance: 0, tasks: [], transactions: [], role: 'executor' });
            },

            buyStars: async (stars) => {
                const { user } = get();
                if (!user) return;
                try {
                    const res = await fetch(`${API_URL}/user/${user.id}/buy-stars`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ stars })
                    });
                    const data = await res.json();
                    if (!res.ok || !data.success) throw new Error(data.error || 'API Error');

                    // Open the Telegram Stars payment modal natively in the Mini App
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    const tg = (window as any).Telegram?.WebApp;
                    if (tg?.openInvoice) {
                        tg.openInvoice(data.url, (status: string) => {
                            if (status === 'paid') {
                                // Wait a short moment to ensure backend webhook fully configures it
                                setTimeout(() => get().refreshUser(), 1500);
                                get().notify('Звёзды успешно приобретены!', 'success');
                            } else if (status === 'failed') {
                                get().notify('Оплата не удалась', 'error');
                            }
                            // 'cancelled' or 'pending' we can just silently ignore
                        });
                    } else {
                        get().notify('Пожалуйста, откройте приложение через Telegram', 'error');
                    }
                } catch (err) {
                    console.error(err);
                    get().notify('Ошибка при создании счета', 'error');
                }
            },

            withdraw: async (amount, walletAddress) => {
                const { user } = get();
                if (!user) return;
                try {
                    const res = await fetch(`${API_URL}/user/${user.id}/withdraw`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ amount, walletAddress })
                    });
                    const data = await res.json();
                    if (!res.ok) throw new Error(data.error || 'Ошибка вывода');
                    await get().refreshUser();
                    get().notify(`Запрос на вывод ${amount} ★ отправлен!`, 'success');
                } catch (err) {
                    get().notify((err as Error).message || 'Ошибка вывода', 'error');
                }
            },

            submitVerification: async (photoUrl) => {
                const { user } = get();
                if (!user) return;
                try {
                    const res = await fetch(`${API_URL}/user/${user.id}/verify`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ photoUrl })
                    });
                    if (!res.ok) throw new Error();
                    const updatedUser = await res.json();
                    set({ user: updatedUser });
                    get().notify('Документ отправлен на проверку', 'success');
                } catch (err) {
                    get().notify('Ошибка отправки на верификацию', 'error');
                }
            },

            setRole: (role) => set({ role }),

            refreshUser: async () => {
                const { user } = get();
                if (!user) return;
                try {
                    const res = await fetch(`${API_URL}/user/${user.id}`);
                    const updatedUser = await res.json();
                    set({
                        user: updatedUser,
                        balance: updatedUser.balance,
                        transactions: updatedUser.transactions || []
                    });
                } catch (err) {
                    console.error('Refresh user error:', err);
                }
            },

            fetchTasks: async () => {
                const { userLocation } = get();
                set({ isLoadingTasks: true });
                try {
                    let url = `${API_URL}/tasks`;
                    if (userLocation) {
                        url += `?lat=${userLocation[0]}&lng=${userLocation[1]}`;
                    }
                    const res = await fetch(url);
                    const tasks = await res.json();
                    set({ tasks, isLoadingTasks: false });
                } catch (err) {
                    console.error('Fetch tasks error:', err);
                    set({ isLoadingTasks: false });
                }
            },

            fetchMyTasks: async () => {
                const { user } = get();
                if (!user) return;
                try {
                    const res = await fetch(`${API_URL}/tasks/my/${user.id}`);
                    const tasks = await res.json();
                    set({ tasks });
                } catch (err) {
                    console.error('Fetch my tasks error:', err);
                }
            },

            fetchMessages: async (taskId) => {
                const { user } = get();
                if (!user) return;
                try {
                    const res = await fetch(`${API_URL}/tasks/${taskId}/messages?userId=${user.id}`);
                    const messages = await res.json();
                    set({ messages });
                    await get().fetchUnreadCount();
                } catch (err) {
                    console.error('Fetch messages error:', err);
                }
            },

            sendMessage: async (taskId, text) => {
                const { user } = get();
                if (!user) return;
                try {
                    const res = await fetch(`${API_URL}/tasks/${taskId}/messages`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ text, senderId: user.id })
                    });
                    if (!res.ok) throw new Error();
                    await get().fetchMessages(taskId);
                    await get().fetchUnreadCount();
                } catch (err) {
                    get().notify('Ошибка при отправке', 'error');
                }
            },

            fetchUnreadCount: async () => {
                const { user } = get();
                if (!user) return;
                try {
                    const res = await fetch(`${API_URL}/unread-count/${user.id}`);
                    const { count } = await res.json();
                    set({ unreadCount: count });
                } catch (err) {
                    console.error('Fetch unread count error:', err);
                }
            },

            uploadPhoto: async (file) => {
                const formData = new FormData();
                formData.append('photo', file);
                try {
                    const res = await fetch(`${API_URL}/upload`, {
                        method: 'POST',
                        body: formData
                    });
                    const data = await res.json();
                    return data.url;
                } catch (err) {
                    get().notify('Ошибка загрузки фото', 'error');
                    return null;
                }
            },

            acceptTask: async (id) => {
                const { user } = get();
                if (!user) return;
                try {
                    const res = await fetch(`${API_URL}/tasks/${id}/accept`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ userId: user.id })
                    });
                    if (!res.ok) throw new Error();

                    get().notify('Задание принято!', 'success');
                    await get().fetchTasks();
                } catch (err) {
                    get().notify('Не удалось принять задание', 'error');
                }
            },

            completeTask: async (id, proofPhotoUrl = '') => {
                try {
                    const res = await fetch(`${API_URL}/tasks/${id}/complete`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ proofPhotoUrl })
                    });
                    if (!res.ok) throw new Error();

                    get().notify('Отправлено на проверку', 'success');
                    await get().fetchMyTasks();
                    await get().refreshUser();
                } catch (err) {
                    get().notify('Ошибка при сдаче задания', 'error');
                }
            },

            approveTask: async (id, rating, comment) => {
                try {
                    const res = await fetch(`${API_URL}/tasks/${id}/approve`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ rating, comment })
                    });
                    if (!res.ok) throw new Error();

                    get().notify('Задание завершено!', 'success');
                    await get().fetchMyTasks();
                    await get().refreshUser();
                } catch (err) {
                    get().notify('Ошибка при одобрении', 'error');
                }
            },

            abandonTask: async (id) => {
                try {
                    await fetch(`${API_URL}/tasks/${id}/abandon`, { method: 'POST' });
                    get().notify('Вы отказались от задания', 'warning');
                    await get().fetchMyTasks();
                    await get().fetchTasks();
                } catch (err) {
                    get().notify('Ошибка', 'error');
                }
            },

            cancelOwnTask: async (id) => {
                try {
                    await fetch(`${API_URL}/tasks/${id}`, { method: 'DELETE' });
                    get().notify('Задание отменено', 'info');
                    await get().fetchMyTasks();
                    await get().refreshUser();
                } catch (err) {
                    get().notify('Не удалось отменить задание', 'error');
                }
            },

            addTask: async (taskData) => {
                const { user } = get();
                if (!user) return;
                try {
                    const res = await fetch(`${API_URL}/tasks`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ ...taskData, customerId: user.id })
                    });
                    if (!res.ok) {
                        const data = await res.json();
                        throw new Error(data.error || 'Ошибка');
                    }

                    get().notify('Задание опубликовано', 'success');
                    await get().fetchTasks();
                    await get().refreshUser();
                } catch (err) {
                    get().notify((err as Error).message, 'error');
                }
            },

            setUserLocation: async (coords) => {
                set({ userLocation: coords });
                const { user } = get();
                if (user && coords) {
                    try {
                        await fetch(`${API_URL}/user/${user.id}/location`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ lat: coords[0], lng: coords[1] })
                        });
                    } catch (e) {
                        console.error('Failed to sync location', e);
                    }
                }
            }
        }),
        {
            name: 'easy-quest-storage',
            partialize: (state) => ({ role: state.role, language: state.language }),
        }
    )
);
