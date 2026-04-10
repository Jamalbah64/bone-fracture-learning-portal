
// Creates a notification context for managing and displaying notifications

import { createContext, useCallback, useContext, useMemo, useState } from "react";

const NotificationContext = createContext(null);

export function NotificationProvider({ children }) {
    const [notifications, setNotifications] = useState([]);

    const removeNotification = useCallback((id) => {
        setNotifications((prev) => prev.filter((item) => item.id !== id));
    }, []);

    const notify = useCallback((message, type = "info", duration = 3500) => {
        const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

        setNotifications((prev) => [...prev, { id, message, type }]);

        window.setTimeout(() => {
            removeNotification(id);
        }, duration);
    }, [removeNotification]);

    const value = useMemo(() => ({
        notify,
        removeNotification,
    }), [notify, removeNotification]);

    return (
        <NotificationContext.Provider value={value}>
            {children}

            <div className="toast-stack">
                {notifications.map((item) => (
                    <div key={item.id} className={`toast toast-${item.type}`}>
                        <div className="toast-message">{item.message}</div>
                        <button
                            className="toast-close"
                            onClick={() => removeNotification(item.id)}
                            aria-label="Close notification"
                        >
                            ×
                        </button>
                    </div>
                ))}
            </div>
        </NotificationContext.Provider>
    );
}

export function useNotification() {
    const context = useContext(NotificationContext);

    if (!context) {
        throw new Error("useNotification must be used within a NotificationProvider");
    }

    return context;
}
