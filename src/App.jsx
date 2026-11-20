import { useEffect, useMemo, useState } from 'react';

const categories = ['Todos', 'RPG', 'Anime', 'Geek'];
const money = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

function formatPrice(priceCents) {
  return money.format(priceCents / 100);
}

function App() {
  const [products, setProducts] = useState([]);
  const [category, setCategory] = useState('Todos');
  const [search, setSearch] = useState('');
  const [cart, setCart] = useState({});
  const [cartOpen, setCartOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [checkoutError, setCheckoutError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [order, setOrder] = useState(null);

  useEffect(() => {
    const controller = new AbortController();

    async function loadProducts() {
      try {
        const response = await fetch('/api/products', { signal: controller.signal });
        if (!response.ok) throw new Error('Não foi possível carregar os produtos.');
        const data = await response.json();
        setProducts(data.products);
      } catch (error) {
        if (error.name !== 'AbortError') setLoadError(error.message);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }

    loadProducts();
    return () => controller.abort();
  }, []);

  useEffect(() => {
    if (!cartOpen) return undefined;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    function handleEscape(event) {
      if (event.key === 'Escape') setCartOpen(false);
    }

    window.addEventListener('keydown', handleEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleEscape);
    };
  }, [cartOpen]);

  const visibleProducts = useMemo(() => {
    const normalizedSearch = search.trim().toLocaleLowerCase('pt-BR');
    return products.filter((product) => {
      const matchesCategory = category === 'Todos' || product.category === category;
      const matchesSearch =
        !normalizedSearch ||
        `${product.name} ${product.description} ${product.category}`
          .toLocaleLowerCase('pt-BR')
          .includes(normalizedSearch);
      return matchesCategory && matchesSearch;
    });
  }, [category, products, search]);

  const cartItems = products
    .filter((product) => cart[product.id])
    .map((product) => ({ ...product, quantity: cart[product.id] }));
  const itemCount = cartItems.reduce((total, item) => total + item.quantity, 0);
  const cartTotal = cartItems.reduce(
    (total, item) => total + item.priceCents * item.quantity,
    0,
  );

  function addToCart(productId) {
    setCart((currentCart) => ({
      ...currentCart,
      [productId]: Math.min((currentCart[productId] ?? 0) + 1, 99),
    }));
    setOrder(null);
    setCheckoutError('');
  }

  function changeQuantity(productId, amount) {
    setCart((currentCart) => {
      const nextQuantity = (currentCart[productId] ?? 0) + amount;
      if (nextQuantity <= 0) {
        const { [productId]: removed, ...remainingItems } = currentCart;
        return remainingItems;
      }
      return { ...currentCart, [productId]: Math.min(nextQuantity, 99) };
    });
  }

  async function submitOrder(event) {
    event.preventDefault();
    if (submitting) return;

    setSubmitting(true);
    setCheckoutError('');
    const formData = new FormData(event.currentTarget);

    try {
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName: String(formData.get('customerName') ?? '').trim(),
          customerEmail: String(formData.get('customerEmail') ?? '').trim(),
          customerAddress: String(formData.get('customerAddress') ?? '').trim(),
          items: cartItems.map(({ id, quantity }) => ({ productId: id, quantity })),
        }),
      });
      let data;
      try {
        data = await response.json();
      } catch {
        throw new Error('O servidor respondeu em um formato inválido.');
      }
      if (!response.ok) throw new Error(data.error || 'Não foi possível enviar o pedido.');
      if (
        typeof data.orderId !== 'string' ||
        typeof data.customerName !== 'string' ||
        !Number.isInteger(data.totalCents)
      ) {
        throw new Error('O servidor retornou dados incompletos do pedido.');
      }
      setOrder(data);
      setCart({});
    } catch (error) {
      setCheckoutError(error instanceof Error ? error.message : 'Não foi possível enviar o pedido.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <header className="site-header">
        <a className="brand" href="#inicio" aria-label="Nexo Geek, início">
          <span className="brand-mark" aria-hidden="true">✦</span>
          <span>NEXO<span className="brand-accent">GEEK</span></span>
        </a>
        <nav className="main-nav" aria-label="Navegação principal">
          <a href="#colecao">Coleção</a>
          <a href="#sobre">Como funciona</a>
        </nav>
        <button className="cart-button" type="button" onClick={() => setCartOpen(true)} aria-haspopup="dialog">
          <span aria-hidden="true">♧</span>
          <span className="cart-label">Sacola</span>
          <span className="cart-count" aria-label={`${itemCount} itens`}>{itemCount}</span>
        </button>
      </header>

      <main>
        <section className="hero" id="inicio">
          <div className="hero-copy">
            <p className="eyebrow"><span /> SUA PRÓXIMA AVENTURA COMEÇA AQUI</p>
            <h1>Seu universo geek,<br /><span>na sua porta.</span></h1>
            <p className="hero-description">
              RPG, anime e cultura pop reunidos num só lugar. Escolha seus favoritos e
              deixe a aventura chegar até você.
            </p>
            <a className="primary-link" href="#colecao">Explorar coleção <span aria-hidden="true">↗</span></a>
            <div className="hero-note">
              <span className="note-icon" aria-hidden="true">✦</span>
              <span>Uma entrega de outro mundo</span>
            </div>
          </div>
          <div className="hero-art" aria-label="Ilustração de dados, estrelas e itens geek">
            <div className="orbit orbit-one" />
            <div className="orbit orbit-two" />
            <span className="spark spark-one">✦</span>
            <span className="spark spark-two">✧</span>
            <span className="hero-die">20</span>
            <span className="floating-item item-book">📚</span>
            <span className="floating-item item-star">⭐</span>
            <span className="floating-item item-controller">🎮</span>
            <span className="floating-item item-crystal">💎</span>
            <span className="hero-caption">ITENS PARA<br />SUA JORNADA</span>
          </div>
          <div className="hero-bottom">
            <span>RPG <b>·</b> ANIME <b>·</b> CULTURA GEEK</span>
            <a href="#colecao">DESCUBRA A COLEÇÃO <span aria-hidden="true">↓</span></a>
          </div>
        </section>

        <section className="collection section-shell" id="colecao">
          <div className="section-heading">
            <div>
              <p className="eyebrow">ESCOLHIDOS PARA VOCÊ</p>
              <h2>Achados <span>de outro mundo</span></h2>
            </div>
            <label className="search-box">
              <span aria-hidden="true">⌕</span>
              <input
                type="search"
                placeholder="Buscar item..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                aria-label="Buscar produtos"
              />
            </label>
          </div>

          <div className="category-list" aria-label="Filtrar por categoria">
            {categories.map((item) => (
              <button
                className={category === item ? 'category-chip active' : 'category-chip'}
                key={item}
                type="button"
                onClick={() => setCategory(item)}
                aria-pressed={category === item}
              >
                {item}
              </button>
            ))}
            <span className="results-count">{visibleProducts.length} itens para descobrir</span>
          </div>

          {loading && <p className="feedback-message" role="status">Carregando a coleção...</p>}
          {loadError && <p className="feedback-message error" role="alert">{loadError}</p>}
          {!loading && !loadError && visibleProducts.length === 0 && (
            <p className="feedback-message">Nenhum item encontrado. Tente outra busca.</p>
          )}

          <div className="product-grid">
            {visibleProducts.map((product, index) => (
              <article className="product-card" key={product.id}>
                <div className={`product-art art-${index % 6}`}>
                  {product.badge && <span className="product-badge">{product.badge}</span>}
                  <span className="product-emoji" aria-hidden="true">{product.emoji}</span>
                  <span className="art-spark" aria-hidden="true">✦</span>
                </div>
                <div className="product-meta">
                  <span>{product.category}</span>
                  <span className="product-rating" aria-label="Favorito da comunidade">★ <span>geek pick</span></span>
                </div>
                <h3>{product.name}</h3>
                <p className="product-description">{product.description}</p>
                <div className="product-footer">
                  <strong>{formatPrice(product.priceCents)}</strong>
                  <button
                    className="add-button"
                    type="button"
                    onClick={() => addToCart(product.id)}
                    aria-label={`Adicionar ${product.name} à sacola`}
                  >
                    <span aria-hidden="true">+</span> Adicionar
                  </button>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="delivery-banner" id="sobre">
          <div className="banner-icon" aria-hidden="true">🛸</div>
          <div>
            <p className="eyebrow">DO NOSSO PORTAL ATÉ VOCÊ</p>
            <h2>Seu próximo item favorito<br />está a um clique.</h2>
          </div>
          <a className="banner-link" href="#colecao">Escolher meus itens <span aria-hidden="true">↗</span></a>
        </section>
      </main>

      <footer className="site-footer">
        <a className="brand footer-brand" href="#inicio">
          <span className="brand-mark" aria-hidden="true">✦</span>
          <span>NEXO<span className="brand-accent">GEEK</span></span>
        </a>
        <p>Feito para quem vive muitas aventuras.</p>
        <span>© 2026 Nexo Geek · Loja demonstrativa</span>
      </footer>

      {cartOpen && (
        <div className="cart-overlay" onMouseDown={(event) => {
          if (event.target === event.currentTarget) setCartOpen(false);
        }}>
          <aside className="cart-drawer" aria-label="Sua sacola" aria-modal="true" role="dialog">
            <div className="drawer-heading">
              <div>
                <p className="eyebrow">SEUS ACHADOS</p>
                <h2>Sacola <span>({itemCount})</span></h2>
              </div>
              <button className="close-button" type="button" onClick={() => setCartOpen(false)} aria-label="Fechar sacola">×</button>
            </div>

            {order ? (
              <div className="order-success" role="status">
                <span className="success-icon" aria-hidden="true">✓</span>
                <p className="eyebrow">PEDIDO RECEBIDO</p>
                <h3>A aventura começou!</h3>
                <p>Pedido <strong>#{order.orderId.slice(0, 8).toUpperCase()}</strong> registrado para {order.customerName}.</p>
                <p className="success-total">Total: {formatPrice(order.totalCents)}</p>
                <p className="demo-note">Este é um pedido de demonstração. Nenhum pagamento ou entrega real foi iniciado.</p>
                <button className="primary-button" type="button" onClick={() => {
                  setOrder(null);
                  setCartOpen(false);
                }}>Continuar explorando</button>
              </div>
            ) : cartItems.length === 0 ? (
              <div className="empty-cart">
                <span aria-hidden="true">🪄</span>
                <h3>Sua sacola está vazia</h3>
                <p>Tem um universo inteiro esperando para ser explorado.</p>
                <button className="primary-button" type="button" onClick={() => setCartOpen(false)}>Ver coleção</button>
              </div>
            ) : (
              <>
                <div className="cart-items">
                  {cartItems.map((item) => (
                    <div className="cart-item" key={item.id}>
                      <span className="cart-item-emoji" aria-hidden="true">{item.emoji}</span>
                      <div className="cart-item-info">
                        <strong>{item.name}</strong>
                        <span>{formatPrice(item.priceCents)}</span>
                        <div className="quantity-control" aria-label={`Quantidade de ${item.name}`}>
                          <button type="button" onClick={() => changeQuantity(item.id, -1)} aria-label="Diminuir quantidade">−</button>
                          <span>{item.quantity}</span>
                          <button type="button" onClick={() => changeQuantity(item.id, 1)} aria-label="Aumentar quantidade">+</button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="checkout">
                  <div className="total-row"><span>Total demonstrativo</span><strong>{formatPrice(cartTotal)}</strong></div>
                  <form onSubmit={submitOrder}>
                    <label htmlFor="customerName">Seu nome</label>
                    <input id="customerName" name="customerName" autoComplete="name" minLength="2" maxLength="80" required />
                    <label htmlFor="customerEmail">E-mail</label>
                    <input id="customerEmail" name="customerEmail" type="email" autoComplete="email" required />
                    <label htmlFor="customerAddress">Endereço de entrega</label>
                    <textarea id="customerAddress" name="customerAddress" autoComplete="street-address" minLength="5" maxLength="160" required />
                    {checkoutError && <p className="form-error" role="alert">{checkoutError}</p>}
                    <button className="primary-button checkout-button" type="submit" disabled={submitting}>
                      {submitting ? 'Enviando pedido...' : 'Finalizar pedido demonstrativo'}
                    </button>
                  </form>
                  <p className="demo-note">Sem cobrança: esta loja é apenas uma demonstração.</p>
                </div>
              </>
            )}
          </aside>
        </div>
      )}
    </>
  );
}

export default App;
