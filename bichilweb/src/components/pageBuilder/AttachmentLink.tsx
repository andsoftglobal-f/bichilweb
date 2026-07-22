'use client';

async function openFileForView(url: string) {
  window.open(url, '_blank', 'noopener,noreferrer');
}

export default function AttachmentLink({
  fileUrl,
  iconUrl,
  title,
  description,
  buttonText,
  fileName,
  isDownload,
  fileDownloadName,
  openNew,
  btnJustify,
  iconWrapClass,
}: {
  fileUrl: string;
  iconUrl: string;
  title?: string;
  description?: string;
  buttonText?: string;
  fileName: string;
  isDownload: boolean;
  fileDownloadName?: string;
  openNew: boolean;
  btnJustify: string;
  iconWrapClass: string;
}) {
  return (
    <a
      href={fileUrl}
      target={openNew ? '_blank' : undefined}
      rel={openNew ? 'noreferrer' : undefined}
      download={isDownload ? (fileDownloadName || true) : undefined}
      onClick={async e => {
        if (isDownload) return;
        e.preventDefault();
        await openFileForView(fileUrl);
      }}
      className="group block rounded-2xl border border-sky-100 bg-gradient-to-br from-sky-50 via-white to-white p-5 transition-all hover:-translate-y-0.5 hover:border-sky-200 hover:shadow-lg hover:shadow-sky-100/50"
    >
      <div className="flex items-start gap-4">
        <div className={`flex shrink-0 items-center justify-center bg-sky-100 text-sky-600 overflow-hidden ${iconWrapClass}`}>
          {iconUrl
            ? <img src={iconUrl} alt="" className="h-full w-full object-cover" />
            : <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21.44 11.05 12.25 20.24a6 6 0 1 1-8.49-8.49l9.19-9.2a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.82-2.83l8.48-8.48" />
              </svg>
          }
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-base font-bold text-slate-900 group-hover:text-sky-700">{title || fileName || 'Attachment'}</div>
          {description ? <p className="mt-1 text-sm leading-6 text-slate-500">{description}</p> : null}
          <div className={`mt-4 flex ${btnJustify}`}>
            <div className="inline-flex items-center gap-2 rounded-xl bg-sky-600 px-4 py-2 text-sm font-semibold text-white transition-colors group-hover:bg-sky-700">
              {isDownload
                ? <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" /></svg>
                : <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.964-7.178Z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" /></svg>
              }
              {buttonText || 'Download file'}
            </div>
          </div>
        </div>
      </div>
    </a>
  );
}
