import Image from "next/image";

export default function Home() {
  return (
    <>
      <div className="grain-overlay" />
      <main className="menu-shell">
        <header className="menu-head">
          <span className="kicker">Origen Cocina de autor</span>
          <h1 className="display-title">Carta digital</h1>
          <p className="subcopy">
            Explora nuestras secciones en formato carrusel. Navega con los botones o
            desliza con el dedo para una experiencia tactil tipo app.
          </p>
        </header>

        <section className="carousel-wrap" aria-label="Categorias del menu">
          <div className="carousel-actions">
            <div className="chip-row" aria-hidden="true">
              {categories.map((item) => (
                <span className="chip" key={item.name}>
                  {item.name}
                </span>
              ))}
            </div>

            <div className="nav-buttons">
              <button
                className="nav-btn"
                type="button"
                aria-label="Desplazar carrusel a la izquierda"
                onClick={() => scrollTrack("left")}
              >
                ←
              </button>
              <button
                className="nav-btn"
                type="button"
                aria-label="Desplazar carrusel a la derecha"
                onClick={() => scrollTrack("right")}
              >
                →
              </button>
            </div>
          </div>

          <div className="track" ref={trackRef}>
            {categories.map((item, index) => (
              <article
                className="menu-card"
                key={item.name}
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <img className="menu-media" src={item.image} alt={item.name} loading="lazy" />
                <div className="menu-content">
                  <span className="menu-tag">{item.label}</span>
                  <h2 className="menu-title">{item.name}</h2>
                  <p className="menu-meta">{item.description}</p>
                  <p className="menu-meta">Tiempo estimado: {item.eta}</p>
                  <div className="cta-row">
                    <span className="cta-primary">Ver platos</span>
                    <span className="cta-secondary">Favoritos</span>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>
      </main>
    </>
  );
}
