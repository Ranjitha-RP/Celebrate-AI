export interface InvitationCardRenderOptions {
  kicker: string;
  headline: string;
  body: string;
  rsvpNote: string;
  hostLine: string;
  rsvpUrl: string;
}

function wrapParagraphs(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number
): string[] {
  const paragraphs = text.split("\n");
  const lines: string[] = [];

  for (const para of paragraphs) {
    const words = para.trim().split(/\s+/).filter(Boolean);
    if (words.length === 0) {
      lines.push("");
      continue;
    }
    let currentLine = words[0];
    for (let i = 1; i < words.length; i++) {
      const candidate = `${currentLine} ${words[i]}`;
      if (ctx.measureText(candidate).width <= maxWidth) {
        currentLine = candidate;
      } else {
        lines.push(currentLine);
        currentLine = words[i];
      }
    }
    lines.push(currentLine);
  }
  return lines;
}

function drawCornerFlourish(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  flipX: number,
  flipY: number
) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(flipX, flipY);
  ctx.strokeStyle = "#D97706";
  ctx.lineWidth = 2.5;

  ctx.beginPath();
  ctx.moveTo(0, 42);
  ctx.lineTo(0, 0);
  ctx.lineTo(42, 0);
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(14, 14, 5, 0, Math.PI * 2);
  ctx.fillStyle = "#BE123C";
  ctx.fill();
  ctx.restore();
}

export async function renderInvitationCardPng(
  opts: InvitationCardRenderOptions
): Promise<{ dataUrl: string; blob: Blob }> {
  if (document.fonts && document.fonts.ready) {
    await document.fonts.ready.catch(() => undefined);
  }

  const width = 1080;
  const paddingX = 116;
  const maxTextWidth = width - paddingX * 2;

  const measureCanvas = document.createElement("canvas");
  const mCtx = measureCanvas.getContext("2d")!;

  mCtx.font = '600 46px "Fraunces", Georgia, serif';
  const headlineLines = wrapParagraphs(mCtx, opts.headline, maxTextWidth);

  mCtx.font = '400 28px "Plus Jakarta Sans", system-ui, sans-serif';
  const bodyLines = wrapParagraphs(mCtx, opts.body, maxTextWidth - 40);

  mCtx.font = '600 24px "Plus Jakarta Sans", system-ui, sans-serif';
  const rsvpLines = wrapParagraphs(mCtx, opts.rsvpNote, maxTextWidth - 40);

  mCtx.font = 'italic 23px "Fraunces", Georgia, serif';
  const hostLines = wrapParagraphs(mCtx, opts.hostLine, maxTextWidth);

  const dynamicHeight =
    260 +
    headlineLines.length * 60 +
    70 +
    bodyLines.length * 46 +
    60 +
    rsvpLines.length * 38 +
    55 +
    hostLines.length * 36 +
    150;

  const height = Math.max(1220, dynamicHeight);

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d")!;

  // Warm Ivory Alabaster background
  ctx.fillStyle = "#FCFBF8";
  ctx.fillRect(0, 0, width, height);

  // Subtle inner glow border frame
  ctx.strokeStyle = "#D97706";
  ctx.lineWidth = 4;
  ctx.strokeRect(42, 42, width - 84, height - 84);

  ctx.strokeStyle = "rgba(190, 18, 60, 0.32)";
  ctx.lineWidth = 1.5;
  ctx.strokeRect(56, 56, width - 112, height - 112);

  // Four festive corner flourishes
  drawCornerFlourish(ctx, 68, 68, 1, 1);
  drawCornerFlourish(ctx, width - 68, 68, -1, 1);
  drawCornerFlourish(ctx, 68, height - 68, 1, -1);
  drawCornerFlourish(ctx, width - 68, height - 68, -1, -1);

  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  const centerX = width / 2;

  let cursorY = 128;

  // Auspicious Kicker
  ctx.fillStyle = "#92400E";
  ctx.font = '600 21px "Plus Jakarta Sans", system-ui, sans-serif';
  ctx.fillText(opts.kicker, centerX, cursorY);
  cursorY += 64;

  // Headline
  ctx.fillStyle = "#881337";
  ctx.font = '600 46px "Fraunces", Georgia, serif';
  for (const line of headlineLines) {
    ctx.fillText(line, centerX, cursorY);
    cursorY += 60;
  }

  cursorY += 22;

  // Marigold divider rule with central kumkum diamond
  ctx.strokeStyle = "#D97706";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(centerX - 110, cursorY);
  ctx.lineTo(centerX - 16, cursorY);
  ctx.moveTo(centerX + 16, cursorY);
  ctx.lineTo(centerX + 110, cursorY);
  ctx.stroke();

  ctx.fillStyle = "#BE123C";
  ctx.beginPath();
  ctx.moveTo(centerX, cursorY - 7);
  ctx.lineTo(centerX + 7, cursorY);
  ctx.lineTo(centerX, cursorY + 7);
  ctx.lineTo(centerX - 7, cursorY);
  ctx.closePath();
  ctx.fill();

  cursorY += 46;

  // Main Invitation Body
  ctx.fillStyle = "#292524";
  ctx.font = '400 28px "Plus Jakarta Sans", system-ui, sans-serif';
  for (const line of bodyLines) {
    ctx.fillText(line, centerX, cursorY);
    cursorY += 46;
  }

  cursorY += 36;

  // Date & Venue RSVP Note Box
  const rsvpBoxHeight = rsvpLines.length * 38 + 36;
  ctx.fillStyle = "#FFFBEB";
  ctx.strokeStyle = "rgba(217, 119, 6, 0.4)";
  ctx.lineWidth = 1.5;
  ctx.fillRect(paddingX, cursorY, maxTextWidth, rsvpBoxHeight);
  ctx.strokeRect(paddingX, cursorY, maxTextWidth, rsvpBoxHeight);

  ctx.fillStyle = "#1C1917";
  ctx.font = '600 24px "Plus Jakarta Sans", system-ui, sans-serif';
  let boxY = cursorY + 18;
  for (const line of rsvpLines) {
    ctx.fillText(line, centerX, boxY);
    boxY += 38;
  }
  cursorY += rsvpBoxHeight + 44;

  // Host Signature Line
  ctx.fillStyle = "#57534E";
  ctx.font = 'italic 24px "Fraunces", Georgia, serif';
  for (const line of hostLines) {
    ctx.fillText(line, centerX, cursorY);
    cursorY += 36;
  }

  // Footer RSVP Link Reference
  ctx.fillStyle = "#78716C";
  ctx.font = '500 18px "JetBrains Mono", monospace';
  ctx.fillText(`RSVP Online: ${opts.rsvpUrl}`, centerX, height - 102);

  const dataUrl = canvas.toDataURL("image/png");
  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((b) => {
      if (b) resolve(b);
      else reject(new Error("Could not encode invitation card image"));
    }, "image/png");
  });

  return { dataUrl, blob };
}

export function printImageViaHiddenFrame(dataUrl: string, title: string): void {
  const existing = document.getElementById("celebrate-print-frame");
  if (existing) existing.remove();

  const iframe = document.createElement("iframe");
  iframe.id = "celebrate-print-frame";
  iframe.style.position = "fixed";
  iframe.style.right = "0";
  iframe.style.bottom = "0";
  iframe.style.width = "0";
  iframe.style.height = "0";
  iframe.style.border = "0";
  document.body.appendChild(iframe);

  const doc = iframe.contentWindow?.document;
  if (!doc) {
    window.print();
    return;
  }

  doc.open();
  doc.write(`<!doctype html>
<html>
  <head>
    <title>${title.replace(/</g, "&lt;")}</title>
    <style>
      @page { margin: 12mm; }
      html, body {
        margin: 0;
        padding: 0;
        background: #FFFFFF;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      img {
        max-width: 100%;
        max-height: 94vh;
        height: auto;
        display: block;
      }
    </style>
  </head>
  <body>
    <img id="card-img" src="${dataUrl}" alt="Invitation Card" />
    <script>
      const img = document.getElementById('card-img');
      function triggerPrint() {
        setTimeout(function() {
          window.focus();
          window.print();
        }, 120);
      }
      if (img.complete) {
        triggerPrint();
      } else {
        img.onload = triggerPrint;
      }
    </script>
  </body>
</html>`);
  doc.close();
}
