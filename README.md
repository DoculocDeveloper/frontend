# Frontend - Doculoc

Aplicação web da plataforma Doculoc (React + Vite + TypeScript).

## Configuração de Ambiente

Crie ou edite o arquivo `.env` na raiz do diretório `frontend`:

```env
# URL da API do backend em produção
VITE_API_URL=https://api.doculoc.com.br

# Caso queira rodar localmente com backend local:
# VITE_API_URL=http://localhost:3333
```

## Como gerar o build para produção

1. Instalar as dependências:
   ```bash
   npm install
   ```

2. Compilar para produção:
   ```bash
   npm run build
   ```
   Os arquivos finais serão gerados na pasta `dist/` prontos para upload na HostGator (incluindo o arquivo `.htaccess` para roteamento SPA).

## Módulos e Funcionalidades

- **Relatórios Operacionais e BI Executivo (`ReportsPage`)**:
  - Acessível em `/admin/relatorios` para perfil `ADMIN` com item direto na barra lateral ("Relatórios").
  - Filtro por Imobiliária (todas ou imobiliária individual).
  - Filtro por período de datas com atalhos rápidos ("Hoje", "Últimos 7 dias", "Últimos 30 dias", "Este mês", "Este ano", "Todo o histórico" e personalizado).
  - Cards de métricas com totais consolidados e **Tooltips explicativos interativos** exibindo as fórmulas matemáticas e regras de cada KPI.
    - Consultas realizadas (quantidade).
    - Contratos gerados (quantidade e valor total R$).
    - Contratos assinados (quantidade e valor total R$ - receita fechada).
    - Contratos declinados (quantidade e valor total R$).
    - Ticket médio dos contratos gerados por imobiliária e global.
    - Taxa de conversão de gerados (% sobre consultas) e de assinados (% sobre gerados).
    - Representatividade da imobiliária selecionada sobre o total de contratos assinados da Doculoc.
  - **Funil de Conversão Comercial (Pipeline)**: Etapas visuais de Consultas ➔ Contratos Gerados ➔ Contratos Assinados (Receita).
  - **Visão BI em Cards Executivos**:
    - Quando sem filtro de imobiliária: exibe 2 cards amplos por linha com paginação de 6 por página.
    - Quando filtrada uma imobiliária: o card ocupa 100% da largura da tela, totalmente expandido e preenchido sem espaços em branco, incluindo funil individual e 5 mini-indicadores horizontais.
    - Opção de alternar a qualquer momento para o modo Tabela.

- **Gestão de Contratos (`ContractsPage`)**:
  - Acessível em `/admin/contratos` (Admin) e `/real_estate/contratos` (Imobiliária e Vendedor).
  - **Aba Pendentes**: Exibe casos com dados de locatário e imóvel preenchidos aguardando geração de contrato DOCX.
  - **Aba Assinados**: Exibe contratos com fluxo de assinatura 100% finalizado via Clicksign, permitindo o download direto do documento PDF assinado oficial.

- **Gestão de Vendedores e Múltiplas Imobiliárias (`RealEstateDetailPage`, `AssociateSellerDialog`)**:
  - Acessível em `/admin/imobiliarias/:id` (aba Vendedores).
  - Exibe vendedores vinculados à imobiliária selecionada com opção de desvinculação.
  - Exibe lista de vendedores cadastrados na plataforma disponíveis para associação direta, com busca em tempo real por nome, CPF e e-mail.
  - Componente modal `AssociateSellerDialog` (`associate-seller-dialog.tsx`) para associação rápida.
  - Permite que um mesmo vendedor (`SELLER`) pertença a múltiplas imobiliárias simultaneamente.

- **Consulta Conjunta / Composição de Renda (Múltiplos Locatários)**:
  - Disponível na tela de Nova Consulta (`NewApplicationPage`).
  - Permite adicionar múltiplos CPFs para composição de renda locatícia (consumindo créditos proporcionais à quantidade de locatários).
  - Exibição unificada em linha única na listagem com indicador visual de múltiplos locatários.
  - No detalhe da consulta (`ApplicationDetailPage`), exibe card de Composição de Renda com soma de rendas, renda individual, percentual de contribuição e destaque da fonte de renda principal, além de alternância dos relatórios completos Órago para administradores.

- **Chat Interno por Consulta com Envio de Documentos (`ApplicationChat`)**:
  - Disponível no detalhe da consulta (`ApplicationDetailPage`), acessível por imobiliárias e administradores.
  - **Histórico Compartilhado entre Administradores**: Qualquer administrador ou executivo de contas da Doculoc visualiza o histórico completo da conversa com a imobiliária.
    - As mensagens enviadas por qualquer membro da equipe Doculoc são agrupadas à direita (lado Doculoc).
    - Distinção visual clara: mensagens do próprio administrador logado identificam-se como "Você", enquanto mensagens de outros colegas da equipe Doculoc exibem o nome do administrador com badge `Doculoc • Equipe`.
    - As mensagens da imobiliária ficam alinhadas à esquerda com badge `Imobiliária`.
    - Contador de mensagens não lidas focado exclusivamente nas mensagens recebidas da contraparte.
    - **Status Automático "Aguardando Retorno Imobiliária"**: Ao responder pelo chat como administrador, o status da consulta muda automaticamente para `WAITING_REAL_ESTATE_RETURN` ("Aguardando retorno imobiliária"); quando a imobiliária responde no chat, a consulta é restaurada automaticamente para o status em que estava antes da espera.
  - Comunicação em tempo real por polling automático (intervalo de 3,5s).
  - Suporte a envio de mensagens e upload de arquivos/documentos complementares (PDF, imagens PNG/JPG/WEBP, DOCX) com limite de até 15MB por anexo.
  - Download seguro do documento autenticado com permissão validada pelo backend.

- **Declínio de Consulta pelo Locatário (`DeclineApplicationDialog`)**:
  - Exclusivo para administradores na tela de detalhes da consulta (`ApplicationDetailPage`).
  - Permite marcar o contrato/consulta como "Declinado pelo Locatário", mudando o status para `CONTRACT_DECLINED` ("Contrato declinado").
  - Regra de negócio: só é exibido se o contrato **não** foi assinado. Se o contrato já estiver assinado, a opção fica permanentemente oculta.



## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```
