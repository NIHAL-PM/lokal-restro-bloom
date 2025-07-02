// Register service worker for PWA
export function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/service-worker.js').then(
        reg => {
          // Registration successful
        },
        err => {
          // Registration failed
        }
      );
    });
  }
}
