/* Press and hold, then drag: holdDrag(root, {item, target, onDrop}).
   Holding an item (about 0.4 seconds, without moving) picks it up; it then follows the finger or mouse, the target underneath is highlighted, and
   letting go over a target calls onDrop(item, target). A quick tap still clicks, and moving before the hold ends scrolls the page as normal.
   Used for the widgets on the Today screen (swap places) and the sessions in the calendar (move to another day). */
window.holdDrag = function(root, o){
  const HOLD = 380, SLOP = 9;
  let st = null, endedAt = 0;
  const point = e => (e.touches && e.touches[0]) || (e.changedTouches && e.changedTouches[0]) || e;

  function begin(e){
    if(st || (e.type === 'mousedown' && e.button !== 0)) return;
    const item = e.target.closest(o.item); if(!item || !root.contains(item)) return;
    const p = point(e);
    st = {item, x:p.clientX, y:p.clientY, active:false, target:null, touch:e.type === 'touchstart'};
    st.timer = setTimeout(lift, HOLD);
    if(!st.touch){ document.addEventListener('mousemove', move); document.addEventListener('mouseup', end); }
  }
  function lift(){
    if(!st) return;
    st.active = true; st.item.classList.add('drag-lift'); document.body.classList.add('dragging');
    try{ navigator.vibrate && navigator.vibrate(12); }catch(e){}
  }
  function move(e){
    if(!st) return;
    const p = point(e);
    if(!st.active){
      if(Math.hypot(p.clientX - st.x, p.clientY - st.y) > SLOP){ clearTimeout(st.timer); cleanup(); }   // they are scrolling, not holding
      return;
    }
    if(e.cancelable) e.preventDefault();
    st.item.style.transform = `translate(${p.clientX - st.x}px, ${p.clientY - st.y}px) scale(1.03)`;
    st.item.style.pointerEvents = 'none';
    const under = document.elementFromPoint(p.clientX, p.clientY);
    st.item.style.pointerEvents = '';
    const t = under && under.closest(o.target);
    if(st.target !== t){ st.target && st.target.classList.remove('drop-target'); st.target = t && t !== st.item && root.contains(t) ? t : null; st.target && st.target.classList.add('drop-target'); }
    if(p.clientY < 90) window.scrollBy(0, -14); else if(p.clientY > innerHeight - 90) window.scrollBy(0, 14);   // near an edge: scroll
  }
  function end(){
    if(!st) return;
    clearTimeout(st.timer);
    if(st.active){ const {item, target} = st; endedAt = performance.now(); cleanup(); if(target) o.onDrop(item, target); }
    else cleanup();
  }
  function cleanup(){
    if(!st) return;
    st.item.classList.remove('drag-lift'); st.item.style.transform = ''; st.item.style.pointerEvents = '';
    st.target && st.target.classList.remove('drop-target');
    document.body.classList.remove('dragging');
    document.removeEventListener('mousemove', move); document.removeEventListener('mouseup', end);
    st = null;
  }
  root.addEventListener('mousedown', begin);
  root.addEventListener('touchstart', begin, {passive:true});
  root.addEventListener('touchmove', move, {passive:false});      // not passive, so a held item can stop the page scrolling
  root.addEventListener('touchend', end); root.addEventListener('touchcancel', end);
  root.addEventListener('contextmenu', e => { if(st && st.active) e.preventDefault(); });
  root.addEventListener('click', e => { if(performance.now() - endedAt < 400){ e.stopPropagation(); e.preventDefault(); } }, true);   // dropping is not a tap
};
