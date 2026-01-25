import React, { useState, useCallback, useEffect } from 'react';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import ChatContainer from './components/ChatContainer';
import ProfileModal from './components/ProfileModal';
import DataSourcesModal from './components/DataSourcesModal';
import { User, Conversation, UploadStatus, ChatConfig, Message } from './types';
import { authApi } from './utils/api';
import Auth from './components/Auth';
import UploadStatusBar from './components/UploadStatusBar';

function App() {
    const [user, setUser] = useState<User | null>(null);
    const [config, setConfig] = useState<ChatConfig>(() => {
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
            try {
                const userData = await authApi.getMe();
                setUser(userData);
            } catch (err) {
                setUser(null);
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
        <div className="flex h-screen mesh-bg font-sans selection:bg-[#38bdf8]/30">
            <Sidebar
                onSelectConversation={setCurrentConversationId}
                onNewChat={clearChat}
                currentConversationId={currentConversationId}
                onOpenDataSources={() => setShowDataSourcesModal(true)}
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

            <ProfileModal
                isOpen={showProfile}
                onClose={() => setShowProfile(false)}
                user={user}
                onUserUpdate={setUser}
            />
            <DataSourcesModal
                isOpen={showDataSourcesModal}
                onClose={() => setShowDataSourcesModal(false)}
                onUploadStatusChange={setUploadStatus}
            />
        </div>
    );
}

export default App;
