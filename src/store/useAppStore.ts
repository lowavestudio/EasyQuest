import { create } from 'zustand';

const API_URL = '/api';

export interface User {
    id: string;
    firstName: string;
    username?: string;
    photoUrl?: string;
    balance: number;
    role: Role;
    rating: number;
    reviewCount: number;
}

export type Role = 'executor' | 'customer';

export type TaskStatus = 'available' | 'accepted' | 'completed' | 'under_review' | 'cancelled';

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
}

export interface Transaction {
    id: number;
    title: string;
    amount: number;
    type: 'earn' | 'bonus' | 'spend' | 'refund';
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

    login: (tgUser: any) => Promise<void>;
    setRole: (role: Role) => void;
    fetchTasks: () => Promise<void>;
    fetchMyTasks: () => Promise<void>;
    acceptTask: (id: number) => Promise<void>;
    completeTask: (id: number, proofPhotoUrl?: string) => Promise<void>;
    approveTask: (id: number, rating?: number, comment?: string) => Promise<void>;
    addTask: (task: { title: string, description: string, reward: number, lat: number, lng: number, category: string }) => Promise<void>;
    setUserLocation: (coords: [number, number]) => void;
    abandonTask: (id: number) => Promise<void>;
    cancelOwnTask: (id: number) => Promise<void>;
    refreshUser: () => Promise<void>;
    uploadPhoto: (file: File) => Promise<string | null>;
    logout: () => void;
    topUp: (amount: number) => Promise<void>;

    // Chat actions
    fetchMessages: (taskId: number) => Promise<void>;
    sendMessage: (taskId: number, text: string) => Promise<void>;
    fetchUnreadCount: () => Promise<void>;

    // Notifications actions
    notify: (message: string, type?: AppNotification['type']) => void;
    dismissNotification: (id: number) => void;
}

export const useAppStore = create<AppState>((set, get) => ({
    user: null,
    role: 'executor',
    balance: 0,
    tasks: [],
    transactions: [],
    notifications: [],
    messages: [],
    unreadCount: 0,
    userLocation: null,

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
                    photoUrl: tgUser.photo_url || tgUser.photoUrl
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

    topUp: async (amount) => {
        const { user } = get();
        if (!user) return;
        try {
            const res = await fetch(`${API_URL}/user/${user.id}/topup`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ amount })
            });
            if (!res.ok) throw new Error();
            await get().refreshUser();
            get().notify(`Баланс пополнен на ${amount} ★`, 'success');
        } catch (err) {
            get().notify('Ошибка пополнения', 'error');
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
        try {
            const res = await fetch(`${API_URL}/tasks`);
            const tasks = await res.json();
            set({ tasks });
        } catch (err) {
            console.error('Fetch tasks error:', err);
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

    setUserLocation: (coords) => set({ userLocation: coords })
}));
