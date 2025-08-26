console.log('server: starting');

import { buildApp } from './app';

console.log('server: buildApp imported');

const app = buildApp();

console.log('server: app built, about to listen');

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`API listening on http://localhost:${port}`));
