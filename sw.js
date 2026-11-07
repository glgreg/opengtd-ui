// Trocar o nome quando o código mudar, para o navegador baixar a versão nova
const CACHE = 'opengtd-v1';

const ARQUIVOS = ['./', 'index.html', 'style.css', 'script.js', 'manifest.json', 'icone-192.png', 'icone-512.png'];

// Na instalação, guarda os arquivos do app no cache
self.addEventListener('install', (event) => {
  event.waitUntil(guardarArquivos());
});

async function guardarArquivos() {
  const cache = await caches.open(CACHE);
  await cache.addAll(ARQUIVOS);
}

// A cada pedido: se está no cache, responde dali; se não, vai pra rede (é o caso da API)
self.addEventListener('fetch', (event) => {
  event.respondWith(responder(event.request));
});

async function responder(pedido) {
  const cache = await caches.open(CACHE);
  const salvo = await cache.match(pedido);
  if (salvo) {
    return salvo;
  }
  return fetch(pedido);
}
