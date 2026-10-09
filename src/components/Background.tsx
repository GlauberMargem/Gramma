const BLOBS = [1, 2, 3];

/** Camadas de fundo (claro/escuro) do legado; o CSS alterna pelo `data-theme`. */
export function Background() {
  return (
    <>
      {(['light', 'dark'] as const).map((theme) => (
        <div key={theme} className={`bg-layer bg-layer-${theme}`} aria-hidden="true">
          {BLOBS.map((n) => (
            <span key={n} className={`bg-blob bg-blob-${n}`} />
          ))}
        </div>
      ))}
    </>
  );
}
