import { createApp } from 'vue';
import { createPinia } from 'pinia';
import App from './App.vue';
import router from './router';

import ElementPlus from 'element-plus';
import 'element-plus/dist/index.css';

// Import Tailwind CSS
import './assets/css/tailwind.css';

// Create Vue app
const app = createApp(App);

// Use plugins
app.use(createPinia());
app.use(router);
app.use(ElementPlus);

// Mount the app
app.mount('#app'); 