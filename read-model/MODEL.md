<h1 align="center"> Documentação aprofundada </h1>

<p align="center">
  <a href="#decisões-arquiteturais">Decisões Arquiteturais</a>&nbsp;&nbsp;&nbsp;|&nbsp;&nbsp;&nbsp;
  <a href="#estrutura-do-projeto">Estrutura do projeto</a>&nbsp;&nbsp;&nbsp;|&nbsp;&nbsp;&nbsp;
  <a href="#funcionamento">Funcionamento</a>&nbsp;&nbsp;&nbsp;|&nbsp;&nbsp;&nbsp;
  <a href="https://github.com/https-shini/financas-reactjs">Voltar</a>
</p>

<br>

## Decisões Arquiteturais:

- O sistema de controle de finanças segue uma arquitetura cliente-servidor, onde o frontend é responsável pela interface do usuário e o backend gerencia a lógica de negócios e a comunicação com o servidor WebSocket.
- WebSocket: O uso do protocolo WebSocket permite uma comunicação bidirecional em tempo real entre clientes e servidor, facilitando a troca instantânea de mensagens.

<br>

## Estrutura do projeto

➜ **Frontend:**

1. **HTML (index.html):**
   - O arquivo HTML é responsável pela estruturação do conteúdo da página. Ele define os elementos como formulários de entrada de usuário, áreas de exibição de relatórios financeiros e botões de interação.

2. **CSS (style.css):**
   - O arquivo CSS é responsável pela estilização e design da interface do usuário. Ele define as cores, fontes, layouts e estilos visuais que tornam a aplicação atraente e fácil de usar.

3. **JavaScript (script.js):**
   - O arquivo JavaScript é responsável por adicionar interatividade à página. Ele manipula eventos do usuário, como cliques em botões e preenchimento de formulários, e se comunica com o backend para enviar e receber dados relacionados às finanças.

<br>

➜ **Backend:**

1. **Node.js (server.js):**
   - O arquivo `server.js` é o principal arquivo do backend, que utiliza o Node.js como plataforma de tempo de execução do JavaScript no servidor. Ele inicializa e configura o servidor WebSocket para lidar com conexões de clientes, recebe e envia mensagens entre os clientes conectados e gerencia a lógica de negócios da aplicação.

2. **WebSocket (ws):**
   - O WebSocket é um protocolo de comunicação bidirecional que permite a troca de mensagens em tempo real entre o cliente e o servidor. No contexto deste projeto, o servidor WebSocket é responsável por receber mensagens dos clientes e retransmiti-las para todos os outros clientes conectados, garantindo que todas as mensagens sejam distribuídas em tempo real para todos os participantes do chat.

<br>

## **Funcionamento:**

- O usuário acessa a aplicação e é apresentado com a interface de controle de finanças.
- Ele pode interagir com os diferentes elementos da interface, como formulários de adição de transações, filtros de visualização de relatórios e configurações de conta.
- As informações inseridas pelo usuário são enviadas para o backend através de requisições HTTP ou WebSocket, dependendo da necessidade.
- O backend processa as solicitações, atualiza o estado da aplicação e envia as respostas de volta para o frontend.
- O frontend atualiza dinamicamente a interface do usuário para refletir as mudanças no estado da aplicação, garantindo uma experiência de usuário responsiva e fluida.

<br>

> **Informações Importantes sobre a Aplicação** <br>
A aplicação de controle de finanças suporta interações em tempo real entre o usuário e o servidor, facilitadas pelo uso do protocolo WebSocket. <br>
Os usuários podem gerenciar suas finanças, adicionar novas transações, visualizar relatórios e configurar suas contas de forma conveniente e intuitiva. <br>
O frontend é responsivo e foi projetado para oferecer uma experiência consistente em diferentes dispositivos e tamanhos de tela.
