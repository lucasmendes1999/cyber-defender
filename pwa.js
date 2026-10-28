(() => {
  if ('serviceWorker' in navigator && window.isSecureContext) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('./sw.js').catch(error => {
        console.warn('Não foi possível ativar o modo offline.', error);
      });
    });
  }

  let installPrompt;
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'arcade-btn pwa-install';
  button.textContent = 'INSTALAR JOGO';
  button.hidden = true;
  document.getElementById('btnStart').after(button);

  window.addEventListener('beforeinstallprompt', event => {
    event.preventDefault();
    installPrompt = event;
    button.hidden = false;
  });

  button.addEventListener('click', async () => {
    if (!installPrompt) return;
    const prompt = installPrompt;
    installPrompt = null;
    button.hidden = true;
    try {
      await prompt.prompt();
      await prompt.userChoice;
    } catch (error) {
      console.warn('Não foi possível abrir a instalação.', error);
    }
  });

  window.addEventListener('appinstalled', () => {
    installPrompt = null;
    button.hidden = true;
  });
})();
