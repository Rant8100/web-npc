import Chat from './pages/Chat';
import NPCManagement from './pages/NPCManagement';
import LoreManagement from './pages/LoreManagement';
import CanonManagement from './pages/CanonManagement';
import QuestManagement from './pages/QuestManagement';
import Analytics from './pages/Analytics';
import Layout from './Layout.jsx';


export const PAGES = {
    "Chat": Chat,
    "NPCManagement": NPCManagement,
    "LoreManagement": LoreManagement,
    "CanonManagement": CanonManagement,
    "QuestManagement": QuestManagement,
    "Analytics": Analytics,
}

export const pagesConfig = {
    mainPage: "Chat",
    Pages: PAGES,
    Layout: Layout,
};