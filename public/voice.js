// Voice capture, for real.
//
// Holding the memo bar opens the microphone, records what is said, meters the
// level while it runs, and posts the clip to /api/transcribe, where the model
// transcribes it. There is no fixture anywhere in this path: if the mic is
// blocked, or nothing was said, or the transcription fails, the caller is told
// why and the inspector types the note instead. What ends up in the box is
// either what they said or what they typed — never something the app supplied
// on their behalf. A record and then an enforcement notice are drafted from it.
//
// Why a recording rather than the browser's own SpeechRecognition: that API is
// Chrome-only in practice, cannot be told what vocabulary to expect, and sends
// the audio somewhere this app has no say over. The clip goes to the same
// backend that drafts the record, with a prompt that knows a fire inspector is
// talking — see ai/prompts.js VOICE. The cost is that the words appear on
// release rather than while speaking, so the hold shows the real level instead.
//
// The microphone needs a secure context: https, or localhost. Over plain http
// to a LAN address getUserMedia does not exist, and this says so rather than
// failing as "no microphone".
window.VOICE = (() => {

  // In preference order, and all four are accepted inline by the backend.
  // Chrome and Android produce the webm/opus ones; Safari produces mp4/aac.
  const WANTED = ['audio/webm;codecs=opus', 'audio/ogg;codecs=opus', 'audio/webm', 'audio/mp4'];

  // A hold is seconds long. This ceiling is here to stop a stuck pointer
  // recording until the tab is closed, not to limit a real memo.
  const CAP_MS = 120000;
  // Under half a second there is no word in it, whatever the meter says.
  const MIN_MS = 400;
  // Peak level below this across the whole clip is a muted mic, a mic pointing
  // at nothing, or a hold with nobody talking. A phone held at arm's length in
  // wind still peaks well above it.
  const SILENT = 0.02;

  let stream = null, rec = null, parts = [], ac = null, an = null, buf = null, meter = null, capT = null;
  let t0 = 0, mime = '', lvl = 0, peak = 0, hist = [], env = [], metered = false;

  const secure = () => window.isSecureContext !== false;
  const supported = () => !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia && window.MediaRecorder);
  const active = () => !!rec && rec.state === 'recording';
  const ms = () => (t0 ? Date.now() - t0 : 0);
  const level = () => lvl;
  // The last `n` level samples, oldest first — the moving trace the bars draw.
  const trace = n => { const out = hist.slice(-n); while (out.length < n) out.unshift(0); return out; };

  const pick = () => WANTED.find(t => { try { return MediaRecorder.isTypeSupported(t); } catch (_) { return false; } }) || '';

  const err = (code, message, hint) => Object.assign(new Error(message), { code, hint });

  // What getUserMedia refuses with, in words the inspector can act on.
  function openFailed(e) {
    const n = (e && e.name) || '';
    if (n === 'NotAllowedError' || n === 'SecurityError' || n === 'PermissionDeniedError') {
      return err('denied', 'Microphone permission was refused', 'Microphone blocked · allow it in the browser, or type the note');
    }
    if (n === 'NotFoundError' || n === 'DevicesNotFoundError' || n === 'OverconstrainedError') {
      return err('nomic', 'No microphone on this device', 'No microphone here · type the note');
    }
    if (n === 'NotReadableError' || n === 'TrackStartError' || n === 'AbortError') {
      return err('busy', 'The microphone could not be read', 'The microphone is busy elsewhere · type the note');
    }
    return err('failed', String((e && e.message) || e || 'the microphone would not open'), 'Could not open the microphone · type the note');
  }

  // RMS of the current window, lifted into a range the bars can use. Speech at
  // a phone's distance sits around 0.05-0.25 raw.
  function sample() {
    if (!an) return;
    an.getByteTimeDomainData(buf);
    let s = 0;
    for (let i = 0; i < buf.length; i++) { const v = (buf[i] - 128) / 128; s += v * v; }
    const rms = Math.sqrt(s / buf.length);
    if (rms > peak) peak = rms;
    lvl = Math.min(1, rms * 4.5);
    hist.push(lvl);
    if (hist.length > 128) hist.shift();
    // The whole clip's envelope, 20 samples a second, kept for the shape
    // measurement in `envelope()`. A two-minute hold is 2400 numbers.
    env.push(rms);
  }

  // What the level did over the clip, which is a different question from how
  // loud it was. Speech is syllables: the envelope rises and falls several
  // times a second, so its spread is wide. A steady tone, a fan, a hand over
  // the mic and a car going past are flat by comparison. Neither this nor the
  // peak decides anything on its own — both are measurements, sent to the
  // transcriber as what the device observed. See ai/prompts.js VOICE.
  function envelope() {
    if (!env.length) return null;
    const n = env.length;
    const mean = env.reduce((a, b) => a + b, 0) / n;
    if (mean <= 0) return { frames: n, peak, mean: 0, cov: 0, swing: 0 };
    const sd = Math.sqrt(env.reduce((a, b) => a + (b - mean) * (b - mean), 0) / n);
    const sorted = env.slice().sort((a, b) => a - b);
    const q = f => sorted[Math.min(n - 1, Math.floor(f * n))];
    const lo = q(0.2) || 1e-6;
    return {
      frames: n,
      peak: +peak.toFixed(4),
      mean: +mean.toFixed(4),
      // Coefficient of variation: how much the level moves, relative to itself.
      cov: +(sd / mean).toFixed(3),
      // Loud-to-quiet ratio across the clip — syllables against the gaps.
      swing: +(q(0.9) / lo).toFixed(2),
    };
  }

  function teardown() {
    clearInterval(meter); meter = null;
    clearTimeout(capT); capT = null;
    if (stream) { try { stream.getTracks().forEach(t => t.stop()); } catch (_) {} }
    if (ac) { try { ac.close(); } catch (_) {} }
    stream = null; rec = null; ac = null; an = null; buf = null;
    lvl = 0; hist = []; t0 = 0;
  }

  const b64 = blob => new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onerror = () => reject(err('failed', 'the recording could not be read', 'Could not read the recording · type the note'));
    r.onload = () => resolve(String(r.result).split(',')[1] || '');
    r.readAsDataURL(blob);
  });

  /**
   * Open the microphone and start recording. Rejects — before anything is
   * recorded — with a `hint` worth showing if it cannot.
   */
  async function start() {
    cancel();
    if (!secure()) throw err('insecure', 'The microphone needs a secure context', 'Voice needs https · type the note');
    if (!supported()) throw err('unsupported', 'This browser cannot record audio', 'This browser cannot record · type the note');

    try {
      stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true, channelCount: 1 },
      });
    } catch (e) { throw openFailed(e); }

    mime = pick();
    try {
      rec = new MediaRecorder(stream, mime ? { mimeType: mime, audioBitsPerSecond: 32000 } : undefined);
    } catch (e) {
      teardown();
      throw err('unsupported', String((e && e.message) || e), 'This browser cannot record · type the note');
    }

    parts = [];
    rec.ondataavailable = e => { if (e.data && e.data.size) parts.push(e.data); };

    // The meter is the honest part of the UI while the hold is on: the bars move
    // because the microphone is moving. If the audio graph will not open the
    // recording still goes ahead — it just cannot be metered, and a clip that
    // was never metered is never called silent.
    peak = 0; lvl = 0; hist = []; metered = false;
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      ac = new AC();
      if (ac.state === 'suspended') await ac.resume();
      an = ac.createAnalyser();
      an.fftSize = 1024;
      an.smoothingTimeConstant = 0.6;
      ac.createMediaStreamSource(stream).connect(an);
      buf = new Uint8Array(an.fftSize);
      meter = setInterval(sample, 50);
      metered = true;
    } catch (_) { an = null; }

    // A 250 ms timeslice, so a release always has whole chunks to work with.
    rec.start(250);
    t0 = Date.now();
    capT = setTimeout(() => { if (active()) { try { rec.stop(); } catch (_) {} } }, CAP_MS);
  }

  /**
   * Stop recording and hand back the clip.
   * @returns {Promise<null|{mimeType,data,bytes,ms,peak,silent,short}>} null if
   *          nothing was captured at all.
   */
  function stop() {
    return new Promise(resolve => {
      const r = rec;
      if (!r) { teardown(); return resolve(null); }
      const took = ms(), pk = peak, wasMetered = metered, shape = envelope();
      const type = r.mimeType || mime || 'audio/webm';
      const finish = async () => {
        const blob = new Blob(parts, { type });
        parts = [];
        teardown();
        if (!blob.size) return resolve(null);
        let data;
        try { data = await b64(blob); } catch (_) { return resolve(null); }
        resolve({
          mimeType: type, data, bytes: blob.size, ms: took, peak: pk,
          meter: wasMetered ? shape : null,
          short: took < MIN_MS,
          // Only a clip that was actually metered can be judged quiet.
          silent: wasMetered && pk < SILENT,
        });
      };
      r.onstop = finish;
      if (r.state === 'recording') { try { r.stop(); } catch (_) { finish(); } } else finish();
    });
  }

  /** Throw the recording away and close the microphone. Safe to call any time. */
  function cancel() {
    const r = rec;
    rec = null;
    if (r && r.state === 'recording') { r.onstop = null; try { r.stop(); } catch (_) {} }
    parts = [];
    teardown();
  }

  /**
   * Send one clip to be transcribed.
   * @param {object} clip  from stop()
   * @param {object} ctx   { address, hasPhoto } — context for the prompt
   * @returns {Promise<{text: string, nothing: boolean, model: string, ms: number}>}
   */
  async function transcribe(clip, ctx = {}) {
    let res;
    try {
      res = await fetch('/api/transcribe', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          audio: { mimeType: clip.mimeType, data: clip.data },
          // What the device's own meter saw while recording. The transcriber is
          // told the numbers: a flat level is evidence against anyone having
          // spoken, which is the one thing a transcription model is bad at
          // concluding on its own.
          meter: clip.meter || null,
          ms: clip.ms, address: ctx.address || '', hasPhoto: !!ctx.hasPhoto,
        }),
      });
    } catch (e) {
      throw err('offline', String((e && e.message) || e), 'No connection · type the note');
    }
    const body = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw err(body.code || 'failed', body.error || 'the transcription failed',
        body.code === 'no_key' ? 'No transcription key on the server · type the note'
          : body.code === 'bad_audio' ? 'That recording format cannot be transcribed · type the note'
            : 'Could not transcribe that · type the note');
    }
    return { text: String(body.text || '').trim(), nothing: !!body.nothing, model: body.model || '', ms: body.ms || 0 };
  }

  return { supported, secure, active, start, stop, cancel, transcribe, level, trace, ms, envelope, CAP_MS, MIN_MS };
})();
