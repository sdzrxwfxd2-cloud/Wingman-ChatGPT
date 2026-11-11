/* Go Around sign-up/sign-in — design only. Redesign first page t783u. No auth. */
(function(){
  const Q=new URLSearchParams(location.search);
  const _raw=Q.get('screen')||'signin-a';
  /* v5 aliases */ const screen=(_raw==='dfe-choice'||_raw==='dfe-approved')?(_raw==='dfe-approved'?'dfe-pending':'dfe-claim'):_raw;
  const googleIcon=`<svg viewBox="0 0 18 18" width="18" height="18" aria-hidden="true"><path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"/><path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z"/><path fill="#FBBC05" d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z"/><path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z"/></svg>`;

  const steps=(i,total)=>{
    let d='';
    for(let n=1;n<=total;n++) d+=`<span class="dot${n<=i?' on':''}"></span>`;
    return `<div class="step" aria-hidden="true">${d}<span class="lbl">Step ${i} of ${total}</span></div>`;
  };

  const atoBackdrop=`
    <article class="backdrop-card" aria-hidden="true">
      <p class="kicker">Example ATO · Cape Town</p>
      <h1>Skyward Flight Academy</h1>
      <p>Part 141 · FATO-0000 · Example school</p>
      <div class="stars">★★★★☆ · 4.3 · 128 reviews</div>
    </article>`;

  const legal=`<p class="legal-line">By continuing you agree to our <a href="#">Terms</a> and <a href="#">Privacy</a>.</p>`;
  const tag='Reviews, examiners and schools for SA pilots';

  /* OLD first page — kept for side-by-side compare only */
  const signinOld=`
      ${atoBackdrop}
      <div class="overlay">
        <section class="sheet" role="dialog" aria-labelledby="si-title">
          <div class="grab" aria-hidden="true"></div>
          <div class="logo-row"><img src="assets/ga-logo-solid-112.png" width="40" height="40" alt=""></div>
          <h2 id="si-title">Cleared for sign-in</h2>
          <p class="sub">Continue with Google to write reviews, vote and message. We never ask for or store your Google password.</p>
          <button class="btn google" type="button">${googleIcon} Continue with Google</button>
          <button class="btn ghost" type="button" style="margin-top:10px">Cancel</button>
          <p class="hint" style="margin-top:14px;text-align:center;color:var(--tx3);font-size:12px">New here? Sign-in starts registration. Returning members skip onboarding.</p>
          <a class="linkish" href="#">Terms · Privacy</a>
        </section>
      </div>`;

  const screens={
    'signin-old': signinOld,
    signin: signinOld,

    /* Option A — v5 centred logo + Clash wordmark (t817u / SU-MT-33) */
    'signin-a':`
      <div class="hero-page hero-centred">
        <div class="hero-mid">
          <img class="hero-mark" src="assets/ga-logo-solid-224.png" width="112" height="112" alt="">
          <p class="hero-line">What every pilot needs</p>
        </div>
        <div class="hero-actions center">
          <button class="btn google" type="button" data-stub-google="1">${googleIcon} Continue with Google</button>
          <button class="btn ghost" type="button" data-go="welcome">Not now</button>
          ${legal}
        </div>
      </div>`,
    /* Option B — bottom sheet kept, big wordmark on top of sheet */
    'signin-b':`
      ${atoBackdrop}
      <div class="overlay">
        <section class="sheet signin-b" role="dialog" aria-labelledby="sib-title">
          <div class="grab" aria-hidden="true"></div>
          <img class="logo-mini" src="assets/ga-logo-solid-112.png" width="40" height="40" alt="">
                    <p class="tagline center">${tag}</p>
          <button class="btn google" type="button">${googleIcon} Continue with Google</button>
          <button class="btn ghost" type="button">Cancel</button>
          ${legal}
        </section>
      </div>`,

    welcome:`
      ${atoBackdrop}
      <section class="panel restyle">
        <span class="pill">Guest</span>
        <h2 class="step-title" style="margin-top:12px">Explore without an account</h2>
        <p class="sub">Public school facts and the top 3 reviews stay open. Writing a review, voting or messaging needs Sign in.</p>
        <button class="btn primary" type="button">Sign in</button>
        <button class="btn ghost" type="button" style="margin-top:10px">Browse schools</button>
      </section>`,

    returning:`
      <section class="panel restyle" style="margin:40px auto 0;max-width:420px" role="status">
        <img src="assets/ga-logo-solid-112.png" width="40" height="40" alt="" style="margin-bottom:14px">
        <h2 class="step-title">Welcome back</h2>
        <p class="sub">Your account is ready. Taking you back to Skyward Flight Academy.</p>
        <div class="note ok">Stable account kept · No new trial · Onboarding skipped</div>
        <button class="btn primary" type="button" style="margin-top:16px">Continue</button>
      </section>`,

    identity:`
      <section class="panel restyle">
        ${steps(1,6)}
        <h2 class="step-title">About you</h2>
        <p class="sub">Google filled your name and email. Finish your Go Around profile.</p>
        <div class="field"><label>Full name</label><input value="Alex Pilot" readonly></div>
        <div class="field"><label>Email</label><input value="alex.pilot@example.com" readonly></div>
        <div class="field focus-demo"><label for="u">Username</label><input id="u" value="alex.ct" autocomplete="off"><p class="hint">Unique on Go Around. Checked privately.</p></div>
        <div class="grid2">
          <div class="field"><label for="dob">Date of birth</label><input id="dob" type="date" value="2002-04-12"></div>
          <div class="field"><label for="gen">Gender</label><select id="gen"><option>Prefer not to say</option><option selected>Male</option><option>Female</option><option>Other</option></select></div>
        </div>
        <div class="field"><label for="nat">Nationality</label><select id="nat"><option selected>South Africa</option><option>Other</option></select><p class="hint">Nationality is not your licence issuer.</p></div>
        <div class="btn-row"><button class="btn ghost" type="button" data-go="signin-a">Back</button><button class="btn primary" type="button" data-go="terms">Continue</button></div>
      </section>`,

    terms:`
      <section class="panel restyle">
        ${steps(2,6)}
        <h2 class="step-title">Terms &amp; age</h2>
        <p class="sub">You must be 15 or older. Ages 15–17 need a parent or guardian to consent.</p>
        <div class="note">Your date of birth puts you at <strong>24</strong> — adult path.</div>
        <label class="check"><input type="checkbox" checked> I agree to the Terms of Use and Privacy Notice.</label>
        <label class="check"><input type="checkbox" checked> I’m signing up for myself and the details I give are true.</label>
        <div class="btn-row"><button class="btn ghost" type="button" data-go="identity">Back</button><button class="btn primary" type="button" data-go="aviation">Continue</button></div>
      </section>`,

    under15:`
      <section class="panel restyle">
        <span class="pill">Age gate</span>
        <h2 class="step-title" style="margin-top:12px">Not available under 15</h2>
        <p class="sub">Go Around is for members aged 15 and older. Parent consent cannot authorise an under-15 account.</p>
        <div class="note warn">This account stays frozen if an under-15 date of birth is found later.</div>
        <button class="btn primary" type="button" style="margin-top:16px">Back to Go Around</button>
      </section>`,

    guardian:`
      <section class="panel restyle">
        ${steps(2,6)}
        <span class="pill">Ages 15–17</span>
        <h2 class="step-title" style="margin-top:12px">Parent or guardian</h2>
        <p class="sub">We’ll email a one-use consent link. Until they confirm, chat stays off.</p>
        <div class="field"><label for="pe">Parent / guardian email</label><input id="pe" type="email" value="parent.example@email.com" autocomplete="off"><p class="hint">Private. Never shown on your public card.</p></div>
        <div class="note">Unsolicited messages to minors stay OFF. Consent can be withdrawn later.</div>
        <div class="btn-row"><button class="btn ghost" type="button">Back</button><button class="btn primary" type="button">Send consent email</button></div>
      </section>`,

    'guardian-sent':`
      <section class="panel restyle">
        <span class="pill">Waiting</span>
        <h2 class="step-title" style="margin-top:12px">Email sent</h2>
        <p class="sub">We sent a one-use link to <strong>parent.example@email.com</strong>. You can keep setting up your profile.</p>
        <div class="note ok">Chat and message requests stay locked until consent is confirmed.</div>
        <div class="btn-row"><button class="btn ghost" type="button">Resend</button><button class="btn primary" type="button">Continue setup</button></div>
      </section>`,

    'guardian-parent':`
      <section class="panel restyle">
        <img src="assets/ga-logo-solid-112.png" width="40" height="40" alt="" style="margin-bottom:14px">
        <span class="pill">Guardian consent</span>
        <h2 class="step-title" style="margin-top:12px">Approve Alex’s account</h2>
        <p class="sub">Alex Pilot (username alex.ct) asked to join Go Around. They are 16. Confirm only if you are their parent or guardian.</p>
        <div class="note">Opening this page does nothing. Consent only happens when you press Confirm (POST). Link expires and is one-use.</div>
        <label class="check"><input type="checkbox" checked> I am the parent or guardian of this person and I agree to the notice shown.</label>
        <div class="btn-row"><button class="btn ghost" type="button">Decline</button><button class="btn primary" type="button">Confirm consent</button></div>
      </section>`,

    aviation:`
      <section class="panel restyle">
        ${steps(3,6)}
        <h2 class="step-title center">What describes you?</h2>
        <p class="sub center">Pick one. This only shapes the next questions.</p>
        <div class="role-grid" data-picker="aviation">
          <button class="role-card centered" type="button" data-role="looking">
            <span class="role-check" aria-hidden="true"><svg viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M2.5 6.2l2.6 2.6 4.4-5"/></svg></span>
            <span class="role-body"><strong>Looking for a flight school</strong><span>Skip licences for now. Add credentials later.</span></span>
          </button>
          <button class="role-card centered" type="button" data-role="enthusiast">
            <span class="role-check" aria-hidden="true"><svg viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M2.5 6.2l2.6 2.6 4.4-5"/></svg></span>
            <span class="role-body"><strong>Aviation enthusiast</strong><span>Skip licences for now. Add credentials later.</span></span>
          </button>
          <button class="role-card centered on" type="button" data-role="pilot" aria-pressed="true">
            <span class="role-check" aria-hidden="true"><svg viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M2.5 6.2l2.6 2.6 4.4-5"/></svg></span>
            <span class="role-body"><strong>Training or licensed pilot</strong><span>Includes SPL holders. Next: licences and ratings.</span></span>
          </button>
        </div>
        <div class="btn-row"><button class="btn ghost" type="button" data-go="terms">Back</button><button class="btn primary" type="button" data-go="licences">Continue</button></div>
      </section>`,


    /* Direction B — icon-forward grid (compare only; A preferred) */
    'aviation-b':`
      <section class="panel restyle">
        ${steps(3,6)}
        <h2 class="step-title">What describes you?</h2>
        <p class="sub">Pick one. This only shapes the next questions.</p>
        <div class="role-grid b" data-picker="aviation">
          <button class="role-card" type="button" data-role="looking">
            <span class="role-ico" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/><path d="M11 8v6M8 11h6"/></svg></span>
            <span class="role-body"><strong>Looking for a school</strong><span>Skip licences for now.</span></span>
            <span class="role-check" aria-hidden="true"><svg viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M2.5 6.2l2.6 2.6 4.4-5"/></svg></span>
          </button>
          <button class="role-card" type="button" data-role="enthusiast">
            <span class="role-ico" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 14c4-1 6-5 8-5s4 4 8 5"/><path d="M12 9V4"/><path d="M9 20h6"/><path d="M12 9l7 3-1.2 2.2"/></svg></span>
            <span class="role-body"><strong>Enthusiast</strong><span>Skip licences for now.</span></span>
            <span class="role-check" aria-hidden="true"><svg viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M2.5 6.2l2.6 2.6 4.4-5"/></svg></span>
          </button>
          <button class="role-card on" type="button" data-role="pilot" aria-pressed="true">
            <span class="role-ico" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3l1.2 6.2L21 12l-7.8 2.8L12 21l-1.2-6.2L3 12l7.8-2.8L12 3z"/></svg></span>
            <span class="role-body"><strong>Training or licensed pilot</strong><span>Includes SPL. Next: licences and ratings.</span></span>
            <span class="role-check" aria-hidden="true"><svg viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M2.5 6.2l2.6 2.6 4.4-5"/></svg></span>
          </button>
        </div>
        <div class="btn-row"><button class="btn ghost" type="button">Back</button><button class="btn primary" type="button">Continue</button></div>
      </section>`,

    /* NEW version t793u — keep current aviation untouched (SU-MT-15) */
    'aviation-c':`
      <section class="panel restyle avi-c">
        ${steps(3,6)}
        <h2 class="step-title center">Where are you in aviation?</h2>
        <p class="sub center">Pick the one that fits best. This only shapes what we ask next.</p>
        <div class="pill-stack" data-picker="aviation-c">
          <button class="gpill" type="button" data-role="looking">
            <strong>Looking for a flight school</strong>
            <span>Skip licences for now. You can add them later.</span>
          </button>
          <button class="gpill" type="button" data-role="enthusiast">
            <strong>Aviation enthusiast</strong>
            <span>Skip licences for now. You can add them later.</span>
          </button>
          <button class="gpill on" type="button" data-role="pilot" aria-pressed="true">
            <strong>Training or licensed pilot</strong>
            <span>Includes SPL holders. Next up: licences and ratings.</span>
          </button>
        </div>
        <div class="btn-row"><button class="btn ghost" type="button">Back</button><button class="btn primary" type="button">Continue</button></div>
      </section>`,



    /* Kept for before/after compare (pre glass-pill chips) */
    'licences-old':`
      <section class="panel restyle">
        ${steps(4,6)}
        <h2 class="step-title">Licences &amp; ratings</h2>
        <p class="sub">South African licences only at launch. Self-declared badges stay grey until verified.</p>
        <p style="margin:0 0 8px;font:600 12px/1 'General Sans',sans-serif;color:var(--tx2);letter-spacing:.02em">Licence (example)</p>
        <div class="chips" data-chips="licence">
          <button class="chip" type="button">SPL</button>
          <button class="chip on" type="button">PPL</button>
          <button class="chip" type="button">CPL</button>
          <button class="chip" type="button">ATPL</button>
          <button class="chip" type="button">NPL</button>
        </div>
        <p style="margin:0 0 8px;font:600 12px/1 'General Sans',sans-serif;color:var(--tx2);letter-spacing:.02em">Aircraft category</p>
        <div class="chips" data-chips="category">
          <button class="chip on" type="button">Aeroplane</button>
          <button class="chip" type="button">Helicopter</button>
          <button class="chip" type="button">Glider</button>
        </div>
        <p style="margin:0 0 8px;font:600 12px/1 'General Sans',sans-serif;color:var(--tx2);letter-spacing:.02em">Ratings held</p>
        <div class="chips" data-chips="rating">
          <button class="chip on" type="button">Night</button>
          <button class="chip on" type="button">Instrument</button>
          <button class="chip" type="button">Multi-engine</button>
          <button class="chip on" type="button">Instructor</button>
          <button class="chip on" type="button" data-dfe="1">DFE</button>
        </div>
        <div class="btn-row"><button class="btn ghost" type="button">Back</button><button class="btn primary" type="button">Continue</button></div>
      </section>`,


    'licences-no-dfe':`
      <section class="panel restyle">
        ${steps(4,5)}
        <h2 class="step-title">Licences &amp; ratings</h2>
        <p class="sub">South African licences only at launch. Self-declared badges stay grey until verified.</p>
        <p style="margin:0 0 8px;font:600 12px/1 'General Sans',sans-serif;color:var(--tx2);letter-spacing:.02em">Licence (example)</p>
        <div class="chips glass-pills" data-chips="licence">
          <button class="chip" type="button">SPL</button>
          <button class="chip on" type="button">PPL</button>
          <button class="chip" type="button">CPL</button>
          <button class="chip" type="button">ATPL</button>
          <button class="chip" type="button">NPL</button>
        </div>
        <p style="margin:0 0 8px;font:600 12px/1 'General Sans',sans-serif;color:var(--tx2);letter-spacing:.02em">Aircraft category</p>
        <div class="chips glass-pills" data-chips="category">
          <button class="chip on" type="button">Aeroplane</button>
          <button class="chip" type="button">Helicopter</button>
          <button class="chip" type="button">Glider</button>
        </div>
        <p style="margin:0 0 8px;font:600 12px/1 'General Sans',sans-serif;color:var(--tx2);letter-spacing:.02em">Ratings held</p>
        <div class="chips glass-pills" data-chips="rating">
          <button class="chip on" type="button">Night</button>
          <button class="chip on" type="button">Instrument</button>
          <button class="chip" type="button">Multi-engine</button>
          <button class="chip on" type="button">Instructor</button>
          <button class="chip" type="button" data-dfe="1">DFE</button>
        </div>
        <div class="btn-row"><button class="btn ghost" type="button">Back</button><button class="btn primary" type="button" data-lic-continue="1">Continue</button></div>
      </section>`,

    licences:`
      <section class="panel restyle">
        ${steps(4,6)}
        <h2 class="step-title">Licences &amp; ratings</h2>
        <p class="sub">South African licences only at launch. Self-declared badges stay grey until verified.</p>
        <p style="margin:0 0 8px;font:600 12px/1 'General Sans',sans-serif;color:var(--tx2);letter-spacing:.02em">Licence (example)</p>
        <div class="chips glass-pills" data-chips="licence">
          <button class="chip" type="button">SPL</button>
          <button class="chip on" type="button">PPL</button>
          <button class="chip" type="button">CPL</button>
          <button class="chip" type="button">ATPL</button>
          <button class="chip" type="button">NPL</button>
        </div>
        <p style="margin:0 0 8px;font:600 12px/1 'General Sans',sans-serif;color:var(--tx2);letter-spacing:.02em">Aircraft category</p>
        <div class="chips glass-pills" data-chips="category">
          <button class="chip on" type="button">Aeroplane</button>
          <button class="chip" type="button">Helicopter</button>
          <button class="chip" type="button">Glider</button>
        </div>
        <p style="margin:0 0 8px;font:600 12px/1 'General Sans',sans-serif;color:var(--tx2);letter-spacing:.02em">Ratings held</p>
        <div class="chips glass-pills" data-chips="rating">
          <button class="chip on" type="button">Night</button>
          <button class="chip on" type="button">Instrument</button>
          <button class="chip" type="button">Multi-engine</button>
          <button class="chip on" type="button">Instructor</button>
          <button class="chip on" type="button" data-dfe="1">DFE</button>
        </div>
        <div class="btn-row"><button class="btn ghost" type="button">Back</button><button class="btn primary" type="button" data-lic-continue="1">Continue</button></div>
      </section>`,


    /* archived separate step — instructor/DFE now under ratings on licences (t786u) */
    instructor:`
      <section class="panel restyle">
        ${steps(5,6)}
        <h2 class="step-title">Instructor or DFE?</h2>
        <p class="sub">Optional. Selecting DFE does not verify you or unlock DFE-card editing.</p>
        <button class="choice on" type="button"><span class="radio"></span><span><strong>Neither</strong><span>Most common. You can add this later.</span></span></button>
        <button class="choice" type="button"><span class="radio"></span><span><strong>Instructor</strong><span>Self-declared grade stays grey “Not verified”.</span></span></button>
        <button class="choice" type="button"><span class="radio"></span><span><strong>DFE</strong><span>Optional private proof next. Badge stays grey until verified, then turns blue.</span></span></button>
        <button class="choice" type="button"><span class="radio"></span><span><strong>Both</strong><span>Instructor and DFE may coexist.</span></span></button>
        <div class="btn-row"><button class="btn ghost" type="button">Back</button><button class="btn primary" type="button">Continue</button></div>
      </section>`,

    'dfe-proof':`
      <section class="panel restyle">
        ${steps(5,6)}
        <span class="pill">Optional · private</span>
        <h2 class="step-title" style="margin-top:12px">DFE proof</h2>
        <p class="sub">Stored privately for verification against the public DFE list. Never shown on your public card.</p>
        <div class="field"><label>Licence number</label><input value="••••-EXAMPLE" autocomplete="off"></div>
        <div class="field"><label>DFE designation / letter ref</label><input value="DFE-EXAMPLE" autocomplete="off"></div>
        <div class="upload"><strong>Add photo ID</strong>PNG or JPG · private · never shown publicly</div>
        <div class="btn-row"><button class="btn ghost" type="button">Skip for now</button><button class="btn primary" type="button">Submit for check</button></div>
      </section>`,

    /* v5 DFE claim (t817u / SU-MT-31) — max 2 screens: claim preview → pending */
    'dfe-claim':`
      <section class="panel restyle dfe-panel">
        ${steps(5,6)}
        <h2 class="step-title center">Claim your DFE membership</h2>
        <p class="sub center claim-lede">By applying here, you’re claiming your DFE badge and card — once you submit and we approve, they’re yours.</p>

        <div class="claim-prose">
          <p>Claiming costs nothing extra. You get verified as a DFE with your DFE card.</p>
          <p>As a <strong>paid member</strong>, you get the <strong>blue DFE tick</strong> and can manage your card.</p>
          <p>Without membership, you keep the <strong>standard (non-blue) DFE mark</strong> and your card stays as listed — without editing.</p>
        </div>

        <div class="claim-note calm">
          <p>Verification isn’t instant. Your claim waits in review until our team approves it. Nothing goes live before then.</p>
        </div>

        <div class="btn-row" style="margin-top:18px">
          <button class="btn ghost" type="button" data-go="licences">Back</button>
          <button class="btn primary" type="button" data-go="dfe-pending">Submit claim</button>
        </div>
      </section>`,

    'dfe-pending':`
      <section class="panel restyle dfe-panel">
        ${steps(5,6)}
        <h2 class="step-title center">Claim sent</h2>
        <p class="sub center">Your claim is pending review. We’ll notify you when it’s done. No blue badge or DFE card yet.</p>
        <div class="claim-note calm">
          <p>Our team will confirm the claim is in your name. This takes a little time and costs nothing extra.</p>
        </div>
        <div class="btn-row" style="margin-top:16px">
          <button class="btn primary" type="button" data-go="done">Continue to app</button>
        </div>
      </section>`,


    done:`
      <section class="aero-dash" aria-label="Aerodromes dashboard">
        <div class="aero-top">
          <img src="assets/ga-logo-solid-112.png" width="32" height="32" alt="">
          <div class="aero-clock"><b>12:45:00Z</b><small>SAST 14:45</small></div>
        </div>
        <header class="aero-hello">
          <h1>Good afternoon</h1>
        </header>
        <div class="a1stats">
          <div class="st" style="--c:#64D2FF"><span class="n">640</span><span class="k">AIRPORTS</span></div>
          <div class="st" style="--c:#0A84FF"><span class="n">13</span><span class="k">CTRL</span></div>
          <div class="st" style="--c:#E879F9"><span class="n">555</span><span class="k">UNCTRL</span></div>
          <div class="st" style="--c:#30D5C8"><span class="n">270</span><span class="k">ATO/DTO</span></div>
          <div class="st" style="--c:#FF6482"><span class="n">134</span><span class="k">DFE</span></div>
        </div>
        <div class="aero-status glass">
          <div class="as"><span class="n go">4</span><span class="k">DEPART</span></div>
          <div class="as"><span class="n cau">44</span><span class="k">CAUTION</span></div>
          <div class="as"><span class="n no">16</span><span class="k">NO DEPART</span></div>
        </div>
        <div class="aero-search">
          <div class="asearch">Search aerodromes</div>
        </div>
        <article class="aero-card glass">
          <div class="ac-row"><h3>Aberdeen.</h3><span class="pill warn">INCOMPLETE</span></div>
          <p class="ac-sub">FAAE · Eastern Cape</p>
          <p class="ac-wx">INCOMPLETE · no current weather</p>
        </article>
        <nav class="aero-tabbar" aria-label="App">
          <span class="on">Aerodromes</span>
          <span>Weather</span>
          <span>ATOs</span>
          <span>DFEs</span>
          <span>Pilot</span>
        </nav>
        <div class="toast ok" role="status">You’re in</div>
      </section>`,

    error:`
      <div class="hero-page">
        <div class="hero-top">
          <img class="hero-mark" src="assets/ga-logo-solid-224.png" width="88" height="88" alt="">
          <h1 class="wordmark hero" style="font-size:clamp(36px,10vw,52px)">Sign-in interrupted</h1>
          <p class="tagline">Google didn’t finish, or the network dropped. Nothing was created twice. Safe to try again.</p>
        </div>
        <div class="hero-actions">
          <button class="btn google" type="button">${googleIcon} Try Google again</button>
          <button class="btn ghost" type="button">Not now</button>
        </div>
      </div>`,

    flow:`
      <div class="flow-wrap" style="max-width:100%;padding:0">
        <h2 class="wordmark" style="font-size:28px;margin:0 0 6px">Sign-up flow</h2>
        <p style="margin:0 0 14px;color:var(--tx2);font-size:13px">Champagne redesign · same steps and rules · design only.</p>
        <div class="flow-grid">
          ${[
            ['01','First page A / B','Big Clash “Go Around” wordmark + one calm line + Google. No aviation-pun headings.'],
            ['02','Google starts registration','First Google sign-in opens setup. Returning members skip onboarding.'],
            ['03','Identity','Google name/email + username, DOB, gender, nationality.'],
            ['04','Terms & age','15+ only. 15–17 → guardian. Under 15 blocked.'],
            ['05','What describes you','Premium role cards · Looking / Enthusiast / Pilot. First two skip licences.'],
            ['06','Licences & ratings','SA chips + ratings. Instructor + DFE pills (multi-select). DFE → choice screen.'],
            ['07','DFE choice','Verify now or continue unverified. Grey vs blue explained.'],
            ['08','DFE claim','Verified: claim badge + DFE card. Update info once verified.'],
            ['09','Done + trial','14-day cardless Pro once. Return to intended school/action.'],
          ].map(([n,t,d])=>`<article class="flow-card"><div class="n">${n}</div><h3>${t}</h3><p>${d}</p></article>`).join('')}
        </div>
      </div>`,

    compare:`
      <div class="compare-wrap">
        <h2 class="wordmark" style="font-size:26px;margin:0 0 6px">First page options</h2>
        <p style="margin:0 0 14px;color:var(--tx2);font-size:13px">Old · Option A (full-page hero) · Option B (sheet with big wordmark)</p>
        <div class="compare-grid">
          <div class="compare-slot"><p class="cap">Old</p><div class="frame-clip"><iframe src="index.html?screen=signin-old&t=champagne" title="Old"></iframe></div></div>
          <div class="compare-slot"><p class="cap">Option A · hero</p><div class="frame-clip"><iframe src="index.html?screen=signin-a&t=champagne" title="A"></iframe></div></div>
          <div class="compare-slot"><p class="cap">Option B · sheet</p><div class="frame-clip"><iframe src="index.html?screen=signin-b&t=champagne" title="B"></iframe></div></div>
        </div>
      </div>`
  };

  const root=document.getElementById('root');
  if(!screens[screen]){
    root.innerHTML=`<section class="panel restyle"><h2 class="step-title">Unknown screen</h2><p class="sub">Use ?screen=signin-a|signin-b|signin-old|identity|…</p></section>`;
    return;
  }
  root.innerHTML=screens[screen];
  document.title=`Go Around · ${screen} (design)`;

  // Interactive picks (design mock only)
  function bootInteractions(){
    const reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    
    document.querySelectorAll('.gpill').forEach((card,i)=>{
      const reduceG = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if(reduceG){ card.classList.add('in'); }
      else {
        card.classList.remove('in');
        requestAnimationFrame(()=>setTimeout(()=>card.classList.add('in'), 30+i*60));
      }
      card.addEventListener('click',()=>{
        const grid=card.closest('[data-picker]');
        if(!grid) return;
        grid.querySelectorAll('.gpill').forEach(c=>{c.classList.remove('on');c.removeAttribute('aria-pressed')});
        card.classList.add('on');card.setAttribute('aria-pressed','true');
      });
    });

    document.querySelectorAll('.role-card').forEach((card,i)=>{
      if(reduce){ card.classList.add('in'); }
      else {
        card.classList.remove('in');
        requestAnimationFrame(()=>setTimeout(()=>card.classList.add('in'), 30+i*60));
      }
      card.addEventListener('click',()=>{
        const grid=card.closest('[data-picker]');
        if(!grid) return;
        grid.querySelectorAll('.role-card').forEach(c=>{c.classList.remove('on');c.removeAttribute('aria-pressed')});
        card.classList.add('on');card.setAttribute('aria-pressed','true');
      });
    });
    document.querySelectorAll('.chips').forEach(group=>{
      group.querySelectorAll('.chip').forEach(chip=>{
        chip.addEventListener('click',()=>{
          // multi-select for licence/rating; single for category
          const single = group.getAttribute('data-chips')==='category';
          if(single){
            group.querySelectorAll('.chip').forEach(c=>c.classList.remove('on'));
            chip.classList.add('on');
          } else {
            chip.classList.toggle('on');
          }
        });
      });
    });
    
    // Demo nav for DFE claim → pending → home
  document.querySelectorAll('[data-go]').forEach(b=>{
    b.addEventListener('click',()=>{
      const u=new URL(location.href);
      u.searchParams.set('screen', b.getAttribute('data-go'));
      location.href=u.toString();
    });
  });
  // Licences Continue: DFE selected → dfe-choice, else stay / done (design mock)
    document.querySelectorAll('[data-lic-continue]').forEach(btn=>{
      btn.addEventListener('click',()=>{
        const dfeOn=!!document.querySelector('.chips[data-chips="rating"] .chip.on[data-dfe]');
        const u=new URL(location.href);
        u.searchParams.set('screen', dfeOn ? 'dfe-claim' : 'done');
        location.href=u.toString();
      });
    });

    document.querySelectorAll('.mini-choice').forEach(group=>{
      group.querySelectorAll('.mini-chip').forEach(chip=>{
        chip.addEventListener('click',()=>{
          group.querySelectorAll('.mini-chip').forEach(c=>c.classList.remove('on'));
          chip.classList.add('on');
        });
      });
    });

  // Stub Google: no auth / gate / appdata — waits for the database
  document.querySelectorAll('[data-stub-google]').forEach(b=>{
    b.addEventListener('click',()=>{
      let t=document.querySelector('.stub-toast');
      if(!t){
        t=document.createElement('div');
        t.className='toast ok stub-toast';
        t.setAttribute('role','status');
        t.textContent='Sign-in waits for the database — opening profile stub';
        document.body.appendChild(t);
      }
      setTimeout(()=>{
        const u=new URL(location.href);
        u.searchParams.set('screen','identity');
        location.href=u.toString();
      }, 700);
    });
  });

  }
  bootInteractions();

  /* hide chrome top bar on pure hero screens for cleaner first-page look */
  if(screen==='signin-a'||screen==='error'){
    const top=document.querySelector('.top');
    if(top) top.style.display='none';
    document.querySelector('.stage')?.classList.remove('stage');
    const main=document.getElementById('root');
    if(main){main.style.padding='0 16px 0';main.style.maxWidth='none'}
  }
})();
