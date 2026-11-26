// examples/common.js — the pieces more than one example needs.
//
// A row belongs here only when two or more photographs genuinely carry the SAME row: the same key, the same words,
// the same places. Anything one example alone uses stays in that example, however tempting it looks. Each factory
// returns a fresh object, because data/law.js writes a by.berkeley into whichever copy it is joining and the two
// copies must not share it.
(function (root) {
'use strict';
const SRC = root.FIREGEO_LAWBASE.sources;

// Chapter 1 of the fire code, amended into a different section number in every town, and not to the same figures.
// It stands behind ANY fire-code citation, so every example whose finding is a fire-code section carries it.
const Q_PENALTY = '“Persons who shall violate a provision of this code or shall fail to comply with any of the requirements thereof or who shall erect, install, alter repair or do work in violation of the approved construction documents or directive of the Fire Code Official, or of a permit or certificate used under provisions of this code, shall be guilty of a misdemeanor, punishable by a fine of not more than $500 dollars or by imprisonment not exceeding 180 days, or both such fine and imprisonment. Each day that a violation continues after due notice has been served shall be deemed a separate offense.”';

function penalties() {
  return { key: 'penalties', label: 'Penalties', title: 'What a violation carries', diffName: 'penalty', unit: '', rule: 'judgement', value: null,
    requires: Q_PENALTY,
    applies: 'The same clause, amended into chapter 1 at a different section number in every town, and not to the same figures.',
    open: 'Whether the official proceeds criminally or by administrative citation.',
    turns: 'whether the official cites criminally or administratively',
    by: {
      ross:        { sec: '§ 113.4', cite: 'CFC § 113.4 as amended by RMC § 14.04.100 · Ord. 732', code: 'RMC § 14.04.140', source: SRC.rossPage,
                     applies: 'Ross amends this into § 113.4 and prints the clause above word for word.' },
      san_anselmo: { sec: '§§ 109.4, 111.4', cite: 'CFC §§ 109.4, 111.4 as amended by SAMC § 3-3.810 · penalties at SAMC § 3-3.812', code: 'SAMC § 3-3.812', source: SRC.saPacket,
                     requires: '§ 109.4 is amended by specifying “[offense = misdemeanor] [amount $500.00] [Number of days =90]”, where the other three say 180 days. § 111.4 fines are set at “Not less than [$500.00] not more than [$1,500.00]”. SAMC § 3-3.812 adds an administrative route: “The first citation, within a 12-month period, for violations of the Fire Code and any amendments adopted herein shall be treated as a Civil Penalty payable directly to the Ross Valley Fire Department and is set at $150 plus the actual costs of all inspections required to gain compliance”.',
                     applies: 'The one town of the four that does not simply reprint the clause: 90 days rather than 180, a fine range, and a $150 first citation.',
                     extra: 'an administrative citation at $150 for a first offence',
                     sayExtra: '{To} can take this administratively: $150 for a first citation in 12 months.',
                     open: 'Whether the first-citation route is used here, and what the inspection costs come to.' },
      fairfax:     { sec: '§ 113.4', cite: 'CFC § 113.4 as amended by FMC § 8.04.100 · Ord. 899', code: 'FMC § 8.04.100', source: SRC.ff899,
                     applies: 'The same section number as Ross, and the same clause but for two words: Fairfax prints “Persons who violate” and “who erect”.' },
      marin:       { sec: '§ 110.4', cite: 'CFC § 110.4 as amended by MCC § 16.16.040 · Ord. 3837', code: 'MCC § 16.16.040', source: SRC.marinOrd,
                     applies: 'The clause above word for word, but the county amends it into § 110.4, not § 113.4. Cite the number this county uses.' },
    } };
}
// Each example that carries this row also declares its one-line form in its own `law.short`, because that is
// where the reader of an example looks for how its rows are shown:
//   'penalties': { sec: '§ 113.4', code: root.FIREGEO_LAWBASE.PEN },
root.FireExampleCommon = { Q_PENALTY, penalties };
})(typeof window !== 'undefined' ? window : globalThis);
