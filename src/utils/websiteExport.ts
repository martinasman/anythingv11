import JSZip from 'jszip';

export interface WebsiteFile {
  path: string;
  content: string;
  type: 'html' | 'css' | 'js' | 'json';
}

/**
 * Downloads a file to the user's computer
 */
function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * Exports website as a single HTML file with inlined CSS and JS
 */
export function exportSingleHTML(files: WebsiteFile[], projectName: string) {
  const htmlFile = files.find(f => f.path === '/index.html');
  const cssFile = files.find(f => f.path === '/styles.css');
  const jsFile = files.find(f => f.path === '/script.js');

  if (!htmlFile) {
    console.error('No HTML file found');
    return;
  }

  let html = htmlFile.content;

  // Inline CSS
  if (cssFile && cssFile.content) {
    html = html.replace('</head>', `<style>\n${cssFile.content}\n</style>\n</head>`);
  }

  // Inline JS
  if (jsFile && jsFile.content) {
    html = html.replace('</body>', `<script>\n${jsFile.content}\n</script>\n</body>`);
  }

  // Download
  const blob = new Blob([html], { type: 'text/html' });
  const filename = `${projectName.toLowerCase().replace(/\s+/g, '-')}.html`;
  downloadBlob(blob, filename);
}

/**
 * Exports website as a ZIP file with separate files
 */
export async function exportZIP(files: WebsiteFile[], projectName: string) {
  const zip = new JSZip();

  // Add each file to the ZIP
  files.forEach(file => {
    // Remove leading slash from path
    const path = file.path.startsWith('/') ? file.path.substring(1) : file.path;
    zip.file(path, file.content);
  });

  // Generate ZIP file
  const blob = await zip.generateAsync({ type: 'blob' });
  const filename = `${projectName.toLowerCase().replace(/\s+/g, '-')}.zip`;
  downloadBlob(blob, filename);
}
