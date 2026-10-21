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

- **Gestão de Contratos (`ContractsPage`)**:
  - Acessível em `/admin/contratos` (Admin) e `/real_estate/contratos` (Imobiliária e Vendedor).
  - **Aba Pendentes**: Exibe casos com dados de locatário e imóvel preenchidos aguardando geração de contrato DOCX.
  - **Aba Assinados**: Exibe contratos com fluxo de assinatura 100% finalizado via Clicksign, permitindo o download direto do documento PDF assinado oficial.



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
