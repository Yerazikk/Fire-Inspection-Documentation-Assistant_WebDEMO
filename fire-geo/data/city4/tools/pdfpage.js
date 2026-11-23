// osascript -l JavaScript pdfpage.js <in.pdf> <outPrefix> <firstPage> <lastPage>
// Renders PDF pages to PNG with macOS PDFKit so strike-through and underline marks can be read by eye.
ObjC.import('PDFKit'); ObjC.import('AppKit');
function run(argv) {
  var doc = $.PDFDocument.alloc.initWithURL($.NSURL.fileURLWithPath(argv[0])); if (!doc || doc.isNil()) return 'could not open';
  var out = [];
  for (var i = +argv[2]; i <= +argv[3]; i++) {
    var img = doc.pageAtIndex(i - 1).thumbnailOfSizeForBox($.NSMakeSize(1400, 1812), $.kPDFDisplayBoxMediaBox);
    var rep = $.NSBitmapImageRep.imageRepWithData(img.TIFFRepresentation);
    var png = rep.representationUsingTypeProperties($.NSBitmapImageFileTypePNG, $.NSDictionary.dictionary);
    var f = argv[1] + '-p' + i + '.png'; png.writeToFileAtomically(f, true); out.push(f);
  }
  return out.join('\n');
}
