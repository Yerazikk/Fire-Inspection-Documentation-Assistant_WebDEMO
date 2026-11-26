// examples/daisy/example.js — one relocatable power tap plugged into another.
//
// The photograph: a white power strip on the wall with a second strip's cord in its last socket, and cords across
// a carpeted floor (assets/daisychain.jpg; the unpacked original is assets/daisychain-src.png).
//
// Why it is here: the rule is statewide text adopted whole, so the finding reads the same in every town. What
// changes at a town line is which ordinance carries chapter 6, which edition was in force before 1 Jan 2026,
// whether the town amended the chapter at all, and what a violation costs. It is also the example where the FIELD
// inspector's answer moves the senior's verdict: the two exceptions in § 603.5.2 turn on what the room is for.
(function (root) {
'use strict';
const EX = root.FireExamples, CM = root.FireExampleCommon, SRC = root.FIREGEO_LAWBASE.sources, PEN = root.FIREGEO_LAWBASE.PEN;

// ============================================================= 1. what the inspector found
// window.CONTENT.daisy: the inspection record, as structured content. Tags carry the evidentiary
// standing of a statement through to the page: confirmed / observed / verify (see examples/README.md).
const content = {
  tab: 'Wires',
  title: 'Relocatable Power Taps — Connected in Series',
  status: 'Noncompliant — inspector confirmed',
  meta: [
    ['Inspection type', 'Fire and life safety inspection'],
    ['Category', 'Electrical · relocatable power taps and cords'],
    ['Location', 'Carpeted floor at the photographed location'],
    ['Compliance deadline', 'To be established by the authority having jurisdiction'],
  ],

  photo: 'assets/daisychain.jpg',
  aspect: 1086 / 1448,

  note: 'one power strip plugged into another',
  noteFix: 'Unplug the pale strip from the grey one and put it in the free socket of the same wall outlet.',
  noteWhy: 'A power tap is listed to be fed by a permanently installed receptacle. Feeding one from another puts the whole load of both through a single cord and a single set of contacts, and past the protection each was built around.',

  summary: 'Two relocatable power taps lie on a carpeted floor below a run of cabinets. The grey tap against the plinth is correctly supplied: its cord runs up to the wall receptacle at the left of the frame. The pale tap in the foreground is not. Its cord runs up the carpet and ends in a socket of the grey tap, so it is fed from another tap rather than from the wall.',
  primary: 'Unplug the pale tap from the grey one and connect it directly to a permanently installed receptacle. The wall receptacle in the photograph has a free socket. Neither tap may be fed from the other.',

  // Boxes are [left, top, width, height] as percentages of the displayed image. Measured off the photograph by
  // cropping and enlarging it, not guessed and not placed by a model: an earlier pass took a model's boxes for the
  // older frame and they sat about four per cent too high.
  annotations: [
    { box: [59, 34.5, 5, 5], tone: 'red', label: 'Tap fed from a tap',
      note: 'The pale plug in the near socket of the grey strip is the lower strip’s supply cord. This one connection is the finding.' },
    { box: [5, 3, 7, 10], tone: 'cyan', label: 'The wall receptacle',
      note: 'The only permanently installed receptacle in the photograph. It is a duplex, and only the lower socket is in use: the grey strip’s cord is in it and the upper socket is free.' },
    { box: [38, 30.5, 39, 9], tone: 'cyan', label: 'Upper strip, fed from the wall',
      note: 'A grey tap lying against the cabinet plinth. Its own cord runs up to the wall receptacle, so this one is correctly supplied. It is what the lower strip is plugged into.' },
    { box: [26, 64, 13, 31], tone: 'cyan', label: 'Lower strip, fed from the upper',
      note: 'A pale tap with a lit red switch and a plug-in transformer in it. Its cord runs up the carpet to the grey tap above, not to a wall socket. It is the downstream device.' },
  ],
  annotationCaption: 'The finding is one plug in one socket. The wall receptacle and both strips are marked so the record is clear about which feeds which: the grey strip is correctly on the wall, the pale one hangs off it, and that direction is what the code is about.',

  solutions: [
    {
      id: 'a',
      badge: 'required', badgeText: 'Required correction · inspector confirmed',
      title: 'Plug both power strips directly into the same wall outlet',
      lede: 'The correction the code asks for. Nothing is bought and nothing is installed.',
      plain: 'Unplug the pale strip from the grey one and put it in the free socket of the same wall outlet.',
      image: 'assets/generated/daisy-a-direct.png',
      where: 'The pale plug in the near socket of the grey strip, and the wall receptacle at the left of the photograph.',
      change: 'Withdraw that plug from the grey strip and put the pale strip’s own cord into the free socket of the wall receptacle, beside the grey strip’s cord.',
      how: [
        'Switch off and unplug both taps before moving anything.',
        'The receptacle on the wall is a duplex: the grey strip uses the lower socket and the upper one is free. Put the pale strip’s own cord into it.',
        'Where no socket is free, move the tap to one that is, or use a tap whose own cord reaches. Never an extension cord between the two.',
        'Confirm that neither tap is now fed by the other.',
        'Total the nameplate load on each tap and check it against the tap’s own rating, and both against the circuit.',
        'Route both cords so they are not walked on, pinched by the cabinet, or run under a door or a floor covering.',
      ],
      keep: 'Both taps, if each is listed and undamaged, and everything currently plugged into them. Nothing here requires new equipment, new wiring or an electrician.',
      why: 'A relocatable power tap is listed to be supplied by a permanently installed receptacle. Fed from another tap, the whole of both loads passes through one cord and one set of contacts, and the overcurrent protection in the upstream tap is no longer sized for what is behind it.',
    },
    {
      id: 'b',
      badge: 'alt', badgeText: 'Alternative — requires inspector approval',
      title: 'Replace both strips with one longer power strip',
      lede: 'One tap of adequate rating and reach, rather than two in a row.',
      plain: 'Take both strips away and put in one longer one that reaches the wall on its own.',
      image: 'assets/generated/daisy-b-one-tap.png',
      where: 'Both taps, the cord between them, and everything presently plugged into either.',
      change: 'Remove both taps and fit a single listed tap whose own cord reaches the wall receptacle and whose rating covers the whole load.',
      how: [
        'Add up the nameplate load of everything presently plugged into both taps.',
        'Choose one listed tap with enough sockets for all of it, a rating above that total, and a cord long enough to reach the receptacle without an extension cord.',
        'Fit it, plug it straight into the wall receptacle, and take both old taps out of the area.',
        'If no single tap covers the load, this option is closed: the load needs more than one supply, and that is correction A or C.',
      ],
      keep: 'The loads themselves are unaffected. Either old tap can be kept for use elsewhere if it is listed and undamaged.',
      why: 'It removes the series connection by removing the reason for it. One tap on one cord is what the listing assumes, and a longer cord answers the distance that led to the chain in the first place.',
      limit: 'It needs the ratings and the total load, and the photograph gives neither. Whether one tap can carry everything here is not established.',
    },
    {
      id: 'c',
      badge: 'alt', badgeText: 'Alternative — requires inspector approval',
      title: 'Install an additional permanent electrical outlet',
      lede: 'The long-term fix, and the only one that needs an electrician.',
      plain: 'Have an electrician put another wall socket in, near where the equipment actually is.',
      image: 'assets/generated/daisy-c-receptacles.png',
      proposal: true,
      where: 'The wall and plinth at the left of the photograph, where the one receptacle is.',
      change: 'Have a licensed electrician add a permanently installed receptacle on a circuit sized for the load, near the equipment, and retire the taps that were standing in for it.',
      how: [
        'Have the circuit and its existing load assessed by a licensed electrician.',
        'Install the additional receptacle under permit, near where the equipment sits.',
        'Plug the equipment into the new receptacle and take away the taps that are no longer needed.',
        'Keep any remaining tap directly on a receptacle of its own.',
      ],
      keep: 'Nothing is required to be discarded. A listed, undamaged tap can stay in use on its own receptacle.',
      why: 'Taps get chained when there are fewer receptacles than things to plug in. Adding one removes that pressure, and the fire code says plainly that cords are not a substitute for permanent wiring.',
      limit: 'This is a proposal, not part of the inspection record, and it is the most expensive of the three. It needs a licensed electrician and in most cases a permit. It must never be presented as a condition of clearing the violation: moving one plug to the free socket clears it, at no cost.',
      imageNote: 'The second receptacle in the visualisation is proposed, not existing. Only the one at the left of the photograph is there today.',
    },
  ],

  extras: [
    {
      title: 'Check the rest of the room for the same arrangement',
      badgeText: 'Supplementary',
      where: 'The photograph shows one corner of a floor. Cords leave the frame in three directions.',
      body: 'Follow each cord that leaves the frame and establish what is on the far end of it. Look for further taps in series, taps fed by extension cords, and cords run under doors, under the carpet or through a wall. Record each one separately rather than as part of this finding.',
      why: 'Where two taps have been chained, there are usually more: the cause is a shortage of receptacles, and that shortage is not confined to one corner.',
      limit: 'Do not conclude from this photograph that other taps are chained. It shows two.',
    },
    {
      title: 'Check both taps for listing marks and damage',
      badgeText: 'Supplementary',
      where: 'The body of each tap, and the full length of both cords.',
      body: 'Establish that each tap carries a listing mark, that its cord and plug are undamaged, and that neither tap has been modified. Replace any tap that is unlisted, damaged or missing a ground pin.',
      why: 'The series connection and the condition of the devices are separate requirements. Correcting the first does not answer the second.',
      limit: 'No listing mark is legible in the photograph, and the cords are only partly in frame. Nothing here is established either way.',
    },
  ],

  notAcceptable: {
    title: 'Not acceptable as corrections',
    body: 'Putting an extension cord between the two taps does not correct this: an extension cord is not a permanently installed receptacle either, and § 603.6 adds its own requirements on top. Nor does swapping one of the taps for a longer one, taping the joint, or moving the pair somewhere less visible. The violation is the series connection, and the only thing that clears it is a permanently installed receptacle at the end of each tap’s own cord.',
  },

  analysis: [
    {
      h: 'Inspector input — what the photograph shows',
      blocks: [
        { t: 'p', tag: 'observed', v: 'The photograph shows two relocatable power taps lying on a ribbed grey carpet, photographed from above and slightly to one side. A wooden edge, possibly a skirting or the foot of a cabinet, is visible at the top left corner.' },
        { t: 'h', v: 'The upper tap' },
        { t: 'p', v: 'A white moulded tap, marked BELKIN on its upper face, with six outlets in a single row. Four are occupied: a black right-angle cord cap, a white plug-in supply of the kind used for charging, a second black cord cap, and at the right-hand end a cream right-angle cord cap. Its own supply cord leaves the left-hand end of the body and runs out of the frame.' },
        { t: 'h', v: 'The lower tap' },
        { t: 'p', v: 'A cream-coloured tap with six outlets and an illuminated rocker switch at its right-hand end, showing surface marking and discolouration consistent with age. Two black cord caps are plugged into it. Its supply cord leaves the right-hand end of the body.' },
        { t: 'h', v: 'The connection between them' },
        { t: 'p', tag: 'observed', v: 'The cream supply cord leaving the lower tap curves up and to the right across the carpet and terminates in the cream right-angle cord cap occupying the last outlet of the upper tap. The lower tap is therefore supplied by the upper tap and not by a wall receptacle. This is the finding.' },
        { t: 'h', v: 'Surroundings' },
        { t: 'ul', v: [
          'Both taps rest directly on carpet, unsecured.',
          'A white cord passes across the lower tap without being connected to it, and runs down out of the frame.',
          'Cords leave the frame at the top, the left and the right.',
          'No wall, receptacle or equipment is visible in the photograph.',
        ] },
        { t: 'h', v: 'What the photograph does not establish' },
        { t: 'ul', tag: 'verify', v: [
          'The occupancy and the use of the room. Both matter: § 603.5.2 excepts a Group A occupancy and a Group B meeting room.',
          'Whether the upper tap’s own cord ends in a permanently installed receptacle or in something else again.',
          'What is on the far end of the other cords leaving the frame.',
          'Whether either tap carries a listing mark. None is legible.',
          'The rating of either tap, and the total load presently on them.',
          'How long the arrangement has stood, which bears on the 90-day testing exception.',
        ] },
      ],
    },
    {
      h: 'Fire behaviour and risk assessment',
      blocks: [
        { t: 'p', v: 'A relocatable power tap is listed on the understanding that it is fed by a permanently installed receptacle on a known branch circuit, and that its own overcurrent protection sits between that circuit and everything plugged into it. Chaining a second tap behind the first changes what that protection is protecting.' },
        { t: 'h', v: '1 — The whole load through one cord and one pair of contacts' },
        { t: 'p', v: 'Everything on the lower tap, plus everything on the upper tap, passes through the upper tap’s single cord and its single plug-and-outlet contact. Cord-cap contacts heat with load and with age, and a worn or loose contact heats faster. The heat appears at the connection rather than at the circuit breaker, which is not watching it.' },
        { t: 'p', tag: 'verify', v: '<b>Photo-specific.</b> Six loads are visible across the two taps. Their nameplate ratings cannot be read from the photograph, so no statement about the actual current is made here.' },
        { t: 'h', v: '2 — Protection that no longer matches what is behind it' },
        { t: 'p', v: 'Where a tap carries overcurrent protection, it is sized for that tap. Behind a second tap, the two sets of protection are in series and the upstream one now stands in front of twice the outlets it was built for. A fault behind the second tap may be cleared late, or by the wrong device.' },
        { t: 'p', tag: 'verify', v: '<b>Photo-specific.</b> The lower tap has a lit rocker switch, which commonly accompanies a protected device, but whether either tap is protected and to what rating is not established by the photograph.' },
        { t: 'h', v: '3 — Where the heat would be if it happened' },
        { t: 'p', v: 'Both taps and both cords lie directly on carpet. Carpet is combustible, it insulates a warm device rather than letting it shed heat, and a connection resting in pile is out of sight. Nothing here establishes that the arrangement is overloaded; it establishes that if it were, the heat would be in contact with a fuel and nobody would see it.' },
        { t: 'p', tag: 'observed', v: '<b>Photo-specific.</b> The cords lie on top of the carpet, not beneath it. § 603.5.3 addresses cords run under a floor covering; that is not what this photograph shows.' },
        { t: 'h', v: 'Overall fire and life-safety risk' },
        { t: 'kv', v: [
          ['Confirmed condition', 'One relocatable power tap supplied by another, as shown in the photograph.'],
          ['Primary risk', 'Load and fault current concentrated at one cord and one contact, with the protection no longer matched to what is behind it.'],
          ['Aggravating condition', 'Both devices and their connections lie on a combustible floor covering, where heat is contained and a fault is unseen.'],
          ['What is not established', 'That the arrangement is overloaded, that either device is faulty, or that anything has already overheated. None of that can be read from a photograph, and none of it is needed: the series connection is itself the violation.'],
        ] },
      ],
    },
    {
      h: 'Applicable fire codes',
      framework: 'Framework: 2025 California Fire Code chapter 6 (Building Services and Systems), as adopted by each jurisdiction. Chapter 6 was reorganised in the 2025 edition — these sections carried § 605.x numbers in earlier editions, and § 605 now addresses fuel-fired appliances.',
      codes: [
        { cite: '2025 California Fire Code<br>§ 603.5.2',
          requires: 'Relocatable power taps and current taps shall be directly connected to a permanently installed receptacle.',
          applies: 'The direct basis for the finding. The lower tap is connected to the upper tap, which is not a permanently installed receptacle.',
          open: 'Two exceptions: up to five taps may be connected together for temporary use supplying electronic equipment in a Group A occupancy or a Group B meeting room, and taps used for 90 days or less to test the performance of the devices. The photograph establishes neither the occupancy nor how long this has stood.' },
        { cite: '2025 California Fire Code<br>§ 603.5.1',
          requires: 'Relocatable power taps listed to UL 1363; current taps listed to UL 498A.',
          applies: 'A separate requirement. An unlisted tap is its own finding, whatever it is plugged into.',
          open: 'No listing mark is legible on either device in this photograph.' },
        { cite: '2025 California Fire Code<br>§ 603.5.3',
          requires: 'Tap cords not run through walls, ceilings or floors, under doors or floor coverings, nor subject to environmental or physical damage.',
          applies: 'The cords cross an open floor. They are on the carpet rather than under it, so the question that remains is damage, not concealment.',
          open: 'Whether the cords are open to physical damage where they cross, and where the cords leaving the frame go.' },
        { cite: '2025 California Fire Code<br>§ 603.6',
          requires: 'Extension cords are not a substitute for permanent wiring, are listed and labelled to UL 817, are not run through or under building elements, and serve only portable appliances.',
          applies: 'Relevant if any cord in the frame is carrying a fixed load in place of a receptacle that should have been installed. That would be a second finding, not this one.',
          open: 'What each cord leaving the frame is feeding.' },
        { cite: '2025 California Fire Code<br>§ 603.2',
          requires: 'Conditions that constitute an electrical shock or fire hazard shall be abated.',
          applies: 'The general duty the correction is ordered under, once the official has found a hazard.',
          open: 'Whether the official makes that finding here.' },
      ],
      conclusion: 'An inspector-confirmed series connection of two relocatable power taps. The section is state text and reads the same in every place on this map; the enforceable citation is that section as carried by the local adopting ordinance, and the penalty clause attached to it sits at a different section number in each town.',
    },
    {
      h: 'Internal inspection record',
      blocks: [
        { t: 'h', v: 'Observed condition' },
        { t: 'p', v: 'Two relocatable power taps are present on a carpeted floor. The supply cord of the lower six-outlet tap is connected to an outlet of the upper tap rather than to a permanently installed receptacle. Four cord caps and one plug-in supply are connected across the two devices. Both devices and their cords rest directly on a combustible floor covering.' },
        { t: 'h', v: 'Hazard description' },
        { t: 'p', v: 'Supplying one relocatable power tap from another concentrates the combined load of both devices at a single cord and a single plug-and-outlet contact, and places the upstream device’s overcurrent protection in front of more outlets than it was listed for. Heating at the shared contact, and any fault behind the downstream device, occur at a connection lying in carpet pile where heat is retained and the condition is not visible.' },
        { t: 'h', v: 'Applicable codes' },
        { t: 'ul', v: [
          '2025 California Fire Code § 603.5.2 — direct connection to a permanently installed receptacle.',
          '2025 California Fire Code § 603.5.1 — listing of taps.',
          '2025 California Fire Code § 603.5.3 — installation and protection of tap cords.',
          '2025 California Fire Code § 603.6 — extension cords.',
          '2025 California Fire Code § 603.2 — abatement of electrical hazards.',
          'The adopting ordinance of the jurisdiction, and its amended penalty section.',
        ] },
        { t: 'p', tag: 'verify', v: 'Final citations subject to jurisdiction and occupancy verification. § 603.5.2 carries two exceptions turning on the occupancy and on the duration of the arrangement, and the photograph establishes neither.' },
        { t: 'h', v: 'Required corrective action' },
        { t: 'p', v: 'Disconnect the lower relocatable power tap from the upper tap and connect it directly to a permanently installed receptacle. No extension cord shall be interposed between either tap and its receptacle. Confirm that the connected load on each tap is within the rating marked on that tap, and that both cords are routed clear of traffic, furniture, doors and floor coverings. Inspect both devices for listing marks and damage, and replace any device found unlisted, damaged or modified.' },
        { t: 'h', v: 'Reinspection requirements' },
        { t: 'p', v: 'The inspector shall verify that:' },
        { t: 'ul', v: [
          'Neither tap is supplied by the other, or by an extension cord.',
          'Each tap in use is connected directly to a permanently installed receptacle.',
          'The load on each tap is within its marked rating.',
          'Both devices are listed, undamaged and unmodified.',
          'The cords are not run under doors or floor coverings and are not open to damage.',
          'No further taps in series are present in the same area.',
        ] },
      ],
    },
  ],

  owner: {
    title: 'Fire safety inspection — electrical correction required',
    sub: 'Finding: one power strip plugged into another',
    intro: 'Two power strips are connected one into the other. The lower strip is not plugged into the wall: its cord goes into the strip above it.',
    todo: 'Unplug the lower strip from the upper one and put it in the free socket of the wall outlet.',
    keep: 'You can keep both strips and everything plugged into them. Nothing needs to be thrown away.',
    when: 'By the deadline specified in your official fire inspection report. This correction takes a minute and costs nothing.',
    dont: 'Do not join the two strips with an extension cord instead. That is the same problem with one more part in it.',
    qa: [
      { q: 'What did we find?', a: ['Two power strips are plugged one into the other.', 'The lower cream-coloured strip does not go to a wall outlet. Its cord runs up to the strip above it and plugs into the last socket on that strip. This is sometimes called <b>daisy-chaining</b>.'] },
      { q: 'Why is this dangerous?', a: ['A power strip is built and tested on the understanding that it is plugged into a wall outlet, and that it is protecting only the things plugged into it.', 'When a second strip hangs off the first, everything on both strips draws its power through one cord and one plug. That single plug carries all of it, and plugs warm up as they age and loosen. Both of these strips are lying on carpet, which holds the heat in and hides it.'] },
      { q: 'What do you need to do?', a: ['<b>Unplug the lower strip from the upper strip, and put it straight into the wall.</b>', 'In your photograph this is the cream-coloured plug in the last socket on the right of the white strip. Pull it out. The wall socket already has a free half above the one in use: put it there.', 'Switch both strips off before you move anything.'], image: true },
      { q: 'Can you use an extension cord to reach the wall?', a: ['<b>No.</b>', 'An extension cord is not a wall outlet, so the same rule applies. If the strip will not reach, move the strip nearer, or use one whose own cord is long enough. If there is genuinely nowhere to plug in, an electrician can add a socket — but that is not needed to clear this.'] },
      { q: 'Do you have to buy anything?', a: ['<b>No.</b>', 'The correction is to move one plug. You can keep both strips, as long as each one is undamaged and goes straight into a wall outlet of its own.', 'If the real problem is that there are not enough wall outlets in the room, a licensed electrician can add some. That is worth doing, but it is not required to clear this violation.'] },
      { q: 'What happens next?', a: ['Once each strip is plugged directly into a wall outlet, the condition can be reviewed. Your inspector will determine whether the finding has been corrected.', 'While you are there, it is worth checking the rest of the room for the same arrangement — where there is one chained strip there are often others.'] },
    ],
  },

  uncertainty: [
    ['Is one tap plugged into another?', 'The photograph shows the lower tap’s supply cord ending in the last outlet of the upper tap. The inspector has confirmed the condition.', 'Confirm the official finding.'],
    ['Where does the upper tap’s cord go?', 'It leaves the frame to the left. Whether it reaches a permanently installed receptacle is not shown.', 'Follow the cord and confirm what supplies the pair.'],
    ['What occupancy is this?', 'Carpet, a skirting edge and office-type equipment are visible. Nothing establishes the occupancy classification.', 'Confirm the occupancy: § 603.5.2 excepts a Group A occupancy and a Group B meeting room.'],
    ['Is this a meeting room?', 'The photograph shows a floor, not a room. The exception for connected taps applies in a Group B meeting room supplying electronic equipment, temporarily.', 'Determine the use of the room and whether the arrangement is temporary.'],
    ['How long has this stood?', 'Not determinable. The second exception covers 90 days or less for performance testing of the devices.', 'Establish how long the arrangement has been in place and for what purpose.'],
    ['Are the taps listed?', 'No listing mark is legible on either device.', 'Inspect both devices for a UL 1363 or UL 498A mark.'],
    ['What is the load?', 'Six connected loads are visible. No nameplate rating can be read.', 'Total the connected load and compare it with the rating marked on each tap.'],
    ['Are the cords damaged?', 'The visible lengths appear intact, but most of each cord is outside the frame.', 'Inspect the full length of both cords and both plugs.'],
    ['Are the cords run under anything?', 'They lie on top of the carpet within the frame. Where they go after that is not shown.', 'Follow each cord and confirm none runs under a door, a covering or through a wall.'],
    ['Are there other chained taps?', 'Cords leave the frame in three directions. The photograph shows two taps.', 'Inspect the rest of the area and record any further taps separately.'],
    ['Which code edition applies?', 'All five places are on the 2025 edition from 1 Jan 2026. Fairfax, unincorporated Marin and Berkeley were on the 2022 edition before that.', 'Confirm the edition in force on the date of the observation, and the section number under it.'],
    ['What does a violation carry?', 'Each town amends the penalty clause into chapter 1 at a different section number, and San Anselmo also runs an administrative citation route.', 'Confirm the enforcement route and the figures for the jurisdiction.'],
    ['Is the violation resolved?', 'A follow-up photograph can show each tap on its own receptacle.', 'Verify the connection, the load and the condition of both devices, and approve closure.'],
  ],

  final: [
    ['Primary finding', 'Two relocatable power taps connected in series — inspector-confirmed violation.'],
    ['Primary cause', 'The lower tap is supplied from an outlet of the upper tap instead of from a permanently installed receptacle.'],
    ['Primary risk', 'The combined load of both devices concentrated at one cord and one contact, with overcurrent protection no longer matched to what is behind it, on a combustible floor covering.'],
    ['Required corrective action', 'Connect each tap directly to a permanently installed receptacle — the free half of the existing duplex serves — with no extension cord interposed.'],
    ['Supplementary recommendation', 'Check the area for further taps in series, and both devices for listing marks and damage.'],
    ['Inspector discretion', 'Required for occupancy and the two § 603.5.2 exceptions, code applicability, enforcement route, compliance deadline and final approval.'],
    ['Final status', 'Noncompliant — pending corrective action and inspector approval.'],
  ],
};

// ============================================================= 2. the law
// ---- the daisy chain. 2025 CFC ch. 6 was reorganised: the electrical sections are §§ 603.x, and the numbers they
// carried in earlier editions now address other subjects (§ 605 is Fuel-Fired Appliances). Read on up.codes
// 2026-11-23; the ICC site is blocked, so the operative sentences are quoted and nothing else is inferred.
const Q_TAP_DIRECT = '“Relocatable power taps and current taps shall be directly connected to a permanently installed receptacle.”';
const Q_TAP_EX = ' Two exceptions: up to five taps may be connected together for temporary use supplying electronic equipment in a Group A occupancy or a Group B meeting room, and taps used for 90 days or less to test the performance of the devices.';
const Q_TAP_LIST = 'Relocatable power taps shall be listed to UL 1363, and current taps to UL 498A.';
const Q_TAP_INSTALL = 'Relocatable power tap cords shall not extend through walls, ceilings or floors, under doors or floor coverings, nor be subject to environmental or physical damage.';
const Q_CORD = '“Extension cords shall not be a substitute for permanent wiring and shall be listed and labeled in accordance with UL 817. Extension cords shall not be affixed to structures, extended through walls, ceilings or floors, or under doors or floor coverings, nor shall such cords be subject to environmental damage or physical impact. Extension cords shall be used only with portable appliances. Extension cords marked for indoor use shall not be used outdoors.”';
const Q_ABATE = '“Conditions that constitute an electrical shock or fire hazard shall be abated.”';

const law = {
  state: [
    { key: 'tap-direct', label: 'Power taps', title: 'Taps plugged straight into a receptacle', value: null, unit: '', rule: 'tapDirect',
      cite: '2025 California Fire Code § 603.5.2', requires: Q_TAP_DIRECT + Q_TAP_EX,
      applies: 'The direct basis for the finding. The photograph shows one power tap plugged into another, and another tap is not a permanently installed receptacle.',
      open: 'Whether either exception is in play: the occupancy and the use of the room, which the photograph does not establish, and whether this is a 90-day performance test.',
      source: SRC.cfc6 },
    { key: 'tap-listing', label: 'Tap listing', title: 'Taps listed to a standard', value: null, unit: '', rule: 'judgement',
      cite: '2025 California Fire Code § 603.5.1', requires: Q_TAP_LIST,
      applies: 'A separate requirement from the connection one. An unlisted tap is a finding of its own, whatever it is plugged into.',
      open: 'Whether either tap carries the mark. No listing mark is legible in the photograph.',
      turns: 'whether either tap carries a listing mark', source: SRC.cfc6 },
    { key: 'tap-install', label: 'Where the cords run', title: 'Cords not run through or under', value: null, unit: '', rule: 'judgement',
      cite: '2025 California Fire Code § 603.5.3', requires: Q_TAP_INSTALL,
      applies: 'The cords lie loose across a carpeted floor. On top of a floor covering is not under one, but a cord crossing open floor raises the damage half of the same sentence.',
      open: 'Whether the cords are open to physical damage where they cross the floor, and whether any of them runs on under a door or a covering outside the frame.',
      turns: 'whether the cords are open to damage', source: SRC.cfc6 },
    { key: 'cords', label: 'Extension cords', title: 'Cords not standing in for wiring', value: null, unit: '', rule: 'judgement',
      cite: '2025 California Fire Code § 603.6', requires: Q_CORD,
      applies: 'Cords leave the frame in three directions. If one of them is carrying a fixed load in place of an outlet that should have been installed, this section is the finding rather than the tap one.',
      open: 'What is on the far end of each cord, and how long the arrangement has stood.',
      turns: 'what the cords leaving the frame are feeding', source: SRC.cfc6 },
  ],
  stateNote: 'The rule is state text and it reads the same in all five places. Chapter 6 was reorganised in the 2025 edition: these sections were numbered § 605.x before it, and § 605 now addresses fuel-fired appliances. What changes with the place is the ordinance that carries the chapter, the edition in force before 1 Jan 2026, and what a violation costs.',
  local: [
    { key: 'ch6-amend', label: 'Chapter 6 amendments', title: 'Local changes to chapter 6', diffName: 'chapter 6', unit: '', rule: 'judgement', value: null,
      requires: '§ 605.11.3 Required conduit. “All wiring that may contain electrical potential when the alternate service disconnect has been activated, (such as the wiring between the solar arrays and the DC electrical disconnect on a photovoltaic system) shall be completely contained in metal conduit.” § 605.11.4 Disconnect. “The electrical service disconnect for the alternative power supply shall be located within eight feet from the electrical service disconnect on the same or an adjacent exterior wall. The disconnect shall be accessible to emergency personnel from the exterior without the use of ladders or other special equipment.” § 605.11.5 adds a permanent red warning sign at the main disconnect. San Anselmo is the only one of the four that writes anything into chapter 6 at all.',
      applies: 'Nothing in it touches power taps. It is on screen because it is the one place in this valley where a chapter 6 citation may not be the state text as printed: read the local chapter before citing, not only the state one.',
      open: 'The ordinance numbers these into § 605.11, which in the 2025 edition is part of Fuel-Fired Appliances. Read as introduced in the Council packet of 28 Oct 2025; confirm the numbering against the adopted ordinance.',
      turns: 'nothing here; the amendment is about solar supply',
      by: { san_anselmo: { cite: 'SAMC § 3-3.810 · Ord. 2025-1194', code: 'SAMC § 3-3.810', sec: '§§ 605.11.3–605.11.5', source: SRC.saPacket } } },
    CM.penalties(),
  ],

  // The one-line form of each row: the section number, and the local code that carries it.
  short: {
  'tap-direct': { sec: '§ 603.5.2', code: 'California Fire Code' }, 'tap-listing': { sec: '§ 603.5.1', code: 'UL 1363 · UL 498A' },
  'tap-install': { sec: '§ 603.5.3', code: 'California Fire Code' }, 'cords': { sec: '§ 603.6', code: 'California Fire Code' },
  'ch6-amend': { sec: '§§ 605.11.3–605.11.5', code: { san_anselmo: 'SAMC § 3-3.810' } },
  'penalties': { sec: '§ 113.4', code: PEN },                      // the shared row, examples/common.js
  },

  // One plain sentence when the map moves to the other region. {To} {toName} = the place arrived in.
  across: 'In {toName} the same state chapter 6 applies, under its own ordinance.',

  overallLine: 'A tap fed from a tap.',

  // The verdict rules this example's rows name. Each returns { verdict, why }: `row` is the merged row,
  // `c` is { d, scope, zone, place }. A rule reads only what the cited text says.
  rules: {
    // 2025 CFC § 603.5.2: a tap goes into a permanently installed receptacle, and another tap is not one. The
    // photograph shows the connection itself, so this is as settled as the painted head — the two exceptions
    // (a Group A or B meeting room, a 90-day test) are facts about the room, and they sit in the row's `open`.
    tapDirect() { return { verdict: 'red', why: 'One power tap is plugged into another. Confirmed.' }; },
  },
};

// ============================================================= 3. the field app (the phone)
// The rules this follows (Andrew, 22 Nov): the app answers everything it can, and the person is asked
// only what a photograph cannot tell. A question must be about THIS photograph and what is in it.
const field = {
  // what the app thinks the inspector is reporting, and the other readings on offer
  reading: {
    text: 'One power strip is plugged into another one, instead of into the wall.',
    alternatives: ['Both strips are plugged into the wall.', 'The cords are lying across the floor where people walk.'],
    source: 'content.js daisy.summary, annotations[0], owner.intro',
  },

  // what the scan lights up: the finding, and at most one thing beside it that matters. `ix` names a
  // content annotation by its index; the region itself is read from that annotation, never written here.
  scan: [{ ix: 2, label: 'Upper strip, on the wall' }, { ix: 0, label: 'The lower strip feeds off it', finding: true }],

  // what the app reads off the photo: answers already filled in. The first option is the app's own
  // reading; the others are what a tap on "Change" offers.
  seen: [
    { id: 'chain', label: 'Lower strip', options: [{ id: 'intostrip', label: 'Plugged into the strip above' }, { id: 'intowall', label: 'Plugged into the wall' }, { id: 'unsure', label: 'Not sure' }], source: 'content.js daisy.summary, annotations[0]' },
    { id: 'upper', label: 'Upper strip', options: [{ id: 'wall', label: 'Plugged into a wall socket' }, { id: 'other', label: 'Plugged into something else' }, { id: 'unsure', label: 'Not sure' }], source: 'content.js daisy.annotations[1]; uncertainty "Where does the upper tap\u2019s cord go?"' },
    { id: 'cords', label: 'Cords', options: [{ id: 'loose', label: 'Loose on the carpet' }, { id: 'under', label: 'Run under a door or the carpet' }, { id: 'unsure', label: 'Not sure' }], source: 'content.js daisy.annotations[2]; code row "tap-install" (CFC \u00a7 603.5.3)' },
    { id: 'count', label: 'Strips', options: [{ id: 'two', label: 'Two, chained together' }, { id: 'more', label: 'More than two' }, { id: 'unsure', label: 'Not sure' }], source: 'content.js daisy.extras[0]; code row "tap-direct" (the exception counts up to five)' },
  ],

  // the questions: one screen, at most three, answered by tapping. Fewer is better. None is fine.
  // The rule itself needs no measurement: a strip fed from a strip is the violation, and the photograph shows it.
  // What the photograph cannot show is whether either exception in CFC \u00a7 603.5.2 is in play, and both turn on
  // something only the person standing in the room knows. So the two questions are exactly those two exceptions.
  questions: [
    {
      // Nothing to photograph here: the three taps are the common answers, anything else is written in, and
      // "Not sure" stays, because a visitor to a building may genuinely not know what a room is used for.
      id: 'room', ask: 'What is this room used for?',
      options: [{ id: 'work', label: 'An office or work room' }, { id: 'meeting', label: 'A meeting room' }, { id: 'assembly', label: 'A hall or function room' }],
      write: { label: 'What the room is used for', placeholder: 'Or write what it is' },
      cant: { id: 'unsure', label: 'Not sure' },
      say: () => 'The rule has an exception for meeting and function rooms.',
      source: 'code row "tap-direct" (CFC \u00a7 603.5.2, read on up.codes 2026-11-23): the exception covers a Group A occupancy or a Group B meeting room. The plain words for the three options are this prototype\u2019s; the occupancy groups themselves are the inspector\u2019s to decide.',
    },
    {
      // Both exceptions turn on the same thing \u2014 whether the arrangement is temporary \u2014 so that is what is asked,
      // in those words. Testing is kept apart from plain temporary use, because only testing carries the 90 days.
      id: 'temp', ask: 'Is this a temporary setup?',
      options: [{ id: 'testing', label: 'Yes, testing equipment' }, { id: 'temporary', label: 'Yes, temporary' }, { id: 'permanent', label: 'No, it stays like this' }],
      cant: { id: 'unsure', label: 'Not sure' },
      write: { label: 'What the setup is for', placeholder: 'Or write what it is for' },
      say: () => 'One exception covers temporary use, the other only 90 days of testing.',
      source: 'code row "tap-direct" (CFC \u00a7 603.5.2): up to five taps \u201cfor temporary use supplying electronic equipment\u201d, and taps \u201cused for 90 days or less for the purpose of testing the performance of such devices\u201d. content.js daisy.uncertainty "How long has this stood?"',
    },
  ],

  /** the phone's answers as plain facts for the code rows. a = answers, c = corrected readings. */
  facts(a, c, h) {
    const f = {}; const { seen } = h;
    if ((a.room || {}).pick) f.room = a.room.pick;
    else if (((a.room || {}).text || '').trim()) { f.room = 'written'; f.roomText = a.room.text.trim(); }
    if ((a.temp || {}).pick) f.temp = a.temp.pick;
    else if (((a.temp || {}).text || '').trim()) { f.temp = 'written'; f.tempText = a.temp.text.trim(); }
    for (const k of ['chain', 'upper', 'cords', 'count']) if (c[k] && c[k] !== seen('daisy').find(s => s.id === k).options[0].id) f[k] = c[k];
    return f;
  },

  /** the one or two things the senior inspector should act on: a short line and a full sentence. */
  callouts(f, ctx) {
    const out = [];
    // Neither answer clears the finding on its own. Each says which exception has to be settled, and by whom.
    if (f.room === 'meeting' || f.room === 'assembly') {
      const where = f.room === 'meeting' ? 'a meeting room' : 'a hall or function room';
      out.push({ short: 'The field inspector calls this ' + where + '.', text: 'The field inspector calls this ' + where + '. The exception in \u00a7 603.5.2 covers up to five taps connected together for temporary use supplying electronic equipment in a Group A occupancy or a Group B meeting room. Whether this room is one, and whether this use is temporary, is yours to decide.' });
    } else if (f.room === 'work') out.push({ short: 'An ordinary work room: no exception in play.', text: 'The field inspector calls this an office or work room, so neither exception in \u00a7 603.5.2 is in play and the finding stands as read.' });
    else if (f.room === 'written') out.push({ short: 'Room, in the field inspector\u2019s words: \u201c' + f.roomText + '\u201d.', text: 'The field inspector wrote the room in rather than choosing one of the three: \u201c' + f.roomText + '\u201d. Decide from that whether \u00a7 603.5.2 excepts it, as a Group A occupancy or a Group B meeting room.' });
    else out.push({ short: 'Room use not recorded.', text: 'What the room is used for was not given, and \u00a7 603.5.2 excepts a Group A occupancy and a Group B meeting room. Settle the occupancy before citing.' });
    if (f.temp === 'written') out.push({ short: 'What it is for, in the field inspector\u2019s words: \u201c' + f.tempText + '\u201d.', text: 'The field inspector wrote what the setup is for rather than choosing: \u201c' + f.tempText + '\u201d. The 90-day exception covers testing the performance of the devices themselves, not a temporary arrangement in general.' });
    else if (f.temp === 'testing') out.push({ short: 'Temporary, for testing equipment, the field inspector says.', text: 'The field inspector says this is temporary and set up to test equipment. The 90-day exception covers testing the performance of the taps themselves, not whatever is plugged into them. Establish what is being tested, and for how long.' });
    else if (f.temp === 'temporary') out.push({ short: 'Temporary, the field inspector says.', text: 'The field inspector calls this temporary. \u00a7 603.5.2 excepts temporary use only in a Group A occupancy or a Group B meeting room, and only for electronic equipment; the other exception is 90 days of testing the devices themselves. Ask what it is for.' });
    else if (f.temp === 'permanent') out.push({ short: 'Not temporary: neither exception in play.', text: 'The field inspector says the arrangement stays as it is, so neither exception in \u00a7 603.5.2 is in play on this point and the finding stands as read.' });
    if (f.cords === 'under') out.push({ short: 'A cord runs under something, out of the frame.', text: 'The field inspector says a cord runs under a door or under the carpet. That is a second finding under \u00a7 603.5.3, separate from the chained taps.' });
    if (f.count === 'more') out.push({ short: 'More than two strips, the field inspector says.', text: 'The field inspector counts more than the two taps in the photograph. Record each one: the exception in \u00a7 603.5.2 stops at five, and only for the uses it names.' });
    return out;
  },

  /** what those answers do to this example's rows on the senior inspector's desk (team/adapter.js). */
  apply(f, ctx) {
    const { by, lead } = ctx;
    // The two answers the phone asks for are the two exceptions in CFC \u00a7 603.5.2, so they land on that row.
    // A meeting or function room does not clear the finding; it turns a confirmed violation into a reading the
    // inspector has to make, which is what yellow means everywhere else on this page.
    if (f.room === 'meeting' || f.room === 'assembly') {
      const where = f.room === 'meeting' ? 'a meeting room' : 'a hall or function room';
      lead('tap-direct', 'The field inspector calls this ' + where + '.');
      if (by['tap-direct']) {
        by['tap-direct'].verdict = 'yellow';
        by['tap-direct'].why = 'Depends on whether the meeting-room exception covers this.';
        by['tap-direct'].open = 'Whether the room is a Group A occupancy or a Group B meeting room, whether the use is temporary, and whether the load is electronic equipment.';
      }
    } else if (f.room === 'work') lead('tap-direct', 'The field inspector calls this an office or work room, so neither exception is in play.');
    else if (f.room === 'written') {
      lead('tap-direct', 'The field inspector wrote the room in: \u201c' + f.roomText + '\u201d.');
      if (by['tap-direct']) {
        by['tap-direct'].verdict = 'yellow';
        by['tap-direct'].why = 'Depends on whether that room is one the exception covers.';
        by['tap-direct'].open = 'Whether the room the field inspector describes is a Group A occupancy or a Group B meeting room, and whether the use is temporary.';
      }
    }
    if (f.temp === 'testing' || f.temp === 'temporary') lead('tap-direct', f.temp === 'testing' ? 'Temporary, for testing equipment, the field inspector says.' : 'Temporary, the field inspector says.');
    // A cord run under a door or a covering is the plain words of \u00a7 603.5.3, and the field inspector can see it.
    if (f.cords === 'under' && by['tap-install']) {
      lead('tap-install', 'The field inspector says a cord runs under a door or under the carpet.');
      by['tap-install'].verdict = 'red';
      by['tap-install'].why = 'A cord runs under a door or a covering. Confirmed on site.';
      by['tap-install'].open = '';
    }
    if (f.count === 'more') lead('tap-direct', 'The field inspector counts more than the two taps in the photograph.');
    if (f.upper === 'other') lead('cords', 'The field inspector says the upper strip is not plugged into a wall socket either.');
  },
};

// ============================================================= 4. the owner's numbered steps
// One list per correction, keyed by the correction id. Each step is one concrete action and says where
// to stop or what must stay; the second item is where the step comes from in the content above.
const ownerSteps = {
  a: [
    ['Switch both power strips off before you move anything.', 'solutions[a].how[0]; owner.qa "What do you need to do?"'],
    ['Find the cream-coloured plug in the last socket on the right of the white strip. That is the lower strip’s cord.', 'solutions[a].where; owner.qa "What do you need to do?"'],
    ['Pull it out and plug the lower strip straight into a wall socket instead.', 'solutions[a].change, .how[2]; owner.todo'],
    ['Do not put an extension lead between the strip and the wall. That is the same problem with one more part in it.', 'notAcceptable.body; owner.dont'],
    ['Check that neither strip is now fed by the other, and that each one goes straight to a wall socket.', 'solutions[a].how[3]'],
    ['Move the cords so they are not walked on, trapped under furniture, or run under a door or the carpet.', 'solutions[a].how[5]'],
    ['You can keep both strips and everything plugged into them. Nothing has to be thrown away.', 'solutions[a].keep; owner.keep'],
  ],
  b: [
    ['Ask your inspector first. This option only counts if the inspector approves it.', 'solutions[b].limit'],
    ['Add up what is plugged into both strips, and check the total against the rating printed on the strip you want to keep.', 'solutions[b].how[0], [1]'],
    ['If it all fits, move everything onto that one strip and take the other one out of the room.', 'solutions[b].how[2]; solutions[b].plain'],
    ['Plug the strip you kept straight into a wall socket.', 'solutions[b].change'],
    ['If it does not all fit, this option is closed: use the required correction, or have more sockets installed.', 'solutions[b].how[3]'],
  ],
  c: [
    ['Ask your inspector first, and use a licensed electrician. This usually needs a permit.', 'solutions[c].limit; solutions[c].how[0], [1]'],
    ['Have the electrician check the circuit and what is already on it.', 'solutions[c].how[0]'],
    ['Have new wall sockets installed where the equipment actually sits.', 'solutions[c].how[1]; solutions[c].plain'],
    ['Plug the equipment into the new sockets and take away the strips you no longer need.', 'solutions[c].how[2]'],
    ['Any strip you keep goes straight into a wall socket of its own.', 'solutions[c].how[3]; solutions[c].keep'],
    ['This is not required to clear the violation. Moving one plug does that, at no cost.', 'solutions[c].limit'],
  ],
};

EX.define({
  id: 'daisy', tab: 'Wires', title: 'Power strip in a power strip',
  photo: 'assets/daisychain.jpg', aspect: 1086 / 1448,
  usesDistance: false,
  zoom: 16,
  content, law, field, ownerSteps,
  emphasis: [],      // nothing marked in this example's text yet
});
})(typeof window !== 'undefined' ? window : globalThis);
