import TopMenuBar from '@/components/editor/TopMenuBar';
import DocumentTabs from '@/components/editor/DocumentTabs';
import ToolOptionsBar from '@/components/editor/ToolOptionsBar';
import LeftToolbar from '@/components/editor/LeftToolbar';
import CanvasArea from '@/components/editor/CanvasArea';
import RightSidebar from '@/components/editor/RightSidebar';
import StatusBar from '@/components/editor/StatusBar';
import { useEffect } from 'react';
import { useEditorStore } from '@/store/editorStore';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';

export default function Editor() {
  const { createDocument, documents } = useEditorStore();
  
  // Initialize keyboard shortcuts
  useKeyboardShortcuts();

  // Create initial document if none exists
  useEffect(() => {
    if (documents.length === 0) {
      createDocument('Untitled-1', 800, 600);
    }
  }, [documents.length, createDocument]);

  return (
    <div className="h-screen flex flex-col bg-primary-dark text-text-primary overflow-hidden">
      <TopMenuBar />
      <DocumentTabs />
      <ToolOptionsBar />
      
      <div className="flex-1 flex overflow-hidden">
        <LeftToolbar />
        <CanvasArea />
        <RightSidebar />
      </div>
      
      <StatusBar />
    </div>
  );
}
