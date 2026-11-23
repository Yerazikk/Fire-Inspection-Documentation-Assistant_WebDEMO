// osascript -l JavaScript tools/pdftext.js <in.pdf> <out.txt>
// Reads the text layer of a PDF with macOS PDFKit (no third-party code) so the ordinance
// documents downloaded for NOTES.md can be searched. Reads only; never executes the file.
ObjC.import('PDFKit');
ObjC.import('Foundation');
function run(argv) {
  var doc = $.PDFDocument.alloc.initWithURL($.NSURL.fileURLWithPath(argv[0]));
  if (!doc || doc.isNil()) return 'could not open ' + argv[0];
  var n = doc.pageCount, out = [];
  for (var i = 0; i < n; i++) { var s = doc.pageAtIndex(i).string; out.push('\n=== page ' + (i + 1) + ' ===\n' + (s && !s.isNil() ? s.js : '')); }
  $.NSString.alloc.initWithUTF8String(out.join('\n')).writeToFileAtomicallyEncodingError(argv[1], true, $.NSUTF8StringEncoding, null);
  return n + ' pages -> ' + argv[1];
}
