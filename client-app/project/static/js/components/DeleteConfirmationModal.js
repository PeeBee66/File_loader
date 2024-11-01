// project/static/js/components/DeleteConfirmationModal.js

import React, { useState } from 'react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";

export default function DeleteConfirmationModal({ isOpen, onClose, onConfirm, folderPath }) {
    const [confirmText, setConfirmText] = useState('');
    const [error, setError] = useState('');

    const handleConfirm = () => {
        if (confirmText.trim() !== 'I Agree') {
            setError('Please type "I Agree" exactly to confirm deletion');
            return;
        }
        setError('');
        onConfirm();
    };

    return (
        <AlertDialog open={isOpen} onOpenChange={onClose}>
            <AlertDialogContent className="max-w-2xl">
                <AlertDialogHeader>
                    <AlertDialogTitle className="text-red-600 flex items-center gap-2">
                        <AlertTriangle className="h-5 w-5" />
                        Permanent Deletion Warning
                    </AlertDialogTitle>
                    <Alert variant="destructive" className="mb-4">
                        <AlertDescription className="font-semibold">
                            You are about to delete: {folderPath}
                        </AlertDescription>
                    </Alert>
                    <AlertDialogDescription className="space-y-4">
                        <p className="font-bold text-red-600">
                            WARNING: This action cannot be undone!
                        </p>
                        <p>
                            All data in this folder will be permanently deleted. This data will be:
                        </p>
                        <ul className="list-disc pl-6 space-y-2">
                            <li>Completely and permanently erased</li>
                            <li>Impossible to recover</li>
                            <li>Removed from all backups</li>
                            <li>Gone forever and ever</li>
                        </ul>
                        <div className="mt-6">
                            <label className="block text-sm font-medium mb-2">
                                Type "I Agree" to confirm deletion:
                            </label>
                            <input
                                type="text"
                                className="w-full px-3 py-2 border rounded-md"
                                value={confirmText}
                                onChange={(e) => setConfirmText(e.target.value)}
                                placeholder="Type 'I Agree'"
                            />
                            {error && (
                                <p className="mt-2 text-sm text-red-600">{error}</p>
                            )}
                        </div>
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                        className="bg-red-600 hover:bg-red-700"
                        onClick={handleConfirm}
                    >
                        Delete Forever
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}