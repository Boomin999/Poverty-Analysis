import { createApp } from './app.ts';
import { env } from './config/env.ts';

const app = createApp();

app.listen(env.port, () => {
  console.log(`Backend listening on http://localhost:${env.port} [${env.mode}]`);
});
