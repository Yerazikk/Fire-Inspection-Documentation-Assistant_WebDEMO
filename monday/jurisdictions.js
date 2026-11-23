// Which fire code applies is a question about where the property is, and in
// the Ross Valley the answer changes over a few hundred metres. Three towns
// sit end to end along Sir Francis Drake Boulevard, all served by the same
// fire department, and all three adopt a *different* fire code:
//
//   Ross          2025 California Fire Code · ladder fuels cleared to 30 ft
//   San Anselmo   2025 California Fire Code · ladder fuels cleared to 30 ft
//   Fairfax       2022 California Fire Code · ladder fuels cleared to 100 ft
//   unincorporated  2022 California Fire Code (County) · 30 ft
//
// So the same hedge, photographed either side of a line that is invisible on
// the ground, produces a different citation and a different required scope of
// work. That is what the map in the codes section is for: the pin is the
// address, and the table under it is whatever that address makes enforceable.
//
// Every row below is taken from the adopting ordinance itself — see `source`
// on each jurisdiction. Text in `requires` is the ordinance's own language,
// trimmed but not reworded. `applies` is this page's reading of it against the
// two findings, and `open` is what the ordinance cannot settle from a photo.
//
// Boundaries are the OpenStreetMap administrative polygons for each town,
// simplified to about 10 m. They are accurate enough to show which side of a
// line a property sits on and nothing like a survey — a parcel on the line is
// a question for the assessor, which is what the readout says.
window.JURIS = (function () {

// ---------------------------------------------------------------------------
// The basemap. Rendered once from OpenStreetMap tiles at z15, desaturated to
// sit inside the page's paper palette, and cropped to exactly these bounds —
// so a lon/lat converts to a pixel with plain Web Mercator arithmetic and no
// tile server is involved at run time.
// ---------------------------------------------------------------------------
const map = {
  src: 'assets/rossvalley.jpg',
  w: 1640, h: 1289,
  west: -122.6280, south: 37.9500, east: -122.5255, north: 38.0135,
  credit: 'Basemap © OpenStreetMap contributors. Town boundaries from OpenStreetMap, simplified.',
};

// Town limits, from the OpenStreetMap administrative boundaries, simplified to
// roughly 10 m. Order matters only for drawing; hit-testing checks them all.
const areas = [
  { id: "fairfax", name: "Fairfax", kind: "town", labelAt: [-122.5956, 37.9883],
    rings: [
      [[-122.61994,37.9755],[-122.61958,37.97572],[-122.6191,37.97565],[-122.61819,37.97608],[-122.61729,37.97599],[-122.61695,37.97575],[-122.6158,37.976],[-122.61477,37.97729],[-122.61432,37.9773],[-122.61387,37.97711],[-122.61377,37.97671],[-122.61354,37.97661],[-122.61285,37.97642],[-122.61226,37.97648],[-122.61111,37.9761],[-122.61034,37.97623],[-122.6094,37.9759],[-122.60945,37.97579],[-122.60901,37.97567],[-122.60882,37.97484],[-122.60853,37.97478],[-122.60884,37.97466],[-122.60881,37.97449],[-122.60125,37.97524],[-122.60101,37.97367],[-122.60061,37.97366],[-122.60023,37.97407],[-122.5999,37.97394],[-122.59935,37.97402],[-122.5986,37.9748],[-122.59854,37.97512],[-122.59818,37.97553],[-122.59039,37.97618],[-122.58918,37.97396],[-122.58809,37.97308],[-122.58709,37.97336],[-122.58682,37.97361],[-122.58795,37.97446],[-122.58877,37.97468],[-122.589,37.97505],[-122.58942,37.97488],[-122.59021,37.9762],[-122.58099,37.97704],[-122.58256,37.97956],[-122.57936,37.98654],[-122.58183,37.98656],[-122.58585,37.99609],[-122.58699,37.99939],[-122.59301,37.99939],[-122.59557,37.99617],[-122.59589,37.99541],[-122.59733,37.99616],[-122.59684,37.99671],[-122.59604,37.99639],[-122.59466,37.99819],[-122.59459,37.99886],[-122.59411,37.99894],[-122.59448,37.99897],[-122.59431,38.00062],[-122.59506,38.00143],[-122.59473,38.00213],[-122.59451,38.002],[-122.59434,38.00209],[-122.59457,38.00223],[-122.59403,38.00273],[-122.59412,38.00305],[-122.59634,38.00497],[-122.59669,38.00486],[-122.59709,38.00539],[-122.59643,38.00542],[-122.59622,38.00612],[-122.59578,38.00629],[-122.5954,38.00811],[-122.59519,38.00808],[-122.59514,38.00834],[-122.59582,38.00861],[-122.59583,38.00844],[-122.59619,38.00844],[-122.5961,38.00872],[-122.59875,38.00977],[-122.60233,38.0045],[-122.60447,38.00521],[-122.6045,38.00542],[-122.60531,38.00613],[-122.60747,38.0036],[-122.60711,38.00306],[-122.60724,38.00264],[-122.60894,38.00318],[-122.60969,38.00123],[-122.60909,38.00115],[-122.60803,38.0007],[-122.60766,38.00034],[-122.60542,38.00038],[-122.60375,37.99996],[-122.60218,37.99893],[-122.59957,37.99624],[-122.59883,37.99588],[-122.59892,37.99571],[-122.5985,37.99524],[-122.59878,37.99514],[-122.59868,37.99409],[-122.60333,37.9944],[-122.60349,37.99291],[-122.60306,37.99312],[-122.60247,37.99311],[-122.60204,37.99285],[-122.60156,37.99308],[-122.60088,37.99292],[-122.5998,37.99294],[-122.59899,37.99128],[-122.60706,37.98891],[-122.60614,37.98766],[-122.60511,37.98754],[-122.60466,37.98766],[-122.60299,37.98654],[-122.60275,37.9859],[-122.60115,37.98591],[-122.6007,37.9857],[-122.60141,37.98494],[-122.60151,37.98427],[-122.60212,37.98406],[-122.60206,37.98376],[-122.60223,37.98357],[-122.60194,37.98331],[-122.60199,37.98299],[-122.60145,37.98287],[-122.6019,37.98246],[-122.60064,37.9817],[-122.60061,37.98113],[-122.60112,37.98103],[-122.60178,37.98065],[-122.60252,37.98094],[-122.60291,37.98039],[-122.60374,37.98032],[-122.60403,37.97976],[-122.60434,37.9806],[-122.60525,37.98068],[-122.60566,37.98066],[-122.6052,37.98036],[-122.60505,37.98003],[-122.60517,37.97999],[-122.60546,37.98002],[-122.60561,37.98021],[-122.60599,37.98008],[-122.60702,37.98015],[-122.60708,37.97996],[-122.60796,37.97992],[-122.60856,37.97948],[-122.6087,37.97853],[-122.60916,37.97851],[-122.60918,37.97796],[-122.60961,37.97807],[-122.61008,37.97783],[-122.61049,37.97806],[-122.61105,37.97798],[-122.61112,37.97826],[-122.61162,37.97859],[-122.61201,37.9785],[-122.61241,37.97803],[-122.61323,37.97871],[-122.61338,37.97867],[-122.61693,37.9806],[-122.61994,37.9755]],
    ] },
  { id: "san_anselmo", name: "San Anselmo", kind: "town", labelAt: [-122.5703, 37.9818],
    rings: [
      [[-122.58699,37.99939],[-122.58585,37.99609],[-122.58183,37.98656],[-122.57936,37.98654],[-122.58256,37.97956],[-122.58099,37.97704],[-122.58484,37.97667],[-122.58084,37.97367],[-122.58147,37.97209],[-122.58058,37.9698],[-122.5728,37.96784],[-122.5722,37.96801],[-122.57159,37.96779],[-122.57156,37.96763],[-122.57061,37.9676],[-122.56964,37.96779],[-122.56852,37.96745],[-122.56762,37.96786],[-122.56649,37.96771],[-122.56039,37.96958],[-122.56064,37.97029],[-122.55764,37.97071],[-122.5576,37.97059],[-122.5568,37.97088],[-122.55647,37.97084],[-122.55608,37.97108],[-122.55502,37.97252],[-122.55493,37.97306],[-122.55363,37.97293],[-122.55246,37.97207],[-122.55261,37.97245],[-122.55239,37.97288],[-122.55163,37.97231],[-122.55046,37.97677],[-122.55133,37.97691],[-122.55004,37.98166],[-122.55755,37.98288],[-122.56088,37.97927],[-122.55892,37.98696],[-122.5603,37.98629],[-122.56109,37.9862],[-122.56131,37.98585],[-122.5655,37.98848],[-122.56545,37.98887],[-122.56593,37.98886],[-122.56701,37.99102],[-122.56736,37.99076],[-122.568,37.99131],[-122.56654,37.99208],[-122.5682,37.99256],[-122.56757,37.99391],[-122.57096,37.99497],[-122.57169,37.99254],[-122.57372,37.99294],[-122.57402,37.9932],[-122.57404,37.99438],[-122.57315,37.99486],[-122.57362,37.99536],[-122.5734,37.99548],[-122.5718,37.99514],[-122.57232,37.99693],[-122.57166,37.99724],[-122.57235,37.99781],[-122.57158,37.99785],[-122.57161,37.99811],[-122.57135,37.99812],[-122.57139,37.99849],[-122.57165,37.99848],[-122.57165,37.99925],[-122.58699,37.99939]],
      [[-122.56594,37.9924],[-122.56415,37.99073],[-122.56401,37.99037],[-122.56429,37.98865],[-122.56408,37.98873],[-122.56375,37.99052],[-122.56333,37.9907],[-122.56299,37.98957],[-122.56214,37.98926],[-122.56198,37.98932],[-122.56266,37.98957],[-122.56151,37.99039],[-122.56166,37.99052],[-122.56134,37.99075],[-122.561,37.9903],[-122.56126,37.99009],[-122.56144,37.9896],[-122.56124,37.9896],[-122.56081,37.98892],[-122.56045,37.98922],[-122.56022,37.989],[-122.55979,37.9893],[-122.55831,37.98957],[-122.55737,37.99356],[-122.55764,37.99387],[-122.56075,37.99223],[-122.56239,37.99427],[-122.56594,37.9924]],
    ] },
  { id: "ross", name: "Ross", kind: "town", labelAt: [-122.5617, 37.9638],
    rings: [
      [[-122.58264,37.96636],[-122.57773,37.96576],[-122.57897,37.96252],[-122.57552,37.95931],[-122.57225,37.9582],[-122.57251,37.95763],[-122.57365,37.95708],[-122.57385,37.95611],[-122.57017,37.95567],[-122.56871,37.95582],[-122.56876,37.95699],[-122.5677,37.95703],[-122.56714,37.95687],[-122.56612,37.95623],[-122.56358,37.95531],[-122.56161,37.95536],[-122.56164,37.95572],[-122.56067,37.95579],[-122.55956,37.95547],[-122.55919,37.9556],[-122.55795,37.95528],[-122.55722,37.95646],[-122.55667,37.95672],[-122.55605,37.95763],[-122.55557,37.95729],[-122.55531,37.95746],[-122.55551,37.95767],[-122.55488,37.95792],[-122.55471,37.95797],[-122.55459,37.95774],[-122.5533,37.95816],[-122.55374,37.95898],[-122.55339,37.95909],[-122.55316,37.95897],[-122.55338,37.95946],[-122.55284,37.9595],[-122.55102,37.96133],[-122.54923,37.96024],[-122.5481,37.95977],[-122.54493,37.96332],[-122.54456,37.96331],[-122.54428,37.96354],[-122.544,37.96336],[-122.54421,37.96273],[-122.54322,37.96333],[-122.54278,37.96321],[-122.54291,37.96307],[-122.54271,37.96288],[-122.54172,37.96324],[-122.54072,37.96387],[-122.54079,37.96407],[-122.54119,37.96426],[-122.54248,37.96446],[-122.543,37.965],[-122.54375,37.96526],[-122.54539,37.96643],[-122.54574,37.9669],[-122.54567,37.96728],[-122.54628,37.96725],[-122.54618,37.96764],[-122.54597,37.96761],[-122.54573,37.9686],[-122.54532,37.96862],[-122.54845,37.97081],[-122.54872,37.97116],[-122.54843,37.97182],[-122.54882,37.97242],[-122.54902,37.97247],[-122.5499,37.97205],[-122.55042,37.97204],[-122.55163,37.97231],[-122.55239,37.97288],[-122.55261,37.97245],[-122.55246,37.97207],[-122.55349,37.97286],[-122.55432,37.97304],[-122.55493,37.97306],[-122.55502,37.97252],[-122.55608,37.97108],[-122.55647,37.97084],[-122.5568,37.97088],[-122.5576,37.97059],[-122.55764,37.97071],[-122.56064,37.97029],[-122.56039,37.96958],[-122.56649,37.96771],[-122.56762,37.96786],[-122.56852,37.96745],[-122.56964,37.96779],[-122.57061,37.9676],[-122.57156,37.96763],[-122.57159,37.96779],[-122.5722,37.96801],[-122.5728,37.96784],[-122.58058,37.9698],[-122.58263,37.96829],[-122.58264,37.96636]],
    ] },
  { id: "san_rafael", name: "San Rafael", kind: "other", labelAt: [-122.537, 38.004],
    rings: [
      [[-122.58972,38.02383],[-122.57097,38.0096],[-122.55737,37.99356],[-122.55074,37.99098],[-122.55055,37.98586],[-122.55075,37.98564],[-122.55148,37.9861],[-122.55262,37.98516],[-122.55378,37.9858],[-122.55239,37.98735],[-122.55338,37.98784],[-122.55254,37.9889],[-122.55484,37.99016],[-122.55831,37.98957],[-122.55951,37.98448],[-122.55736,37.98502],[-122.55643,37.98445],[-122.55755,37.98288],[-122.55004,37.98166],[-122.55133,37.97691],[-122.55046,37.97677],[-122.55163,37.97231],[-122.55042,37.97204],[-122.5499,37.97205],[-122.54902,37.97247],[-122.54863,37.97228],[-122.54843,37.97182],[-122.54872,37.97116],[-122.54845,37.97081],[-122.54532,37.96862],[-122.54573,37.9686],[-122.54597,37.96761],[-122.54618,37.96764],[-122.54628,37.96725],[-122.54567,37.96728],[-122.54574,37.9669],[-122.54539,37.96643],[-122.54375,37.96526],[-122.543,37.965],[-122.54248,37.96446],[-122.54091,37.96415],[-122.54073,37.96399],[-122.54084,37.96379],[-122.54019,37.96373],[-122.53977,37.96356],[-122.53953,37.96324],[-122.53832,37.96287],[-122.53765,37.96214],[-122.52894,37.95839],[-122.52844,37.9588],[-122.52664,37.95772],[-122.52582,37.95671],[-122.5243,37.95573],[-122.52328,37.95548],[-122.52255,37.95418],[-122.52143,37.95428],[-122.52034,37.95412],[-122.52003,37.9536],[-122.51822,37.95255],[-122.51746,37.95186],[-122.51614,37.95154],[-122.51456,37.95235],[-122.51395,37.95243],[-122.51422,37.95284],[-122.51491,37.95293],[-122.51513,37.95375],[-122.51535,37.95597],[-122.51522,37.95651],[-122.5149,37.95684],[-122.51501,37.95706],[-122.51486,37.95739],[-122.51502,37.95776],[-122.51472,37.95858],[-122.5143,37.95891],[-122.51312,37.96101],[-122.51224,37.96042],[-122.50941,37.958],[-122.50917,37.95641],[-122.5093,37.95623],[-122.50913,37.95618],[-122.50875,37.95381],[-122.50912,37.95312],[-122.50978,37.95265],[-122.51017,37.95203],[-122.50862,37.95117],[-122.50581,37.95118],[-122.505,37.94971],[-122.50364,37.94917],[-122.50019,37.94691],[-122.4973,37.94664],[-122.49619,37.94624],[-122.49384,37.94596],[-122.49392,37.94576],[-122.49378,37.94559],[-122.49283,37.9457],[-122.49243,37.94598],[-122.49175,37.94601],[-122.49018,37.94508],[-122.48793,37.94439],[-122.48487,37.94455],[-122.48256,37.94355],[-122.48024,37.94295],[-122.43542,37.93885],[-122.43618,37.94094],[-122.44098,37.95742],[-122.44148,37.96062],[-122.44148,37.96802],[-122.44131,37.97199],[-122.47431,37.97142],[-122.4744,37.97484],[-122.47538,37.97474],[-122.47563,37.97511],[-122.47548,37.97516],[-122.47579,37.97554],[-122.47643,37.97514],[-122.47629,37.975],[-122.4761,37.97511],[-122.47573,37.97462],[-122.47602,37.97451],[-122.47687,37.97358],[-122.47818,37.9738],[-122.47899,37.97417],[-122.4798,37.9746],[-122.47928,37.97483],[-122.4796,37.975],[-122.48011,37.97478],[-122.48041,37.97493],[-122.48099,37.97487],[-122.48107,37.97528],[-122.4814,37.97538],[-122.48223,37.97709],[-122.48318,37.97806],[-122.48338,37.97976],[-122.48397,37.98031],[-122.48791,37.9821],[-122.48656,37.98423],[-122.48628,37.98439],[-122.48532,37.98405],[-122.48392,37.98314],[-122.48372,37.98324],[-122.4827,37.98291],[-122.48178,37.98347],[-122.48201,37.98442],[-122.47974,37.98366],[-122.48005,37.9818],[-122.47992,37.98144],[-122.4785,37.9804],[-122.47788,37.98014],[-122.47769,37.97978],[-122.47822,37.97924],[-122.47799,37.9791],[-122.47811,37.979],[-122.47834,37.97914],[-122.47876,37.97874],[-122.47927,37.97862],[-122.47902,37.97804],[-122.47777,37.9783],[-122.47773,37.97809],[-122.47724,37.97785],[-122.47679,37.97853],[-122.47645,37.97824],[-122.47653,37.97787],[-122.47555,37.97778],[-122.47542,37.9783],[-122.47622,37.97826],[-122.4765,37.97869],[-122.4758,37.97899],[-122.47516,37.97873],[-122.47518,37.9792],[-122.47417,37.98076],[-122.47263,37.98261],[-122.46739,37.98488],[-122.46606,37.98615],[-122.46615,37.98625],[-122.46523,37.98698],[-122.46066,37.98803],[-122.45839,37.98929],[-122.45818,37.98916],[-122.4574,37.98985],[-122.45654,37.99027],[-122.45435,37.99101],[-122.45375,37.99068],[-122.45354,37.99068],[-122.45294,37.99112],[-122.45244,37.99108],[-122.45216,37.99089],[-122.45273,37.98993],[-122.45259,37.98975],[-122.45009,37.98974],[-122.44921,37.99022],[-122.44966,37.9914],[-122.4506,37.99224],[-122.45356,37.99846],[-122.45647,37.99688],[-122.4592,37.99733],[-122.46526,38.00043],[-122.47513,38.00228],[-122.48781,37.99577],[-122.49553,37.99767],[-122.50004,37.99686],[-122.50134,37.99683],[-122.50179,37.99746],[-122.50147,37.99774],[-122.50213,37.99861],[-122.50298,37.99854],[-122.50313,37.99834],[-122.5041,37.99849],[-122.50458,37.99834],[-122.506,37.99718],[-122.50789,37.99662],[-122.50965,37.99735],[-122.51107,37.99753],[-122.51221,37.9973],[-122.51256,37.99716],[-122.51286,37.99663],[-122.51336,37.99625],[-122.5138,37.99545],[-122.51421,37.99404],[-122.51489,37.9936],[-122.51672,37.99305],[-122.51731,37.99241],[-122.51741,37.99206],[-122.51805,37.99164],[-122.51959,37.99214],[-122.52031,37.99201],[-122.52108,37.9922],[-122.52226,37.99316],[-122.52375,37.99493],[-122.52745,37.99651],[-122.52815,37.99605],[-122.528,37.9956],[-122.52833,37.99501],[-122.52927,37.99582],[-122.52852,37.99642],[-122.52814,37.99648],[-122.5281,37.99675],[-122.52747,37.9973],[-122.5287,37.99826],[-122.52832,37.99855],[-122.52906,37.99913],[-122.52927,37.99895],[-122.52977,37.99935],[-122.52733,38.00131],[-122.52721,38.00121],[-122.52684,38.00152],[-122.5291,38.00326],[-122.52713,38.00459],[-122.5278,38.00525],[-122.52644,38.00489],[-122.52607,38.00495],[-122.52608,38.00509],[-122.52497,38.00581],[-122.52388,38.00617],[-122.52439,38.007],[-122.52402,38.00824],[-122.52428,38.00851],[-122.52479,38.00872],[-122.52646,38.01005],[-122.52821,38.01005],[-122.52816,38.01339],[-122.52446,38.01484],[-122.52186,38.01493],[-122.51959,38.01434],[-122.51942,38.01611],[-122.51889,38.01721],[-122.5171,38.01941],[-122.51651,38.0211],[-122.51514,38.02132],[-122.50544,38.01818],[-122.5039,38.01833],[-122.50399,38.02218],[-122.5018,38.02221],[-122.50193,38.02582],[-122.50641,38.02575],[-122.50651,38.0291],[-122.51116,38.02751],[-122.51687,38.02521],[-122.51803,38.02602],[-122.51928,38.02621],[-122.52009,38.02556],[-122.52153,38.0252],[-122.52312,38.02399],[-122.52434,38.02206],[-122.52995,38.02579],[-122.53084,38.02614],[-122.53283,38.02602],[-122.53803,38.02492],[-122.538,38.02395],[-122.53841,38.02307],[-122.53867,38.02172],[-122.53936,38.02183],[-122.53957,38.02159],[-122.54058,38.02206],[-122.5407,38.02192],[-122.54477,38.0246],[-122.54562,38.025],[-122.5477,38.02572],[-122.54873,38.02626],[-122.55164,38.02717],[-122.55516,38.02699],[-122.55761,38.02588],[-122.55866,38.02562],[-122.56267,38.02575],[-122.56429,38.02564],[-122.56388,38.02487],[-122.56615,38.02453],[-122.56814,38.02473],[-122.56873,38.02464],[-122.57104,38.02517],[-122.57399,38.02668],[-122.57642,38.02535],[-122.5787,38.02554],[-122.58507,38.02539],[-122.5858,38.02564],[-122.58694,38.02707],[-122.58662,38.02748],[-122.5876,38.02707],[-122.58794,38.02625],[-122.58877,38.02522],[-122.58877,38.02483],[-122.58972,38.02383]],
    ] },
  { id: "larkspur", name: "Larkspur", kind: "other", labelAt: null,
    rings: [
      [[-122.55322,37.92788],[-122.55277,37.92166],[-122.53892,37.92188],[-122.53824,37.92378],[-122.5375,37.92372],[-122.53731,37.92347],[-122.53647,37.9231],[-122.53549,37.92396],[-122.53559,37.92422],[-122.53538,37.92499],[-122.53451,37.92573],[-122.53537,37.92612],[-122.53487,37.9269],[-122.53432,37.92646],[-122.53391,37.92672],[-122.53352,37.92661],[-122.53197,37.92767],[-122.53069,37.92773],[-122.5319,37.92936],[-122.52728,37.92934],[-122.52704,37.93002],[-122.52621,37.93009],[-122.52614,37.9305],[-122.52566,37.93054],[-122.52501,37.93088],[-122.52482,37.93132],[-122.52499,37.93155],[-122.52555,37.93174],[-122.52637,37.93156],[-122.52706,37.93194],[-122.52727,37.93224],[-122.52727,37.93392],[-122.52091,37.93455],[-122.52084,37.93498],[-122.52122,37.93713],[-122.52168,37.93833],[-122.5197,37.93922],[-122.51914,37.93979],[-122.51885,37.93983],[-122.51776,37.94052],[-122.51665,37.94169],[-122.51526,37.94089],[-122.51538,37.94047],[-122.51611,37.94069],[-122.51645,37.94039],[-122.51712,37.9374],[-122.51703,37.9357],[-122.51734,37.93565],[-122.51732,37.93534],[-122.51716,37.93509],[-122.51677,37.93516],[-122.51689,37.93551],[-122.51567,37.93605],[-122.51453,37.93681],[-122.51345,37.93792],[-122.51311,37.93873],[-122.51381,37.9434],[-122.51258,37.94323],[-122.51093,37.94259],[-122.50991,37.9424],[-122.50393,37.9427],[-122.50276,37.94189],[-122.50178,37.94255],[-122.50198,37.94291],[-122.50209,37.94376],[-122.50169,37.9478],[-122.50364,37.94917],[-122.505,37.94971],[-122.50581,37.95118],[-122.50862,37.95117],[-122.51163,37.95274],[-122.51456,37.95235],[-122.51614,37.95154],[-122.51704,37.95167],[-122.51746,37.95186],[-122.51822,37.95255],[-122.52003,37.9536],[-122.52034,37.95412],[-122.52143,37.95428],[-122.52255,37.95418],[-122.52328,37.95548],[-122.5243,37.95573],[-122.52582,37.95671],[-122.52664,37.95772],[-122.52844,37.9588],[-122.52885,37.95847],[-122.52868,37.95832],[-122.52858,37.95751],[-122.52794,37.95665],[-122.52763,37.95528],[-122.52858,37.95519],[-122.52837,37.95454],[-122.52747,37.95459],[-122.52617,37.95559],[-122.5259,37.95394],[-122.52686,37.95426],[-122.52742,37.95403],[-122.52788,37.9535],[-122.52787,37.95311],[-122.52731,37.95252],[-122.52726,37.95222],[-122.52546,37.95244],[-122.52554,37.95213],[-122.52477,37.95183],[-122.52461,37.9508],[-122.52384,37.95071],[-122.52404,37.95043],[-122.5233,37.95026],[-122.52354,37.94974],[-122.52404,37.94975],[-122.52399,37.94942],[-122.52263,37.94927],[-122.52118,37.94946],[-122.52064,37.94919],[-122.52031,37.9488],[-122.51892,37.94836],[-122.51899,37.9479],[-122.51841,37.94739],[-122.51944,37.9461],[-122.51971,37.94616],[-122.51958,37.946],[-122.52002,37.94555],[-122.52897,37.94901],[-122.53134,37.94958],[-122.5337,37.95054],[-122.53448,37.94951],[-122.53388,37.94804],[-122.53609,37.94619],[-122.5345,37.94554],[-122.53332,37.9459],[-122.53326,37.9453],[-122.53475,37.94502],[-122.53494,37.94472],[-122.53603,37.94554],[-122.5372,37.94589],[-122.53753,37.94522],[-122.53856,37.94449],[-122.53894,37.94643],[-122.53959,37.94715],[-122.54189,37.94748],[-122.54336,37.94797],[-122.54496,37.949],[-122.5458,37.95161],[-122.54923,37.95012],[-122.54968,37.95077],[-122.54963,37.94913],[-122.54928,37.94856],[-122.55055,37.94804],[-122.55033,37.94778],[-122.55109,37.94793],[-122.55037,37.94666],[-122.5492,37.94533],[-122.54904,37.94489],[-122.54947,37.94467],[-122.54928,37.94419],[-122.54852,37.94434],[-122.54752,37.94265],[-122.54717,37.94237],[-122.54683,37.94292],[-122.54611,37.94309],[-122.5465,37.94043],[-122.54385,37.93529],[-122.55036,37.93443],[-122.55143,37.93367],[-122.55232,37.93338],[-122.55318,37.9293],[-122.55322,37.92788]],
    ] },
];

// ---------------------------------------------------------------------------
// Shared statewide provisions. The edition they are read in changes with the
// jurisdiction, so the citation text is built per town rather than shared.
// ---------------------------------------------------------------------------
const nfpa25 = ed => ({
  cite: 'NFPA 25<br>§ 5.2.1.1.1',
  requires: 'Replacement of sprinklers carrying disqualifying paint contamination. The wording differs by edition; Title 19 § 904 references the California-amended 2013 edition, and later editions distinguish paint detrimental to performance.',
  applies: 'The coating has to be assessed under whichever edition is enforced here. ' + ed,
  open: 'Which edition the authority having jurisdiction enforces.',
});

const crc = {
  cite: '2025 California Residential Code<br>§ R309.3.2.6',
  requires: 'Painting, caulking or modifying sprinklers is prohibited, and affected sprinklers must be replaced.',
  applies: 'The most direct basis for requiring replacement — if this building is governed by the residential code.',
  open: 'The occupancy and building classification, which the photograph does not establish.',
};

// ---------------------------------------------------------------------------
// The four jurisdictions on the map
// ---------------------------------------------------------------------------
const jurisdictions = {

// ------------------------------------------------------------------- ROSS --
ross: {
  name: 'Town of Ross',
  short: 'Ross',
  where: 'In Ross',
  kind: 'Incorporated town',
  agency: 'Ross Valley Fire Department',
  agencyNote: 'Town Fire Code enforced by the RVFD Fire Prevention Bureau under the Fire Chief (RMC § 14.04.020). “Fire Code Official” means the RVFD Chief or Fire Marshal (§ 14.04.030).',
  adopted: [
    ['Fire code', '2025 California Fire Code and 2024 International Fire Code — RMC § 14.04.010 (Ord. 732, 2025)'],
    ['WUI code', 'Town WUI Code: 2025 California Wildland-Urban Interface Code, Appendices A, B and F, and the 2024 IWUIC — RMC ch. 14.16'],
  ],
  source: { label: 'Town of Ross Municipal Code, Title 14 — Fire Prevention', url: 'https://www.townofrossca.gov/administration/page/title-14-fire-prevention' },
  pin: [-122.5570, 37.9630],

  ladder: {
    headline: 'Ladder fuels: 30 feet.',
    rows: [
      { cite: 'Town WUI Code<br>§ 604.6(7)',
        requires: '“Ladder fuels shall be removed within 30 feet of the structure.”',
        applies: 'The direct basis for this finding. The lower hedge meets the canopy above it, so if that canopy stands within 30 ft of a structure, removing the lower tier answers the section squarely.',
        open: 'The measured distance from the vegetation to the structure — the photograph cannot give it.' },
      { cite: 'Town WUI Code<br>§ 604.6(1)',
        requires: 'Cut and remove all hazardous vegetation and ground coverings within 100 feet of structures, up to 200 feet where topography or fuel type requires it, as determined by the Fire Code Official.',
        applies: 'Reaches the dead and yellowed material along the retaining wall even where the 30 ft ladder-fuel rule does not.',
        open: '' },
      { cite: 'Town WUI Code<br>§ 604.6(6)',
        requires: 'Cut and remove growth under 3 inches in diameter from the ground up to a height of 10 feet, provided no crown is raised above the lower one-third of the tree’s total height.',
        applies: 'Sets the limit on how far the retained upper tier may be limbed up while making the separation.',
        open: '' },
      { cite: 'Town WUI Code<br>§ 603.3.1',
        requires: 'Fuel management zones are delineated as Zone 0 (0–5 ft), Zone 1 (5–30 ft), Zone 2 (30–100 ft) from all structures, and Zone 3 (10 ft either side of a road or driveway).',
        applies: 'Which zone governs follows from the measurement. The strip borders a paved road, so Zone 3 may apply on top of the structure zones.',
        open: 'The same measurement.' },
      { cite: 'Town WUI Code<br>§ 604.7',
        requires: 'The Fire Code Official may require clearance of flammable vegetation within 10 feet of each side of highways, fire apparatus access roads and driveways.',
        applies: 'The vegetation directly borders a paved roadway, so roadside clearance may apply alongside the defensible-space finding.',
        open: 'Whether it is invoked here. No road-clearance violation is established by the photograph.' },
      { cite: 'RMC § 14.04.120',
        requires: 'Any violation of the Town Fire Code is a public nuisance, and the owner has primary responsibility for keeping the property free of it.',
        applies: 'The enforcement route if the correction is not made in the stated timeframe.',
        open: '' },
    ],
  },

  sprinkler: {
    headline: 'Read in the 2025 edition.',
    rows: [
      { cite: '2025 CFC § 901.6<br>(adopted RMC § 14.04.010)',
        requires: 'Fire protection and life-safety systems kept in operative condition, with defective components repaired or replaced.',
        applies: 'Paint contamination capable of affecting operation is a maintenance deficiency. Ross reads this in the 2025 edition.',
        open: '' },
      { cite: '2025 CFC § 903.5',
        requires: 'Inspection, testing and maintenance of automatic sprinkler systems to the adopted standards.',
        applies: 'This sprinkler is part of a water-based system, so those standards and the California amendments govern its maintenance.',
        open: '' },
      { cite: '2025 CFC § 903.2.1<br>as added by RMC § 14.04.100',
        requires: 'An automatic sprinkler system shall be installed and maintained in all newly constructed buildings or structures, with narrow Group U and agricultural exceptions.',
        applies: 'Ross requires sprinklers far past the state baseline, so a head in an ordinary building is more likely part of a *required* system — and a required system must be maintained.',
        open: 'Whether this building was built or substantially remodelled under the local rule.' },
      { cite: 'Town WUI Code<br>§ 613.2',
        requires: 'An approved automatic fire sprinkler system shall be installed in all occupancies, in new buildings and substantial remodels.',
        applies: 'The WUI-side counterpart of the same requirement, which is what puts sprinklers in Ross houses at all.',
        open: '' },
      { cite: '2025 CFC § 901.7<br>as amended',
        requires: 'Where a required system is out of service the fire department and fire code official are notified immediately, and the building is evacuated or a fire watch provided. Applies to residential sprinkler systems too.',
        applies: 'Governs the replacement work itself, once the head is taken out of service.',
        open: '' },
      nfpa25('Ross enforces through the 2025 CFC.'),
      crc,
    ],
  },
},

// ---------------------------------------------------------------- FAIRFAX --
fairfax: {
  name: 'Town of Fairfax',
  short: 'Fairfax',
  where: 'In Fairfax',
  kind: 'Incorporated town',
  agency: 'Ross Valley Fire Department',
  agencyNote: 'The adopted codes are filed with the Fire Marshal of the Ross Valley Fire Department (FMC § 8.04.010(B)) — the same department as Ross and San Anselmo, enforcing a different code.',
  adopted: [
    ['Fire code', '2022 California Fire Code, 2021 International Fire Code and Appendix A of the 2021 IWUIC — FMC § 8.04.010 (Ord. 873, 2022)'],
    ['WUI code', '2025 California Wildland-Urban Interface Code and 2024 IWUIC — FMC ch. 8.06'],
    ['Vegetation', 'Abatement of fire hazards associated with flammable vegetation — FMC ch. 8.24'],
  ],
  source: { label: 'Fairfax Municipal Code, ch. 8.04 — California Fire Code', url: 'https://codelibrary.amlegal.com/codes/fairfax/latest/fairfax_ca/0-0-0-2144' },
  pin: [-122.5950, 37.9870],

  ladder: {
    headline: 'Ladder fuels: 100 feet — more than three times the reach of the neighbouring towns.',
    rows: [
      { cite: 'CFC § 4907.4(7)<br>added by FMC § 8.04.100',
        requires: '“Ladder fuels shall be removed within 100 feet of the structure.”',
        applies: 'The same finding, with a far longer reach. A hedge that is outside the rule in Ross or the county at, say, 60 ft from the house is squarely inside it here.',
        open: 'Still the measured distance — but far more of the property is in scope.' },
      { cite: 'CFC § 4907.4(1)',
        requires: 'Cut and remove all hazardous vegetation and ground coverings within 100 feet of structures, up to 200 feet where topography or fuel type requires it.',
        applies: 'Runs alongside the ladder-fuel item at the same 100 ft, so the dead material along the wall is in scope on both counts.',
        open: '' },
      { cite: 'CFC § 4907.4(6)',
        requires: 'Cut and remove growth under 3 inches in diameter from the ground up to a height of 10 feet, without raising any crown above the lower one-third of the tree’s height.',
        applies: 'Sets the limit on limbing up the retained upper tier.',
        open: '' },
      { cite: 'CFC § 4907.5',
        requires: 'The Fire Code Official may clear flammable vegetation within 10 feet of each side of highways, access roads and driveways, with corrective action as in § 4907.4, entering private property to do so.',
        applies: 'The vegetation borders a paved road. Fairfax states the entry power expressly.',
        open: 'Whether it is invoked here.' },
      { cite: 'CFC § 4907.6<br>FMC § 8.24.010',
        requires: 'Failure to comply with § 4907.4 is a public nuisance. Separately, FMC § 8.24.010 declares dry brush, dead trees and bushes that are a fire menace to be a public nuisance, abated on notice (§ 8.24.020) with costs assessed (§ 8.24.030).',
        applies: 'Two independent abatement routes for the same hedge, one through the fire code and one through the municipal code.',
        open: '' },
      { cite: 'CFC § 4906.3<br>as amended',
        requires: 'A Vegetation Management Plan is required for new construction, substantial remodels and landscape modifications, including new plantings and modifications to existing plantings.',
        applies: 'Replanting the strip as a low-fuel landscape is a landscape modification, so the alternative correction carries a plan requirement here.',
        open: 'Whether the proposed work is a modification within the meaning of the section.' },
    ],
  },

  sprinkler: {
    headline: 'Read in the 2022 edition — three years behind the towns either side.',
    rows: [
      { cite: '2022 CFC § 901.6<br>(adopted FMC § 8.04.010)',
        requires: 'Fire protection and life-safety systems kept in operative condition, with defective components repaired or replaced.',
        applies: 'Same obligation, earlier edition. Section numbers hold, but the text and referenced standards are the 2022 ones — check wording before quoting it in a notice.',
        open: 'Nothing in this section; the edition itself is the thing to get right.' },
      { cite: '2022 CFC § 903.5',
        requires: 'Inspection, testing and maintenance of automatic sprinkler systems to the adopted standards.',
        applies: 'Puts this sprinkler under the adopted maintenance standards as part of a water-based system.',
        open: '' },
      { cite: '2022 CFC § 903.2.1<br>as amended by FMC § 8.04.100',
        requires: 'An automatic sprinkler system shall be installed and maintained in all newly constructed buildings or structures, with narrow Group U and agricultural exceptions.',
        applies: 'Fairfax, like Ross, requires sprinklers in all new construction — so the head is likely part of a required system.',
        open: 'Whether this building falls under the local installation rule.' },
      { cite: '2022 CFC § 901.7<br>as amended',
        requires: 'Where a required system is out of service, immediate notification and evacuation or an approved fire watch. Applies to residential sprinkler systems too.',
        applies: 'Governs the replacement work once the head is isolated.',
        open: '' },
      { cite: 'FMC § 8.04.115<br>FMC § 8.04.120',
        requires: 'Nuisance abatement and penalties for violations of the Town Fire Code.',
        applies: 'The enforcement route if the head is not replaced.',
        open: '' },
      nfpa25('Fairfax enforces through the 2022 CFC.'),
      crc,
    ],
  },
},

// ----------------------------------------------------------- SAN ANSELMO --
san_anselmo: {
  name: 'Town of San Anselmo',
  short: 'San Anselmo',
  where: 'In San Anselmo',
  kind: 'Incorporated town',
  agency: 'Ross Valley Fire Department',
  agencyNote: 'Enforced by the Fire Prevention Bureau of the Ross Valley Fire Department under the Fire Chief (SAMC § 3-3.802).',
  adopted: [
    ['Fire code', '2025 California Fire Code and 2024 International Fire Code — SAMC § 3-3.801 (Ord. 2025-1194, adopted 10 November 2025)'],
    ['WUI code', '2025 California Wildland-Urban Interface Code and portions of the 2024 IWUIC (Ord. 2025-1195)'],
  ],
  source: { label: 'San Anselmo Municipal Code, Title 3 ch. 3 — Fire Prevention', url: 'https://library.municode.com/ca/san_anselmo/codes/code_of_ordinances?nodeId=TIT3PUSA_CH3FIPR' },
  pin: [-122.5610, 37.9755],

  ladder: {
    headline: 'Ladder fuels: 30 feet.',
    rows: [
      { cite: 'WUI Code § 604.6(7)<br>(Ord. 2025-1195)',
        requires: '“Ladder fuels shall be removed within 30 feet of the structure.”',
        applies: 'The direct basis for this finding, in the same words Ross uses — the two towns adopted the identical Ross Valley template.',
        open: 'The measured distance from the vegetation to the structure.' },
      { cite: 'WUI Code § 604.6(1)',
        requires: 'Cut and remove all hazardous vegetation and ground coverings within 100 feet of structures, up to 200 feet where topography or fuel type requires it.',
        applies: 'Covers the dead and yellowed material along the wall beyond the 30 ft ladder-fuel reach.',
        open: '' },
      { cite: 'WUI Code § 604.6(6)',
        requires: 'Cut and remove growth under 3 inches in diameter from the ground up to a height of 10 feet, without raising any crown above the lower one-third of the tree’s height.',
        applies: 'Bounds how far the retained upper tier may be limbed up.',
        open: '' },
      { cite: 'WUI Code § 603.3.1',
        requires: 'Zone 0 (0–5 ft), Zone 1 (5–30 ft), Zone 2 (30–100 ft) fuel management zones from all structures, and Zone 3 (10 ft either side of the road or driveway).',
        applies: 'Fixes which zone the strip sits in once the distance is measured; the roadway puts Zone 3 in play as well.',
        open: 'The same measurement.' },
      { cite: 'WUI Code § 604.7',
        requires: 'Clearance of flammable vegetation within 10 feet of each side of highways, fire apparatus access roads and driveways, at the Fire Code Official’s direction.',
        applies: 'The vegetation borders a paved road.',
        open: 'Whether it is invoked here.' },
      { cite: 'SAMC § 3-3.812',
        requires: 'Penalties for violations of the Town Fire Code, with abatement costs recoverable as a nuisance abatement lien.',
        applies: 'The enforcement route if the correction is not made.',
        open: '' },
    ],
  },

  sprinkler: {
    headline: 'Read in the 2025 edition.',
    rows: [
      { cite: '2025 CFC § 901.6<br>(adopted SAMC § 3-3.801)',
        requires: 'Fire protection and life-safety systems kept in operative condition, with defective components repaired or replaced.',
        applies: 'Paint contamination capable of affecting operation is a maintenance deficiency, read in the 2025 edition.',
        open: '' },
      { cite: '2025 CFC § 903.5',
        requires: 'Inspection, testing and maintenance of automatic sprinkler systems to the adopted standards.',
        applies: 'Brings the adopted maintenance standards to bear on this head.',
        open: '' },
      { cite: '2025 CFC § 903.2.1<br>added by SAMC § 3-3.810',
        requires: 'An automatic sprinkler system shall be installed and maintained in all newly constructed buildings or structures.',
        applies: 'As in Ross: a head here is likely part of a required system rather than a voluntary one.',
        open: 'Whether the building was newly constructed under the local rule.' },
      { cite: '2025 CFC §§ 903.2.2, 903.2.2.1<br>added by SAMC § 3-3.810',
        requires: 'Sprinklers in buildings over 3,000 sq ft adding 10% or more floor area in any 36 months, and in any building adding 50% or more floor area or undergoing a “substantial remodel” in that period.',
        applies: 'San Anselmo is the only one of the three with these explicit remodel triggers — worth checking against the building’s permit history before the notice goes out.',
        open: 'The building’s recent permit history.' },
      { cite: '2025 CFC § 901.7<br>as amended',
        requires: 'Immediate notification when a required system is out of service, with evacuation or an approved fire watch. Applies to residential sprinkler systems too.',
        applies: 'Governs the replacement work itself.',
        open: '' },
      nfpa25('San Anselmo enforces through the 2025 CFC.'),
      crc,
    ],
  },
},

// ------------------------------------------------------- UNINCORPORATED ---
marin: {
  name: 'Unincorporated Marin County',
  short: 'Unincorporated',
  where: 'On unincorporated county land',
  kind: 'Outside any town limit',
  agency: 'Marin County Fire Department — or a local district',
  agencyNote: 'Unincorporated land in this valley is covered by several agencies: Marin County Fire, the Sleepy Hollow Fire Protection District north of San Anselmo, the Kentfield Fire Protection District to the south-east, and others. The responsible agency has to be confirmed from the address before a notice is issued.',
  adopted: [
    ['Fire code', '2022 California Fire Code, 2021 International Fire Code and 2021 IWUIC — Marin County Code ch. 16.16 (Ord. 3775)'],
    ['Caution', 'A fire protection district covering the parcel may enforce its own more recent ordinance — Sleepy Hollow FPD adopted Ordinance 2025-04.'],
  ],
  source: { label: 'Marin County Ordinance 3775 (Marin County Code ch. 16.16)', url: 'https://www.marincounty.gov/depts/fr' },
  pin: [-122.5760, 38.0040],

  ladder: {
    headline: 'Ladder fuels: 30 feet — but confirm which agency enforces here.',
    rows: [
      { cite: 'CFC § 4907.4(7)<br>Marin County Code ch. 16.16',
        requires: '“Ladder fuels shall be removed within 30 feet of the structure.”',
        applies: 'The direct basis for the finding on unincorporated land. Same distance as Ross and San Anselmo, different chapter and a different adopted edition.',
        open: 'The measured distance — and whether a fire protection district rather than Marin County Fire is the authority here.' },
      { cite: 'CFC § 4907.1<br>as amended',
        requires: 'Defensible space maintained around all buildings in State Responsibility Area per PRC § 4290 and the SRA Fire Safe Regulations (14 CCR § 1270), and in WUI areas and Very-High Fire Hazard Severity Zones of Local Responsibility Areas per Gov. Code §§ 51175–51189.',
        applies: 'The county frames the duty through state law, which the towns do not do in these words. Which regime applies depends on whether the parcel is SRA or LRA.',
        open: 'The responsibility-area classification of the parcel.' },
      { cite: 'CFC § 4907.4(1)',
        requires: 'Cut and remove all hazardous vegetation and ground coverings within 100 feet of structures, up to 200 feet where topography or fuel type requires it.',
        applies: 'Reaches the dead material along the wall beyond the ladder-fuel distance.',
        open: '' },
      { cite: 'CFC § 4907.4(8)',
        requires: 'Where the Fire Code Official requires it, remove trees 6 inches or less in diameter at breast height to achieve canopy separation within 30 feet of the structure.',
        applies: 'Note the threshold: the county says 6 inches where all three towns say 8. A tree the towns would leave can be required out here.',
        open: 'Whether canopy separation is required on this property.' },
      { cite: 'CFC § 4907.5',
        requires: 'Clearance of flammable vegetation within 10 feet of each side of highways, fire apparatus access roads and driveways, with entry onto private property authorised.',
        applies: 'The vegetation borders a paved road.',
        open: 'Whether it is invoked here.' },
    ],
  },

  sprinkler: {
    headline: 'Read in the 2022 edition — and confirm the agency first.',
    rows: [
      { cite: '2022 CFC § 901.6<br>Marin County Code ch. 16.16',
        requires: 'Fire protection and life-safety systems kept in operative condition, with defective components repaired or replaced.',
        applies: 'The same maintenance duty, in the county’s adopted 2022 edition.',
        open: 'Whether a district with its own, later ordinance covers this parcel.' },
      { cite: '2022 CFC § 903.5',
        requires: 'Inspection, testing and maintenance of automatic sprinkler systems to the adopted standards.',
        applies: 'Brings the adopted maintenance standards onto this head.',
        open: '' },
      { cite: '2022 CFC § 903.2.1<br>as amended',
        requires: 'An automatic sprinkler system shall be installed and maintained in all newly constructed buildings or structures, with exceptions for small detached accessory structures and certain canopies.',
        applies: 'The county’s exceptions are drawn differently from the towns’ — a detached structure exempt here may not be exempt a street away.',
        open: 'Whether the building falls inside an exception.' },
      nfpa25('The county enforces through the 2022 CFC.'),
      crc,
    ],
  },
},

};

// ---------------------------------------------------------------------------
// What the citation changes about the work
// ---------------------------------------------------------------------------
// The sections above are what gets written on the notice. This is the part the
// owner feels: how far the correction has to reach, what has to be measured or
// permitted before anyone starts, and what happens if it is not done.
//
// It is kept in one block rather than inside each jurisdiction because the
// whole point is the comparison — four jurisdictions, one screen, and the
// differences legible by reading down the column. The ladder-fuel reach is the
// one that changes the job: 30 ft in Ross, San Anselmo and the county, 100 ft
// in Fairfax, which is a different quote from a landscape contractor.
const work = {

ross: {
  ladder: {
    scope: 'Ladder-fuel removal inside <b>30 ft</b> of the structure. Dead and hazardous vegetation out to 100 ft.',
    steps: [
      ['Measure before writing it', 'The citation turns on the distance from the vegetation to the structure. Inside 30 ft it is § 604.6(7). Past it, only the § 604.6(1) hazardous-vegetation duty reaches, which is a narrower correction — dead material, not the whole hedge.'],
      ['Limit on limbing up', 'Raising the retained canopy is capped at 10 ft from the ground and at the lower third of the tree (§ 604.6(6)). If separation needs more than that, the lower tier goes rather than the upper one being lifted.'],
      ['Replanting', 'A Vegetation Management Plan is required for new construction and substantial remodels, or when the code official asks for one — a straight removal does not trigger it by itself.'],
      ['The roadside is separate', 'Zone 3 is 10 ft either side of the road or driveway (§ 603.3.1), so frontage clearance is its own obligation, not part of the structure zones.'],
    ],
    enforcement: 'Any violation of the Town Fire Code is a public nuisance (RMC § 14.04.120). The owner carries primary responsibility, and abatement can be ordered.',
  },
  sprinkler: {
    scope: 'Replace the head — it is not cleaned. Quote the <b>2025</b> edition.',
    steps: [
      ['Before the head comes out', 'Isolating a required system triggers § 901.7 as amended: notify the fire department and the fire code official immediately, then evacuate or set an approved fire watch until it is back in service. That applies to residential systems too.'],
      ['Check whether the system is required', 'Ross requires sprinklers in all newly constructed buildings (§ 903.2.1) and in all occupancies in new buildings and substantial remodels under Town WUI Code § 613.2. If the system is required, maintaining it is not discretionary.'],
      ['Edition', 'Ross adopted the 2025 CFC in Ord. 732. Do not quote 2022 wording into a Ross notice.'],
    ],
    enforcement: 'Violations are a public nuisance under RMC § 14.04.120.',
  },
},

fairfax: {
  ladder: {
    scope: 'Ladder-fuel removal inside <b>100 ft</b> of the structure — three times the reach of the towns either side.',
    steps: [
      ['Scope the full 100 ft, not the photograph', 'At 100 ft a hedge anywhere on an ordinary valley lot is inside the rule. The correction has to be walked out to that distance before it is written, and it is a materially larger job than the same finding in Ross.'],
      ['Replanting needs a plan and a permit first', 'A Vegetation Management Plan is required for landscape modifications, including new plantings and modifications to existing plantings (§ 4906.3 as amended), and implementing one requires a construction permit. The low-fuel-landscape option cannot start on the owner’s say-so here.'],
      ['Limit on limbing up', 'The same cap as elsewhere: ground to 10 ft, no more than the lower third of the crown (§ 4907.4(6)).'],
      ['The roadside', 'The Fire Code Official may clear 10 ft either side of the road and is authorised to enter the property to do it (§ 4907.5).'],
    ],
    enforcement: 'Two independent routes. Failure to comply with § 4907.4 is a public nuisance (§ 4907.6), and FMC ch. 8.24 separately declares fire-menace brush a nuisance, abated on notice (§ 8.24.020) with costs assessed against the property (§ 8.24.030).',
    ownerRider: 'Because the property is in Fairfax, the cleared band has to reach 100 ft from the house, not 30 ft — and if you choose to replant the strip rather than simply remove the lower hedge, the town requires a vegetation management plan and a permit <b>before</b> the work starts. Ask the Ross Valley Fire Department which applies to you before booking a contractor.',
  },
  sprinkler: {
    scope: 'Replace the head. Quote the <b>2022</b> edition — not the 2025 one.',
    steps: [
      ['The edition trap', 'Fairfax is three years behind its neighbours. The section numbers are familiar, but the adopted text and the referenced standards are the 2022 ones. A notice quoting 2025 language is quoting a code this town has not adopted.'],
      ['Before the head comes out', '§ 901.7 as amended: immediate notification, then evacuation or an approved fire watch until the system is back in service.'],
      ['Likely a required system', 'Fairfax requires sprinklers in all newly constructed buildings (§ 903.2.1 as amended), so treat the head as part of a required system until the permit history says otherwise.'],
    ],
    enforcement: 'FMC § 8.04.115 nuisance abatement and § 8.04.120 penalties.',
  },
},

san_anselmo: {
  ladder: {
    scope: 'Ladder-fuel removal inside <b>30 ft</b> of the structure. Dead and hazardous vegetation out to 100 ft.',
    steps: [
      ['Measure before writing it', 'Same template as Ross, same 30 ft trigger. Inside it the finding is § 604.6(7); past it only the hazardous-vegetation duty reaches.'],
      ['Limit on limbing up', 'Ground to 10 ft, and no crown raised above the lower third of the tree (§ 604.6(6)).'],
      ['Replanting', 'A Vegetation Management Plan is required for substantial remodels and new construction, or when the code official requires one (§ 603.3).'],
      ['The roadside is separate', 'Zone 3 is 10 ft either side of the road or driveway (§ 603.3.1).'],
    ],
    enforcement: 'SAMC § 3-3.812 — penalties, with abatement costs recoverable against the property as a nuisance abatement lien.',
  },
  sprinkler: {
    scope: 'Replace the head. Quote the <b>2025</b> edition, and pull the permit history.',
    steps: [
      ['Check the last three years of permits', 'San Anselmo pulls existing buildings into the sprinkler requirement on remodel: over 3,000 sq ft adding 10% or more floor area in any 36 months, any building adding 50% or more, or a substantial remodel (§§ 903.2.2, 903.2.2.1). A system the owner believes is voluntary may be a required one — which changes the weight of the maintenance finding.'],
      ['Before the head comes out', '§ 901.7 as amended — notify, then evacuate or set a fire watch.'],
      ['Edition', '2025 CFC, adopted 10 November 2025 by Ord. 2025-1194.'],
    ],
    enforcement: 'SAMC § 3-3.812 — penalties and abatement costs as a lien.',
    ownerRider: 'If this building has been extended or substantially remodelled in the last three years, San Anselmo may treat the sprinkler system as a required one rather than a voluntary one, which affects how the deficiency is handled. Your records of that work are worth having to hand.',
  },
},

marin: {
  ladder: {
    scope: 'Ladder-fuel removal inside <b>30 ft</b> — but settle the enforcing agency before anything is issued.',
    steps: [
      ['Agency first', 'Marin County Fire, the Sleepy Hollow FPD and the Kentfield FPD all cover parts of this valley. A notice from the wrong agency is not worth issuing.'],
      ['Smaller trees come out here', 'Canopy separation within 30 ft can require removal of trees up to 6 in. diameter at breast height (§ 4907.4(8)). All three towns set that threshold at 8 in., so the county can require a tree the towns would leave.'],
      ['SRA or LRA changes the standard', '§ 4907.1 routes the duty through PRC § 4290 and the SRA Fire Safe Regulations on state responsibility land, and through Gov. Code §§ 51175–51189 in local responsibility areas. Establish which before scoping the work.'],
    ],
    enforcement: 'Abatement under Marin County Code ch. 16.16, once the responsible agency is settled.',
    ownerRider: 'The property is outside any town limit, so confirm which fire agency covers your address before scheduling the work — Marin County Fire and the local districts enforce different ordinances, and the tree sizes they can require you to remove are not the same.',
  },
  sprinkler: {
    scope: 'Replace the head. Confirm the agency, then quote the <b>2022</b> county edition.',
    steps: [
      ['Agency first', 'A district covering the parcel may enforce its own, later ordinance — Sleepy Hollow FPD adopted Ordinance 2025-04.'],
      ['The exceptions are drawn differently', 'The county’s § 903.2.1 exceptions cover small detached accessory structures built alongside existing non-sprinklered houses, and certain non-combustible canopies. A detached structure exempt here may not be exempt a street away.'],
      ['Edition', 'The county is on the 2022 CFC under Ord. 3775.'],
    ],
    enforcement: 'Abatement under Marin County Code ch. 16.16.',
  },
},

};

Object.keys(work).forEach(id => {
  jurisdictions[id].ladder.work = work[id].ladder;
  jurisdictions[id].sprinkler.work = work[id].sprinkler;
});

// ---------------------------------------------------------------------------
// Incorporated places on the map that this demo does not carry codes for. The
// honest answer there is "not this jurisdiction" rather than a wrong table.
// ---------------------------------------------------------------------------
const outside = {
  san_rafael: {
    name: 'City of San Rafael', short: 'San Rafael', kind: 'Incorporated city',
    agency: 'San Rafael Fire Department',
    why: 'San Rafael is outside the Ross Valley Fire Department’s area and adopts its own fire code. This demo carries Ross, Fairfax, San Anselmo and unincorporated Marin only.',
  },
  larkspur: {
    name: 'City of Larkspur', short: 'Larkspur', kind: 'Incorporated city',
    agency: 'Central Marin Fire Department',
    why: 'Larkspur is served by Central Marin Fire and adopts its own fire code. This demo carries Ross, Fairfax, San Anselmo and unincorporated Marin only.',
  },
};

return { map, areas, jurisdictions, outside, fallback: 'marin' };
})();
