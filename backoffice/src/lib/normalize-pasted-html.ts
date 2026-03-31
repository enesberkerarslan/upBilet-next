/**
 * Word / Outlook vb. yapıştırmada başlıklar çoğunlukla <p class="MsoHeading1"> şeklinde gelir;
 * Tiptap yalnızca gerçek <h1>–<h3> etiketlerini başlık düğümüne çevirir. Bu dönüşümü yapıştırmadan önce uygularız.
 */
export function normalizePastedHtml(html: string): string {
  if (!html || typeof window === 'undefined') return html;
  try {
    const doc = new DOMParser().parseFromString(html, 'text/html');
    const body = doc.body;
    if (!body) return html;

    body.querySelectorAll('p').forEach((p) => {
      const cls = (p.getAttribute('class') || '').toUpperCase();
      let level: 1 | 2 | 3 | null = null;
      if (cls.includes('MSOHEADING1') || cls.includes('MSOTITLE')) level = 1;
      else if (cls.includes('MSOHEADING2') || cls.includes('MSOSUBTITLE')) level = 2;
      else if (cls.includes('MSOHEADING3')) level = 3;
      if (!level) return;
      const h = doc.createElement(`h${level}`);
      h.innerHTML = p.innerHTML;
      p.replaceWith(h);
    });

    body.querySelectorAll('h4, h5, h6').forEach((el) => {
      const h3 = doc.createElement('h3');
      h3.innerHTML = el.innerHTML;
      el.replaceWith(h3);
    });

    return body.innerHTML;
  } catch {
    return html;
  }
}
