# Cyber Neon Defender — PWA

Sirva esta pasta por HTTPS em produção ou por `http://localhost` durante o desenvolvimento. Abrir `index.html` diretamente pelo sistema de arquivos não ativa o PWA.

## Instalar e jogar offline

1. Abra o jogo online e aguarde o carregamento completo.
2. Em navegadores compatíveis, use **INSTALAR JOGO** no menu inicial ou a opção de instalação do navegador. No iPhone/iPad, use **Compartilhar → Adicionar à Tela de Início**.
3. Após o service worker concluir o cache inicial, o jogo pode ser reaberto sem conexão.

## Publicar atualizações

Publique todos os arquivos juntos, incluindo `icons/`, manifesto e service worker. Não é necessário incrementar `CACHE_NAME` para alterações nos arquivos do jogo: quando online, cada abertura ou recarga busca os arquivos atuais e atualiza a cópia offline. Sem conexão, o jogo usa a última cópia salva. Arquivos já carregados permanecem em uso até a próxima abertura ou recarga.

Alterações no próprio service worker são verificadas na abertura, ao voltar ao aplicativo e ao recuperar a conexão. Um novo service worker é ativado imediatamente e recarrega a página automaticamente; isso pode interromper uma partida em andamento.

## Conferência no navegador

- Em DevTools → Application, confira o manifesto, os ícones e o service worker ativo.
- Recarregue uma vez online, ative Offline e recarregue novamente: o menu e uma partida devem funcionar, inclusive o áudio após interação.
- Instale e abra pelo ícone: o jogo deve aparecer em janela independente.
- Teste também quando publicado em uma subpasta: todos os caminhos são relativos.

O cache mantém apenas os arquivos locais listados em `APP_FILES`. Recordes e configurações continuam usando o armazenamento já existente do jogo.
