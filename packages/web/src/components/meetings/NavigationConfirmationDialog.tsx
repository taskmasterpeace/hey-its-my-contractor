'use client';

import { useEffect, useState, Fragment, useRef, useCallback } from 'react';
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
    minTimeOnPageMs?: number;
}

const NavigationConfirmationDialog = ({
    isRecording,
    onConfirmLeave,
    minTimeOnPageMs = 2000, // Don't show immediately, wait 5 seconds
}: NavigationConfirmationDialogProps) => {
    const [showDialog, setShowDialog] = useState(false);
    const [pendingNavigation, setPendingNavigation] = useState<string | null>(null);
    const [isNavigating, setIsNavigating] = useState(false);
    const hasShownExitIntentRef = useRef(false);
    const pageLoadTimeRef = useRef(Date.now());

    // Check if we should show the exit intent popup
    const shouldShowExitIntent = useCallback(() => {
        if (!isRecording) return false;
        if (hasShownExitIntentRef.current) return false;

        // Don't show if user just arrived (less than minTimeOnPageMs)
        const timeOnPage = Date.now() - pageLoadTimeRef.current;
        if (timeOnPage < minTimeOnPageMs) return false;

        return true;
    }, [isRecording, minTimeOnPageMs]);

    // Handle Next.js client-side navigation (Link clicks)
    useEffect(() => {
        if (!isRecording) return;

        const handleLinkClick = (e: MouseEvent) => {
            if (isNavigating) return;

            const target = e.target as HTMLElement;
            const link = target.closest('a');

            if (link && link.href) {
                const targetUrl = new URL(link.href);
                const currentUrl = new URL(window.location.href);

                if (targetUrl.pathname !== currentUrl.pathname) {
                    e.preventDefault();
                    e.stopPropagation();

                    setShowDialog(true);
                    setPendingNavigation(link.href);
                }
            }
        };

        document.addEventListener('click', handleLinkClick, true);

        return () => {
            document.removeEventListener('click', handleLinkClick, true);
        };
    }, [isRecording, isNavigating]);

    // Handle browser back/forward button
    useEffect(() => {
        if (!isRecording) return;

        let isHandlingPopState = false;

        const handlePopState = () => {
            if (isHandlingPopState || isNavigating) return;
            isHandlingPopState = true;

            // Push current state back to prevent immediate navigation
            window.history.pushState(null, '', window.location.href);

            setShowDialog(true);
            setPendingNavigation('BACK');

            setTimeout(() => {
                isHandlingPopState = false;
            }, 100);
        };

        // Push initial state
        window.history.pushState(null, '', window.location.href);
        window.addEventListener('popstate', handlePopState);

        return () => {
            window.removeEventListener('popstate', handlePopState);
        };
    }, [isRecording, isNavigating]);

    // EXIT INTENT: Detect mouse leaving to top of browser (refresh/close area)
    useEffect(() => {
        if (!isRecording) return;

        const handleMouseOut = (e: MouseEvent) => {
            if (e.clientY <= 10 && !e.relatedTarget) {
                if (shouldShowExitIntent()) {
                    setShowDialog(true);
                    setPendingNavigation('EXIT_INTENT');
                    hasShownExitIntentRef.current = true;
                }
            }
        };

        // Use mouseout on window for broader detection
        window.addEventListener('mouseout', handleMouseOut);

        return () => {
            window.removeEventListener('mouseout', handleMouseOut);
        };
    }, [isRecording, shouldShowExitIntent]);

    // VISIBILITY CHANGE: Detect tab switching or minimizing
    useEffect(() => {
        if (!isRecording) return;

        const handleVisibilityChange = () => {
            if (document.visibilityState === 'hidden') {
                // Tab is being hidden (switched or closed)
                if (shouldShowExitIntent()) {
                    setShowDialog(true);
                    setPendingNavigation('TAB_SWITCH');
                    hasShownExitIntentRef.current = true;
                }
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);

        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, [isRecording, shouldShowExitIntent]);

    const handleCancel = () => {
        setShowDialog(false);

        // If it was exit intent or tab switch, reset so user can see it again if needed
        if (pendingNavigation === 'EXIT_INTENT' || pendingNavigation === 'TAB_SWITCH') {
            hasShownExitIntentRef.current = false;
        }

        setPendingNavigation(null);

        // Re-push state to keep blocking back button
        if (isRecording) {
            window.history.pushState(null, '', window.location.href);
        }
    };

    const handleConfirm = async () => {
        setShowDialog(false);
        setIsNavigating(true);

        // Call cleanup callback
        if (onConfirmLeave) {
            await onConfirmLeave();
        }

        // Execute navigation based on type
        if (pendingNavigation) {
            if (pendingNavigation === 'BACK') {
                window.history.back();
            } else if (pendingNavigation === 'EXIT_INTENT' || pendingNavigation === 'TAB_SWITCH') {
                // User confirmed they want to leave
                // For exit intent/tab switch, we don't force navigation
                // Just close the dialog and let them proceed
                console.log('User confirmed exit intent');
            } else {
                // Regular link navigation
                window.location.href = pendingNavigation;
            }
        }

        setPendingNavigation(null);
        setIsNavigating(false);
    };

    // Reset refs when recording stops
    useEffect(() => {
        if (!isRecording) {
            hasShownExitIntentRef.current = false;
            pageLoadTimeRef.current = Date.now();
        }
    }, [isRecording]);

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
