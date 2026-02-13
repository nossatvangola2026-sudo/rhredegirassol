
import { Injectable, signal } from '@angular/core';

@Injectable({
    providedIn: 'root'
})
export class PwaService {
    private deferredPrompt: any;
    public installable = signal(false);

    constructor() {
        window.addEventListener('beforeinstallprompt', (e) => {
            // Prevent the mini-infobar from appearing on mobile
            e.preventDefault();
            // Stash the event so it can be triggered later.
            this.deferredPrompt = e;
            // Update UI notify the user they can install the PWA
            this.installable.set(true);
            console.log('PWA installation available');
        });

        window.addEventListener('appinstalled', () => {
            // Log install to analytics
            console.log('PWA was installed');
            this.installable.set(false);
            this.deferredPrompt = null;
        });
    }

    public promptInstall() {
        if (this.deferredPrompt) {
            // Show the install prompt
            this.deferredPrompt.prompt();
            // Wait for the user to respond to the prompt
            this.deferredPrompt.userChoice.then((choiceResult: { outcome: string }) => {
                if (choiceResult.outcome === 'accepted') {
                    console.log('User accepted the install prompt');
                } else {
                    console.log('User dismissed the install prompt');
                }
                this.deferredPrompt = null;
                this.installable.set(false);
            });
        }
    }
}
