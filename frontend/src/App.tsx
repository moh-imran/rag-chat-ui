import { useState, useEffect } from 'react';
import ChatContainer from './components/ChatContainer';
import Header from './components/Header';
import SettingsPanel from './components/SettingsPanel';
import UploadStatusBar from './components/UploadStatusBar';
import Auth from './components/Auth';
import Sidebar from './components/Sidebar';
import { Message, ChatConfig, UploadStatus, User } from './types';
import { authApi } from './utils/api';

function App() {
    const [isAuthenticated, setIsAuthenticated] = useState<boolean>(!!localStorage.getItem('token'));
    const [user, setUser] = useState<User | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [config, setConfig] = useState<ChatConfig>({
        topK: 5,
        temperature: 0.7,
        showSources: true,
    });
    const [showSettings, setShowSettings] = useState(false);
    const [uploadStatus, setUploadStatus] = useState<UploadStatus | null>(null);
    const [currentConversationId, setCurrentConversationId] = useState<string | undefined>();

    useEffect(() => {
        if (isAuthenticated) {
            authApi.getMe().then(setUser).catch(() => setIsAuthenticated(false));
        }
    }, [isAuthenticated]);

    const clearChat = () => {
        setMessages([]);
        setCurrentConversationId(undefined);
    };

    const handleLogout = () => {
        authApi.logout();
        setIsAuthenticated(false);
        setUser(null);
        clearChat();
    };

    if (!isAuthenticated) {
        return <Auth onAuthSuccess={() => setIsAuthenticated(true)} />;
    }

    return (
        <div className="flex h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
            <Sidebar
                onSelectConversation={setCurrentConversationId}
                onNewChat={clearChat}
                currentConversationId={currentConversationId}
            />

            <div className="flex-1 flex flex-col min-w-0">
                <Header
                    onClearChat={clearChat}
                    onLogout={handleLogout}
                    onToggleSettings={() => setShowSettings(!showSettings)}
                    onUploadStatusChange={setUploadStatus}
                    user={user}
                />

                {showSettings && (
                    <SettingsPanel config={config} onConfigChange={setConfig} />
                )}

                {uploadStatus && <UploadStatusBar status={uploadStatus} />}

                <ChatContainer
                    messages={messages}
                    config={config}
                    onMessagesChange={setMessages}
                    conversationId={currentConversationId}
                    onConversationIdChange={setCurrentConversationId}
                />
            </div>
        </div>
    );
}

export default App;