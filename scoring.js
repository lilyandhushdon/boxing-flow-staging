/* Amateur scoring: how a bout is scored, and single-bout videos of international fights, with the judges' cards where they are known.
   To add a bout: { yt (YouTube video id), title, event, weight, and optionally date, referee, red:{name,noc}, blue:{name,noc}, winner:'red'|'blue', result:'5:0',
   cards:[[red,blue] x5 or x3], rounds (one list per round of [red,blue] per judge), judges (names), notes:[...] }. Scores are red first, blue second, Judge 1 first. */
(function(){
  const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
  const BOUTS = [
    {yt:'Q4q45c3OdFo', title:'Javokhir Ummataliev (UZB) v Alfred Commey (ITA)', event:'World Boxing Cup 2025', weight:'80 kg'},
    {yt:'uavBVZQ7Puc', title:'Wanderley Pereira (BRA) v Abel Mina (ECU)', event:'South American Games 2026, final', weight:'80 kg'},
    {yt:'fj9GX7Souuc', title:'Kaian Reis (BRA) v Edinson Alvarado (VEN)', event:'South American Games 2026, final', weight:'70 kg'},
    {yt:'Kr8v1k1k5yM', title:'Yuri Falcão (BRA) v Santiago Cardozo (URU)', event:'South American Games 2026, final', weight:'65 kg'},
    {yt:'iWpA0QfYI6Y', title:'Luiz Oliveira (BRA) v Santiago Celes (ARG)', event:'South American Games 2026, final', weight:'60 kg'},
    {yt:'0B758vHlkmQ', title:'Isaías Ribeiro (BRA) v Jhojan Caicedo (COL)', event:'South American Games 2026, final', weight:'90 kg'},
    {yt:'YEEnHLMjDOU', title:'Gerlon Congo (ECU) v Joel Ramos (BRA)', event:'South American Games 2026, final', weight:'90+ kg'}
  ];

  function cardsTable(b){
    const pick = (r, bl) => r > bl ? 'red' : bl > r ? 'blue' : '';
    const hasRounds = !!b.rounds;
    const head = `<tr><th></th>${hasRounds ? b.rounds.map((_, i) => `<th>R${i + 1}</th>`).join('') : ''}<th>Total</th><th>Picked</th></tr>`;
    const rows = b.cards.map((c, j) => `<tr><th>Judge ${j + 1}${b.judges ? `<span>${esc(b.judges[j])}</span>` : ''}</th>${hasRounds ? b.rounds.map(r => `<td class="${pick(r[j][0], r[j][1])}">${r[j][0]}-${r[j][1]}</td>`).join('') : ''}<td><b>${c[0]}-${c[1]}</b></td><td class="${pick(c[0], c[1])}">${pick(c[0], c[1]) === 'red' ? esc(b.red.noc) : esc(b.blue.noc)}</td></tr>`).join('');
    return `<div class="sc-wrap"><table class="sc-tbl"><thead>${head}</thead><tbody>${rows}</tbody></table></div>`;
  }
  const video = b => `<div class="sc-vid"><iframe src="https://www.youtube.com/embed/${esc(b.yt)}" title="${esc(b.title)}" loading="lazy" referrerpolicy="strict-origin-when-cross-origin" allow="accelerometer; encrypted-media; picture-in-picture; fullscreen" allowfullscreen></iframe></div>
    <a class="btn ghost small" target="_blank" rel="noopener" href="https://www.youtube.com/watch?v=${esc(b.yt)}">Open on YouTube</a>`;
  function boutHtml(b){
    const w = b.winner && b[b.winner], split = b.result ? b.result.split(':').map(Number) : null;
    return `<div class="nu-card sc-bout"><h2 class="nu-fname">${esc(b.title)}</h2>
      <p class="t-note">${esc(b.event)} · ${esc(b.weight)}${b.date ? ' · ' + esc(b.date) : ''}${b.referee ? ' · Referee ' + esc(b.referee) : ''}</p>
      ${video(b)}
      ${b.cards ? `<p><b>${esc(w.name)}</b> won ${esc(b.result)}${split[1] ? ` (${split[0]} judges to ${split[1]})` : ' (every judge)'}</p>${cardsTable(b)}`
        : '<p class="t-note">Judges’ scorecard not entered yet. Score each round yourself as you watch, then check the scores shown at the end of the bout.</p>'}
      ${(b.notes || []).length ? `<h3 class="cal-sub">What to notice</h3>${b.notes.map(n => `<p class="t-note">${esc(n)}</p>`).join('')}` : ''}</div>`;
  }
  const GUIDE = `
    <div class="nu-card"><h2 class="nu-fname">How an amateur bout is scored</h2>
      <p class="t-note"><b>Five judges, each with their own card.</b> At the Olympics and international events the sheets show five judges, each scoring on their own. A bout is won by the boxer most of the five picked.</p>
      <p class="t-note"><b>Ten-point must, round by round.</b> In each round the judge gives the winner 10 points and the loser fewer. Most rounds are 10-9. A clear gap, or a count, can be 10-8. No round is scored as a draw. A 3-round bout is out of 30, so a judge's card reads like 29-28 or 30-27.</p>
      <p class="t-note"><b>How the result is written.</b> 5:0 is a unanimous decision. Anything else, like 4:1 or 3:2, is a split decision. Only the number of judges who picked you matters. A boxer who wins on three cards at 28-29 each wins the same as one who wins them 30-27.</p>
      <p class="t-note"><b>Each judge adds up their own rounds.</b> A boxer can lose a round on most cards and still win the bout, because what counts is how many judges' totals favour them.</p>
      <p class="t-note"><b>New Zealand.</b> A bout in New Zealand may have only three judges instead of five, so the result reads 3:0 or 2:1 and not 5:0, 4:1 or 3:2. It works the same way: each judge keeps their own card, and the boxer picked by more judges wins. With fewer cards, one judge who sees it differently counts for more. The number of judges can change from show to show, so check your event.</p>
      <p class="t-note"><b>What judges are looking at.</b> The exact criteria are in the World Boxing rulebook, which is not copied here, so check your federation’s current version. In general, clean, effective scoring punches, control of the ring and who dictates the pace decide close rounds.</p>
      <p class="iq-note">Why this matters in a fight: with five or three cards you cannot know what every judge saw. Winning the round clearly, in the first minute and the last, is the only thing that helps on all of them.</p></div>`;

  window.renderScoring = () => {
    $('scoringBody').innerHTML = GUIDE
      + `<div class="nu-card"><h2 class="nu-fname">Bouts to watch and score</h2><p class="t-note">Single-bout videos of international amateur fights. Judges’ scores are shown only where they have been taken from the official scoreboard or result sheet.</p></div>`
      + BOUTS.map(boutHtml).join('');
  };
  $('scoring').addEventListener('click', e => { const b = e.target.closest('button'); if(b && b.dataset.section) show(b.dataset.section); });
  if(!$('scoring').hidden) window.renderScoring();
})();
