import "./styles.css";

const root = document.querySelector<HTMLDivElement>("#app");

if (!root) {
  throw new Error('Required app mount element "#app" was not found.');
}

root.innerHTML = `
  <main class="shell">
    <p class="eyebrow">Projectbasis</p>
    <h1>De technische basis staat klaar</h1>
    <p>De plek voor de game is voorbereid. De game zelf is nog niet gebouwd.</p>
  </main>
`;
