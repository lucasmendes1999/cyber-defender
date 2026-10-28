# Cyber Neon Defender — PWA

Sirva esta pasta por HTTPS em produção ou por `http://localhost` durante o desenvolvimento. Abrir `index.html` diretamente pelo sistema de arquivos não ativa o PWA.

## Instalar e jogar offline

1. Abra o jogo online e aguarde o carregamento completo.
2. Em navegadores compatíveis, use **INSTALAR JOGO** no menu inicial ou a opção de instalação do navegador. No iPhone/iPad, use **Compartilhar → Adicionar à Tela de Início**.
3. Após o service worker concluir o cache inicial, o jogo pode ser reaberto sem conexão.

## Publicar atualizações

Sempre que alterar um arquivo do jogo, incremente a versão em `CACHE_NAME` no `sw.js`. Publique todos os arquivos juntos, incluindo `icons/`, manifesto e service worker. A atualização será ativada quando as janelas anteriores do jogo forem fechadas; não há recarga automática durante a partida.

## Conferência no navegador

- Em DevTools → Application, confira o manifesto, os ícones e o service worker ativo.
- Recarregue uma vez online, ative Offline e recarregue novamente: o menu e uma partida devem funcionar, inclusive o áudio após interação.
- Instale e abra pelo ícone: o jogo deve aparecer em janela independente.
- Teste também quando publicado em uma subpasta: todos os caminhos são relativos.

O cache mantém apenas os arquivos locais listados em `APP_FILES`. Recordes e configurações continuam usando o armazenamento já existente do jogo.
