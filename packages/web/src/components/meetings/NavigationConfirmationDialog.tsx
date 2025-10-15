'use client';

import { useEffect, useState, Fragment } from 'react';
import { usePathname } from 'next/navigation';
import {
    AlertDialog,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';

interface NavigationConfirmationDialogProps {
    isRecording: boolean;
    onConfirmLeave?: () => void;
}

const NavigationConfirmationDialog = ({
    isRecording,
    onConfirmLeave,
}: NavigationConfirmationDialogProps) => {
    const pathname = usePathname();
    const [showDialog, setShowDialog] = useState(false);
    const [pendingNavigation, setPendingNavigation] = useState<(() => void) | null>(null);

    // Handle Next.js client-side navigation (Link clicks)
    useEffect(() => {
        if (!isRecording) return;

        const handleLinkClick = (e: MouseEvent) => {
            const target = e.target as HTMLElement;
            const link = target.closest('a');

            if (link && link.href) {
                const targetUrl = new URL(link.href);
                const currentUrl = new URL(window.location.href);

                // Check if it's a different page (not same path)
                if (targetUrl.pathname !== currentUrl.pathname) {
                    e.preventDefault();
                    e.stopPropagation();

                    // Show confirmation dialog
                    setShowDialog(true);
                    setPendingNavigation(() => () => {
                        window.location.href = link.href;
                    });
                }
            }
        };

        // Capture phase to intercept before Next.js Link handles it
        document.addEventListener('click', handleLinkClick, true);

        return () => {
            document.removeEventListener('click', handleLinkClick, true);
        };
    }, [isRecording, pathname]);

    // Handle browser navigation events (refresh, close tab, navigate away)
    useEffect(() => {
        if (!isRecording) return;

        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            // Standard way to trigger browser's native confirmation dialog
            e.preventDefault();
            e.returnValue = 'Recording in progress! Are you sure you want to leave? Your recording data may be lost.';
            return e.returnValue;
        };

        window.addEventListener('beforeunload', handleBeforeUnload);

        return () => {
            window.removeEventListener('beforeunload', handleBeforeUnload);
        };
    }, [isRecording]);

    // Handle browser back/forward button navigation
    useEffect(() => {
        if (!isRecording) return;

        let navigationBlocked = false;

        const handlePopState = (e: PopStateEvent) => {
            if (navigationBlocked) return;

            e.preventDefault();

            // Show custom dialog for back button
            setShowDialog(true);
            setPendingNavigation(() => () => {
                navigationBlocked = true;
                window.history.back();
            });

            // Push state again to prevent immediate navigation
            window.history.pushState(null, '', window.location.href);
        };

        // Push initial state to enable back button interception
        window.history.pushState(null, '', window.location.href);
        window.addEventListener('popstate', handlePopState);

        return () => {
            window.removeEventListener('popstate', handlePopState);
        };
    }, [isRecording]);

    // Handle visibility change (tab switching) - show warning indicator
    useEffect(() => {
        if (!isRecording) return;

        const handleVisibilityChange = () => {
            if (document.visibilityState === 'hidden') {
                console.warn('⚠️ Recording is still active in the background. Please return to this tab.');
            } else {
                console.log('✅ Recording tab is now visible again.');
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);

        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, [isRecording]);

    const handleCancel = () => {
        setShowDialog(false);
        setPendingNavigation(null);
    };

    const handleConfirm = async () => {
        setShowDialog(false);

        // Call the cleanup callback
        if (onConfirmLeave) {
            await onConfirmLeave();
        }

        // Execute pending navigation if any
        if (pendingNavigation) {
            pendingNavigation();
            setPendingNavigation(null);
        }
    };

    // Visual indicator when recording is active
    if (!isRecording) return null;

    return (
        <Fragment>
            {/* Confirmation Dialog */}
            <AlertDialog open={showDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center gap-2">
                            <AlertTriangle className="w-5 h-5 text-red-600" />
                            Recording in Progress
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            You have an active recording session. Leaving this page will stop the recording,
                            but your data will be saved automatically. Are you sure you want to leave?
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <Button variant="outline" onClick={handleCancel}>
                            Stay on Page
                        </Button>
                        <Button variant="destructive" onClick={handleConfirm}>
                            Leave Anyway
                        </Button>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </Fragment>
    );
};

export default NavigationConfirmationDialog;
