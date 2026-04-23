export function openPdfDocument(title, bodyHtml) {
  const printWindow = window.open('', '_blank', 'width=900,height=700');
  if (!printWindow) return;

  printWindow.document.write(`
    <!doctype html>
    <html>
      <head>
        <title>${title}</title>
        <style>
          body { margin: 0; padding: 32px; font-family: Arial, sans-serif; color: #111827; background: #f3f4f6; }
          .sheet { max-width: 760px; margin: 0 auto; background: white; border-radius: 18px; padding: 30px; border: 1px solid #e5e7eb; }
          .header { display: flex; justify-content: space-between; gap: 20px; border-bottom: 1px solid #e5e7eb; padding-bottom: 18px; margin-bottom: 22px; }
          .brand { font-size: 24px; font-weight: 800; margin: 0; }
          .muted { color: #6b7280; font-size: 13px; margin: 4px 0 0; }
          .badge { display: inline-block; padding: 7px 12px; border-radius: 999px; background: #ecfdf5; color: #047857; font-size: 12px; font-weight: 800; }
          .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin: 20px 0; }
          .box { border: 1px solid #e5e7eb; border-radius: 12px; padding: 14px; }
          .label { color: #6b7280; font-size: 12px; margin-bottom: 4px; }
          .value { font-size: 15px; font-weight: 700; }
          .qr { width: 132px; height: 132px; border: 1px solid #d1d5db; border-radius: 12px; padding: 8px; background: white; }
          .row { display: flex; justify-content: space-between; gap: 12px; padding: 10px 0; border-bottom: 1px dashed #e5e7eb; }
          .total { font-size: 20px; font-weight: 800; text-align: right; margin-top: 18px; }
          .note { margin-top: 24px; color: #4b5563; font-size: 13px; line-height: 1.5; }
          @media print { body { background: white; padding: 0; } .sheet { border: 0; border-radius: 0; } }
        </style>
      </head>
      <body>
        <div class="sheet">${bodyHtml}</div>
        <script>
          window.onload = function () {
            window.print();
          };
        </script>
      </body>
    </html>
  `);
  printWindow.document.close();
}

export function qrUrl(text) {
  return `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(text)}`;
}
