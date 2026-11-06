import "./styles.css";

const root = document.querySelector<HTMLDivElement>("#app");
if (!root) throw new Error('Required app mount element "#app" was not found.');

root.innerHTML = `
  <main class="game-shell">
    <header class="masthead">
      <span class="mark" aria-hidden="true">✳</span>
      <span class="wordmark">DELEEUWTJE <span>STUDIO</span></span>
      <span class="status">PROJECT IN OPBOUW</span>
    </header>
    <section class="landing" aria-labelledby="game-title">
      <div class="landing-copy">
        <p class="kicker"><span></span> EEN VERHAAL OM IN TE VERDWIJNEN</p>
        <h1 id="game-title">Een wereld<br />wacht op <em>ons.</em></h1>
        <p class="intro">De plek voor een klein, eigenzinnig avontuur is voorbereid. Het verhaal komt later.</p>
        <button class="start-button" type="button" disabled><span aria-hidden="true">↗</span> Verhaal wordt voorbereid</button>
        <p class="save-note"><span aria-hidden="true">◇</span> Je voortgang wordt straks lokaal bewaard</p>
      </div>
      <div class="art-panel" role="img" aria-label="Abstract landschap met maan en sterren">
        <div class="moon"></div><div class="star star-one">✳</div><div class="star star-two">·</div>
        <div class="star star-three">✧</div><div class="hill hill-back"></div><div class="hill hill-front"></div>
        <div class="art-caption">VERHAAL 001 <span>—</span> BINNENKORT</div>
      </div>
    </section>
    <footer class="footer"><span>GEMAAKT MET ZORG, SAMEN</span><span>VERSIE 0.1</span></footer>
  </main>
`;
