# WhizPic

Protótipo de livros infantis personalizados com landing, plataforma desktop e app web instalável para celular.

## Executar

Na raiz deste repositório, rode `python3 -m http.server 4173` e abra `http://localhost:4173`.

Clique em **Criar meu livro** e faça o cadastro local ou use **Experimentar demonstração**. No estúdio, escolha uma história da coleção ou crie do zero. Adicione personagem, foto opcional e dedicatória. Abra a prévia, arraste ou use as setas para folhear, revise, aprove e simule o pedido impresso. Rascunhos, livros e pedidos aparecem na estante e no acompanhamento.

A instalação do app pode ser acionada em **Perfil → Instalar app** ou pelo menu do navegador. O service worker funciona em localhost ou HTTPS e permite abrir o app offline após a primeira carga.

Perfis e livros são locais ao navegador. A foto aparece como retrato na prévia. A conversa, a composição narrativa, os pedidos e as etapas de entrega são simulações do protótipo.


## Publicar no Render

No painel do Render, escolha **New → Blueprint** e conecte o repositório GitHub. Selecione a branch que contém o protótipo e o arquivo `render.yaml`. O Blueprint cria um Static Site e publica apenas os arquivos usados pelo navegador no diretório `dist`.

Se preferir criar o Static Site manualmente, use o `buildCommand` de `render.yaml` e defina o **Publish Directory** como `dist`. O protótipo funciona sem variáveis de ambiente.
