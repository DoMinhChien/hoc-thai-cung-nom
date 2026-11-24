/** Phát một bản ghi trên máy; xong (hoặc lỗi) thì resolve. Một bản phát tại một thời điểm. */
let current: HTMLAudioElement | null = null;

export function stopPlayback() {
  current?.pause();
  current = null;
}

export function playBlob(blob: Blob): Promise<void> {
  stopPlayback();
  const url = URL.createObjectURL(blob);
  const audio = new Audio(url);
  current = audio;
  return new Promise<void>((resolve) => {
    const done = () => {
      URL.revokeObjectURL(url);
      if (current === audio) current = null;
      resolve();
    };
    audio.onended = done;
    audio.onerror = done;
    audio.onpause = done;
    audio.play().catch(done);
  });
}
