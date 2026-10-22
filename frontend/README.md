# Frontend — OBD-II Retrofit

Aplicação React para autenticação, vínculo de dispositivos e acompanhamento dos
dados de combustível e viagem enviados pela ESP32.

## Funcionalidades

- login e cadastro com login automático;
- sessão autenticada com `Authorization: Bearer <token>`;
- lista de dispositivos vinculados ao usuário;
- vínculo de uma ESP32 pelo MAC e nome do veículo;
- detalhe com combustível, capacidade, fator, distância e consumo;
- recalibração do fator de combustível após abastecimento;
- reset da distância e do consumo da viagem;
- logout e proteção das rotas privadas.

## Executar localmente

O backend ASP.NET deve estar disponível antes de iniciar o frontend. Por padrão,
o proxy de desenvolvimento usa `http://127.0.0.1:5000`.

```bash
cp .env.example .env
npm install
npm run dev
```

Para usar outro servidor, altere `VITE_API_PROXY_TARGET` no `.env`. O navegador
continua chamando `/api`, e o Vite encaminha as requisições para o backend.
Na Vercel, `/api` é encaminhado ao endereço HTTPS publicado pelo Tailscale Funnel.

## Rotas

| Rota | Função |
|---|---|
| `/login` | Entrar na conta |
| `/cadastro` | Criar conta |
| `/devices` | Listar dispositivos |
| `/devices/novo` | Vincular uma ESP32 |
| `/devices/:idDevice` | Consultar dados e resetar viagem |
| `/devices/:idDevice/combustivel` | Recalibrar combustível |

## Verificações

```bash
npm test
npm run build
```

As credenciais do MySQL pertencem somente ao backend. Não coloque senhas de
banco ou outras credenciais em variáveis `VITE_*`, pois elas são expostas no
JavaScript entregue ao navegador.
