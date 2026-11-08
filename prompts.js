// RPG-style prompts: scripted sequences that drive the real UI. Each step is one of
//  tap(sel) · type(sel,text) · hold(sel,ms) · key(k) · wait(ms) · waitFor(sel) · say(text)
// Prompts are offered by screen; `when` can hide a prompt that doesn't apply right now.
window.PROMPTS = {
  map: [
    { title: 'Add an address', hint: 'type, pick, Enter', steps: [['type', '#addr', '40 Ridgecrest'], ['waitFor', '#sugg [data-i]'], ['wait', 500], ['key', 'Enter'], ['waitFor', '.srow .leg', 20000], ['say', 'Pin dropped · drive timed from HQ']], when: () => !S.stops.includes('a1') },
    { title: 'Type a real address', hint: 'geocoded, not a fixture', steps: [['type', '#addr', '100 Shoreline Hwy Mill Valley'], ['waitFor', '#sugg [data-i]', 15000], ['wait', 700], ['key', 'Enter'], ['waitFor', '.srow .leg', 20000], ['say', 'Geocoded and timed on real roads']] },
    { title: 'Plan a full day', hint: '4 addresses → every order tried', steps: [['type', '#addr', 'Wolfback'], ['waitFor', '#sugg [data-i]'], ['key', 'Enter'], ['wait', 350], ['type', '#addr', 'Ridgecrest'], ['waitFor', '#sugg [data-i]'], ['key', 'Enter'], ['wait', 350], ['type', '#addr', 'Eldridge'], ['waitFor', '#sugg [data-i]'], ['key', 'Enter'], ['wait', 350], ['type', '#addr', 'Butterfield'], ['waitFor', '#sugg [data-i]'], ['key', 'Enter'], ['waitFor', '.srow .leg', 25000], ['tap', '#best'], ['waitFor', '.rstat .good', 60000], ['say', 'All 24 orders driven from HQ · fastest kept']], when: () => S.stops.length < 4 },
  ],
  location: [
    { title: 'Photo + voice note → violation', hint: 'the main flow', steps: [['tap', '#newEntry'], ['waitFor', '#shutter'], ['wait', 400], ['tap', '#shutter'], ['wait', 900], ['hold', '#pill', 2800], ['wait', 700], ['tap', '#submit'], ['say', 'Scanning in place…'], ['waitFor', '#save', 16000], ['say', 'Record drafted']], when: () => !S.snapshot },
    { title: 'Note only → follow-up', hint: 'skip the photo', steps: [['tap', '#newEntry'], ['waitFor', '#noteOnly'], ['wait', 400], ['tap', '#noteOnly'], ['wait', 900], ['tap', '#pill'], ['wait', 600], ['type', '#memo', 'Owner says the north gutters were cleaned last week, verify at reinspection'], ['tap', '#submit'], ['waitFor', '#save', 12000]], when: () => !S.snapshot },
    { title: 'Upload a photo → compliant', hint: 'from the library', steps: [['tap', '#newEntry'], ['waitFor', '#upload'], ['wait', 400], ['tap', '#upload'], ['wait', 900], ['tap', '#pill'], ['wait', 600], ['type', '#memo', 'Roof and gutters clear, compliant'], ['tap', '#submit'], ['waitFor', '#save', 16000]], when: () => !S.snapshot },
  ],
  camera: [
    { title: 'Hold to speak the memo', hint: 'walkie-talkie', steps: [['hold', '#pill', 2800], ['wait', 700], ['say', 'Transcript is now editable']], when: () => S.draft && S.draft.snapped && !document.querySelector('.sheet2.type') },
    { title: 'Type the memo instead', hint: 'tap the bar', steps: [['tap', '#pill'], ['wait', 600], ['type', '#memo', 'Ladder fuels are required to be removed within 30 ft of homes']], when: () => S.draft && S.draft.snapped && !document.querySelector('.sheet2.type') },
  ],
  record: [
    { title: 'Edit the AI summary', hint: 'Edit → change → Done', steps: [['tap', '.edcard[data-key="summary"] [data-edit]'], ['wait', 300], ['fill', '.edcard[data-key="summary"] .ed', 'Continuous ladder fuel ≈ 20 ft from the residence.'], ['wait', 400], ['tap', '.edcard[data-key="summary"] [data-edit]'], ['say', 'Saved · Revert is now offered']] },
    { title: 'Give the scan feedback', hint: 'tap scanned photo', steps: [['tap', '#pScan'], ['waitFor', '#fbin'], ['type', '#fbin', 'The hedge is closer to 4.5 ft'], ['tap', '#fbgo'], ['wait', 2000], ['say', 'Re-scanned with your note']], when: () => S.rec && !!S.rec.photo },
  ],
  deck: [
    { title: 'Write my own recommendation', hint: 'generates a card on top', steps: [['tap', '#own'], ['waitFor', '#ownTx'], ['type', '#ownTx', 'Replace the wooden wall cap with stone and keep the bed clear 5 ft out'], ['tap', '.confirm [data-yes]'], ['wait', 1900], ['say', 'Your card is on top · decide on it like the others']] },
  ],
  report: [],
  notice: [
    { title: 'Refresh after changes', hint: 'only when stale', steps: [['tap', '#refresh'], ['wait', 300]], when: () => !!document.querySelector('#refresh') },
  ],
  kb: [],
  days: [
    { title: 'Search for “juniper”', hint: '', steps: [['type', '#dq', 'juniper'], ['wait', 500], ['say', 'One location matches']] },
  ],
};
