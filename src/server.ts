import {
  AngularNodeAppEngine,
  createNodeRequestHandler,
  isMainModule,
  writeResponseToNodeResponse,
} from '@angular/ssr/node';
import express from 'express';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import Medusa from '@medusajs/js-sdk';

const serverDistFolder = dirname(fileURLToPath(import.meta.url));
const browserDistFolder = resolve(serverDistFolder, '../browser');

const MEDUSA_BACKEND_URL = process.env['MEDUSA_BACKEND_URL'] || 'http://localhost:9000';
const MEDUSA_PUBLISHABLE_API_KEY = process.env['MEDUSA_PUBLISHABLE_API_KEY'];

const sdk = new Medusa({
  baseUrl: MEDUSA_BACKEND_URL,
  debug: true,
  publishableKey: MEDUSA_PUBLISHABLE_API_KEY,
});

const app = express();
const angularApp = new AngularNodeAppEngine();

app.post('/api/auth/register', express.json(), async (req, res) => {
  try {
    const { email, first_name, last_name, phone, password } = req.body;
    const token = await sdk.auth.register('customer', 'emailpass', {
      email,
      password,
    });
    const customHeaders = { authorization: `Bearer ${token}` };
    const { customer: createdCustomer } = await sdk.store.customer.create(
      {
        email,
        first_name,
        last_name,
        phone,
      },
      {},
      customHeaders
    );
    const loginToken = await sdk.auth.login('customer', 'emailpass', {
      email,
      password,
    });
    res.status(200).json({ success: true, customer: createdCustomer, token: loginToken });
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    res.status(500).json({ error: 'Proxy error (SDK)', details: errorMessage });
  }
});

app.use(
  express.static(browserDistFolder, {
    maxAge: '1y',
    index: false,
    redirect: false,
  }),
);

app.use('/**', (req, res, next) => {
  angularApp
    .handle(req)
    .then((response) =>
      response ? writeResponseToNodeResponse(response, res) : next(),
    )
    .catch(next);
});

if (isMainModule(import.meta.url)) {
  const port = process.env['PORT'] || 4000;
  app.listen(port, () => {
    // Server started
  });
}

export const reqHandler = createNodeRequestHandler(app);
