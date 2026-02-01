import { useState, useCallback, useEffect, lazy, Suspense } from 'react';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import ChatContainer from './components/ChatContainer';
import { User, UploadStatus, ChatConfig, Message } from './types';
import { authApi } from './utils/api';
import Auth from './components/Auth';
import UploadStatusBar from './components/UploadStatusBar';

// Lazy load modals for better initial performance
const ProfileModal = lazy(() => import('./components/ProfileModal'));
const DataSourcesModal = lazy(() => import('./components/DataSourcesModal'));
const IntegrationsModal = lazy(() => import('./components/IntegrationsModal'));

function App() {
    const [user, setUser] = useState<User | null>(null);
    const [config] = useState<ChatConfig>(() => {
        // Load config from localStorage (set by admin panel)
        const savedConfig = localStorage.getItem('chatConfig');
        if (savedConfig) {
            try {
                return JSON.parse(savedConfig);
            } catch (e) {
                console.error('Failed to load chat config');
            }
        }
        return {
            topK: 5,
            temperature: 0.7,
            showSources: false,
            useHyde: false,
            routingStrategy: 'auto',
            selectedCollections: [],
            metadataFilters: {},
        };
    });
    const [showProfile, setShowProfile] = useState(false);
    const [showDataSourcesModal, setShowDataSourcesModal] = useState(false);
    const [showIntegrationsModal, setShowIntegrationsModal] = useState(false);
    const [uploadStatus, setUploadStatus] = useState<UploadStatus | null>(null);
    const [currentConversationId, setCurrentConversationId] = useState<string | undefined>();
    const [messages, setMessages] = useState<Message[]>([]);
    const [theme, setTheme] = useState<'light' | 'dark'>(() => {
        return (localStorage.getItem('theme') as 'light' | 'dark') || 'dark';
    });

    useEffect(() => {
        localStorage.setItem('theme', theme);
        document.documentElement.setAttribute('data-theme', theme);
    }, [theme]);

    useEffect(() => {
        const checkAuth = async () => {
            const token = localStorage.getItem('token');
            if (!token) {
                setUser(null);
                return;
            }
            try {
                const userData = await authApi.getMe();
                setUser(userData);
            } catch (err) {
                console.error('Auth check failed:', err);
                setUser(null);
                // The interceptor will have cleared the token if it was a 401
            }
        };
        checkAuth();
    }, []);

    const handleLogout = async () => {
        try {
            await authApi.logout();
            setUser(null);
        } catch (err) {
            console.error('Logout failed', err);
        }
    };

    const clearChat = useCallback(() => {
        setCurrentConversationId(undefined);
        setMessages([]);
    }, []);

    if (!user) {
        return <Auth onAuthSuccess={() => authApi.getMe().then(setUser)} />;
    }

    return (
        <div className="flex h-screen mesh-bg font-sans">
            <Sidebar
                onSelectConversation={setCurrentConversationId}
                onNewChat={clearChat}
                currentConversationId={currentConversationId}
                onOpenDataSources={() => setShowDataSourcesModal(true)}
                onOpenIntegrations={() => setShowIntegrationsModal(true)}
            />

            <div className="flex-1 flex flex-col min-w-0">
                <Header user={user} onOpenProfile={() => setShowProfile(true)} onLogout={handleLogout} theme={theme} onToggleTheme={() => setTheme(prev => prev === 'light' ? 'dark' : 'light')} />

                {uploadStatus && <UploadStatusBar status={uploadStatus} />}

                <ChatContainer
                    conversationId={currentConversationId}
                    messages={messages}
                    onMessagesChange={setMessages}
                    onConversationIdChange={setCurrentConversationId}
                    config={config}
                />
            </div>

            <Suspense fallback={null}>
                {showProfile && (
                    <ProfileModal
                        isOpen={showProfile}
                        onClose={() => setShowProfile(false)}
                        user={user}
                        onUserUpdate={setUser}
                    />
                )}
                {showDataSourcesModal && (
                    <DataSourcesModal
                        isOpen={showDataSourcesModal}
                        onClose={() => setShowDataSourcesModal(false)}
                        onUploadStatusChange={setUploadStatus}
                    />
                )}
                {showIntegrationsModal && (
                    <IntegrationsModal
                        isOpen={showIntegrationsModal}
                        onClose={() => setShowIntegrationsModal(false)}
                    />
                )}
            </Suspense>
        </div>
    );
}

export default App;
