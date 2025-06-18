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
const VACANCIES_COLLECTION_ID = "6851dae3001dffd55e83";

// Константы для фильтров
const CITIES = {
  0: "Москва",
  1: "Санкт-Петербург",
  2: "Новосибирск",
  3: "Екатеринбург",
  4: "Казань",
  5: "Нижний Новгород",
  6: "Челябинск",
  7: "Самара",
  8: "Омск",
  9: "Ростов-на-Дону",
  10: "Уфа",
  11: "Красноярск",
  12: "Воронеж",
  13: "Пермь",
  14: "Волгоград",
  15: "Краснодар",
  16: "Саратов",
  17: "Тюмень",
  18: "Тольятти",
  19: "Ижевск",
  20: "Барнаул",
  21: "Ульяновск",
  22: "Иркутск",
  23: "Хабаровск",
  24: "Ярославль",
  25: "Владивосток",
  26: "Махачкала",
  27: "Томск",
  28: "Оренбург",
  29: "Кемерово",
  30: "Новокузнецк",
  31: "Рязань",
  32: "Астрахань",
  33: "Набережные Челны",
  34: "Пенза",
  35: "Липецк",
  36: "Киров",
  37: "Чебоксары",
  38: "Тула",
  39: "Калининград",
  40: "Курск",
  41: "Улан-Удэ",
  42: "Ставрополь",
  43: "Сочи",
  44: "Брянск",
  45: "Иваново",
  46: "Магнитогорск",
  47: "Тверь",
  48: "Белгород",
  49: "Архангельск"
};

const EXPERIENCE_LEVELS = {
  0: "Без опыта",
  1: "Менее года",
  2: "Год и больше"
};

// Appwrite client setup
const client = new Client().setEndpoint(APPWRITE_ENDPOINT).setProject(PROJECT_ID);
const databases = new Databases(client);

// Получаем все товары из базы Appwrite
async function fetchCatalog() {
  const response = await databases.listDocuments(DATABASE_ID, COLLECTION_ID, [
    Query.limit(100),
  ]);
  // Ожидается что документ содержит imageUrl, title, description, category, parameters[], contact, ratings[]
  return response.documents.map(doc => ({
    id: doc.$id,
    imageUrl: doc.imageUrl,
    title: doc.title,
    description: doc.description,
    category: doc.category,
    parameters: doc.parameters || [],
    contact: doc.contact,
    ratings: doc.ratings || [],
    city: doc.city,
    atHome: doc.atHome,
    requiredStage: doc.requiredStage
  }));
}

// Получить блог-посты из Appwrite
async function fetchBlogPosts() {
  const BLOG_COLLECTION_ID = "685318f00019ac7b6ef1";
  const response = await databases.listDocuments(DATABASE_ID, BLOG_COLLECTION_ID, [Query.limit(100)]);
  return response.documents.map(doc => ({
    id: doc.$id,
    title: doc.title,
    caption: doc.caption,
    likes: doc.likes || 0
  }));
}

// Получить услуги из Appwrite
async function fetchServices() {
  const SERVICES_COLLECTION_ID = "68531ad00022e1c67aac";
  const response = await databases.listDocuments(DATABASE_ID, SERVICES_COLLECTION_ID, [Query.limit(100)]);
  return response.documents.map(doc => ({
    id: doc.$id,
    name: doc.name,
    caption: doc.caption,
    contacts: doc.contacts
  }));
}

// Каталожная карточка
function Card({ item }) {
  const calculateAverageRating = (ratings) => {
    if (!ratings || ratings.length === 0) return "Нет оценок";
    const sum = ratings.reduce((acc, curr) => acc + curr.stars, 0);
    return (sum / ratings.length).toFixed(1);
  };

  const averageRating = calculateAverageRating(item.ratings);
  const hasRatings = averageRating !== "Нет оценок";

  return (
    <Link to={`/item/${item.id}`} className="catalog-card">
      <img src={item.imageUrl} alt={item.title} className="catalog-card-image" />
      <div className="catalog-card-content">
        <h3 className="catalog-card-title">{item.title}</h3>
        <div className="catalog-card-desc">{item.description}</div>
        <div className="catalog-card-rating">
          {hasRatings ? (
            <>
              <span className="rating-stars">{'⭐'.repeat(Math.round(Number(averageRating)))}</span>
              <span className="rating-value">{averageRating}</span>
            </>
          ) : (
            <span className="rating-value">{averageRating}</span>
          )}
        </div>
        <div className="catalog-card-params">
          {item.parameters && item.parameters.map((param, index) =>
            <div key={index} className="catalog-card-param">
              <span className="param-value">{param}</span>
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}

// Модальное окно с формой вакансии
function VacancyModal({ isOpen, onClose }) {
  const [formData, setFormData] = useState({
    name: '',
    age: '',
    contact: '',
    comment: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      await databases.createDocument(
        DATABASE_ID,
        VACANCIES_COLLECTION_ID,
        'unique()', // Appwrite автоматически сгенерирует ID
        {
          name: formData.name,
          age: Number(formData.age),
          contact: formData.contact,
          comment: formData.comment
        }
      );

      // Очищаем форму и закрываем модальное окно
      setFormData({ name: '', age: '', contact: '', comment: '' });
      onClose();
    } catch (error) {
      console.error('Ошибка при отправке формы:', error);
      setSubmitError('Произошла ошибка при отправке формы. Пожалуйста, попробуйте позже.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>×</button>
        <h2>Откликнуться на вакансию</h2>
        {submitError && (
          <div className="form-error">
            {submitError}
          </div>
        )}
        <form onSubmit={handleSubmit} className="vacancy-form">
          <div className="form-group">
            <label>Имя:</label>
            <input
              type="text"
              value={formData.name}
              onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
              required
              placeholder="Ваше имя"
              disabled={isSubmitting}
            />
          </div>
          <div className="form-group">
            <label>Возраст:</label>
            <input
              type="number"
              value={formData.age}
              onChange={e => setFormData(prev => ({ ...prev, age: e.target.value }))}
              required
              min="18"
              max="99"
              placeholder="Ваш возраст"
              disabled={isSubmitting}
            />
          </div>
          <div className="form-group">
            <label>Контакт (телефон или телеграм):</label>
            <input
              type="text"
              value={formData.contact}
              onChange={e => setFormData(prev => ({ ...prev, contact: e.target.value }))}
              required
              placeholder="+7 (999) 123-45-67 или @username"
              disabled={isSubmitting}
            />
          </div>
          <div className="form-group">
            <label>Комментарий:</label>
            <textarea
              value={formData.comment}
              onChange={e => setFormData(prev => ({ ...prev, comment: e.target.value }))}
              placeholder="Расскажите о себе"
              rows="4"
              disabled={isSubmitting}
            />
          </div>
          <button 
            type="submit" 
            className="submit-vacancy"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Отправка...' : 'Отправить'}
          </button>
        </form>
      </div>
    </div>
  );
}

// Header-компонент
function Header({ onVacancyClick }) {
  return (
    <header className="main-header">
      <div className="header-content">
        <Link to="/" className="header-logo">Каталог студий</Link>
        <div className="header-actions">
          <nav className="header-nav">
            <Link to="/blog" className="header-link">Блог</Link>
            <Link to="/services" className="header-link">Услуги</Link>
          </nav>
          <button className="vacancy-btn" onClick={onVacancyClick}>
            Подать заявку
          </button>
        </div>
      </div>
    </header>
  );
}

// Каталог: фильтры, поиск + загрузка из базы
function Catalog({ onVacancyClick }) {
  const [category, setCategory] = useState("Все");
  const [search, setSearch] = useState("");
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [showVacancyModal, setShowVacancyModal] = useState(false);
  const [filters, setFilters] = useState({
    rating: "all", // all, above4, withRatings, only5
    city: "all",
    atHome: "all", // all, true, false
    requiredStage: "all" // all, 0, 1, 2
  });

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

  const calculateAverageRating = (ratings) => {
    if (!ratings || ratings.length === 0) return 0;
    const sum = ratings.reduce((acc, curr) => acc + curr.stars, 0);
    return sum / ratings.length;
  };

  const filtered = items.filter(item => {
    // Базовый фильтр по поиску
    const searchMatch = 
      (item.title && item.title.toLowerCase().includes(search.toLowerCase())) ||
      (item.description && item.description.toLowerCase().includes(search.toLowerCase())) ||
      (item.parameters && item.parameters.some(param =>
        typeof param === "string" && param.toLowerCase().includes(search.toLowerCase())
      ));

    if (!searchMatch) return false;

    // Фильтр по рейтингу
    const averageRating = calculateAverageRating(item.ratings);
    const ratingMatch = 
      filters.rating === "all" ||
      (filters.rating === "above4" && averageRating >= 4) ||
      (filters.rating === "withRatings" && item.ratings?.length > 0) ||
      (filters.rating === "only5" && averageRating === 5);

    if (!ratingMatch) return false;

    // Фильтр по городу
    if (filters.city !== "all" && item.city !== Number(filters.city)) return false;

    // Фильтр по месту работы
    if (filters.atHome !== "all" && item.atHome !== (filters.atHome === "true")) return false;

    // Фильтр по опыту
    if (filters.requiredStage !== "all" && item.requiredStage !== Number(filters.requiredStage)) return false;

    return true;
  });

  return (
    <main className="catalog-main">
      <section className="catalog-hero">
        <div className="hero-content">
          <h1>Каталог вебкам студий</h1>
          <p>Откройте для себя лучшие вебкам студии, собранные в этом каталоге</p>
        </div>
      </section>
      
      <VacancyModal 
        isOpen={showVacancyModal} 
        onClose={() => setShowVacancyModal(false)} 
      />

      <section className="catalog-filters">
        <div className="filters-header">
          <input
            type="text"
            placeholder="Поиск по каталогу..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="filter-search"
          />
          <button 
            className="toggle-filters-btn"
            onClick={() => setShowFilters(!showFilters)}
          >
            {showFilters ? "Скрыть фильтры" : "Показать фильтры"}
          </button>
        </div>
        
        {showFilters && (
          <div className="filters-panel">
            <div className="filter-group">
              <label>Рейтинг:</label>
              <select 
                value={filters.rating}
                onChange={e => setFilters(prev => ({ ...prev, rating: e.target.value }))}
              >
                <option value="all">Все</option>
                <option value="above4">Выше 4 звезд</option>
                <option value="withRatings">Только с оценками</option>
                <option value="only5">Только 5 звезд</option>
              </select>
            </div>

            <div className="filter-group">
              <label>Город:</label>
              <select 
                value={filters.city}
                onChange={e => setFilters(prev => ({ ...prev, city: e.target.value }))}
              >
                <option value="all">Все города</option>
                {Object.entries(CITIES).map(([id, name]) => (
                  <option key={id} value={id}>{name}</option>
                ))}
              </select>
            </div>

            <div className="filter-group">
              <label>Место работы:</label>
              <select 
                value={filters.atHome}
                onChange={e => setFilters(prev => ({ ...prev, atHome: e.target.value }))}
              >
                <option value="all">Все</option>
                <option value="true">На дому</option>
                <option value="false">В студии</option>
              </select>
            </div>

            <div className="filter-group">
              <label>Опыт работы:</label>
              <select 
                value={filters.requiredStage}
                onChange={e => setFilters(prev => ({ ...prev, requiredStage: e.target.value }))}
              >
                <option value="all">Любой</option>
                {Object.entries(EXPERIENCE_LEVELS).map(([id, name]) => (
                  <option key={id} value={id}>{name}</option>
                ))}
              </select>
            </div>
          </div>
        )}
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
  const [newReview, setNewReview] = useState({ author: '', caption: '', stars: 5 });

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
          parameters: doc.parameters || [],
          contact: doc.contact,
          ratings: doc.ratings || [],
          city: doc.city,
          atHome: doc.atHome,
          requiredStage: doc.requiredStage
        });
        setLoading(false);
        setLoadError(null);
      })
      .catch(() => {
        setLoadError("Товар не найден или произошла ошибка");
        setLoading(false);
      });
  }, [id]);

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!newReview.author || !newReview.caption) return;

    try {
      const updatedRatings = [...(item.ratings || []), newReview];
      await databases.updateDocument(DATABASE_ID, COLLECTION_ID, id, {
        ratings: updatedRatings
      });
      
      setItem(prev => ({
        ...prev,
        ratings: updatedRatings
      }));
      
      setNewReview({ author: '', caption: '', stars: 5 });
    } catch (error) {
      console.error('Ошибка при добавлении отзыва:', error);
    }
  };

  const calculateAverageRating = (ratings) => {
    if (!ratings || ratings.length === 0) return "Нет оценок";
    const sum = ratings.reduce((acc, curr) => acc + curr.stars, 0);
    return (sum / ratings.length).toFixed(1);
  };

  const averageRating = calculateAverageRating(item?.ratings);
  const hasRatings = averageRating !== "Нет оценок";

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
            {item.parameters && item.parameters.map((param, index) =>
              <div key={index} className="detail-param">
                <span className="param-key">{index + 1}:</span> <span className="param-value">{param}</span>
              </div>
            )}
          </div>
          <div className="detail-contact">
            <span>Контакты: </span>
            <span>{item.contact}</span>
          </div>
          
          <div className="ratings-section">
            <h3>Рейтинг: {hasRatings ? `${averageRating} ⭐` : averageRating}</h3>
            
            <form onSubmit={handleReviewSubmit} className="review-form">
              <h4>Оставить отзыв</h4>
              <input
                type="text"
                placeholder="Ваше имя"
                value={newReview.author}
                onChange={(e) => setNewReview(prev => ({ ...prev, author: e.target.value }))}
                required
              />
              <textarea
                placeholder="Ваш отзыв"
                value={newReview.caption}
                onChange={(e) => setNewReview(prev => ({ ...prev, caption: e.target.value }))}
                required
              />
              <div className="stars-input">
                <span>Оценка: </span>
                <select
                  value={newReview.stars}
                  onChange={(e) => setNewReview(prev => ({ ...prev, stars: Number(e.target.value) }))}
                >
                  {[1, 2, 3, 4, 5].map(num => (
                    <option key={num} value={num}>{num} ⭐</option>
                  ))}
                </select>
              </div>
              <button type="submit" className="submit-review">Отправить отзыв</button>
            </form>

            <div className="reviews-list">
              <h4>Отзывы ({item.ratings?.length || 0})</h4>
              {item.ratings?.map((review, index) => (
                <div key={index} className="review-item">
                  <div className="review-header">
                    <span className="review-author">{review.author}</span>
                    <span className="review-stars">{'⭐'.repeat(review.stars)}</span>
                  </div>
                  <p className="review-caption">{review.caption}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

function BlogPage() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expanded, setExpanded] = useState({});
  const [likes, setLikes] = useState({});

  useEffect(() => {
    fetchBlogPosts()
      .then(data => {
        setPosts(data);
        setLoading(false);
        // Инициализация лайков из localStorage
        const stored = localStorage.getItem('blogLikes') || '{}';
        setLikes(JSON.parse(stored));
      })
      .catch(() => {
        setError('Ошибка загрузки постов');
        setLoading(false);
      });
  }, []);

  const handleToggleExpand = (id) => {
    setExpanded(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleLike = async (id, liked) => {
    const post = posts.find(p => p.id === id);
    if (!post) return;
    let newLikes = post.likes;
    let newLiked = { ...likes };
    if (!liked) {
      newLikes = post.likes + 1;
      newLiked[id] = true;
    } else {
      newLikes = Math.max(0, post.likes - 1);
      newLiked[id] = false;
    }
    setPosts(posts.map(p => p.id === id ? { ...p, likes: newLikes } : p));
    setLikes(newLiked);
    localStorage.setItem('blogLikes', JSON.stringify(newLiked));
    try {
      await databases.updateDocument(
        DATABASE_ID,
        "685318f00019ac7b6ef1",
        id,
        { likes: newLikes }
      );
    } catch (e) {
      // ignore
    }
  };

  if (loading) return <div className="catalog-empty">Загрузка...</div>;
  if (error) return <div className="catalog-empty">{error}</div>;

  return (
    <main className="blog-main">
      <h1>Блог</h1>
      <div className="blog-list">
        {posts.map(post => {
          const isExpanded = expanded[post.id];
          const liked = likes[post.id];
          return (
            <div className="blog-post" key={post.id}>
              <h2 className="blog-title">{post.title}</h2>
              <div className="blog-caption">
                {isExpanded ? post.caption : post.caption.slice(0, 150) + (post.caption.length > 150 ? '...' : '')}
                {post.caption.length > 150 && (
                  <button className="show-more-btn" onClick={() => handleToggleExpand(post.id)}>
                    {isExpanded ? 'Скрыть' : 'Показать полностью'}
                  </button>
                )}
              </div>
              <button className={"like-btn" + (liked ? " liked" : "")}
                onClick={() => handleLike(post.id, liked)}>
                {liked ? '❤️' : '🤍'} {post.likes}
              </button>
            </div>
          );
        })}
      </div>
    </main>
  );
}

function ServicesPage() {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expanded, setExpanded] = useState({});
  const [showContacts, setShowContacts] = useState({});

  useEffect(() => {
    fetchServices()
      .then(data => {
        setServices(data);
        setLoading(false);
      })
      .catch(() => {
        setError('Ошибка загрузки услуг');
        setLoading(false);
      });
  }, []);

  const handleToggleExpand = (id) => {
    setExpanded(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleShowContacts = (id) => {
    setShowContacts(prev => ({ ...prev, [id]: !prev[id] }));
  };

  if (loading) return <div className="catalog-empty">Загрузка...</div>;
  if (error) return <div className="catalog-empty">{error}</div>;

  return (
    <main className="services-main">
      <h1>Услуги</h1>
      <div className="services-list">
        {services.map(service => {
          const isExpanded = expanded[service.id];
          const contactsVisible = showContacts[service.id];
          return (
            <div className="service-post" key={service.id}>
              <h2 className="service-title">{service.name}</h2>
              <div className="service-caption">
                {isExpanded ? service.caption : service.caption.slice(0, 150) + (service.caption.length > 150 ? '...' : '')}
                {service.caption.length > 150 && (
                  <button className="show-more-btn" onClick={() => handleToggleExpand(service.id)}>
                    {isExpanded ? 'Скрыть' : 'Показать полностью'}
                  </button>
                )}
              </div>
              <button className="respond-btn" onClick={() => handleShowContacts(service.id)}>
                {contactsVisible ? 'Скрыть контакты' : 'Показать контакты'}
              </button>
              {contactsVisible && (
                <div className="service-contacts">{service.contacts}</div>
              )}
            </div>
          );
        })}
      </div>
    </main>
  );
}

function App() {
  const [showVacancyModal, setShowVacancyModal] = useState(false);
  return (
    <BrowserRouter>
      <div className="app-container">
        <Header onVacancyClick={() => setShowVacancyModal(true)} />
        <Routes>
          <Route path="/item/:id" element={<Detail />} />
          <Route path="/" element={<Catalog onVacancyClick={() => setShowVacancyModal(true)} />} />
          <Route path="/blog" element={<BlogPage />} />
          <Route path="/services" element={<ServicesPage />} />
        </Routes>
        <VacancyModal isOpen={showVacancyModal} onClose={() => setShowVacancyModal(false)} />
      </div>
    </BrowserRouter>
  );
}

export default App;
