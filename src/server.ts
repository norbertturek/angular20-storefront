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
import { environment } from './environments/environment';

const serverDistFolder = dirname(fileURLToPath(import.meta.url));
const browserDistFolder = resolve(serverDistFolder, '../browser');

// Use environment configuration
const MEDUSA_BACKEND_URL = environment.medusaBackendUrl;
const MEDUSA_PUBLISHABLE_API_KEY = environment.medusaPublishableKey;

console.log('Medusa Backend URL:', MEDUSA_BACKEND_URL);
console.log('Medusa Publishable Key:', MEDUSA_PUBLISHABLE_API_KEY ? 'Set' : 'Not set');

const sdk = new Medusa({
  baseUrl: MEDUSA_BACKEND_URL,
  debug: true,
  publishableKey: MEDUSA_PUBLISHABLE_API_KEY,
});

const app = express();
const angularApp = new AngularNodeAppEngine();

// Register endpoint
app.post('/api/auth/register', express.json(), async (req, res) => {
  try {
    const { email, first_name, last_name, phone, password } = req.body;
    
    // Register the customer
    const token = await sdk.auth.register('customer', 'emailpass', {
      email,
      password,
    });
    
    const customHeaders = { authorization: `Bearer ${token}` };
    
    // Create customer profile
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
    
    // Login to get the final token
    const loginToken = await sdk.auth.login('customer', 'emailpass', {
      email,
      password,
    });
    
    res.status(200).json({ 
      success: true, 
      customer: createdCustomer, 
      token: loginToken 
    });
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    console.error('Registration error:', errorMessage);
    res.status(500).json({ 
      error: 'Proxy error (SDK)', 
      details: errorMessage 
    });
  }
});

// Login endpoint
app.post('/api/auth/login', express.json(), async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Login the customer
    const token = await sdk.auth.login('customer', 'emailpass', {
      email,
      password,
    });
    
    if (typeof token === 'object' && token.location) {
      // Handle redirect case
      res.status(200).json({ 
        success: true, 
        redirectUrl: token.location 
      });
      return;
    }
    
    // Get customer data
    const { customer } = await sdk.store.customer.retrieve({}, {
      authorization: `Bearer ${token}`
    });
    
    res.status(200).json({ 
      success: true, 
      customer,
      token 
    });
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    console.error('Login error:', errorMessage);
    res.status(500).json({ 
      error: 'Proxy error (SDK)', 
      details: errorMessage 
    });
  }
});

// Update customer endpoint
app.post('/api/customer/update', express.json(), async (req, res) => {
  try {
    const { first_name, last_name, phone } = req.body;
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      res.status(401).json({ 
        success: false, 
        error: 'No authorization token provided' 
      });
      return;
    }
    
    // Update customer data
    const { customer } = await sdk.store.customer.update(
      {
        first_name,
        last_name,
        phone,
      },
      {},
      { authorization: authHeader }
    );
    
    res.status(200).json({ 
      success: true, 
      customer 
    });
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    console.error('Update customer error:', errorMessage);
    res.status(500).json({ 
      error: 'Proxy error (SDK)', 
      details: errorMessage 
    });
  }
});

// Get customer orders endpoint
app.get('/api/customer/orders', async (req, res) => {
  try {
    const { limit = 10, offset = 0 } = req.query;
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      res.status(401).json({ 
        success: false, 
        error: 'No authorization token provided' 
      });
      return;
    }
    
    // Get customer orders
    const { orders, count } = await sdk.store.order.list(
      {
        limit: parseInt(limit as string),
        offset: parseInt(offset as string),
      },
      { authorization: authHeader }
    );
    
    res.status(200).json({ 
      success: true, 
      orders,
      count 
    });
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    console.error('Get orders error:', errorMessage);
    res.status(500).json({ 
      error: 'Proxy error (SDK)', 
      details: errorMessage 
    });
  }
});

// Password reset endpoint
app.post('/api/customer/password-reset', express.json(), async (req, res) => {
  try {
    const { email } = req.body;
    
    // TODO: Implement password reset using Medusa SDK
    // For now, just return success
    console.log('Password reset requested for:', email);
    
    res.status(200).json({ 
      success: true 
    });
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    console.error('Password reset error:', errorMessage);
    res.status(500).json({ 
      error: 'Proxy error (SDK)', 
      details: errorMessage 
    });
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
