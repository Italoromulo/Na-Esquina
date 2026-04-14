// Dados dos restaurantes (simulados)
const restaurants = [
    {
        id: 1,
        name: "Burgers do João",
        cuisine: "Hambúrguer Artesanal",
        rating: 4.8,
        reviews: 234,
        distance: "0.3 km",
        status: "open",
        category: "burguer",
        logo: "logo",
        lat: 30,
        lng: 40
    },
    {
        id: 2,
        name: "Pizza da Maria",
        cuisine: "Pizza Italiana",
        rating: 4.6,
        reviews: 189,
        distance: "0.5 km",
        status: "open",
        category: "pizza",
        logo: "logo",
        lat: 50,
        lng: 60
    },
    {
        id: 3,
        name: "Pastel & Cia",
        cuisine: "Salgados Fritos",
        rating: 4.3,
        reviews: 156,
        distance: "0.8 km",
        status: "open",
        category: "salgados",
        logo: "logo",
        lat: 40,
        lng: 30
    },
    {
        id: 4,
        name: "Doces Sonhos",
        cuisine: "Bolos e Tortas",
        rating: 4.9,
        reviews: 312,
        distance: "1.2 km",
        status: "open",
        category: "doces",
        logo: "logo",
        lat: 60,
        lng: 50
    },
    {
        id: 5,
        name: "Taco Loco",
        cuisine: "Comida Mexicana",
        rating: 4.7,
        reviews: 201,
        distance: "1.5 km",
        status: "open",
        category: "burguer",
        logo: "logo",
        lat: 70,
        lng: 35
    },
    {
        id: 6,
        name: "Açaí do Norte",
        cuisine: "Açaí e Sobremesas",
        rating: 4.4,
        reviews: 145,
        distance: "0.9 km",
        status: "open",
        category: "doces",
        logo: "logo",
        lat: 55,
        lng: 45
    },
    {
        id: 7,
        name: "Coxinha Gold",
        cuisine: "Salgados Assados",
        rating: 4.2,
        reviews: 87,
        distance: "2.1 km",
        status: "closed",
        category: "salgados",
        logo: "logo",
        lat: 25,
        lng: 55
    }
];

// Estado atual
let currentCategory = 'all';
let currentLocation = null;

// Elementos DOM
const mapBackground = document.getElementById('map-background');
const restaurantsList = document.getElementById('restaurants-list');
const restaurantsCount = document.getElementById('restaurants-count');
const tabs = document.querySelectorAll('.tab');
const filterBtn = document.getElementById('filter-btn');
const filterModal = document.getElementById('filter-modal');
const closeFilter = document.getElementById('close-filter');
const clearFilters = document.getElementById('clear-filters');
const applyFilters = document.getElementById('apply-filters');
const distanceRange = document.getElementById('distance-range');
const distanceValue = document.getElementById('distance-value');
const searchInput = document.getElementById('search-input');
const locationBtn = document.getElementById('location-btn');
const navItems = document.querySelectorAll('.nav-item');

// Inicializar mapa com pins
function initMap() {
    restaurants.forEach(restaurant => {
        const pin = document.createElement('div');
        pin.className = 'map-pin';
        pin.style.top = restaurant.lat + '%';
        pin.style.left = restaurant.lng + '%';
        pin.dataset.id = restaurant.id;

        pin.addEventListener('click', () => {
            document.querySelectorAll('.map-pin').forEach(p => p.classList.remove('active'));
            pin.classList.add('active');
            selectRestaurant(restaurant.id);
        });

        mapBackground.appendChild(pin);
    });
}

// Renderizar lista de restaurantes
function renderRestaurants(filterCategory = 'all', searchTerm = '') {
    let filtered = restaurants;

    if (filterCategory !== 'all') {
        filtered = filtered.filter(r => r.category === filterCategory);
    }

    if (searchTerm) {
        filtered = filtered.filter(r =>
            r.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            r.cuisine.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }

    restaurantsCount.textContent = filtered.length;
    restaurantsList.innerHTML = '';

    filtered.forEach(restaurant => {
        const card = document.createElement('div');
        card.className = 'restaurant-card';
        card.dataset.id = restaurant.id;
        card.innerHTML = `
            <div class="restaurant-image">${restaurant.logo}</div>
            <div class="restaurant-info">
                <div class="restaurant-name">${restaurant.name}</div>
                <div class="restaurant-cuisine">${restaurant.cuisine}</div>
                <div class="restaurant-meta">
                    <div class="restaurant-rating">
                        ⭐ ${restaurant.rating}
                        <span style="color: var(--text-secondary); font-size: 11px;">(${restaurant.reviews})</span>
                    </div>
                    <div class="restaurant-distance">📍 ${restaurant.distance}</div>
                    <div class="restaurant-status ${restaurant.status === 'closed' ? 'closed' : ''}">
                        ${restaurant.status === 'open' ? 'Aberto' : 'Fechado'}
                    </div>
                </div>
            </div>
        `;

        card.addEventListener('click', () => selectRestaurant(restaurant.id));
        restaurantsList.appendChild(card);
    });
}

// Selecionar restaurante
function selectRestaurant(id) {
    document.querySelectorAll('.restaurant-card').forEach(card => {
        card.classList.toggle('active', card.dataset.id == id);
    });

    // Scroll até o card selecionado
    const selectedCard = document.querySelector(`.restaurant-card[data-id="${id}"]`);
    if (selectedCard) {
        selectedCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
}

// Event Listeners para tabs
tabs.forEach(tab => {
    tab.addEventListener('click', () => {
        tabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        currentCategory = tab.dataset.category;
        renderRestaurants(currentCategory, searchInput.value);
    });
});


// Barra de pesquisa
searchInput.addEventListener('input', (e) => {
    renderRestaurants(currentCategory, e.target.value);
});

// Botão de localização
locationBtn.addEventListener('click', () => {
    if ('geolocation' in navigator) {
        locationBtn.style.animation = 'pulse 0.5s ease-in-out 3';
        navigator.geolocation.getCurrentPosition(
            (position) => {
                currentLocation = {
                    lat: position.coords.latitude,
                    lng: position.coords.longitude
                };
                console.log('Localização atual:', currentLocation);
                // Aqui você centralizaria o mapa na localização do usuário
                showNotification('📍 Localização atualizada!');
            },
            (error) => {
                console.error('Erro ao obter localização:', error);
                showNotification('❌ Não foi possível obter sua localização');
            }
        );
    } else {
        showNotification('❌ Geolocalização não suportada');
    }
});

// Navegação
navItems.forEach(item => {
    item.addEventListener('click', (e) => {
        navItems.forEach(nav => nav.classList.remove('active'));
        item.classList.add('active');
    });
});


// Notificação toast
function showNotification(message) {
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 80px;
        left: 50%;
        transform: translateX(-50%);
        background: rgba(18, 8, 6, 0.95);
        backdrop-filter: blur(10px);
        border: 1px solid var(--glass-border);
        padding: 12px 24px;
        border-radius: 24px;
        color: var(--text-primary);
        font-size: 14px;
        z-index: 300;
        animation: slideDown 0.3s ease-out;
    `;
    notification.textContent = message;
    document.body.appendChild(notification);

    setTimeout(() => {
        notification.style.animation = 'slideUp 0.3s ease-out forwards';
        setTimeout(() => notification.remove(), 300);
    }, 2000);
}

// Adicionar animações de slide
const style = document.createElement('style');
style.textContent = `
    @keyframes slideDown {
        from { transform: translateX(-50%) translateY(-20px); opacity: 0; }
        to { transform: translateX(-50%) translateY(0); opacity: 1; }
    }
    @keyframes slideUp {
        from { transform: translateX(-50%) translateY(0); opacity: 1; }
        to { transform: translateX(-50%) translateY(-20px); opacity: 0; }
    }
`;
document.head.appendChild(style);

// Inicializar app
document.addEventListener('DOMContentLoaded', () => {
    initMap();
    renderRestaurants();

    // Simular atualização em tempo real
    setInterval(() => {
        const pins = document.querySelectorAll('.map-pin');
        pins.forEach(pin => {
            if (Math.random() > 0.7) {
                pin.style.animation = 'none';
                setTimeout(() => {
                    pin.style.animation = '';
                }, 100);
            }
        });
    }, 5000);
});

let map;
let markersLayer = L.layerGroup();

function initMap() {
    // 1. Inicializa o mapa centralizado em uma coordenada (Ex: São Paulo)
    // [Latitude, Longitude], Zoom
    map = L.map('map-background', {
        zoomControl: false, // Escondemos para manter o visual limpo
        attributionControl: false
    }).setView([-22.9065, -43.5591], 15);

    // 2. Adiciona o estilo Dark (CartoDB Dark Matter) para combinar com seu design
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        maxZoom: 19
    }).addTo(map);

    // Adiciona a camada de pins ao mapa
    markersLayer.addTo(map);

    // Renderiza os pins iniciais
    updateMapPins(restaurants);
}

function updateMapPins(filteredRestaurants) {
    markersLayer.clearLayers(); // Limpa pins antigos antes de filtrar

    filteredRestaurants.forEach(res => {
        // Criamos o HTML do seu Pin Ultra Realista
        const customPinIcon = L.divIcon({
            className: 'custom-pin',
            html: `<div class="map-pin" style="transform: rotate(45deg); position: relative;"></div>`,
            iconSize: [40, 40],
            iconAnchor: [20, 40]
        });

        // Adiciona o marcador ao mapa
        const marker = L.marker([res.lat, res.lng], { icon: customPinIcon });
        
        marker.on('click', () => {
            map.flyTo([res.lat, res.lng], 16); // Efeito suave de zoom ao clicar
            selectRestaurant(res.id);
        });

        markersLayer.addLayer(marker);
    });
}

applyFilters.addEventListener('click', () => {
    filterModal.classList.remove('active');
    
    // Filtre os dados e depois atualize o mapa
    const filtered = restaurants.filter(r => r.category === currentCategory); 
    updateMapPins(filtered); 
});