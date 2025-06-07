import React, { useState, useEffect } from "react";
import "./App.css";
import {
  BrowserRouter,
  Routes,
  Route,
  Link,
  useParams,
  useNavigate,
} from "react-router-dom";
import { Client, Databases, Query } from "appwrite";

// Appwrite config
const APPWRITE_ENDPOINT = "https://cloud.appwrite.io/v1";
const PROJECT_ID = "6843f3700007cb97c75d";
const DATABASE_ID = "6843f3b3003aeb85c8a3";
const COLLECTION_ID = "6843f3cb002566f87355";

// Appwrite client setup
const client = new Client().setEndpoint(APPWRITE_ENDPOINT).setProject(PROJECT_ID);
const databases = new Databases(client);

// Получаем все товары из базы Appwrite
async function fetchCatalog() {
  const response = await databases.listDocuments(DATABASE_ID, COLLECTION_ID, [
    Query.limit(100),
  ]);
  // Ожидается что документ содержит imageUrl, title, description, category, parameters{}, contact
  return response.documents.map(doc => ({
    id: doc.$id,
    imageUrl: doc.imageUrl,
    title: doc.title,
    description: doc.description,
    category: doc.category,
    parameters: doc.parameters,
    contact: doc.contact,
  }));
}

// Каталожная карточка
function Card({ item }) {
  return (
    <Link to={`/item/${item.id}`} className="catalog-card">
      <img src={item.imageUrl} alt={item.title} className="catalog-card-image" />
      <div className="catalog-card-content">
        <h3 className="catalog-card-title">{item.title}</h3>
        <div className="catalog-card-desc">{item.description}</div>
        <div className="catalog-card-params">
          {item.parameters && item.parameters.map(par =>
            <div key={par.key} className="catalog-card-param">
              <span className="param-value">{par}</span>
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}

// Каталог: фильтры, поиск + загрузка из базы
function Catalog() {
  const [category, setCategory] = useState("Все");
  const [search, setSearch] = useState("");
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);

  useEffect(() => {
    setLoading(true);
    fetchCatalog()
      .then(docs => {
        setItems(docs);
        setLoading(false);
        setLoadError(null);
      })
      .catch(err => {
        setLoadError("Ошибка загрузки данных");
        setLoading(false);
      });
  }, []);

  const filtered = items.filter(item =>
    (category === "Все" || item.category === category) &&
    (
      (item.title && item.title.toLowerCase().includes(search.toLowerCase())) ||
      (item.description && item.description.toLowerCase().includes(search.toLowerCase())) ||
      (item.parameters && Object.values(item.parameters).some(val =>
        typeof val === "string" && val.toLowerCase().includes(search.toLowerCase())
      ))
    )
  );

  return (
    <main className="catalog-main">
      <section className="catalog-hero">
        <h1>Каталог вебкам студий</h1>
        <p>Откройте для себя лучшие вебкам студии, собранные в этом каталоге</p>
      </section>
      <section className="catalog-filters">
        <input
          type="text"
          placeholder="Поиск по каталогу..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="filter-search"
        />
      </section>
      <section className="catalog-grid">
        {loading ? (
          <div className="catalog-empty">Загрузка...</div>
        ) : loadError ? (
          <div className="catalog-empty">{loadError}</div>
        ) : filtered.length ? (
          filtered.map(item => <Card item={item} key={item.id} />)
        ) : (
          <div className="catalog-empty">Совпадений не найдено 😕</div>
        )}
      </section>
    </main>
  );
}

// Detail: загрузка одного товара либо из items (если есть), либо дополнительно из базы
function Detail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);

  useEffect(() => {
    setLoading(true);
    databases.getDocument(DATABASE_ID, COLLECTION_ID, id)
      .then(doc => {
        setItem({
          id: doc.$id,
          imageUrl: doc.imageUrl,
          title: doc.title,
          description: doc.description,
          category: doc.category,
          parameters: doc.parameters,
          contact: doc.contact,
        });
        setLoading(false);
        setLoadError(null);
      })
      .catch(() => {
        setLoadError("Товар не найден или произошла ошибка");
        setLoading(false);
      });
  }, [id]);

  if (loading) return <div className="catalog-empty">Загрузка...</div>;
  if (loadError || !item) return <div className="catalog-empty">{loadError || "Товар не найден"}</div>;

  return (
    <main className="detail-main">
      <button className="btn-back" onClick={() => navigate(-1)}>← Назад</button>
      <div className="detail-card">
        <img src={item.imageUrl} alt={item.title} className="detail-image" />
        <div className="detail-content">
          <h2 className="detail-title">{item.title}</h2>
          <div className="detail-description">{item.description}</div>
          <div className="detail-params">
            {item.parameters && Object.entries(item.parameters).map(([key, value]) =>
              <div key={key} className="detail-param">
                <span className="param-key">{Number(key) + 1}:</span> <span className="param-value">{value}</span>
              </div>
            )}
          </div>
          <div className="detail-contact">
            <span>Контакты: </span>
            <span>{item.contact}</span>
          </div>
        </div>
      </div>
    </main>
  );
}

function App() {
  return (
    <BrowserRouter>
      <div className="app-container">
        <Routes>
          <Route path="/item/:id" element={<Detail />} />
          <Route path="/" element={<Catalog />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;
